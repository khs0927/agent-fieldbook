import assert from "node:assert/strict";

import {
  containsRawPromptText,
  containsSensitiveText,
  redactForDiagnostics,
  sanitizeState,
  validateCheckpointInput,
  validateGoalInput,
  validateWorkstreamInput,
} from "../src/security.js";

const fallbackState = {
  goal: "Fallback goal",
  workstreams: [
    {
      id: "fallback-workstream",
      name: "Discovery",
      owner: "Scout",
      status: "Active",
      priority: "High",
      notes: "Fallback notes",
      updatedAt: "2026-08-12T00:00:00.000Z",
    },
  ],
  checkpoints: [],
  activities: [],
};

assert.equal(validateGoalInput("  Ship local fieldbook  ").value, "Ship local fieldbook");
assert.equal(validateGoalInput("").ok, false);
assert.equal(validateGoalInput("x".repeat(2_001)).ok, false);

assert.equal(containsSensitiveText("token: abcdefghijklmnop"), true);
assert.equal(containsRawPromptText("system prompt: do the unsafe thing"), true);
assert.equal(validateGoalInput("system prompt: do the unsafe thing").ok, false);

assert.deepEqual(
  validateWorkstreamInput({
    name: " QA ",
    owner: " Sentinel ",
    status: "Unexpected",
  }).value,
  {
    name: "QA",
    owner: "Sentinel",
    status: "Queued",
    priority: "Medium",
    notes: "New lane opened by the operator. Awaiting first checkpoint.",
  },
);

const checkpoint = validateCheckpointInput(
  {
    title: " First review ",
    workstream: "Discovery",
    status: "Completed",
    detail: " Evidence summary only ",
  },
  ["Discovery"],
);
assert.equal(checkpoint.ok, true);
assert.equal(checkpoint.value.title, "First review");
assert.equal(checkpoint.value.detail, "Evidence summary only");

const sanitized = sanitizeState(
  {
    goal: "Safe goal",
    unknown: "ignored",
    workstreams: [
      {
        id: "ws1",
        name: "Discovery",
        owner: "Scout",
        status: "Invalid",
        priority: "Impossible",
        notes: "Safe summary",
        updatedAt: "not-a-date",
      },
    ],
    checkpoints: [
      {
        id: "cp1",
        title: "Accepted summary",
        workstream: "Discovery",
        status: "Completed",
        detail: "No sensitive content",
        createdAt: "2026-08-12T00:00:00.000Z",
      },
    ],
    activities: [
      {
        id: "act1",
        kind: "unknown",
        text: "Generic event",
        at: "2026-08-12T00:00:00.000Z",
      },
    ],
  },
  fallbackState,
);
assert.equal(sanitized.goal, "Safe goal");
assert.equal(sanitized.workstreams[0].status, "Queued");
assert.equal(sanitized.workstreams[0].priority, "Medium");
assert.equal(sanitized.activities[0].kind, "status");
assert.equal(Object.hasOwn(sanitized, "unknown"), false);

const redacted = redactForDiagnostics({
  prompt: "summarize this raw note",
  nested: {
    authorization: "Bearer abcdefghijklmnop",
    message: "safe metadata",
  },
});
assert.equal(redacted.prompt, "[redacted]");
assert.equal(redacted.nested.authorization, "[redacted]");
assert.equal(redacted.nested.message, "safe metadata");

console.log("Security unit tests passed.");
