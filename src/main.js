import {
  sanitizeState,
  validateCheckpointInput,
  validateGoalInput,
  validateWorkstreamInput,
} from "./security.js";
import "./styles.css";

const STORAGE_KEY = "agent-fieldbook-state-v1";
const PRIVACY_COPY =
  "Local-only mode: data stays in this browser storage. Raw prompts, model responses, and secrets are rejected.";

const seededState = {
  goal:
    "Launch a dependable research-and-build agent team that can turn an ambiguous product idea into a validated prototype brief by Friday.",
  workstreams: [
    {
      id: crypto.randomUUID(),
      name: "Discovery",
      owner: "Scout",
      status: "Active",
      priority: "High",
      notes:
        "Interview notes are clustered. Need one more market proof point before handoff.",
      updatedAt: minutesAgo(7),
    },
    {
      id: crypto.randomUUID(),
      name: "Prototype",
      owner: "Builder",
      status: "At risk",
      priority: "High",
      notes:
        "Navigation skeleton works; data model still needs sharper checkpoint semantics.",
      updatedAt: minutesAgo(18),
    },
    {
      id: crypto.randomUUID(),
      name: "QA / Review",
      owner: "Sentinel",
      status: "Queued",
      priority: "Medium",
      notes: "Ready to begin once prototype workstream posts an integration checkpoint.",
      updatedAt: minutesAgo(31),
    },
  ],
  checkpoints: [
    {
      id: crypto.randomUUID(),
      title: "Goal reframed into measurable success criteria",
      workstream: "Discovery",
      status: "Completed",
      detail:
        "Operator approved three acceptance checks: evidence quality, runnable artifact, and decision memo.",
      createdAt: minutesAgo(42),
    },
    {
      id: crypto.randomUUID(),
      title: "Prototype interface map drafted",
      workstream: "Prototype",
      status: "In progress",
      detail:
        "Fieldbook panels defined for goal, workstreams, checkpoint log, and activity timeline.",
      createdAt: minutesAgo(20),
    },
    {
      id: crypto.randomUUID(),
      title: "Risk review staged",
      workstream: "QA / Review",
      status: "Queued",
      detail:
        "Waiting on first build artifact before running failure-mode review.",
      createdAt: minutesAgo(12),
    },
  ],
  activities: [
    {
      id: crypto.randomUUID(),
      kind: "handoff",
      text: "A discovery handoff was recorded.",
      at: minutesAgo(46),
    },
    {
      id: crypto.randomUUID(),
      kind: "checkpoint",
      text: "A checkpoint was accepted.",
      at: minutesAgo(41),
    },
    {
      id: crypto.randomUUID(),
      kind: "status",
      text: "A workstream risk flag changed.",
      at: minutesAgo(18),
    },
    {
      id: crypto.randomUUID(),
      kind: "watch",
      text: "A review watch item was opened.",
      at: minutesAgo(11),
    },
  ],
};

let state = loadState();
let ticker;
let privacyMessage = PRIVACY_COPY;

const app = document.querySelector("#app");

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return seededState;

  try {
    return sanitizeState(JSON.parse(saved), seededState);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return seededState;
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeState(state, seededState)));
    return true;
  } catch {
    privacyMessage =
      "Could not save locally. Browser storage may be disabled or full; no external service was contacted.";
    return false;
  }
}

function setPrivacyMessage(message) {
  privacyMessage = message || PRIVACY_COPY;
}

