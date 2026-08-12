#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
let assertions = 0;

function readProjectFile(relativePath) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

function assert(condition, message) {
  assertions += 1;
  if (!condition) {
    throw new Error(message);
  }
}

function includes(haystack, needle, label) {
  assert(haystack.includes(needle), `${label} should include ${needle}`);
}

function matches(haystack, pattern, label) {
  assert(pattern.test(haystack), `${label} should match ${pattern}`);
}

const packageJson = JSON.parse(readProjectFile("package.json"));
const html = readProjectFile("index.html");
const main = readProjectFile("src/main.js");
const styles = readProjectFile("src/styles.css");

assert(packageJson.name === "agent-fieldbook", "package name should stay agent-fieldbook");
assert(packageJson.type === "module", "package should use ESM modules");
assert(Boolean(packageJson.scripts?.build), "package should expose a build script");
assert(Boolean(packageJson.scripts?.dev), "package should expose a dev script");

includes(html, "<title>Agent Fieldbook</title>", "index.html");
includes(html, '<div id="app"></div>', "index.html");
includes(html, 'type="module" src="/src/main.js"', "index.html");
includes(html, "Agent Fieldbook needs JavaScript enabled.", "index.html");

includes(main, 'const STORAGE_KEY = "agent-fieldbook-state-v1";', "src/main.js");
includes(main, "localStorage.getItem(STORAGE_KEY)", "src/main.js");
includes(main, "localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeState(state, seededState)))", "src/main.js");
includes(main, "localStorage.removeItem(STORAGE_KEY)", "src/main.js");
includes(main, "validateGoalInput(", "goal validation");
includes(main, "validateWorkstreamInput(", "workstream validation");
includes(main, "validateCheckpointInput(", "checkpoint validation");
includes(main, "Privacy guardrails", "privacy notice");

for (const requiredStateKey of ["goal:", "workstreams:", "checkpoints:", "activities:"]) {
  includes(main, requiredStateKey, "seeded state");
}

for (const requiredFormId of [
  "goal-form",
  "workstream-form",
  "checkpoint-form",
  "simulate-activity",
]) {
  includes(main, requiredFormId, "interactive controls");
}

includes(main, "state.workstreams.unshift({", "workstream create flow");
includes(main, "state.checkpoints.unshift({", "checkpoint create flow");
includes(main, "addActivity(", "activity timeline flow");
includes(main, "touchWorkstream(checkpoint.value.workstream, checkpoint.value.status)", "checkpoint side effect");

matches(main, /function escapeHtml\(value\)/, "escapeHtml");
includes(main, 'replaceAll("&", "&amp;")', "escapeHtml");
includes(main, 'replaceAll("<", "&lt;")', "escapeHtml");
includes(main, 'replaceAll(">", "&gt;")', "escapeHtml");
includes(main, "escapeHtml(stream.name)", "workstream rendering");
includes(main, "escapeHtml(checkpoint.title)", "checkpoint rendering");
includes(main, "escapeHtml(activity.text)", "activity rendering");

for (const requiredClass of [".shell", ".panel", ".privacy-banner", ".metric", ".workstream-card", ".timeline"]) {
  includes(styles, requiredClass, "src/styles.css");
}

console.log(`Smoke checks passed (${assertions} assertions).`);
