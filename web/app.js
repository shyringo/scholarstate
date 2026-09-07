let state;
let events;
let selectedId;
let filter = "all";
let query = "";

const typeLabels = {
  "ai:paper": "Paper",
  "ai:claim": "Claim",
  "ai:method": "Method",
  "ai:software": "Software",
  "ai:evidence": "Evidence",
};

await refresh();
bindNavigation();
bindFilters();
bindDialog();

async function refresh() {
  [state, events] = await Promise.all([fetchJson("/api/state"), fetchJson("/api/events")]);
  selectedId ??= Object.values(state.objects).find((item) => item.type === "ai:claim")?.id;
  const warnings = state.integrity.warnings.length;
  document.querySelector("#integrity").innerHTML = `<span class="signal"></span> ${state.eventCount} events verified${warnings ? `, ${warnings} warnings` : ""}`;
  document.querySelector("#metric-events").textContent = state.eventCount;
  document.querySelector("#metric-sources").textContent = state.workload.sourceObjects;
  document.querySelector("#metric-crystallized").textContent = state.workload.crystallizedObjects;
  document.querySelector("#metric-review").textContent = state.workload.claimsWithoutHumanAttestation;
  document.querySelector("#scope-note").textContent = `${Object.keys(state.objects).length} durable objects in this bounded record`;
  renderGraph();
  renderDetail();
  renderTable();
  renderLog();
  populateSubjects();
}

function bindNavigation() {
  document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));
}

function showView(name) {
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === name));
  document.querySelectorAll(".view").forEach((item) => item.classList.toggle("active", item.id === `view-${name}`));
}

function bindFilters() {
  document.querySelector("#search").addEventListener("input", (event) => {
    query = event.target.value.toLowerCase();
    renderGraph();
  });
  document.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => {
    filter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("active", item === button));
    renderGraph();
  }));
}

function visibleObjects() {
  return Object.values(state.objects).filter((object) => {
    const matchesType = filter === "all" || object.type === filter;
    const haystack = `${object.latest.title} ${object.latest.summary} ${object.id}`.toLowerCase();
    return matchesType && (!query || haystack.includes(query));
  });
}

