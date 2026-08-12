const MAX_TEXT = {
  goal: 2_000,
  workstreamName: 80,
  owner: 80,
  checkpointTitle: 120,
  checkpointDetail: 1_000,
  activityText: 180,
};

const ALLOWED_WORKSTREAM_STATUSES = new Set([
  "Active",
  "Queued",
  "At risk",
  "Blocked",
  "Done",
]);

const ALLOWED_CHECKPOINT_STATUSES = new Set([
  "In progress",
  "Completed",
  "Queued",
  "Blocked",
]);

const ALLOWED_PRIORITIES = new Set(["Low", "Medium", "High"]);
const ALLOWED_ACTIVITY_KINDS = new Set(["handoff", "checkpoint", "status", "watch"]);

const SENSITIVE_TEXT_PATTERNS = [
  /-----BEGIN (?:RSA |DSA |EC |OPENSSH |)?PRIVATE KEY-----/i,
  /\b(?:api[_-]?key|secret|token|password|private[_-]?key)\b\s*[:=]\s*\S{8,}/i,
  /\bauthorization\b\s*[:=]\s*bearer\s+\S{8,}/i,
  /\b(?:sk|pk|rk)-[A-Za-z0-9_-]{16,}\b/,
];

const RAW_PROMPT_PATTERNS = [
  /\braw\s+(?:prompt|response)\b/i,
  /\b(?:system|developer|assistant|user)\s+prompt\s*:/i,
  /\bcopy\s+this\s+prompt\b/i,
  /\bprompt\s*[:=]\s*.{40,}/i,
];

const REDACTED = "[redacted]";

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeText(value, maxLength) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function containsSensitiveText(value) {
  const text = String(value ?? "");
  return SENSITIVE_TEXT_PATTERNS.some((pattern) => pattern.test(text));
}

export function containsRawPromptText(value) {
  const text = String(value ?? "");
  return RAW_PROMPT_PATTERNS.some((pattern) => pattern.test(text));
}

export function validateSafeText(value, options) {
  const text = normalizeText(value, options.maxLength);

  if (options.required && !text) {
    return { ok: false, error: `${options.label} is required.` };
  }

  if (String(value ?? "").length > options.maxLength) {
    return {
      ok: false,
      error: `${options.label} must be ${options.maxLength} characters or fewer.`,
    };
  }

  if (containsSensitiveText(text)) {
    return {
      ok: false,
      error: `${options.label} appears to contain a secret or credential. Store secrets in an OS keychain or environment variable, not Agent Fieldbook.`,
    };
  }

  if (containsRawPromptText(text)) {
    return {
      ok: false,
      error: `${options.label} appears to contain a raw prompt or raw model response. Save a short summary instead.`,
    };
  }

  return { ok: true, value: text };
}

export function validateGoalInput(value) {
  return validateSafeText(value, {
    label: "Goal",
    maxLength: MAX_TEXT.goal,
    required: true,
  });
}

export function validateWorkstreamInput(data) {
  const name = validateSafeText(data.name, {
    label: "Workstream name",
    maxLength: MAX_TEXT.workstreamName,
    required: true,
  });
  if (!name.ok) return name;

  const owner = validateSafeText(data.owner, {
    label: "Owner",
    maxLength: MAX_TEXT.owner,
    required: true,
  });
  if (!owner.ok) return owner;

  const status = ALLOWED_WORKSTREAM_STATUSES.has(data.status)
    ? data.status
    : "Queued";

  return {
    ok: true,
    value: {
      name: name.value,
      owner: owner.value,
      status,
      priority: "Medium",
      notes: "New lane opened by the operator. Awaiting first checkpoint.",
    },
  };
}

export function validateCheckpointInput(data, allowedWorkstreams) {
  const title = validateSafeText(data.title, {
    label: "Checkpoint title",
    maxLength: MAX_TEXT.checkpointTitle,
    required: true,
  });
  if (!title.ok) return title;

  const detail = validateSafeText(data.detail, {
    label: "Checkpoint detail",
    maxLength: MAX_TEXT.checkpointDetail,
    required: false,
  });
  if (!detail.ok) return detail;

  const workstreamNames = new Set(allowedWorkstreams);
  const workstream = workstreamNames.has(data.workstream)
    ? data.workstream
    : allowedWorkstreams[0];
  if (!workstream) {
    return {
      ok: false,
      error: "Add a workstream before recording a checkpoint.",
    };
  }

  const status = ALLOWED_CHECKPOINT_STATUSES.has(data.status)
    ? data.status
    : "Queued";

  return {
    ok: true,
    value: {
      title: title.value,
      workstream,
      status,
      detail: detail.value,
    },
  };
}

