import {cases, company} from './demo-data.js';

const $ = (selector, root = document) => root.querySelector(selector);
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const caseMap = new Map(cases.map(item => [item.id, item]));
const sourceMap = new Map(cases.flatMap(item => item.sources.map(source => [source.id, {...source, caseId: item.id}])));
const taskMap = new Map(cases.flatMap(item => item.tasks.map(task => [task.id, {...task, caseId: item.id}])));
const storageKey = 'bit-public-demo-v1';
const statuses = {open: 'Offen', progress: 'In Bearbeitung', done: 'Im Demoablauf erledigt'};
const choices = {review: 'Vorschlag zur weiteren Prüfung übernommen', clarify: 'Klärung offener Angaben vorgesehen'};
let state = {view: 'overview', selected: cases[0].id, query: '', category: '', taskFilter: '', reviews: {}, tasks: {}, history: []};
let activeReview = null, activeTask = null, noticeTimer = null, fragOpener = null;
const dialogOpeners = new WeakMap();

function restore() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    if (saved?.version !== 1) return;
    for (const [id, value] of Object.entries(saved.reviews || {})) {
      if (!caseMap.has(id) || !value || !Object.hasOwn(choices, value.choice)) continue;
      state.reviews[id] = {choice: value.choice, actor: String(value.actor || '').slice(0, 80), note: String(value.note || '').slice(0, 800), at: String(value.at || '')};
    }
    for (const [id, value] of Object.entries(saved.tasks || {})) {
      if (!taskMap.has(id) || !value || !Object.hasOwn(statuses, value.status) || !state.reviews[taskMap.get(id).caseId]) continue;
      state.tasks[id] = {title: String(value.title || taskMap.get(id).title).slice(0, 160), owner: String(value.owner || '').slice(0, 100), note: String(value.note || '').slice(0, 800), status: value.status};
    }
    if (Array.isArray(saved.history)) state.history = saved.history.filter(event => event && caseMap.has(event.caseId) && typeof event.title === 'string' && typeof event.at === 'string' && Number.isFinite(Date.parse(event.at))).slice(0, 60).map(event => ({caseId: event.caseId, title: event.title.slice(0, 200), detail: String(event.detail || '').slice(0, 1000), at: event.at}));
  } catch { /* A restricted browser still supports an in-memory demonstration. */ }
}
function save() { try { sessionStorage.setItem(storageKey, JSON.stringify({version: 1, reviews: state.reviews, tasks: state.tasks, history: state.history})); } catch {} }
function announce(message) { clearTimeout(noticeTimer); $('#notice').textContent = message; $('#notice').classList.add('is-visible'); noticeTimer = setTimeout(() => $('#notice').classList.remove('is-visible'), 5500); }
function record(caseId, title, detail = '') { state.history.unshift({caseId, title, detail, at: new Date().toISOString()}); state.history = state.history.slice(0, 60); }
function dateLabel(value) { return new Date(value).toLocaleString('de-DE', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}); }
function taskRows() { return Object.entries(state.tasks).filter(([id]) => taskMap.has(id)).map(([id, saved]) => ({...taskMap.get(id), ...saved})); }
function badge(item) { return `<span class="status-pill ${item.tone}"><span aria-hidden="true"></span>${escapeHtml(item.label)}</span>`; }
function sourceButtons(ids) { return `<span class="source-buttons">${ids.map(id => `<button class="source-link" type="button" data-source="${id}" aria-label="Quelle ${id} öffnen">${id} <span aria-hidden="true">↗</span></button>`).join('')}</span>`; }
function heading(eyebrow, title, description, action = '') { return `<div class="page-heading"><div><p class="eyebrow">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1><p class="page-subtitle">${escapeHtml(description)}</p></div>${action}</div>`; }
function icon(name) {
  const paths = {people:'<circle cx="9" cy="7" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 4a3 3 0 0 1 0 6M21 20v-2a6 6 0 0 0-3-5"/>',chat:'<path d="M3 3h18v13H10l-5 5v-5H3zM7 8h10M7 12h6"/>',scan:'<path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5M3 12h18"/><rect x="8" y="8" width="8" height="8" rx="1"/>',source:'<path d="M5 3h9l5 5v13H5zM14 3v5h5M9 12h6M9 16h6"/>',check:'<path d="m5 12 4 4L19 6"/>'};
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.source}</svg>`;
}
function caseCard(item) { return `<button class="case-card" type="button" data-case="${item.id}"><span class="case-card-top"><span class="case-icon">${icon(item.icon)}</span><span class="case-department">${escapeHtml(item.department)}</span><span class="case-arrow" aria-hidden="true">↗</span></span><strong>${escapeHtml(item.name)}</strong>${badge(item)}<span class="case-purpose">${escapeHtml(item.purpose)}</span><span class="case-card-bottom"><span>${item.sources.length} Quellen · ${item.questions.length} offene Fragen</span><span>${state.reviews[item.id] ? 'Demoentscheidung erfasst' : 'Beispiel erkunden'} →</span></span></button>`; }
function overviewView() {
  const tasks = taskRows(), open = tasks.filter(item => item.status !== 'done').length;
  const stats = [{value: cases.length, label:'Anwendungen', detail:'Drei unterschiedliche Einsatzfälle', view:'inventory', icon:'people'}, {value: sourceMap.size, label:'Quellenauszüge', detail:'Jede Aussage hat einen Bezug', view:'evidence', icon:'source'}, {value: Object.keys(state.reviews).length, label:'Demoentscheidungen', detail:'Ihre dokumentierten Prüfschritte', view:'history', icon:'check'}, {value: open, label:'Offene Maßnahmen', detail:'Aus Ihren Entscheidungen übernommen', view:'tasks', icon:'scan'}];
  return heading(company.name, 'KI-Anwendungen verstehen. Nächste Schritte steuern.', 'Erkunden Sie den Weg von der Beschreibung über die Bewertung bis zur menschlichen Entscheidung.') +
    `<div class="try-cue"><span class="cue-number">1</span><span><strong>Wählen Sie ein Beispiel.</strong> Öffnen Sie eine Quelle und übernehmen Sie anschließend die vorgeschlagenen Maßnahmen.</span><span class="cue-arrow" aria-hidden="true">↓</span></div>` +
    `<section class="kpis" aria-label="Stand dieser Demo">${stats.map(stat => `<button type="button" class="kpi" data-view="${stat.view}"><span class="kpi-top">${icon(stat.icon)}<strong>${stat.value}</strong></span><span class="kpi-label">${stat.label}</span><span class="kpi-detail">${stat.detail}</span><span class="kpi-link">Ansehen →</span></button>`).join('')}</section>` +
    `<section class="section-block"><div class="section-heading"><div><p class="eyebrow">DREI WEGE DURCH BIT</p><h2>Wo möchten Sie anfangen?</h2></div><span class="subtle-count">${cases.length} vorbereitete Fälle</span></div><div class="case-grid">${cases.map(caseCard).join('')}</div></section>` +
    `<section class="workflow-guide"><h2>Ein Vorschlag wird nachvollziehbar.</h2><ol><li><span>01</span><div><strong>Einsatz verstehen</strong><p>Wofür wird die KI tatsächlich genutzt?</p></div></li><li><span>02</span><div><strong>Bewertung prüfen</strong><p>Einordnung und offene Fragen lesen.</p></div></li><li><span>03</span><div><strong>Quelle öffnen</strong><p>Die genaue Grundlage selbst ansehen.</p></div></li><li><span>04</span><div><strong>Weiterarbeiten</strong><p>Entscheidung und Maßnahmen festhalten.</p></div></li></ol></section>`;
}
function inventoryMatches() { const query = state.query.toLocaleLowerCase('de-DE').trim(); return cases.filter(item => (!state.category || item.id === state.category) && (!query || `${item.name} ${item.department} ${item.purpose}`.toLocaleLowerCase('de-DE').includes(query))); }
function inventoryResults() { const matches = inventoryMatches(); return `<p class="filter-count" role="status">${matches.length} von ${cases.length} Beispielen</p><div class="case-grid">${matches.map(caseCard).join('')}</div>${matches.length ? '' : '<div class="empty-state"><h2>Kein Beispiel gefunden.</h2><p>Versuchen Sie „Personal“, „Kundenservice“ oder „Produktion“.</p><button class="button secondary" type="button" data-clear-filter>Filter zurücksetzen</button></div>'}`; }
function inventoryView() { return heading('KI-INVENTAR', 'Anwendungen im Blick', 'Wählen Sie eine Anwendung. Beschreibung, vorbereitete Bewertung und Quellen gehören immer zum selben Beispiel.') + `<div class="filter-bar"><label>Beispiele durchsuchen<input id="caseSearch" type="search" maxlength="100" value="${escapeHtml(state.query)}" placeholder="Name oder Fachbereich"></label><label>Fachbereich<select id="caseCategory"><option value="">Alle Fachbereiche</option>${cases.map(item => `<option value="${item.id}"${state.category === item.id ? ' selected' : ''}>${escapeHtml(item.department)}</option>`).join('')}</select></label></div><div id="inventoryResults">${inventoryResults()}</div>`; }
function caseView() {
  const item = caseMap.get(state.selected) || cases[0], review = state.reviews[item.id];
  return `<button class="back-link" type="button" data-view="inventory">← Alle Anwendungen</button>` + heading(`${item.department} · ${item.id}`, item.name, 'Vorbereitete Beispielbewertung · Menschliche Prüfung bleibt erforderlich.', badge(item)) +
    `<nav class="case-steps" aria-label="Schritte im Beispiel"><button data-section="caseFacts" type="button"><span>1</span>Angaben</button><button data-section="caseAssessment" type="button"><span>2</span>Bewertung</button><button data-section="caseEvidence" type="button"><span>3</span>Quellen</button><button data-section="caseDecision" type="button"><span>4</span>Entscheidung</button></nav>` +
    `<section class="panel" id="caseFacts" tabindex="-1"><div class="panel-heading"><div><p class="eyebrow">01 · EINSATZ VERSTEHEN</p><h2>Was macht diese Anwendung?</h2></div><span class="tag">Fiktiver Fall</span></div><p class="lead-copy">${escapeHtml(item.purpose)}</p><dl class="fact-grid"><div><dt>Fachbereich</dt><dd>${escapeHtml(item.department)}</dd></div><div><dt>Verantwortliche Stelle</dt><dd>${escapeHtml(item.owner)}</dd></div><div><dt>Prüffokus</dt><dd>${escapeHtml(item.role)}</dd></div></dl></section>` +
    `<section class="panel assessment-panel" id="caseAssessment" tabindex="-1"><div class="panel-heading"><div><p class="eyebrow">02 · VORBEREITETE BEWERTUNG</p><h2>Einordnung mit Begründung</h2></div><span class="tag">Beispielvorschlag</span></div><div class="assessment-summary">${badge(item)}<h3>${escapeHtml(item.summary)}</h3><p>${escapeHtml(item.classification)}</p></div><h3 class="small-heading">Worauf stützt sich das?</h3><div class="finding-list">${item.findings.map((finding, i) => `<article class="finding"><span class="finding-number">0${i + 1}</span><div><p>${escapeHtml(finding.text)}</p>${sourceButtons(finding.sources)}</div></article>`).join('')}</div><div class="questions-box"><h3>Was ist noch offen?</h3><ul>${item.questions.map(question => `<li>${escapeHtml(question)}</li>`).join('')}</ul></div></section>` +
    `<section class="panel" id="caseEvidence" tabindex="-1"><div class="panel-heading"><div><p class="eyebrow">03 · QUELLEN PRÜFEN</p><h2>Die Grundlage bleibt sichtbar.</h2></div><span class="subtle-count">${item.sources.length} Quellenauszüge</span></div><div class="source-list">${item.sources.map(sourceCard).join('')}</div></section>` +
    `<section class="panel decision-panel" id="caseDecision" tabindex="-1"><div class="panel-heading"><div><p class="eyebrow">04 · MENSCHLICHER SCHRITT</p><h2>${review ? 'Ihre Demoentscheidung' : 'Wie geht es jetzt weiter?'}</h2></div>${review ? '<span class="tag done-tag">Im Demoablauf erfasst</span>' : ''}</div>${review ? `<div class="saved-decision"><strong>${escapeHtml(choices[review.choice])}</strong><p>${escapeHtml(review.actor)}${Number.isFinite(Date.parse(review.at)) ? ` · ${escapeHtml(dateLabel(review.at))}` : ''}</p>${review.note ? `<blockquote>${escapeHtml(review.note)}</blockquote>` : ''}</div>` : `<p class="lead-copy">Prüfen Sie den Vorschlag und halten Sie Ihren nächsten Schritt fest. Die vorbereitete Bewertung bleibt als Ausgangspunkt erhalten.</p>`}<div class="proposal-list">${item.tasks.map(task => `<div class="proposal"><span>${icon('check')}</span><div><strong>${escapeHtml(task.title)}</strong><p>${escapeHtml(task.reason)}</p><small>Vorgeschlagene Stelle: ${escapeHtml(task.owner)}</small></div></div>`).join('')}</div><div class="panel-actions"><button class="button primary" type="button" data-review="${item.id}">${review ? 'Demoentscheidung bearbeiten' : 'Demoentscheidung erfassen'} <span aria-hidden="true">→</span></button>${review ? `<button class="button secondary" type="button" data-case-tasks="${item.id}">Maßnahmen bearbeiten</button>` : ''}</div><p class="form-hint">Ihre Eingaben ändern nur diesen Demoablauf. Eine Demoentscheidung ist keine fachliche Freigabe.</p></section>`;
}
function sourceCard(source) { return `<button type="button" class="source-card" data-source="${source.id}"><span class="source-icon">${icon('source')}</span><span><strong>${escapeHtml(source.title)}</strong><span>${escapeHtml(source.origin)}</span><small>${source.id} · ${escapeHtml(source.date)}</small></span><span class="source-arrow" aria-hidden="true">↗</span></button>`; }
function evidenceView() { return heading('NACHWEISREGISTER', 'Quellen, die Sie selbst lesen können', 'Sechs fiktive Originalauszüge bilden die Grundlage der vorbereiteten Bewertungen.') + cases.map(item => `<section class="panel"><div class="panel-heading"><div><p class="eyebrow">${escapeHtml(item.department)}</p><h2>${escapeHtml(item.name)}</h2></div><button class="text-button" type="button" data-case="${item.id}">Bewertung öffnen →</button></div><div class="source-list">${item.sources.map(sourceCard).join('')}</div></section>`).join(''); }
function taskCard(task) {
  const item = caseMap.get(task.caseId);
  return `<article class="task-card ${task.status === 'done' ? 'is-done' : ''}"><div class="task-card-top"><span class="tag task-${task.status}">${escapeHtml(statuses[task.status])}</span><button class="text-button" type="button" data-case="${item.id}">${escapeHtml(item.short)} ↗</button></div><h2>${escapeHtml(task.title)}</h2><p>${escapeHtml(task.reason)}</p><dl class="task-meta"><div><dt>Verantwortlich</dt><dd>${escapeHtml(task.owner)}</dd></div><div><dt>Demo-Kennung</dt><dd>${task.id}</dd></div></dl>${task.note ? `<div class="task-note"><strong>Bearbeitungsnotiz</strong><p>${escapeHtml(task.note)}</p></div>` : ''}${sourceButtons(task.sources)}<div class="task-actions"><button class="button secondary" type="button" data-edit-task="${task.id}">Bearbeiten</button><button class="button ${task.status === 'done' ? 'secondary' : 'primary'}" type="button" data-toggle-task="${task.id}">${task.status === 'done' ? 'Wieder öffnen' : 'Als erledigt markieren'}</button></div></article>`;
}
function tasksView() {
  const tasks = taskRows(), visible = tasks.filter(item => !state.taskFilter || item.caseId === state.taskFilter), done = tasks.filter(item => item.status === 'done').length;
  return heading('MASSNAHMEN', 'Aus der Prüfung wird ein nächster Schritt.', 'Verantwortliche Stelle, Bearbeitungsstand und Notizen bleiben mit dem Beispiel und seinen Quellen verbunden.') +
    (tasks.length ? `<div class="task-summary"><p><strong>${tasks.length - done}</strong> offen oder in Bearbeitung <span>·</span> <strong>${done}</strong> im Demoablauf erledigt</p><label>Anwendung<select id="taskCaseFilter"><option value="">Alle Anwendungen</option>${cases.map(item => `<option value="${item.id}"${state.taskFilter === item.id ? ' selected' : ''}>${escapeHtml(item.name)}</option>`).join('')}</select></label></div><div class="task-grid">${visible.map(taskCard).join('')}</div>${visible.length ? '' : '<div class="empty-state"><h2>Für dieses Beispiel noch keine Maßnahme übernommen.</h2><p>Öffnen Sie die Bewertung und erfassen Sie eine Demoentscheidung.</p><button class="button primary" type="button" data-view="inventory">Beispiel auswählen →</button></div>'}` : `<div class="empty-state large-empty"><span class="empty-icon">${icon('check')}</span><h2>Ihr nächster Schritt beginnt bei einer Bewertung.</h2><p>Öffnen Sie ein Beispiel, prüfen Sie die Quellen und erfassen Sie eine Demoentscheidung. Die vorgeschlagenen Maßnahmen erscheinen anschließend hier.</p><button class="button primary" type="button" data-view="inventory">Beispiel auswählen →</button></div>`);
}
function historyView() { return heading('VERLAUF', 'Ihre Schritte bleiben nachvollziehbar.', 'Dieser Verlauf zeigt ausschließlich Ihre Aktionen in dieser Browser-Demo.') + (state.history.length ? `<ol class="timeline">${state.history.map(event => `<li><span class="timeline-dot" aria-hidden="true"></span><time datetime="${escapeHtml(event.at)}">${escapeHtml(dateLabel(event.at))}</time><article><span class="eyebrow">${escapeHtml(caseMap.get(event.caseId).short)} · DEMOAKTION</span><h2>${escapeHtml(event.title)}</h2>${event.detail ? `<p>${escapeHtml(event.detail)}</p>` : ''}<button class="text-button" type="button" data-case="${event.caseId}">${escapeHtml(caseMap.get(event.caseId).name)} öffnen →</button></article></li>`).join('')}</ol>` : `<div class="empty-state large-empty"><span class="empty-icon">${icon('source')}</span><h2>Noch keine Demoentscheidung erfasst.</h2><p>Sobald Sie eine Entscheidung speichern oder eine übernommene Maßnahme bearbeiten, erscheint Ihr Schritt hier.</p><button class="button primary" type="button" data-view="inventory">Ein Beispiel erkunden →</button></div>`); }
const views = {overview: overviewView, inventory: inventoryView, case: caseView, evidence: evidenceView, tasks: tasksView, history: historyView};
function render({focus = false} = {}) {
  $('#viewHost').innerHTML = (views[state.view] || overviewView)();
  document.querySelectorAll('.primary-nav [data-view]').forEach(button => { const current = button.dataset.view === (state.view === 'case' ? 'inventory' : state.view); if (current) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); });
  if (focus) { $('#main').focus({preventScroll:true}); window.scrollTo({top:0, behavior:'instant'}); }
}
function navigate(view) { if (!Object.hasOwn(views, view)) return; state.view = view; closeFrag(false); render({focus:true}); }
function openDialog(id, opener) { const dialog = document.getElementById(id); dialogOpeners.set(dialog, opener || document.activeElement); dialog.showModal(); document.body.style.overflow = 'hidden'; }
function showSource(id, opener) {
  const source = sourceMap.get(id); if (!source) return;
  $('#sourceContent').innerHTML = `<h2 id="sourceTitle">${escapeHtml(source.title)}</h2><p class="dialog-subtitle">${escapeHtml(caseMap.get(source.caseId).name)}</p><dl class="source-meta"><div><dt>Quellenkennung</dt><dd>${source.id}</dd></div><div><dt>Herkunft</dt><dd>${escapeHtml(source.origin)}</dd></div><div><dt>Stand</dt><dd>${escapeHtml(source.date)}</dd></div></dl><p class="quote-label">EXAKTER AUSZUG AUS DEM BEISPIEL</p><blockquote class="source-quote">${escapeHtml(source.quote)}</blockquote><p class="form-hint">Fiktiver Quelltext · Vorbereitete Demonstration</p>`;
  openDialog('sourceDialog', opener);
}
function showReview(id, opener) {
  if (!caseMap.has(id)) return; activeReview = id; const item = caseMap.get(id), prior = state.reviews[id];
  $('#reviewActor').setCustomValidity(''); $('#reviewCase').textContent = item.name; $('#reviewChoice').value = prior?.choice || 'review'; $('#reviewActor').value = prior?.actor || 'Demo-Nutzer:in'; $('#reviewNote').value = prior?.note || ''; openDialog('reviewDialog', opener);
}
function showTask(id, opener) {
  if (!state.tasks[id] || !taskMap.has(id)) return; activeTask = id; const task = {...taskMap.get(id), ...state.tasks[id]};
  $('#taskCase').textContent = caseMap.get(task.caseId).name; $('#taskName').value = task.title; $('#taskOwner').value = task.owner; $('#taskState').value = task.status; $('#taskNote').value = task.note; openDialog('taskDialog', opener);
}
$('#reviewForm').addEventListener('submit', event => {
  event.preventDefault(); if (!caseMap.has(activeReview) || !event.currentTarget.reportValidity()) return;
  const item = caseMap.get(activeReview), actor = $('#reviewActor').value.trim(); if (!actor) { $('#reviewActor').setCustomValidity('Bitte geben Sie eine Person oder Stelle an.'); $('#reviewActor').reportValidity(); return; }
  const choice = $('#reviewChoice').value; if (!Object.hasOwn(choices, choice)) return;
  const existed = Boolean(state.reviews[activeReview]); state.reviews[activeReview] = {choice, actor, note: $('#reviewNote').value.trim(), at: new Date().toISOString()};
  for (const task of item.tasks) if (!state.tasks[task.id]) state.tasks[task.id] = {title: task.title, owner: task.owner, note: '', status: 'open'};
  record(activeReview, existed ? 'Demoentscheidung aktualisiert' : 'Demoentscheidung erfasst', `${choices[choice]} · ${actor}${state.reviews[activeReview].note ? ` · ${state.reviews[activeReview].note}` : ''}`);
  save(); $('#reviewDialog').close(); render(); announce(existed ? 'Demoentscheidung aktualisiert. Ihre Maßnahmenänderungen bleiben erhalten.' : 'Demoentscheidung gespeichert. Zwei Maßnahmen sind jetzt bearbeitbar.');
});
$('#reviewActor').addEventListener('input', event => event.target.setCustomValidity(''));
$('#taskForm').addEventListener('submit', event => {
  event.preventDefault(); if (!state.tasks[activeTask] || !event.currentTarget.reportValidity()) return;
  const title = $('#taskName').value.trim(), owner = $('#taskOwner').value.trim(), status = $('#taskState').value;
  if (!title || !owner || !Object.hasOwn(statuses, status)) { announce('Bitte Maßnahme und verantwortliche Stelle ausfüllen.'); return; }
  state.tasks[activeTask] = {title, owner, status, note: $('#taskNote').value.trim()}; record(taskMap.get(activeTask).caseId, 'Maßnahme bearbeitet', `${title} · ${statuses[status]} · ${owner}`); save(); $('#taskDialog').close(); render(); announce('Änderung in diesem Demoablauf gespeichert.');
});
$('#resetDemo').addEventListener('click', event => openDialog('resetDialog', event.currentTarget));
$('#confirmReset').addEventListener('click', () => { state = {view:'overview',selected:cases[0].id,query:'',category:'',taskFilter:'',reviews:{},tasks:{},history:[]}; save(); $('#resetDialog').close(); render({focus:true}); announce('Demo zurückgesetzt. Alle drei Beispiele sind wieder im Ausgangszustand.'); });
document.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  const data = button.dataset;
  if (data.close) { document.getElementById(data.close)?.close(); return; }
  if (data.view) { navigate(data.view); return; }
  if (data.case && caseMap.has(data.case)) { state.selected = data.case; navigate('case'); return; }
  if (data.source) { showSource(data.source, button); return; }
  if (data.review) { showReview(data.review, button); return; }
  if (data.section) { const section = document.getElementById(data.section); section?.focus({preventScroll:true}); section?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',block:'start'}); return; }
  if (data.caseTasks) { state.taskFilter = data.caseTasks; navigate('tasks'); return; }
  if (data.editTask) { showTask(data.editTask, button); return; }
  if (data.toggleTask && state.tasks[data.toggleTask]) { const task = state.tasks[data.toggleTask]; task.status = task.status === 'done' ? 'open' : 'done'; record(taskMap.get(data.toggleTask).caseId, task.status === 'done' ? 'Maßnahme im Demoablauf erledigt' : 'Maßnahme wieder geöffnet', task.title); save(); render(); [...document.querySelectorAll('[data-toggle-task]')].find(control => control.dataset.toggleTask === data.toggleTask)?.focus({preventScroll:true}); announce(task.status === 'done' ? 'Maßnahme im Demoablauf als erledigt markiert.' : 'Maßnahme wieder geöffnet.'); return; }
  if (Object.hasOwn(data, 'clearFilter')) { state.query = ''; state.category = ''; render(); $('#caseSearch')?.focus(); }
});
$('#viewHost').addEventListener('input', event => { if (event.target.id === 'caseSearch') { state.query = event.target.value; $('#inventoryResults').innerHTML = inventoryResults(); } });
$('#viewHost').addEventListener('change', event => { if (event.target.id === 'caseCategory') { state.category = event.target.value; $('#inventoryResults').innerHTML = inventoryResults(); } if (event.target.id === 'taskCaseFilter') { state.taskFilter = event.target.value; render(); $('#taskCaseFilter').focus(); } });
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; const opener = dialogOpeners.get(dialog); if (opener?.isConnected) opener.focus({preventScroll:true}); else $('#main').focus({preventScroll:true}); });
  dialog.addEventListener('click', event => { if (event.target !== dialog) return; const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); });
});
const narrow = window.matchMedia('(max-width: 1050px)');
function closeFrag(restoreFocus = true) { const wasOpen = $('#fragPanel').classList.contains('is-open'); $('#fragPanel').classList.remove('is-open'); $('#fragPanel').removeAttribute('aria-modal'); $('#fragPanel').removeAttribute('role'); $('#fragBackdrop').hidden = true; $('#openFrag').setAttribute('aria-expanded','false'); $('#main').inert = false; $('#header').inert = false; $('.demo-ribbon').inert = false; if (narrow.matches) $('#fragPanel').setAttribute('aria-hidden','true'); else $('#fragPanel').removeAttribute('aria-hidden'); document.body.style.overflow = ''; if (restoreFocus && wasOpen && fragOpener?.isConnected) fragOpener.focus(); }
$('#openFrag').addEventListener('click', event => { fragOpener = event.currentTarget; $('#fragPanel').classList.add('is-open'); $('#fragPanel').removeAttribute('aria-hidden'); $('#fragPanel').setAttribute('role','dialog'); $('#fragPanel').setAttribute('aria-modal','true'); $('#fragBackdrop').hidden = false; $('#openFrag').setAttribute('aria-expanded','true'); $('#main').inert = true; $('#header').inert = true; $('.demo-ribbon').inert = true; document.body.style.overflow = 'hidden'; $('#closeFrag').focus(); });
$('#closeFrag').addEventListener('click', () => closeFrag()); $('#fragBackdrop').addEventListener('click', () => closeFrag());
document.addEventListener('keydown', event => { if (!$('#fragPanel').classList.contains('is-open')) return; if (event.key === 'Escape') { event.preventDefault(); closeFrag(); } if (event.key === 'Tab') { const focusable = [...$('#fragPanel').querySelectorAll('button,a[href]')].filter(item => item.getClientRects().length); const first = focusable[0], last = focusable.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } } });
narrow.addEventListener('change', () => closeFrag(false));
restore(); closeFrag(false); render();
