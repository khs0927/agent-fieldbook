# Agent Fieldbook Design Specification

## Product intent

Agent Fieldbook is a focused workspace for capturing, organizing, and reusing practical knowledge about AI agents: prompts, operating procedures, experiments, failure notes, checklists, and field-tested playbooks.

The app should feel like a modern field notebook for agent builders: calm, durable, readable, and operational. It should help users move quickly from “I learned something” to “my team can reuse this.”

Primary users:

- Agent builders documenting patterns, tools, prompts, workflows, and gotchas.
- Team leads reviewing repeatable practices and implementation readiness.
- Operators looking up procedures while running or debugging agents.

Primary jobs:

- Capture a field note quickly.
- Turn notes into reusable playbooks.
- Browse agent patterns by task, tool, risk, or maturity.
- Track what has been tested, accepted, deprecated, or needs review.
- Hand implementation agents a clear spec without requiring oral context.

## Information architecture

The app has five top-level areas:

1. **Today**
   - Recent notes, active investigations, pinned playbooks, and quick capture.
2. **Fieldbook**
   - Searchable library of notes, playbooks, patterns, checklists, and decisions.
3. **Agents**
   - Profiles for agents, including role, tools, constraints, prompts, known issues, and evaluation results.
4. **Missions**
   - Outcome-oriented workspaces that group notes, agents, test runs, tasks, and decisions.
5. **Reviews**
   - Items needing validation, owner approval, deprecation, or promotion from note to playbook.

Use these item types throughout the product:

- **Field Note**: raw observation, incident, idea, or discovery.
- **Playbook**: repeatable procedure with steps, guardrails, and acceptance checks.
- **Agent Profile**: reusable description of an agent’s role, tools, instructions, and operating boundaries.
- **Mission**: temporary project or investigation.
- **Checklist**: operational checklist for setup, review, launch, or incident response.
- **Decision**: recorded tradeoff with rationale and date.
- **Test Run**: result of trying an agent, prompt, tool, or workflow.

## Core interaction model

### Global shell

Desktop layout:

- Left sidebar: app logo, primary nav, create button, workspace switcher, and settings.
- Main content: list/detail, dashboard, or editor surface.
- Right inspector: contextual metadata, linked items, status, owners, and activity.

Tablet layout:

- Left sidebar collapses to icon rail.
- Right inspector opens as a slide-over panel.
- List/detail can remain split if width allows; otherwise use stacked navigation.

Mobile layout:

- Bottom navigation with Today, Fieldbook, Agents, Missions, Reviews.
- Create action is a persistent floating button above bottom nav.
- Filters and inspector open as full-screen sheets.
- Editor uses one-column flow with sticky save/status bar.

### Primary create flow

The create button opens a command-style create sheet.

Options:

- New field note
- New playbook
- New agent profile
- New mission
- New checklist
- New decision
- New test run

Default should be “field note” because quick capture is the fastest path.

Create sheet requirements:

- Keyboard shortcut: `C`.
- Searchable item type list.
- Arrow-key navigation.
- `Enter` selects highlighted type.
- `Esc` closes.
- Mobile: bottom sheet with large touch targets.

### Quick capture flow

Quick capture appears on Today and as a global shortcut.

Fields:

- Title, optional but auto-generated from body if omitted.
- Body, required.
- Type, default Field Note.
- Tags.
- Linked mission or agent.
- Confidence: Low, Medium, High.
- Status: Draft, Needs Review, Accepted, Deprecated.

Behavior:

- Autosave after 800ms idle.
- Show save state inline: Saving, Saved, Offline draft, Failed to save.
- If user leaves mid-entry, preserve draft locally and surface it on Today.
- After save, offer two next actions: “Keep writing” and “Promote to playbook.”

### Library browsing

Fieldbook uses a two-pane browser on desktop:

- Left/content pane: searchable, filterable list of items.
- Right/detail pane: selected item preview or full detail.

Filters:

- Type
- Status
- Owner
- Tags
- Agent
- Mission
- Confidence
- Updated date
- Review due

Sorting:

- Recently updated
- Most used
- Highest confidence
- Needs attention
- A–Z

Each result card should show:

- Type icon
- Title
- One-line summary
- Status pill
- Tags
- Updated date
- Linked agent/mission, if any

### Detail pages

Every item detail page has:

- Header with type, title, status, owner, and primary action.
- Body content.
- Metadata panel.
- Linked items.
- Activity history.
- Comments or review notes.

Primary actions by type:

