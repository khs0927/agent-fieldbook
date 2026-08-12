# Agent Fieldbook

Agent Fieldbook is a small, dependency-light operator web app for coordinating an agent team around a project goal. It runs locally, starts with seeded field data, and persists edits in the browser with `localStorage`.

## What it does

- Capture and update the project goal.
- Add team workstreams with owner and status.
- Record status checkpoints against a workstream.
- Show a live-feeling activity timeline seeded with local data.
- Simulate new field-log activity without any backend service.

## Stack

- Vanilla JavaScript
- CSS
- Vite for local development and production builds
- No runtime framework dependencies

## Getting started

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite, usually <http://127.0.0.1:5173/>.

## Useful commands

```bash
npm run dev      # start local development server
npm run build    # create production build in dist/
npm run preview  # preview the production build locally
```

## Data model

Seed data is defined in `src/main.js` and includes:

- `goal`: the current project north star.
- `workstreams`: team lanes with owner, status, notes, and update time.
- `checkpoints`: timestamped status records tied to workstreams.
- `activities`: timeline entries that make the workspace feel active.

User edits are stored in the browser under `agent-fieldbook-state-v1`.