function render() {
  const activeCount = state.workstreams.filter((stream) =>
    ["Active", "At risk"].includes(stream.status),
  ).length;
  const completedCount = state.checkpoints.filter(
    (checkpoint) => checkpoint.status === "Completed",
  ).length;
  const atRiskCount = state.workstreams.filter(
    (stream) => stream.status === "At risk",
  ).length;

  app.innerHTML = `
    <main class="shell">
      <section class="hero panel">
        <div>
          <p class="eyebrow">Operator workspace</p>
          <h1>Agent Fieldbook</h1>
          <p class="lede">Coordinate goals, workstreams, checkpoints, and the signals that keep an agent team moving.</p>
        </div>
        <div class="pulse-card" aria-label="Live activity indicator">
          <span class="pulse-dot"></span>
          <strong>Live field log</strong>
          <span>${relativeTime(new Date())}</span>
        </div>
      </section>

      <section class="privacy-banner panel" aria-live="polite">
        <strong>Privacy guardrails</strong>
        <span>${escapeHtml(privacyMessage)}</span>
      </section>

      <section class="metrics" aria-label="Project summary metrics">
        ${metricCard("Workstreams", state.workstreams.length, `${activeCount} moving`)}
        ${metricCard("Checkpoints", state.checkpoints.length, `${completedCount} complete`)}
        ${metricCard("Risk flags", atRiskCount, atRiskCount ? "needs operator attention" : "clear")}
      </section>

      <section class="grid">
        <article class="panel goal-panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">North star</p>
              <h2>Project goal</h2>
            </div>
            <button id="clear-local-data" class="danger secondary" type="button">Clear local data</button>
          </div>
          <form id="goal-form" class="stack">
            <label for="goal">What should the team accomplish?</label>
            <textarea id="goal" name="goal" rows="7" maxlength="2000">${escapeHtml(state.goal)}</textarea>
            <button type="submit">Save goal</button>
          </form>
        </article>

        <article class="panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Team lanes</p>
              <h2>Workstreams</h2>
            </div>
          </div>
          <form id="workstream-form" class="inline-form">
            <input name="name" required maxlength="80" placeholder="Workstream name" aria-label="Workstream name" />
            <input name="owner" required maxlength="80" placeholder="Owner / agent" aria-label="Owner or agent" />
            <select name="status" aria-label="Workstream status">
              <option>Active</option>
              <option>Queued</option>
              <option>At risk</option>
              <option>Blocked</option>
              <option>Done</option>
            </select>
            <button type="submit">Add</button>
          </form>
          <div class="cards">
            ${state.workstreams.map(workstreamCard).join("")}
          </div>
        </article>
      </section>

      <section class="grid lower-grid">
        <article class="panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Evidence trail</p>
              <h2>Status checkpoints</h2>
            </div>
          </div>
          <form id="checkpoint-form" class="checkpoint-form">
            <input name="title" required maxlength="120" placeholder="Checkpoint title" aria-label="Checkpoint title" />
            <select name="workstream" aria-label="Checkpoint workstream">
              ${state.workstreams.map((stream) => `<option>${escapeHtml(stream.name)}</option>`).join("")}
            </select>
            <select name="status" aria-label="Checkpoint status">
              <option>In progress</option>
              <option>Completed</option>
              <option>Queued</option>
              <option>Blocked</option>
            </select>
            <textarea name="detail" rows="3" maxlength="1000" placeholder="What changed? What evidence matters? Summaries only; do not paste raw prompts, responses, or secrets." aria-label="Checkpoint detail"></textarea>
            <button type="submit">Record checkpoint</button>
          </form>
          <ol class="checkpoint-list">
            ${state.checkpoints.map(checkpointItem).join("")}
          </ol>
        </article>

        <aside class="panel timeline-panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Signals</p>
              <h2>Activity timeline</h2>
            </div>
            <button id="simulate-activity" class="secondary" type="button">Simulate tick</button>
          </div>
          <ol class="timeline">
            ${state.activities
              .slice()
              .sort((a, b) => new Date(b.at) - new Date(a.at))
              .slice(0, 9)
              .map(activityItem)
              .join("")}
          </ol>
        </aside>
      </section>
    </main>
  `;

  bindEvents();
}

function metricCard(label, value, caption) {
  return `
    <article class="metric panel">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(caption)}</small>
    </article>
  `;
}

function workstreamCard(stream) {
  return `
    <article class="workstream-card">
      <div>
        <h3>${escapeHtml(stream.name)}</h3>
        <p>${escapeHtml(stream.notes || "No notes yet.")}</p>
      </div>
      <dl>
        <div><dt>Owner</dt><dd>${escapeHtml(stream.owner)}</dd></div>
        <div><dt>Status</dt><dd><span class="badge ${statusClass(stream.status)}">${escapeHtml(stream.status)}</span></dd></div>
        <div><dt>Priority</dt><dd>${escapeHtml(stream.priority || "Medium")}</dd></div>
        <div><dt>Updated</dt><dd>${relativeTime(stream.updatedAt)}</dd></div>
      </dl>
    </article>
  `;
}

function checkpointItem(checkpoint) {
  return `
    <li>
      <div>
        <h3>${escapeHtml(checkpoint.title)}</h3>
        <p>${escapeHtml(checkpoint.detail || "No detail recorded.")}</p>
      </div>
      <footer>
        <span>${escapeHtml(checkpoint.workstream)}</span>
        <span class="badge ${statusClass(checkpoint.status)}">${escapeHtml(checkpoint.status)}</span>
        <time>${relativeTime(checkpoint.createdAt)}</time>
      </footer>
    </li>
  `;
}

