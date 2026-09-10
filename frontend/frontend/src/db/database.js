import { defaultAdmin, defaultCategories, defaultProducts, defaultShowrooms } from '../data/defaultCatalog';

const DB_NAME = 'somnera-local-db';
const DB_VERSION = 2;
export const CATALOG_CHANGED_EVENT = 'somnera-catalog-changed';

const stores = ['products', 'categories', 'users', 'carts', 'wishlists', 'orders', 'coupons', 'distributorRequests', 'showrooms', 'meta'];
let dbPromise;

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Local database request failed.'));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error('Local database transaction failed.'));
    transaction.onabort = () => reject(transaction.error || new Error('Local database transaction was cancelled.'));
  });
}

export function openLocalDatabase() {
  if (!('indexedDB' in window)) return Promise.reject(new Error('This browser does not support IndexedDB.'));
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        stores.forEach((name) => {
          if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name, { keyPath: 'id' });
        });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Unable to open the local database.'));
    });
  }
  return dbPromise;
}

export async function getAll(storeName) {
  const db = await openLocalDatabase();
  return requestResult(db.transaction(storeName, 'readonly').objectStore(storeName).getAll());
}

export async function getOne(storeName, id) {
  const db = await openLocalDatabase();
  return requestResult(db.transaction(storeName, 'readonly').objectStore(storeName).get(id));
}

export async function putOne(storeName, value) {
  const db = await openLocalDatabase();
  const transaction = db.transaction(storeName, 'readwrite');
  transaction.objectStore(storeName).put(value);
  await transactionDone(transaction);
  return value;
}

export async function deleteOne(storeName, id) {
  const db = await openLocalDatabase();
  const transaction = db.transaction(storeName, 'readwrite');
  transaction.objectStore(storeName).delete(id);
  await transactionDone(transaction);
}

export async function replaceAll(storeName, values) {
  const db = await openLocalDatabase();
  const transaction = db.transaction(storeName, 'readwrite');
  const store = transaction.objectStore(storeName);
  store.clear();
  values.forEach((value) => store.put(value));
  await transactionDone(transaction);
}

export async function initializeLocalDatabase() {
  const db = await openLocalDatabase();
  const transaction = db.transaction(['products', 'categories', 'users', 'showrooms', 'meta'], 'readwrite');
  const metaStore = transaction.objectStore('meta');
  const initialized = await requestResult(metaStore.get('catalog-version'));
  if (!initialized) {
    defaultProducts.forEach((product) => transaction.objectStore('products').put(structuredClone(product)));
    defaultCategories.forEach((category) => transaction.objectStore('categories').put(structuredClone(category)));
    transaction.objectStore('users').put(structuredClone(defaultAdmin));
    metaStore.put({ id: 'catalog-version', value: 1 });
  }
  const showroomsInitialized = await requestResult(metaStore.get('showrooms-version'));
  if (!showroomsInitialized) {
    defaultShowrooms.forEach((showroom) => transaction.objectStore('showrooms').put(structuredClone(showroom)));
    metaStore.put({ id: 'showrooms-version', value: 1 });
  }
  await transactionDone(transaction);
  return db;
}

export function notifyCatalogChanged() {
  window.dispatchEvent(new CustomEvent(CATALOG_CHANGED_EVENT));
}

export async function resetLocalDatabase() {
  const db = await openLocalDatabase();
  db.close();
  dbPromise = null;
  await new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = resolve;
    request.onerror = () => reject(request.error || new Error('Unable to reset the local database.'));
    request.onblocked = () => reject(new Error('Close other Somnera tabs before resetting local data.'));
  });
  await initializeLocalDatabase();
  notifyCatalogChanged();
}

export function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
