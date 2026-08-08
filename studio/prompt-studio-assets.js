const DB_NAME = 'seedance-porter-prompt-studio';
const DB_VERSION = 1;
const STORE = 'reference-assets';

export async function promptStudioAssetCapabilities() {
  return {
    indexedDb:Boolean(globalThis.indexedDB),
    objectUrls:Boolean(globalThis.URL?.createObjectURL)
  };
}

export async function putPromptStudioAsset(file, metadata = {}) {
  if (!globalThis.indexedDB) throw new Error('IndexedDB is unavailable in this browser.');
  if (!(file instanceof Blob)) throw new Error('Reference asset must be a File or Blob.');
  const key = String(metadata.key || `asset-${cryptoId()}`);
  const value = {
    key,
    projectId:String(metadata.projectId || ''),
    referenceId:String(metadata.referenceId || ''),
    name:String(metadata.name || file.name || key),
    type:String(metadata.type || file.type || 'application/octet-stream'),
    size:Number(file.size || 0),
    createdAt:new Date().toISOString(),
    blob:file
  };
  const db = await openDb();
  await transactionPromise(db, 'readwrite', store => store.put(value));
  db.close();
  return assetMetadata(value);
}

export async function getPromptStudioAsset(key) {
  if (!globalThis.indexedDB) return null;
  const db = await openDb();
  const value = await requestPromise(db.transaction(STORE, 'readonly').objectStore(STORE).get(String(key)));
  db.close();
  return value || null;
}

export async function listPromptStudioAssets(projectId = null) {
  if (!globalThis.indexedDB) return [];
  const db = await openDb();
  const all = await requestPromise(db.transaction(STORE, 'readonly').objectStore(STORE).getAll());
  db.close();
  return (all || [])
    .filter(item => !projectId || item.projectId === projectId)
    .map(assetMetadata)
    .sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function deletePromptStudioAsset(key) {
  if (!globalThis.indexedDB) return;
  const db = await openDb();
  await transactionPromise(db, 'readwrite', store => store.delete(String(key)));
  db.close();
}

export async function deletePromptStudioProjectAssets(projectId) {
  const items = await listPromptStudioAssets(projectId);
  for (const item of items) await deletePromptStudioAsset(item.key);
}

export async function promptStudioAssetObjectUrl(key) {
  const asset = await getPromptStudioAsset(key);
  if (!asset?.blob || !globalThis.URL?.createObjectURL) return '';
  return URL.createObjectURL(asset.blob);
}

export function revokePromptStudioAssetObjectUrl(url) {
  try { if (url) URL.revokeObjectURL(url); } catch {}
}

function assetMetadata(value) {
  return {
    key:value.key,
    projectId:value.projectId,
    referenceId:value.referenceId,
    name:value.name,
    type:value.type,
    size:value.size,
    createdAt:value.createdAt
  };
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error || new Error('Unable to open Prompt Studio asset database.'));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath:'key' });
        store.createIndex('projectId', 'projectId', { unique:false });
        store.createIndex('referenceId', 'referenceId', { unique:false });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function transactionPromise(db, mode, action) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    action(store);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Prompt Studio asset transaction failed.'));
    tx.onabort = () => reject(tx.error || new Error('Prompt Studio asset transaction aborted.'));
  });
}

function requestPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Prompt Studio IndexedDB request failed.'));
  });
}

function cryptoId() {
  try { return globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`; }
  catch { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`; }
}
