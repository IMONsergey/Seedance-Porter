import { createPromptStudioProject, projectSnapshot, refreshPromptStudioProject, PROMPT_STUDIO_PROJECT_KIND } from './prompt-studio-engine.js';

const INDEX_KEY = 'porterPromptStudio:index:v1';
const CURRENT_KEY = 'porterPromptStudio:current:v1';
const PROJECT_PREFIX = 'porterPromptStudio:project:';
const REVISION_PREFIX = 'porterPromptStudio:revisions:';
const MAX_REVISIONS = 25;

export function listPromptStudioProjects() {
  const index = readJson(INDEX_KEY, []);
  return Array.isArray(index) ? index.sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||''))) : [];
}

export function loadPromptStudioProject(id) {
  const raw = readJson(`${PROJECT_PREFIX}${id}`, null);
  if (!raw || raw.kind !== PROMPT_STUDIO_PROJECT_KIND) return null;
  return refreshPromptStudioProject(raw, raw.updatedAt || Date.now());
}

export function currentPromptStudioProjectId() {
  try { return localStorage.getItem(CURRENT_KEY) || ''; } catch { return ''; }
}

export function setCurrentPromptStudioProjectId(id) {
  try {
    if (id) localStorage.setItem(CURRENT_KEY, String(id));
    else localStorage.removeItem(CURRENT_KEY);
  } catch {}
}

export function createAndSavePromptStudioProject(seed = {}) {
  const project = createPromptStudioProject(seed);
  savePromptStudioProject(project, { revision:false, reason:'created' });
  return project;
}

export function savePromptStudioProject(project, options = {}) {
  const refreshed = refreshPromptStudioProject(project, options.now || Date.now());
  const key = `${PROJECT_PREFIX}${refreshed.id}`;
  const previous = readJson(key, null);
  if (options.revision !== false && previous && meaningfulProjectChange(previous, refreshed)) {
    saveRevision(previous, options.reason || 'autosave');
  }
  writeJson(key, refreshed);
  updateIndex(refreshed);
  setCurrentPromptStudioProjectId(refreshed.id);
  dispatchChange('save', refreshed.id);
  return refreshed;
}

export function deletePromptStudioProject(id) {
  try {
    localStorage.removeItem(`${PROJECT_PREFIX}${id}`);
    localStorage.removeItem(`${REVISION_PREFIX}${id}`);
  } catch {}
  const next = listPromptStudioProjects().filter(item => item.id !== id);
  writeJson(INDEX_KEY, next);
  if (currentPromptStudioProjectId() === id) setCurrentPromptStudioProjectId('');
  dispatchChange('delete', id);
}

export function duplicatePromptStudioProject(id, now = Date.now()) {
  const source = loadPromptStudioProject(id);
  if (!source) return null;
  const copy = createPromptStudioProject({
    ...projectSnapshot(source),
    id:undefined,
    title:`${source.title} — Copy`,
    createdAt:undefined,
    updatedAt:undefined,
    now
  });
  savePromptStudioProject(copy, { revision:false, reason:'duplicated' });
  return copy;
}

export function listPromptStudioRevisions(id) {
  const revisions = readJson(`${REVISION_PREFIX}${id}`, []);
  return Array.isArray(revisions) ? revisions : [];
}

export function createPromptStudioRevision(project, reason = 'manual snapshot') {
  saveRevision(projectSnapshot(project), reason);
  dispatchChange('revision', project.id);
  return listPromptStudioRevisions(project.id);
}

export function restorePromptStudioRevision(projectId, revisionId, now = Date.now()) {
  const revisions = listPromptStudioRevisions(projectId);
  const revision = revisions.find(item => item.id === revisionId);
  if (!revision?.project) return null;
  const current = loadPromptStudioProject(projectId);
  if (current) saveRevision(current, 'before revision restore');
  const restored = refreshPromptStudioProject({ ...revision.project, id:projectId }, now);
  return savePromptStudioProject(restored, { revision:false, reason:`restored ${revisionId}` });
}

export function exportPromptStudioProject(project) {
  return `${JSON.stringify({
    schemaVersion:1,
    kind:'seedance-porter-prompt-studio-export',
    exportedAt:new Date().toISOString(),
    project:projectSnapshot(project)
  }, null, 2)}\n`;
}

export function importPromptStudioProject(payload, now = Date.now()) {
  const value = typeof payload === 'string' ? JSON.parse(payload) : payload;
  const raw = value?.kind === 'seedance-porter-prompt-studio-export' ? value.project : value;
  if (!raw || raw.kind !== PROMPT_STUDIO_PROJECT_KIND) throw new Error('Not a Seedance Porter Prompt Studio project.');
  const imported = createPromptStudioProject({
    ...raw,
    id:undefined,
    title:`${raw.title || 'Imported project'} — Imported`,
    createdAt:undefined,
    updatedAt:undefined,
    now
  });
  savePromptStudioProject(imported, { revision:false, reason:'imported' });
  return imported;
}

function updateIndex(project) {
  const current = listPromptStudioProjects().filter(item => item.id !== project.id);
  current.unshift({
    id:project.id,
    title:project.title,
    updatedAt:project.updatedAt,
    createdAt:project.createdAt,
    mode:project.mode,
    aspect:project.aspect,
    duration:project.duration,
    sourceKind:project.source?.kind || 'manual',
    sourceTitle:project.source?.title || '',
    score:project.quality?.score ?? null
  });
  writeJson(INDEX_KEY, current.slice(0, 250));
}

function saveRevision(project, reason) {
  if (!project?.id) return;
  const key = `${REVISION_PREFIX}${project.id}`;
  const revisions = listPromptStudioRevisions(project.id);
  const snapshot = projectSnapshot(project);
  const serialized = JSON.stringify(snapshot);
  if (revisions[0]?.fingerprint === serialized) return;
  revisions.unshift({
    id:`rev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`,
    createdAt:new Date().toISOString(),
    reason:String(reason || 'revision'),
    fingerprint:serialized,
    project:snapshot
  });
  writeJson(key, revisions.slice(0, MAX_REVISIONS));
}

function meaningfulProjectChange(a,b) {
  const strip = value => {
    const copy = JSON.parse(JSON.stringify(value || {}));
    delete copy.updatedAt;
    delete copy.compiledPrompt;
    delete copy.quality;
    delete copy.lastPatch;
    return copy;
  };
  return JSON.stringify(strip(a)) !== JSON.stringify(strip(b));
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (error) { throw new Error(`Prompt Studio local storage failed: ${error?.message || error}`); }
}

function dispatchChange(type, projectId) {
  try { window.dispatchEvent(new CustomEvent('porter-prompt-studio-change', { detail:{ type, projectId } })); } catch {}
}