function renderGraph() {
  const host = document.querySelector("#graph");
  const objects = visibleObjects();
  if (!objects.length) {
    host.innerHTML = `<div class="empty-detail" style="padding:24px">No objects match this view.</div>`;
    return;
  }
  const width = 760;
  const height = 470;
  const positions = layout(objects, width, height);
  const ids = new Set(objects.map((object) => object.id));
  const edges = state.relations.filter((edge) => ids.has(edge.subject) && ids.has(edge.object));
  host.innerHTML = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
    ${edges.map((edge) => edgeSvg(edge, positions)).join("")}
    ${objects.map((object) => nodeSvg(object, positions[object.id])).join("")}
  </svg>`;
  host.querySelectorAll(".node").forEach((node) => node.addEventListener("click", () => {
    selectedId = node.dataset.id;
    renderGraph();
    renderDetail();
  }));
  host.querySelectorAll(".node").forEach((node) => node.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") node.dispatchEvent(new MouseEvent("click"));
  }));
}

function layout(objects, width, height) {
  const preferred = {
    "arxiv:2205.14135": [145, 100],
    "claim:flashattention-io-aware-exact": [380, 86],
    "method:flashattention-tiling": [380, 248],
    "github:Dao-AILab/flash-attention": [625, 260],
    "evidence:official-reference-tests": [380, 400],
  };
  const fallbackRadius = Math.min(width, height) * 0.32;
  const result = {};
  objects.forEach((object, index) => {
    const angle = (index / objects.length) * Math.PI * 2 - Math.PI / 2;
    result[object.id] = preferred[object.id] ?? [width / 2 + Math.cos(angle) * fallbackRadius, height / 2 + Math.sin(angle) * fallbackRadius];
  });
  return result;
}

function edgeSvg(edge, positions) {
  const [x1, y1] = positions[edge.subject];
  const [x2, y2] = positions[edge.object];
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return `<g><line class="edge" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><text class="edge-label" x="${mx}" y="${my - 5}" text-anchor="middle">${escapeHtml(edge.relationType.replace("ai:", ""))}</text></g>`;
}

function nodeSvg(object, [x, y]) {
  const title = shorten(object.latest.title, 28);
  return `<g class="node ${selectedId === object.id ? "selected" : ""}" data-id="${escapeHtml(object.id)}" transform="translate(${x - 78} ${y - 35})" tabindex="0" role="button" aria-label="${escapeHtml(object.latest.title)}">
    <rect width="156" height="70"></rect>
    <text class="type" x="11" y="16">${escapeHtml(typeLabels[object.type] ?? object.type)}</text>
    <text class="title" x="11" y="35">${escapeHtml(title)}</text>
    <text class="status" x="11" y="55">${escapeHtml(object.status)} - v${object.versions.length}</text>
  </g>`;
}

function renderDetail() {
  const host = document.querySelector("#detail");
  const object = state.objects[selectedId];
  if (!object) {
    host.innerHTML = `<p class="empty-detail">Select an object to inspect its exact version, sources, relations, and attestations.</p>`;
    return;
  }
  const related = state.relations.filter((item) => item.subject === object.id || item.object === object.id);
  const attestations = state.attestations.filter((item) => item.subject === object.id);
  const artifacts = object.latest.artifacts ?? [];
  host.innerHTML = `
    <span class="detail-type">${escapeHtml(typeLabels[object.type] ?? object.type)}</span>
    <h2>${escapeHtml(object.latest.title)}</h2>
    <p class="detail-summary">${escapeHtml(object.latest.summary)}</p>
    <div class="status-line"><span class="status-pill ${object.status}">${escapeHtml(object.status)}</span><span class="subtle">Projected state, not a universal verdict</span></div>
    <dl class="detail-meta"><dt>Stable ID</dt><dd>${escapeHtml(object.id)}</dd><dt>Version</dt><dd>${escapeHtml(object.latest.id)}</dd><dt>Resolution</dt><dd>${escapeHtml(object.latest.attributes.resolution ?? "unspecified")}</dd><dt>Recorded by</dt><dd>${escapeHtml(object.latest.actor.name ?? object.latest.actor.id)} (${escapeHtml(object.latest.actor.kind)})</dd></dl>
    ${crystallizationHtml(object)}
    <div class="detail-section"><h3>Source artifacts</h3><ul class="detail-list">${artifacts.length ? artifacts.map((item) => `<li><a href="${safeUrl(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.role)}</a> &middot; ${escapeHtml(item.mediaType)}</li>`).join("") : "<li>No artifact attached to this object version</li>"}</ul></div>
    <div class="detail-section"><h3>Relations</h3><ul class="detail-list">${related.length ? related.map((item) => `<li><strong>${escapeHtml(item.relationType)}</strong><br>${escapeHtml(item.subject === object.id ? `to ${item.object}` : `from ${item.subject}`)}</li>`).join("") : "<li>No typed relations</li>"}</ul></div>
    <div class="detail-section"><h3>Attestations</h3><ul class="detail-list">${attestations.length ? attestations.map((item) => `<li><strong>${escapeHtml(item.attestationType)} &middot; ${escapeHtml(item.position)}</strong><br>${escapeHtml(item.statement)}<div class="subtle">${escapeHtml(item.accountability)} &middot; proof ${escapeHtml(item.proofStatus)}</div></li>`).join("") : "<li>No one has attested to this object yet</li>"}</ul></div>`;
}

function renderTable() {
  document.querySelector("#object-table").innerHTML = Object.values(state.objects).map((object) => `<tr>
    <td><button class="object-link" data-object="${escapeHtml(object.id)}">${escapeHtml(object.latest.title)}</button><div class="subtle">${escapeHtml(object.id)}</div></td>
    <td>${escapeHtml(object.latest.attributes.resolution ?? "unspecified")}<div class="subtle">${escapeHtml(typeLabels[object.type] ?? object.type)}</div></td><td>${escapeHtml(object.latest.id)}</td>
    <td><span class="status-pill ${object.status}">${escapeHtml(object.status)}</span></td><td>${object.incoming + object.outgoing}</td>
  </tr>`).join("");
  document.querySelectorAll("[data-object]").forEach((button) => button.addEventListener("click", () => {
    selectedId = button.dataset.object;
    showView("map");
    renderGraph();
    renderDetail();
  }));
}

function renderLog() {
  document.querySelector("#event-log").innerHTML = events.map((event) => `<li><span class="event-kind">${escapeHtml(event.type)}</span><div class="event-subject"><strong>${escapeHtml(eventLabel(event))}</strong><div class="subtle">${escapeHtml(event.actor.name ?? event.actor.id)} &middot; ${new Date(event.createdAt).toLocaleString()}</div></div><code class="event-hash">${escapeHtml(event.eventId)}</code></li>`).join("");
}

function eventLabel(event) {
  const value = event.payload;
  return value.title ?? value.statement ?? value.relationId ?? value.activityId ?? value.profileId;
}

function crystallizationHtml(object) {
  const value = object.latest.attributes.crystallization;
  if (!value) return "";
  return `<div class="detail-section"><h3>Why this fragment became durable</h3><ul class="detail-list"><li>${value.triggers.map(escapeHtml).join(", ")}<div class="subtle">${escapeHtml(value.source.objectId)} @ ${escapeHtml(value.source.versionId)} / ${escapeHtml(value.source.selector)}</div></li></ul></div>`;
}

function bindDialog() {
  const dialog = document.querySelector("#attestation-dialog");
  const form = document.querySelector("#attestation-form");
  document.querySelector("#new-attestation").addEventListener("click", () => dialog.showModal());
  document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());
  document.querySelector("#cancel-dialog").addEventListener("click", () => dialog.close());
  document.querySelector("#decisive").addEventListener("change", (event) => {
    document.querySelector("#authority-fields").hidden = !event.target.checked;
    form.elements.jurisdiction.required = event.target.checked;
    form.elements.policy.required = event.target.checked;
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = new FormData(form);
    const actorId = values.get("actorId").trim();
    const decisive = values.get("decisive") === "on";
    const draft = {
      type: "attestation.issue",
      createdAt: new Date().toISOString(),
      actor: { id: actorId, kind: "human", name: values.get("actorName").trim() },
      humanAnchors: [actorId],
      payload: {
        attestationId: `attestation:${Date.now()}-${crypto.randomUUID()}`,
        attestationType: values.get("type"),
        subject: values.get("subject"),
        position: values.get("position"),
        statement: values.get("statement").trim(),
        evidence: [],
        authority: decisive ? { decisive: true, jurisdiction: values.get("jurisdiction").trim(), policy: values.get("policy").trim() } : { decisive: false },
      },
    };
    try {
      document.querySelector("#form-status").textContent = "Appending...";
      const response = await fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) });
      if (!response.ok) throw new Error((await response.json()).error);
      form.reset();
      document.querySelector("#authority-fields").hidden = true;
      document.querySelector("#form-status").textContent = "";
      dialog.close();
      await refresh();
      selectedId = draft.payload.subject;
      renderGraph();
      renderDetail();
    } catch (error) {
      document.querySelector("#form-status").textContent = error.message;
    }
  });
}

function populateSubjects() {
  const select = document.querySelector("#attestation-subject");
  const current = select.value;
  select.innerHTML = Object.values(state.objects).map((object) => `<option value="${escapeAttr(object.id)}">${escapeHtml(object.latest.title)}</option>`).join("");
  if (state.objects[current]) select.value = current;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url}`);
  return response.json();
}

function shorten(value, length) { return value.length > length ? `${value.slice(0, length - 3)}...` : value; }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]); }
function escapeAttr(value) { return escapeHtml(value); }
function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? escapeAttr(url.href) : "#";
  } catch {
    return "#";
  }
}
