/**
 * Offline Queue System for Student Work Submissions
 * Uses IndexedDB to queue uploads when offline, syncs via Service Worker when online
 */

import { logger } from './logger';

const DB_NAME = 'makr-academy-offline-queue';
const DB_VERSION = 1;
const STORE_NAME = 'pending-uploads';

interface QueuedUpload {
  id: string;
  studentId: string;
  enrollmentId: string;
  lessonId?: string;
  assignmentId?: string;
  fileUrls: string[];
  notes: string;
  submissionType: 'photo' | 'video' | 'document';
  createdAt: number;
  retryCount: number;
}

let db: IDBDatabase | null = null;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('createdAt', 'createdAt', { unique: false });
        objectStore.createIndex('studentId', 'studentId', { unique: false });
      }
    };
  });
};

export const queueUpload = async (upload: Omit<QueuedUpload, 'id' | 'createdAt' | 'retryCount'>): Promise<string> => {
  const database = await initDB();
  const id = crypto.randomUUID();
  const queuedUpload: QueuedUpload = {
    ...upload,
    id,
    createdAt: Date.now(),
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(queuedUpload);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
};

export const getQueuedUploads = async (): Promise<QueuedUpload[]> => {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const removeQueuedUpload = async (id: string): Promise<void> => {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const incrementRetryCount = async (id: string): Promise<void> => {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const upload = getRequest.result;
      if (upload) {
        upload.retryCount += 1;
        const putRequest = store.put(upload);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

// Check if online and sync queued uploads
export const syncQueuedUploads = async (supabase: any): Promise<number> => {
  if (!navigator.onLine) {
    return 0;
  }

  const queuedUploads = await getQueuedUploads();
  let syncedCount = 0;

  for (const upload of queuedUploads) {
    try {
      // Retry limit
      if (upload.retryCount >= 5) {
        await removeQueuedUpload(upload.id);
        continue;
      }

      const { error } = await supabase
        .from('skill_submissions')
        .insert({
          student_id: upload.studentId,
          enrollment_id: upload.enrollmentId,
          lesson_id: upload.lessonId || null,
          assignment_id: upload.assignmentId || null,
          submission_type: upload.submissionType,
          file_urls: upload.fileUrls,
          notes: upload.notes,
          status: 'submitted',
        });

      if (error) {
        await incrementRetryCount(upload.id);
        throw error;
      }

      await removeQueuedUpload(upload.id);
      syncedCount++;
    } catch (error) {
      logger.error('Error syncing queued upload:', error);
      await incrementRetryCount(upload.id);
    }
  }

  return syncedCount;
};

// Listen for online event and sync
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    // Import supabase client dynamically to avoid circular dependencies
    import('@/integrations/supabase/client').then(({ supabase }) => {
      syncQueuedUploads(supabase).then((count) => {
        if (count > 0) {
          // Show notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`${count} submission(s) synced`, {
              body: 'Your queued work submissions have been uploaded.',
            });
          }
        }
      });
    });
  });
}

