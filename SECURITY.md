# Agent Fieldbook Security & Privacy Controls

Status: implemented local-first baseline for the current browser app. Future integrations must preserve these controls.

## Security objectives

Agent Fieldbook must be safe-by-default for local agent notes, field observations, workflows, and model interactions.

- Keep user data local unless the user explicitly enables a named external integration.
- Do not persist raw prompts, raw model responses, secrets, API keys, tokens, or credentials.
- Validate and normalize all user-controlled input before storage, rendering, or tool execution.
- Treat imported files, pasted text, model output, and agent-generated instructions as untrusted.
- Make privacy-preserving behavior testable in local development and CI.

## Data handling policy

### Local-only by default

- Store application data under an app-scoped local directory only, such as:
  - macOS: `~/Library/Application Support/Agent Fieldbook`
  - Linux: `${XDG_DATA_HOME:-~/.local/share}/agent-fieldbook`
  - Windows: `%APPDATA%\Agent Fieldbook`
- Do not sync local app data to cloud storage by default.
- Do not send notes, prompts, embeddings, logs, telemetry, traces, attachments, or usage analytics to third parties unless the user opts in to a specific integration.
- Any future network feature must have:
  - a user-visible purpose;
  - an allowlist of destination hosts;
  - a clear off switch;
  - tests that prove disabled integrations do not make network calls.

### Data minimization

- Persist only the minimum fieldbook data needed for the feature.
- Prefer derived, bounded summaries over raw transcripts.
- Use stable random IDs instead of names, emails, file paths, or prompt text in logs and indexes.
- Apply retention limits to caches, temporary files, and diagnostic bundles.
- Delete temporary files after import/export completes.

### Sensitive data that must not be stored raw

The app must not persist these values in source-controlled files, local databases, logs, analytics payloads, crash reports, or diagnostics:

- raw user prompts or full model responses;
- API keys, OAuth tokens, session cookies, refresh tokens, private keys, SSH keys, passwords;
- `.env` contents;
- personal identifiers not required by the feature;
- file contents imported only for one-time processing;
- exact local filesystem paths when a basename or generated ID is enough.

If a feature needs recoverable secrets, use the operating system secret store/keychain. If a feature needs non-recoverable comparison, use a slow salted hash.

## Input validation and output safety

### Validate at trust boundaries

Validate every value received from users, files, URLs, local IPC, browser contexts, model output, plugins, or future server APIs.

Required validation rules:

- Define schemas for structured inputs.
- Reject unknown fields for security-sensitive actions.
- Bound string length, collection size, file size, attachment count, and recursion depth.
- Normalize Unicode and line endings before matching, indexing, or deduplication.
- Canonicalize paths and require them to stay inside the app-scoped data directory unless the user selected a file through an OS picker.
- Treat model output as text, never as trusted commands, code, SQL, shell arguments, or file paths.
- Escape output by context before rendering HTML, Markdown, SQL, shell commands, JSON, CSV, or filesystem paths.

### File import controls

- Use allowlisted file types.
- Enforce maximum file sizes before reading into memory.
- Store imported files under generated IDs, not user-supplied names.
- Strip or ignore active content, macros, scripts, embedded links, and remote references unless explicitly needed.
- Scan/parsing failures must fail closed and not keep partial raw data.

### Prompt-injection controls

- Model output and imported documents may contain malicious instructions. The app must separate:
  - user intent;
  - system/developer instructions;
  - retrieved document content;
  - model-generated suggestions.
- Retrieved or imported content must never override app policy.
- Tool actions must require explicit user approval when they read outside the app data directory, write files selected by the user, call a network service, or change external state.

## Secrets management

- Never commit real secrets or example values that look like real secrets.
- Keep `.env*`, key files, token caches, local databases, and diagnostic bundles out of version control.
- Provide `.env.example` only with placeholder values such as `OPENAI_API_KEY=replace-me`.
- Read secrets from environment variables or OS secret storage at runtime.
- Redact secrets before logging errors, request metadata, stack traces, or diagnostics.
- Rotate any secret immediately if it appears in a commit, log, issue, screenshot, or support bundle.

## Logging and diagnostics

Logs are for behavior and failure modes, not content capture.

Allowed in logs:

- event names;
- timestamps;
- generated IDs;
- coarse counts and durations;
- validation failure categories;
- redacted error codes.

Forbidden in logs:

- raw prompts;
- model responses;
- note bodies;
- attachment contents;
- secrets;
- full local file paths;
- external request bodies unless explicitly redacted and user-approved.

Recommended log shape:

```json
{
  "event": "note.saved",
  "note_id": "nt_7a1f...",
  "bytes": 2048,
  "duration_ms": 31
}
```

## Access control

For the local app baseline:

- Rely on OS account isolation for local single-user storage.
- Use restrictive filesystem permissions for app data, secret caches, exports, and backups.
- Add app-level locking or profile separation before supporting shared devices or multi-user workspaces.

For any future sync or collaboration:

- Require authentication.
- Enforce authorization on every object access.
- Use least-privilege scopes for external providers.
- Keep external sharing disabled by default.

## Security checklist

Before a change is considered complete:

- [x] Data remains local-only unless a named, user-enabled integration is part of the feature.
- [x] No raw prompts, raw model responses, note bodies, secrets, or credentials are logged.
- [x] No raw prompts, raw model responses, secrets, or credentials are persisted.
- [x] All user-controlled inputs have schemas or validators.
- [ ] File paths are canonicalized and constrained to allowed directories.
- [ ] File imports have type and size limits.
- [ ] Model output is treated as untrusted text.
- [x] Rendering escapes by context.
- [x] Network destinations are allowlisted and disabled by default.
- [ ] Secrets come from environment variables or OS secret storage.
- [x] `.env*`, local databases, key files, token caches, and diagnostics are ignored by version control.
- [x] Security tests pass locally.
- [ ] New risks are added to the threat notes in `security/implementation-notes.md`.

## Required security tests

Run:

```bash
node tests/security_unit_tests.mjs
python3 tests/security_static_checks.py
```

The test scripts check that:

- validators reject raw prompts, prompt-like text, obvious secrets, oversized input, and unknown status values;
- loaded state is normalized and unknown fields are discarded;
- diagnostic redaction removes prompt/response/secret-like fields;
- required security files exist;
- common secret/key files are not present in the project tree;
- source files do not contain obvious hardcoded credentials;
- source files do not use common raw prompt/response logging patterns;
- project ignore rules include local secrets, databases, diagnostics, and cache artifacts.

When a core app exists, add unit tests for:

- validators rejecting oversized, malformed, and unknown-field inputs;
- path traversal attempts staying outside storage;
- logs redacting prompts, note bodies, and secrets;
- disabled integrations making no network calls;
- import failures deleting temporary raw data;
- model output being unable to invoke tools without user approval.

## Incident response notes

If sensitive data is exposed:

1. Stop the affected feature or integration.
2. Preserve minimal evidence without copying sensitive content.
3. Identify data types, affected users, and exposure window.
4. Rotate exposed credentials.
5. Delete exposed artifacts from logs, diagnostics, caches, and support bundles.
6. Add regression tests for the failure mode.
7. Document the incident and mitigation in the project security notes.