function activityItem(activity) {
  return `
    <li>
      <span class="activity-icon ${statusClass(activity.kind)}"></span>
      <div>
        <p>${escapeHtml(activity.text)}</p>
        <time>${relativeTime(activity.at)}</time>
      </div>
    </li>
  `;
}

function bindEvents() {
  document.querySelector("#goal-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const goal = validateGoalInput(new FormData(event.currentTarget).get("goal"));
    if (!goal.ok) {
      setPrivacyMessage(goal.error);
      render();
      return;
    }

    state.goal = goal.value;
    addActivity("status", "The project goal was updated.");
    if (saveState()) setPrivacyMessage("Goal saved locally.");
    render();
  });

  document
    .querySelector("#workstream-form")
    .addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      const stream = validateWorkstreamInput({
        name: data.get("name"),
        owner: data.get("owner"),
        status: data.get("status"),
      });

      if (!stream.ok) {
        setPrivacyMessage(stream.error);
        render();
        return;
      }

      state.workstreams.unshift({
        id: crypto.randomUUID(),
        ...stream.value,
        updatedAt: new Date().toISOString(),
      });
      addActivity("handoff", "A workstream was opened.");
      if (saveState()) setPrivacyMessage("Workstream saved locally.");
      render();
    });

  document
    .querySelector("#checkpoint-form")
    .addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      const checkpoint = validateCheckpointInput(
        {
          title: data.get("title"),
          workstream: data.get("workstream"),
          status: data.get("status"),
          detail: data.get("detail"),
        },
        state.workstreams.map((stream) => stream.name),
      );

      if (!checkpoint.ok) {
        setPrivacyMessage(checkpoint.error);
        render();
        return;
      }

      state.checkpoints.unshift({
        id: crypto.randomUUID(),
        ...checkpoint.value,
        createdAt: new Date().toISOString(),
      });
      touchWorkstream(checkpoint.value.workstream, checkpoint.value.status);
      addActivity("checkpoint", "A checkpoint was recorded.");
      if (saveState()) setPrivacyMessage("Checkpoint saved locally.");
      render();
    });

  document
    .querySelector("#simulate-activity")
    .addEventListener("click", simulateActivity);

  document.querySelector("#clear-local-data").addEventListener("click", () => {
    const confirmed = window.confirm("Clear Agent Fieldbook data stored in this browser?");
    if (!confirmed) return;
    localStorage.removeItem(STORAGE_KEY);
    state = sanitizeState(seededState, seededState);
    setPrivacyMessage("Local data cleared. Seed data restored in memory; nothing was sent externally.");
    render();
  });
}

function touchWorkstream(name, checkpointStatus) {
  const stream = state.workstreams.find((item) => item.name === name);
  if (!stream) return;

  stream.updatedAt = new Date().toISOString();
  stream.notes =
    checkpointStatus === "Blocked"
      ? "Latest checkpoint indicates a blocker. Operator review recommended."
      : `Latest checkpoint moved to ${checkpointStatus.toLowerCase()}.`;
  if (checkpointStatus === "Blocked") stream.status = "Blocked";
  if (checkpointStatus === "Completed" && stream.status !== "Done") {
    stream.status = "Active";
  }
}

function simulateActivity() {
  const templates = [
    ["watch", "A dependency watch refresh completed."],
    ["status", "A progress beat was posted."],
    ["handoff", "A handoff was prepared."],
    ["checkpoint", "A review gate reminder was created."],
  ];
  const [kind, text] = templates[Math.floor(Math.random() * templates.length)];
  addActivity(kind, text);
  if (saveState()) setPrivacyMessage("Simulated activity saved locally.");
  render();
}

function addActivity(kind, text) {
  state.activities.unshift({
    id: crypto.randomUUID(),
    kind,
    text,
    at: new Date().toISOString(),
  });
  state.activities = state.activities.slice(0, 120);
}

function statusClass(status) {
  return String(status).toLowerCase().replaceAll(" ", "-").replace(/[^a-z0-9-]/g, "");
}

function relativeTime(value) {
  const date = new Date(value);
  const diff = date.getTime() - Date.now();
  const seconds = Math.round(diff / 1000);
  const absolute = Math.abs(seconds);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (absolute < 60) return rtf.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  const days = Math.round(hours / 24);
  return rtf.format(days, "day");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function startTicker() {
  window.clearInterval(ticker);
  ticker = window.setInterval(render, 30_000);
}

render();
startTicker();