- Field Note: Promote to playbook, link to mission, request review.
- Playbook: Run checklist, duplicate, mark accepted, deprecate.
- Agent Profile: Start test run, edit instructions, link playbook.
- Mission: Add note, add test run, close mission.
- Checklist: Start checklist, duplicate.
- Decision: Supersede, link evidence.
- Test Run: Mark outcome, link finding, create follow-up.

### Playbook structure

Playbooks should use a consistent template:

1. Purpose
2. When to use
3. Inputs required
4. Procedure
5. Guardrails
6. Failure modes
7. Verification steps
8. Acceptance criteria
9. Related agents, missions, notes, and decisions

The editor should make these sections visible and easy to reorder, but implementation can begin with plain Markdown plus structured metadata.

### Review workflow

Statuses:

- Draft
- Needs Review
- Accepted
- Deprecated

Review queue groups items by urgency:

- Blocking launch
- Due today
- Due this week
- No due date

Review actions:

- Approve
- Request changes
- Deprecate
- Assign owner
- Change due date

Approval must capture reviewer, date, and optional comment.

## Screen-by-screen design

### 1. Today

Purpose: operational home base.

Desktop layout:

- Top bar: page title, global search, create button.
- Left column: quick capture card and active drafts.
- Center column: active missions and recent field notes.
- Right column: pinned playbooks, review queue summary, and recently viewed agents.

Mobile layout:

- Quick capture first.
- Active missions second.
- Review queue third.
- Recent notes fourth.
- Pinned playbooks fifth.

Empty state:

- Headline: “Start your fieldbook.”
- Body: “Capture what you learn about agents, then promote the useful parts into playbooks.”
- Primary action: “Create first field note.”
- Secondary action: “Create an agent profile.”

### 2. Fieldbook

Purpose: searchable library.

Desktop layout:

- Search and filters at top.
- Results list on left.
- Preview/detail on right.

Mobile layout:

- Search bar at top.
- Filter button opens full-screen filter sheet.
- Results list leads to detail pages.

Empty search state:

- Show the active query and filters.
- Offer “Clear filters.”
- Offer “Create field note from this search.”

### 3. Agent profile

Purpose: durable reference for each agent.

Sections:

- Overview: role, owner, maturity, status.
- Instructions: system/developer/user prompt snippets or links.
- Tools: enabled tools, permissions, constraints, known risks.
- Operating model: when to use, when not to use, escalation rules.
- Evaluations: test runs, outcomes, notes.
- Linked playbooks and missions.

Maturity levels:

- Experimental
- Internal-ready
- Production-ready
- Deprecated

Agent cards should show role, maturity, last tested date, and risk level.

### 4. Mission workspace

Purpose: collect work around an outcome.

Sections:

- Mission brief
- Objectives
- Linked agents
- Timeline
- Field notes
- Test runs
- Decisions
- Open follow-ups

Mission statuses:

- Planning
- Active
- Paused
- Completed
- Archived

Completion flow:

- User clicks “Close mission.”
- App asks for outcome summary.
- User selects which notes should become review items.
- Mission becomes read-only except for comments and links.

### 5. Reviews

Purpose: quality gate and operational trust.

Layout:

- Queue grouped by urgency.
- Each item row shows type, title, owner, due date, status, and risk.
- Selecting an item opens review panel with content preview and actions.

Accessible review controls:

- Approve, Request changes, and Deprecate must be real buttons.
- Destructive or status-changing actions require confirmation.
- Request changes must include a comment field.

## Visual direction

### Mood

The visual language should blend:

- Field notebook
- Mission control
- Technical reference manual
- Calm productivity app

Avoid sci-fi excess. The product should feel precise, trusted, and human.

### Color

Use a restrained neutral base with one operational accent.

Suggested palette:

- Background: `#F7F4ED` warm paper
- Surface: `#FFFCF6` notebook page
- Surface raised: `#FFFFFF`
- Text primary: `#1F2933`
- Text secondary: `#5B6472`
- Border: `#DDD6C8`
- Accent: `#315C48` field green
- Accent hover: `#264838`
- Warning: `#A35C00`
- Danger: `#A43E3E`
- Success: `#2F7D4F`
- Info: `#3867A6`

Dark mode palette:

- Background: `#111513`
- Surface: `#171D1A`
- Surface raised: `#202823`
- Text primary: `#F2EFE8`
- Text secondary: `#B8B0A3`
- Border: `#374139`
- Accent: `#7DBA91`

Contrast requirements:

- Body text must meet WCAG AA, 4.5:1 minimum.
- Large text and icons must meet 3:1 minimum.
- Status pills cannot rely on color alone; include text labels.

### Typography