function validateIsoDate(value, fallback) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function sanitizeWorkstream(item, fallbackDate) {
  if (!isObject(item)) return null;

  const name = validateSafeText(item.name, {
    label: "Workstream name",
    maxLength: MAX_TEXT.workstreamName,
    required: true,
  });
  const owner = validateSafeText(item.owner, {
    label: "Owner",
    maxLength: MAX_TEXT.owner,
    required: true,
  });
  const notes = validateSafeText(item.notes, {
    label: "Workstream notes",
    maxLength: MAX_TEXT.checkpointDetail,
    required: false,
  });

  if (!name.ok || !owner.ok || !notes.ok) return null;

  return {
    id: normalizeText(item.id, 80) || crypto.randomUUID(),
    name: name.value,
    owner: owner.value,
    status: ALLOWED_WORKSTREAM_STATUSES.has(item.status) ? item.status : "Queued",
    priority: ALLOWED_PRIORITIES.has(item.priority) ? item.priority : "Medium",
    notes: notes.value,
    updatedAt: validateIsoDate(item.updatedAt, fallbackDate),
  };
}

function sanitizeCheckpoint(item, fallbackDate, allowedWorkstreams) {
  if (!isObject(item)) return null;

  const validated = validateCheckpointInput(
    {
      title: item.title,
      workstream: item.workstream,
      status: item.status,
      detail: item.detail,
    },
    allowedWorkstreams,
  );
  if (!validated.ok) return null;

  return {
    id: normalizeText(item.id, 80) || crypto.randomUUID(),
    ...validated.value,
    createdAt: validateIsoDate(item.createdAt, fallbackDate),
  };
}

function sanitizeActivity(item, fallbackDate) {
  if (!isObject(item)) return null;

  const text = validateSafeText(item.text, {
    label: "Activity",
    maxLength: MAX_TEXT.activityText,
    required: true,
  });
  if (!text.ok) return null;

  return {
    id: normalizeText(item.id, 80) || crypto.randomUUID(),
    kind: ALLOWED_ACTIVITY_KINDS.has(item.kind) ? item.kind : "status",
    text: text.value,
    at: validateIsoDate(item.at, fallbackDate),
  };
}

export function sanitizeState(candidate, fallbackState) {
  if (!isObject(candidate)) return fallbackState;

  const fallbackDate = new Date().toISOString();
  const goal = validateGoalInput(candidate.goal);
  if (!goal.ok) return fallbackState;

  const workstreams = Array.isArray(candidate.workstreams)
    ? candidate.workstreams
        .slice(0, 40)
        .map((item) => sanitizeWorkstream(item, fallbackDate))
        .filter(Boolean)
    : [];
  if (!workstreams.length) return fallbackState;

  const workstreamNames = workstreams.map((item) => item.name);
  const checkpoints = Array.isArray(candidate.checkpoints)
    ? candidate.checkpoints
        .slice(0, 120)
        .map((item) => sanitizeCheckpoint(item, fallbackDate, workstreamNames))
        .filter(Boolean)
    : [];

  const activities = Array.isArray(candidate.activities)
    ? candidate.activities
        .slice(0, 120)
        .map((item) => sanitizeActivity(item, fallbackDate))
        .filter(Boolean)
    : [];

  return {
    goal: goal.value,
    workstreams,
    checkpoints,
    activities,
  };
}

export function redactForDiagnostics(value) {
  if (Array.isArray(value)) {
    return value.map((item) => redactForDiagnostics(item));
  }

  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => {
        if (/prompt|response|secret|token|password|key|cookie|authorization/i.test(key)) {
          return [key, REDACTED];
        }
        return [key, redactForDiagnostics(item)];
      }),
    );
  }

  if (typeof value !== "string") return value;

  return SENSITIVE_TEXT_PATTERNS.reduce(
    (text, pattern) => text.replace(pattern, REDACTED),
    value,
  );
}

export const SECURITY_LIMITS = Object.freeze({
  maxGoalLength: MAX_TEXT.goal,
  maxCheckpointDetailLength: MAX_TEXT.checkpointDetail,
  allowedWorkstreamStatuses: [...ALLOWED_WORKSTREAM_STATUSES],
  allowedCheckpointStatuses: [...ALLOWED_CHECKPOINT_STATUSES],
});
