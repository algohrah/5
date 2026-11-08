// ====================================================================
//  قاعدة بيانات SQLite محلية تعمل داخل المتصفح
//  المحرك: sql.js (SQLite مترجمة إلى WebAssembly)
//  الملف الفعلي app.sqlite يُحفظ في IndexedDB ويُحمَّل كاملًا في الذاكرة
//  عند الإقلاع، ويصبح SQLite المصدر الموثوق لكل بيانات المنصة
// ====================================================================

const SQLITE_IDB_NAME = 'tawasul-sqlite';
const IDB_STORE = 'database-files';
const FILE_KEY = 'app.sqlite';
const KV_TABLE = 'kv';

let db: any = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function openSqliteFilesDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SQLITE_IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(IDB_STORE)) database.createObjectStore(IDB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadDatabaseBytes(idb: IDBDatabase): Promise<Uint8Array | null> {
  try {
    const store = idb.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE);
    const value = await idbRequest<any>(store.get(FILE_KEY));
    if (!value) return null;
    if (value instanceof Uint8Array) return value;
    if (value instanceof ArrayBuffer) return new Uint8Array(value);
    if (Array.isArray(value)) return new Uint8Array(value);
    return null;
  } catch {
    return null;
  }
}

async function saveDatabaseBytes(idb: IDBDatabase, bytes: Uint8Array): Promise<void> {
  const store = idb.transaction(IDB_STORE, 'readwrite').objectStore(IDB_STORE);
  await idbRequest(store.put(bytes, FILE_KEY));
}

function kvSet(key: string, value: string): void {
  if (!db) return;
  try {
    const stmt = db.prepare(`INSERT INTO ${KV_TABLE} (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`);
    stmt.bind([key, value]);
    stmt.step();
    stmt.free();
    schedulePersist();
  } catch (error) {
    console.error('[SQLite] فشل كتابة المفتاح:', key, error);
  }
}

function kvRemove(key: string): void {
  if (!db) return;
  try {
    const stmt = db.prepare(`DELETE FROM ${KV_TABLE} WHERE key = ?`);
    stmt.bind([key]);
    stmt.step();
    stmt.free();
    schedulePersist();
  } catch { /* ignore */ }
}

function kvClearAll(): void {
  if (!db) return;
  try {
    db.exec(`DELETE FROM ${KV_TABLE}`);
    schedulePersist();
  } catch { /* ignore */ }
}

/** تصدير قاعدة البيانات وحفظها في IndexedDB (مؤجل لتجميع الكتابات) */
function schedulePersist(): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(persistNow, 400);
}

export async function persistNow(): Promise<void> {
  if (!db) return;
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  try {
    const bytes: Uint8Array = db.export();
    const idb = await openSqliteFilesDb();
    await saveDatabaseBytes(idb, bytes);
  } catch (error) {
    console.error('[SQLite] فشل حفظ قاعدة البيانات:', error);
  }
}

/**
 * تهيئة قاعدة بيانات SQLite:
 * 1. تحميل المحرك (sql.js WASM) — حزمة مستقلة تُحمَّل عند الإقلاع فقط
 * 2. فتح ملف app.sqlite من IndexedDB أو إنشاؤه جديدًا
 * 3. ترحيل البيانات القديمة من localStorage عند أول تشغيل
 * 4. ترطيب localStorage من SQLite (SQLite هو المصدر الموثوق)
 * 5. تركيب كتابة مرورية: كل كتابة localStorage تُسجل في SQLite أيضًا
 */
export async function initializeSqliteDatabase(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const initSqlJs = (await import('sql.js')).default;
    const wasmUrl = (await import('sql.js/dist/sql-wasm.wasm?url')).default;
    const SQL = await initSqlJs({ locateFile: () => wasmUrl });

    const idb = await openSqliteFilesDb();
    const savedBytes = await loadDatabaseBytes(idb);
    db = savedBytes ? new SQL.Database(savedBytes) : new SQL.Database();
    db.exec(`CREATE TABLE IF NOT EXISTS ${KV_TABLE} (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);

    // عدد الصفوف الحالية
    let rowCount = 0;
    const countResult = db.exec(`SELECT COUNT(*) AS c FROM ${KV_TABLE}`);
    if (countResult.length && countResult[0].values.length) {
      rowCount = Number(countResult[0].values[0][0]);
    }

    // ترحيل بيانات قاعدة بيانات محلية سابقة (localStorage) عند أول تشغيل
    if (rowCount === 0 && localStorage.length > 0) {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        const value = key !== null ? localStorage.getItem(key) : null;
        if (key && value !== null) kvSet(key, value);
      }
      console.info('[SQLite] تم ترحيل البيانات السابقة إلى قاعدة بيانات SQLite');
    }

    // ترطيب: استرجاع كل القيم من SQLite إلى localStorage
    const rows = db.exec(`SELECT key, value FROM ${KV_TABLE}`);
    if (rows.length) {
      for (const row of rows[0].values) {
        const key = String(row[0]);
        const value = String(row[1] ?? '');
        try {
          localStorage.setItem(key, value);
        } catch { /* ignore */ }
      }
    }

    // كتابة مرورية: كل setItem/removeItem/clear في localStorage يُسجل في SQLite
    const prototype = Storage.prototype;
    const originalSetItem = prototype.setItem;
    const originalRemoveItem = prototype.removeItem;
    const originalClear = prototype.clear;

    prototype.setItem = function setItem(key: string, value: string) {
      originalSetItem.call(this, key, value);
      kvSet(key, String(value));
    };
    prototype.removeItem = function removeItem(key: string) {
      originalRemoveItem.call(this, key);
      kvRemove(key);
    };
    prototype.clear = function clear() {
      originalClear.call(this);
      kvClearAll();
    };

    // حفظ فوري عند إغلاق/تبديل التبويب
    window.addEventListener('pagehide', () => { persistNow(); });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') persistNow();
    });

    console.info('[DataService] Connected to Local SQLite Database (app.sqlite).');
  } catch (error) {
    console.error('[SQLite] تعذر تهيئة قاعدة البيانات، سيتم الاعتماد على localStorage فقط:', error);
  }
}