Use a highly readable sans-serif for UI and a slightly editorial style for long-form content.

Recommended stack:

- UI: Inter, system-ui, sans-serif.
- Content: Charter, Georgia, serif as optional enhancement.
- Monospace: JetBrains Mono, SFMono-Regular, Menlo, monospace.

Type scale:

- Page title: 32/40 desktop, 26/34 mobile.
- Section title: 20/28.
- Card title: 16/24.
- Body: 15/24 or 16/26 for reading views.
- Metadata: 13/18.

### Shape and spacing

- Base spacing unit: 4px.
- Card padding: 16px mobile, 20–24px desktop.
- Page gutters: 16px mobile, 24px tablet, 32px desktop.
- Border radius: 12px for cards, 8px for controls, 999px for pills.
- Use subtle 1px borders more than shadows.
- Shadows, when needed: low blur and low opacity.

### Iconography

Use simple line icons with consistent stroke width.

Suggested metaphors:

- Field Note: notebook page
- Playbook: map or manual
- Agent Profile: compass or bot head
- Mission: flag
- Checklist: checked square
- Decision: signpost
- Test Run: flask or pulse
- Review: stamp or eye-check

Icons must never be the only label for navigation or status.

## Components

### Buttons

Variants:

- Primary: filled accent.
- Secondary: neutral outline.
- Ghost: transparent, visible hover/focus.
- Danger: danger-colored outline or fill depending on severity.

Requirements:

- Minimum touch target: 44px by 44px.
- Visible focus ring with at least 2px thickness.
- Disabled state must explain reason via tooltip or inline helper when practical.

### Status pills

Statuses:

- Draft
- Needs Review
- Accepted
- Deprecated
- Experimental
- Internal-ready
- Production-ready
- Planning
- Active
- Paused
- Completed
- Archived

Each pill includes text and color. For example: “Needs Review” in warning color, not just a yellow dot.

### Cards

Card anatomy:

- Type label and icon.
- Title.
- Summary.
- Metadata row.
- Status and tags.
- Optional quick actions.

Cards should be fully clickable only when there are no nested buttons. If quick actions exist, use a clear title link instead of making the whole card interactive.

### Editor

The editor can begin as Markdown with structured side metadata.

Required controls:

- Title input.
- Body editor.
- Type selector.
- Status selector.
- Tag input.
- Linked items picker.
- Owner selector.
- Save indicator.

Accessibility:

- Inputs have visible labels.
- Markdown toolbar buttons have `aria-label`.
- Keyboard shortcuts have discoverable help.
- Autosave failures are announced through an accessible live region.

### Linked item picker

Behavior:

- Opens as popover on desktop, full-screen sheet on mobile.
- Search by title, type, tag, and agent.
- Supports keyboard navigation.
- Shows selected items as removable chips.
- Removal controls have explicit labels like “Remove linked mission Q3 launch.”

## Responsive breakpoints

Use these implementation breakpoints:

- Small: 0–639px
- Medium: 640–1023px
- Large: 1024–1439px
- Extra large: 1440px+

Small:

- One column.
- Bottom nav.
- Floating create button.
- Full-screen sheets for filters and inspectors.
- No hover-only affordances.

Medium:

- Icon rail navigation.
- Main content one or two columns depending on screen.
- Slide-over inspector.

Large:

- Persistent sidebar.
- Main content supports list/detail.
- Optional right inspector.

Extra large:

- Max content width for reading surfaces: 860px.
- Dashboard may use three columns.
- Inspector can remain pinned.

## Accessibility requirements

Keyboard:

- All interactive elements are reachable with Tab.
- Logical focus order follows visual order.
- `Esc` closes modals, sheets, popovers, and command menus.
- Arrow keys navigate menus, listboxes, and command results.
- Focus returns to the invoking control after closing overlays.

Screen readers:

- Use semantic landmarks: header, nav, main, aside.
- Page title is the only `h1`.
- Item cards use headings in order.
- Status changes from autosave and review actions use polite live regions.
- Destructive confirmations use modal dialog semantics.

Motion:

- Respect `prefers-reduced-motion`.
- Keep transitions under 200ms by default.
- Avoid parallax, flashing, or continuous animation.

Color and contrast:

- Meet WCAG AA contrast.
- Never communicate status by color alone.
- Focus states must be visible in both light and dark modes.

Forms:

- Every form field has a label.
- Validation errors appear next to the field and are summarized at top for multi-field forms.
- Error text explains how to fix the issue.

## Loading, empty, error, and offline states

Loading:

