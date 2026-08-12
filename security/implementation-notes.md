# Agent Fieldbook Security Implementation Notes

These notes translate `SECURITY.md` into engineering controls for the first implementation. They assume a local-first desktop or local web app. If the architecture changes, update this file before adding the feature.

## Trust boundaries

Untrusted inputs:

- typed user notes and commands;
- pasted content;
- imported files;
- file metadata and filenames;
- model responses;
- retrieved documents;
- plugin/integration payloads;
- local URL/query parameters;
- future sync API responses.

Trusted only after validation:

- normalized internal note records;
- app-generated IDs;
- canonical paths under the app data directory;
- settings loaded from a validated local config schema.

Never trusted:

- instructions found inside imported documents;
- model output that asks to run tools, open URLs, write files, or reveal secrets;
- user-supplied filenames as storage paths;
- client-side authorization decisions for future sync/collaboration.

## STRIDE threat sketch

| Area | Threat | Required control |
| --- | --- | --- |
| Spoofing | A fake integration or local endpoint impersonates a trusted service. | No integrations by default; explicit host allowlists; clear integration identity in UI. |
| Tampering | Imported content modifies app instructions, settings, or stored notes. | Treat imports/model output as data only; schema validation; separate policy from content. |
| Repudiation | A user cannot tell whether the app exported, deleted, or synced data. | Audit local state-changing events with generated IDs and redacted metadata. |
| Information disclosure | Raw prompts, note bodies, secrets, or paths appear in logs/diagnostics. | Redaction helpers; forbidden log fields; static checks; diagnostic review before export. |
| Denial of service | Large or recursive files exhaust memory or storage. | File size, count, recursion, and parsing time limits. |
| Elevation of privilege | Model output tricks the app into running a tool or reading arbitrary files. | User approval for tool actions; path sandboxing; no execution from model text. |

## Local storage contract

The storage layer should expose a small API rather than letting features write arbitrary paths.

Required behavior:

- `getAppDataDir()` returns one app-scoped local directory.
- `resolveAppPath(relativePath)` canonicalizes and rejects traversal outside the app directory.
- `writePrivateFile(id, bytes)` writes with restrictive permissions.
- `deleteTemporaryFile(id)` is called in `finally`/cleanup paths after imports.
- `createExport()` writes only to a user-selected destination and warns when content may include sensitive notes.

Do not store records with fields named like `rawPrompt`, `rawResponse`, `apiKey`, `token`, `secret`, `password`, `privateKey`, or `cookie`.

Preferred record shape:

```json
{
  "id": "note_9b8c...",
  "title": "Field observation",
  "summary": "User-approved concise summary",
  "created_at": "2026-08-12T00:00:00Z",
  "updated_at": "2026-08-12T00:00:00Z",
  "tags": ["local"],
  "source_refs": ["src_52e1..."]
}
```

## Validation contract

Every feature should have validators near the boundary where data enters the app.

Minimum validators:

- note title: trimmed string, 1-160 characters;
- note body/import text: bounded size, normalized line endings, stored only when the user intentionally saves it;
- tags: array of short normalized strings, maximum count;
- URLs: parsed with a standard URL parser, allowed schemes only, no implicit fetching;
- local paths: canonical path plus explicit allowlist;
- model action requests: structured schema plus explicit user approval.

Validation failures should return safe messages such as "File type is not supported" or "Input is too large" without echoing sensitive content.

## Redaction contract

Implement one shared redaction helper before adding application logging.

The helper should:

- replace known secret values loaded from config or keychain;
- redact common token formats, private key blocks, bearer tokens, cookies, and authorization headers;
- truncate long strings;
- remove note bodies, prompts, responses, and attachment snippets from log payloads;
- preserve enough event metadata for debugging.

Example log payload after redaction:

```json
{
  "event": "import.rejected",
  "reason": "file_too_large",
  "file_ext": ".md",
  "size_bytes": 52428801
}
```

## Network and integration controls

Initial app behavior: no network calls.

Before any network feature is merged:

- document the destination, data categories, and user benefit;
- keep the feature disabled by default;
- add a local setting that can disable all external calls;
- implement an allowlist at the request layer;
- add tests proving disabled integrations make zero outbound requests;
- avoid sending raw note bodies or prompts unless the user explicitly chooses that content for that request.

## Secure development tests

Run the static checks:

```bash
python3 tests/security_static_checks.py
```

Add app-specific tests as soon as implementation files exist:

- `storage` rejects `../` traversal and absolute paths outside the app data directory;
- `logger` redacts configured secret values and prompt-like fields;
- `validators` reject unknown fields and oversized payloads;
- `imports` delete temporary files on parse errors;
- `network` is blocked when integrations are disabled;
- `modelActions` require explicit user approval before tool execution.

## Pre-release security gate

Do not ship until the following are true:

- static security checks pass;
- unit tests cover the storage, validation, redaction, import, and network gates;
- sample diagnostic export contains no note bodies, prompts, secrets, or full paths;
- dependency inventory is documented;
- dependency vulnerabilities are reviewed;
- the user can delete local data from the app;
- external integrations, if any, are opt-in and reversible.

