const DB_NAME = 'posyandu_offline'
const DB_VERSION = 1
const STORE_NAME = 'action_queue'

export interface QueueItem {
  id: string
  actionType: 'create_warga' | 'create_layanan' | 'create_pemeriksaan'
  payload: unknown
  timestamp: number
}

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('IndexedDB is only available in browser.'))
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

export function addToQueue(item: Omit<QueueItem, 'id' | 'timestamp'>): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB()
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const id = Math.random().toString(36).substring(2, 15)
      const queueItem: QueueItem = {
        ...item,
        id,
        timestamp: Date.now(),
      }

      const request = store.add(queueItem)
      request.onsuccess = () => resolve(id)
      request.onerror = () => reject(request.error)
    } catch (err) {
      reject(err)
    }
  })
}

export function getQueue(): Promise<QueueItem[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB()
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)

      const request = store.getAll()
      request.onsuccess = () => {
        const sorted = (request.result as QueueItem[]).sort((a, b) => a.timestamp - b.timestamp)
        resolve(sorted)
      }
      request.onerror = () => reject(request.error)
    } catch (err) {
      reject(err)
    }
  })
}

export function removeFromQueue(id: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB()
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    } catch (err) {
      reject(err)
    }
  })
}
