# Agent Fieldbook verification plan

## Current repository state

The directory now contains a runnable local-first Agent Fieldbook app. This plan covers the implemented browser workflow and its security/privacy gates.

## Scope

- Work is limited to this `agent-fieldbook` directory.
- Do not read from, write to, deploy, or create a GitHub repository for `agency-control-room`.
- Prefer checks that can run locally without installing dependencies.
- When app files become available, add targeted smoke tests that verify the primary Agent Fieldbook user path.

## Verification goals

1. Confirm the repository has a clear, repeatable validation command.
2. Confirm project metadata and lightweight source syntax are valid when those files exist.
3. Confirm the app has a smoke-testable user journey once application files are present.
4. Keep the validation path safe for local development and CI.

## Test matrix

| Area | Current check | Future app-specific check |
| --- | --- | --- |
| Repository scope | Script guards against running outside `agent-fieldbook`. | Keep the guard and add CI working-directory enforcement. |
| Documentation | `TEST_PLAN.md` is required and checked for core sections. | Update this plan whenever architecture or smoke paths change. |
| Product spec | `DESIGN.md` is checked for core Agent Fieldbook sections when present. | Keep spec checks aligned with the implemented navigation and workflows. |
| Security/privacy | `npm run security` covers validators, state sanitization, and redaction. `tests/security_static_checks.py` verifies security docs, ignore rules, absence of common local secret artifacts, hardcoded secret patterns, and raw prompt/response logging patterns. | Add unit tests for storage path constraints if file imports are added. |
| Metadata | JSON files are parsed if present. | Validate required `package.json` or backend metadata fields. |
| Shell scripts | Shell scripts are syntax-checked with `bash -n`. | Add checks for project scripts that bootstrap or validate the app. |
| JavaScript | Plain `.js`, `.mjs`, and `.cjs` files are checked with `node --check` when Node is available. | Add framework-native lint/type/test commands when dependencies are installed. |
| Python | `.py` files are byte-compiled when Python is available. | Add backend unit tests for API routes, storage, and auth boundaries. |
| Product smoke path | `npm test` runs 36 deterministic assertions over the local app contract. Browser proof also covers goal, workstream, checkpoint, activity, and responsive flows. | Add a full browser runner to CI if the project becomes a shared service. |

## Recommended future smoke test

The current dependency-light smoke test covers the smallest complete workflow:

1. Start the app in local mode or exercise the handler/component directly.
2. Load the fieldbook home or entry list.
3. Create a goal, workstream, checkpoint, and activity tick.
4. Confirm each item is rendered.
5. Run security/static validation and a production build.
6. Browser-verify local persistence and the explicit clear-data action.

For a web app, prefer Playwright or the framework’s built-in test runner only after dependencies are already part of the project. For a server/API app, prefer a single route-level test using the existing runtime. Avoid adding heavyweight test frameworks solely for smoke coverage.

## Design specification checks

Until app code exists, validate that `DESIGN.md` continues to preserve these product-critical areas:

- Product intent
- Information architecture
- Primary create flow
- Quick capture flow
- Review workflow
- Acceptance and verification concepts for playbooks

## Validation command

Run from the `agent-fieldbook` directory:

```sh
bash scripts/validate-agent-fieldbook.sh
```

## Acceptance criteria

- The validation command exits with status `0`.
- The command output shows the scope guard, documentation checks, security/privacy checks, and any available lightweight syntax checks.
- Any future app-specific smoke test is deterministic, uses local test data, and can run without external deployment.