- Use skeleton cards for lists.
- Use inline spinner only for button-level actions.
- Preserve layout dimensions to avoid jumping.

Empty:

- Explain what belongs in the space.
- Provide one primary action.
- Avoid generic “No data” copy.

Error:

- Show plain-language error.
- Provide retry when recoverable.
- Preserve unsaved user input.
- For failed save, show “Retry save” and “Copy content.”

Offline:

- Allow drafting notes offline.
- Clearly label offline drafts.
- Queue saves and sync when connection returns.
- Resolve conflicts by showing both versions and asking user to choose or merge.

Permission denied:

- Explain missing access.
- Show who owns the item if known.
- Provide “Request access” only if implemented; otherwise hide it.

## Search and command behavior

Global search:

- Search across title, body, tags, type, agent, mission, and owner.
- Results grouped by type.
- Recent items appear before typing.
- Keyboard shortcut: `/`.

Command menu:

- Keyboard shortcut: `Cmd+K` on macOS and `Ctrl+K` elsewhere.
- Commands include create, navigate, change status, assign owner, link item, and start review.
- Commands should respect current context.

Search result requirements:

- Highlight matching terms.
- Show item type and status.
- Preserve active filters in URL state when routing exists.

## Data model guidance for implementation

Minimum fields for all items:

- `id`
- `type`
- `title`
- `summary`
- `body`
- `status`
- `tags`
- `owner`
- `createdAt`
- `updatedAt`
- `linkedItemIds`

Recommended additional fields:

- `confidence`
- `risk`
- `reviewDueAt`
- `reviewedBy`
- `reviewedAt`
- `source`
- `version`
- `archivedAt`

Agent profile fields:

- `role`
- `instructions`
- `tools`
- `constraints`
- `maturity`
- `lastTestedAt`
- `knownIssues`

Mission fields:

- `objectives`
- `outcome`
- `status`
- `closedAt`

Test run fields:

- `hypothesis`
- `setup`
- `result`
- `evidence`
- `followUps`

## Acceptance criteria

### Navigation and layout

- On desktop width 1024px and above, the app shows persistent left navigation and a main content area.
- On mobile width below 640px, the app uses bottom navigation and a floating create button.
- No primary navigation item is icon-only without an accessible label.
- Main pages are reachable from keyboard alone.

### Today

- User can create a field note from Today in under three interactions.
- Drafts are preserved if the user navigates away before saving.
- Empty Today state includes a primary action to create the first field note.

### Fieldbook

- User can search and filter items by type, status, tag, agent, mission, and owner.
- Empty search state shows the active filters and provides a clear-filters action.
- Selecting an item opens its detail on desktop without losing the result list.
- Selecting an item on mobile opens a dedicated detail view with a visible back control.

### Item editor

- Editor includes title, body, type, status, tags, owner, linked items, and save state.
- Autosave communicates Saving, Saved, Failed, and Offline draft states.
- Failed saves preserve user input and provide retry.
- All editor controls have visible labels and keyboard focus states.

### Playbooks

- Playbooks support the required sections: Purpose, When to use, Inputs required, Procedure, Guardrails, Failure modes, Verification steps, Acceptance criteria, and Related items.
- A field note can be promoted into a playbook while preserving the original note link.

### Reviews

- Items can be moved to Needs Review, Accepted, or Deprecated.
- Approval records reviewer and date.
- Request changes requires a comment.
- Destructive or deprecating actions ask for confirmation.

### Accessibility

- App meets WCAG AA contrast for text and controls.
- All dialogs and sheets trap focus while open and return focus on close.
- Status changes caused by save, approval, or errors are announced to assistive technology.
- Touch targets are at least 44px by 44px.
- App respects reduced-motion settings.

### Responsive quality

- Core flows work at 320px, 768px, 1024px, and 1440px widths.
- Content does not overflow horizontally at 320px.
- Long titles, tags, and metadata wrap or truncate gracefully.
- Reading surfaces keep line length comfortable on wide screens.

### Visual implementation

- Light and dark themes are available or the color tokens are structured so dark mode can be added without component rewrites.
- Status is represented with text plus color, never color alone.
- Components use consistent spacing, radius, typography, and focus states.

## Initial implementation priority

Build in this order:

1. App shell with responsive navigation.
2. Today page with quick capture.
3. Shared item model and editor.
4. Fieldbook search/list/detail.
5. Agent profile detail.
6. Mission workspace.
7. Review queue and approval actions.
8. Dark mode and advanced command menu.

The first usable milestone is complete when a user can create a field note, find it in Fieldbook, edit metadata, promote it to a playbook, and mark the playbook as Needs Review.
