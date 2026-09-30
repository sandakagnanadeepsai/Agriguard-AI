import { DiagnosticResult, OfflineQueueItem, OutbreakRecord } from '../types';

const DB_NAME = 'agriguard_db';
const DB_VERSION = 1;

const STORES = {
  OFFLINE_QUEUE: 'offline_queue',
  DIAGNOSIS_HISTORY: 'diagnosis_history',
  SAVED_OUTBREAKS: 'saved_outbreaks',
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
        db.createObjectStore(STORES.OFFLINE_QUEUE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.DIAGNOSIS_HISTORY)) {
        db.createObjectStore(STORES.DIAGNOSIS_HISTORY, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.SAVED_OUTBREAKS)) {
        db.createObjectStore(STORES.SAVED_OUTBREAKS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ----------------- OFFLINE QUEUE (Store-and-Forward) -----------------
export async function enqueueOfflineScan(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'status'> & { id?: string }): Promise<OfflineQueueItem> {
  const db = await openDB();
  const queueItem: OfflineQueueItem = {
    id: item.id || `queue-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: Date.now(),
    imageBase64: item.imageBase64,
    mimeType: item.mimeType,
    cropHint: item.cropHint,
    latitude: item.latitude,
    longitude: item.longitude,
    regionName: item.regionName,
    status: 'pending',
    cachedResult: item.cachedResult,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.OFFLINE_QUEUE, 'readwrite');
    const store = tx.objectStore(STORES.OFFLINE_QUEUE);
    const req = store.put(queueItem);
    req.onsuccess = () => resolve(queueItem);
    req.onerror = () => reject(req.error);
  });
}

export async function getOfflineQueue(): Promise<OfflineQueueItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.OFFLINE_QUEUE, 'readonly');
      const store = tx.objectStore(STORES.OFFLINE_QUEUE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function updateOfflineQueueItem(item: OfflineQueueItem): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.OFFLINE_QUEUE, 'readwrite');
    const store = tx.objectStore(STORES.OFFLINE_QUEUE);
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function removeOfflineQueueItem(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.OFFLINE_QUEUE, 'readwrite');
    const store = tx.objectStore(STORES.OFFLINE_QUEUE);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ----------------- DIAGNOSIS HISTORY -----------------
export async function saveDiagnosisToHistory(diagnosis: DiagnosticResult): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DIAGNOSIS_HISTORY, 'readwrite');
      const store = tx.objectStore(STORES.DIAGNOSIS_HISTORY);
      const req = store.put(diagnosis);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not save to IndexedDB history:', err);
  }
}

export async function getDiagnosisHistory(): Promise<DiagnosticResult[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DIAGNOSIS_HISTORY, 'readonly');
      const store = tx.objectStore(STORES.DIAGNOSIS_HISTORY);
      const req = store.getAll();
      req.onsuccess = () => {
        const sorted = (req.result || []).sort((a: DiagnosticResult, b: DiagnosticResult) => b.timestamp - a.timestamp);
        resolve(sorted);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function clearDiagnosisHistory(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DIAGNOSIS_HISTORY, 'readwrite');
      const store = tx.objectStore(STORES.DIAGNOSIS_HISTORY);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Error clearing history:', err);
  }
}
