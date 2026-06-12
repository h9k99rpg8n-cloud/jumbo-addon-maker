const DB_NAME = 'jumbo_db';
const STORE_NAME = 'project_store';
const PROJECT_KEY = 'active_project';
const PROJECTS_KEY = 'projects_list';
const ACTIVE_ID_KEY = 'active_project_id';
const MAX_PROJECTS = 20;

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readKey(key, fallback = null) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result ?? fallback);
    request.onerror = () => reject(request.error);
  });
}

async function writeKey(key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

function makeId() {
  return `project_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export async function listProjects() {
  const projects = await readKey(PROJECTS_KEY, []);
  return Array.isArray(projects) ? projects : [];
}

export async function getActiveProjectId() {
  return await readKey(ACTIVE_ID_KEY, null);
}

export async function setActiveProjectId(projectId) {
  return await writeKey(ACTIVE_ID_KEY, projectId);
}

export async function createProject(data) {
  const projects = await listProjects();
  if (projects.length >= MAX_PROJECTS) throw new Error('MAX_PROJECTS');
  const project = { id: makeId(), updatedAt: new Date().toISOString(), ...data };
  projects.unshift(project);
  await writeKey(PROJECTS_KEY, projects);
  await setActiveProjectId(project.id);
  return project;
}

export async function saveProject(data) {
  const projects = await listProjects();
  let activeId = await getActiveProjectId();

  if (!activeId) {
    const created = await createProject(data);
    return created;
  }

  const next = projects.map(project => project.id === activeId ? { ...project, ...data, id: activeId, updatedAt: new Date().toISOString() } : project);
  await writeKey(PROJECTS_KEY, next);
  return next.find(project => project.id === activeId) || null;
}

export async function loadProject(projectId = null) {
  const projects = await listProjects();
  const activeId = projectId || await getActiveProjectId();
  return projects.find(project => project.id === activeId) || projects[0] || null;
}

export async function renameProject(projectId, newName) {
  const projects = await listProjects();
  const next = projects.map(project => project.id === projectId ? { ...project, addon: { ...project.addon, name: newName }, updatedAt: new Date().toISOString() } : project);
  await writeKey(PROJECTS_KEY, next);
  return next.find(project => project.id === projectId) || null;
}

export async function duplicateProject(projectId) {
  const projects = await listProjects();
  if (projects.length >= MAX_PROJECTS) throw new Error('MAX_PROJECTS');
  const source = projects.find(project => project.id === projectId);
  if (!source) return null;
  const copy = JSON.parse(JSON.stringify(source));
  copy.id = makeId();
  copy.updatedAt = new Date().toISOString();
  copy.addon = { ...copy.addon, name: `${copy.addon?.name || 'Proyecto'} copia` };
  const next = [copy, ...projects];
  await writeKey(PROJECTS_KEY, next);
  await setActiveProjectId(copy.id);
  return copy;
}

export async function deleteProject(projectId) {
  const projects = await listProjects();
  const next = projects.filter(project => project.id !== projectId);
  await writeKey(PROJECTS_KEY, next);
  const activeId = await getActiveProjectId();
  if (activeId === projectId) await setActiveProjectId(next[0]?.id || null);
  return next;
}
