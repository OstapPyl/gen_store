import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';

// Load environment variables from .env.local if present
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const SERVER_URL = process.env.SYNC_SERVER_URL || 'http://localhost:3000';
const SYNC_TOKEN = process.env.SYNC_API_TOKEN || '';
const DEFAULT_SQLITE_PATH = process.env.SYNC_SQLITE_PATH || path.resolve(process.cwd(), 'orders.sqlite');

function getArg(flag: string): string | null {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  return null;
}

const sqliteFilePath = getArg('--db') || DEFAULT_SQLITE_PATH;
const isOnce = process.argv.includes('--once');

function initLocalDatabase(dbPath: string): DatabaseSync {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      status TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      customer_first_name TEXT NOT NULL,
      customer_last_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      delivery_method TEXT NOT NULL,
      settlement TEXT NOT NULL,
      branch_or_address TEXT NOT NULL,
      delivery_requires_verification INTEGER NOT NULL DEFAULT 0,
      delivery_verification_reason TEXT,
      comment TEXT,
      total_amount_kop INTEGER NOT NULL,
      ttn TEXT,
      internal_comment TEXT
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      sku TEXT NOT NULL,
      price_kop INTEGER NOT NULL,
      quantity INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_status_history (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      previous_status TEXT NOT NULL,
      new_status TEXT NOT NULL,
      comment TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_state (
      key TEXT PRIMARY KEY,
      last_cursor TEXT NOT NULL,
      last_synced_at TEXT NOT NULL
    );
  `);

  return db;
}

async function performSync(db: DatabaseSync): Promise<{ syncedCount: number; hasMore: boolean }> {
  // Read current cursor
  const stateStmt = db.prepare('SELECT last_cursor FROM sync_state WHERE key = ?');
  const stateRow: any = stateStmt.get('orders');
  const cursor = stateRow?.last_cursor || '1970-01-01T00:00:00.000Z';

  const url = `${SERVER_URL}/api/sync/orders?cursor=${encodeURIComponent(cursor)}&limit=100`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (SYNC_TOKEN) {
    headers['Authorization'] = `Bearer ${SYNC_TOKEN}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Помилка сервера HTTP ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  const { orders = [], items = [], history = [], next_cursor, has_more } = data;

  if (orders.length === 0) {
    return { syncedCount: 0, hasMore: false };
  }

  // Transactional Upsert into SQLite
  db.exec('BEGIN IMMEDIATE TRANSACTION;');
  try {
    const upsertOrder = db.prepare(`
      INSERT INTO orders (
        id, order_number, created_at, updated_at, status, payment_status,
        customer_first_name, customer_last_name, customer_phone, customer_email,
        delivery_method, settlement, branch_or_address, delivery_requires_verification,
        delivery_verification_reason, comment, total_amount_kop, ttn, internal_comment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        order_number = excluded.order_number,
        updated_at = excluded.updated_at,
        status = excluded.status,
        payment_status = excluded.payment_status,
        customer_first_name = excluded.customer_first_name,
        customer_last_name = excluded.customer_last_name,
        customer_phone = excluded.customer_phone,
        customer_email = excluded.customer_email,
        delivery_method = excluded.delivery_method,
        settlement = excluded.settlement,
        branch_or_address = excluded.branch_or_address,
        delivery_requires_verification = excluded.delivery_requires_verification,
        delivery_verification_reason = excluded.delivery_verification_reason,
        comment = excluded.comment,
        total_amount_kop = excluded.total_amount_kop,
        ttn = excluded.ttn,
        internal_comment = excluded.internal_comment
    `);

    const upsertItem = db.prepare(`
      INSERT INTO order_items (
        id, order_id, product_id, product_name, sku, price_kop, quantity
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        product_name = excluded.product_name,
        sku = excluded.sku,
        price_kop = excluded.price_kop,
        quantity = excluded.quantity
    `);

    const upsertHistory = db.prepare(`
      INSERT INTO order_status_history (
        id, order_id, created_at, previous_status, new_status, comment
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        previous_status = excluded.previous_status,
        new_status = excluded.new_status,
        comment = excluded.comment
    `);

    for (const o of orders) {
      upsertOrder.run(
        o.id,
        o.order_number,
        o.created_at,
        o.updated_at,
        o.status,
        o.payment_status,
        o.customer_first_name,
        o.customer_last_name,
        o.customer_phone,
        o.customer_email || null,
        o.delivery_method,
        o.settlement,
        o.branch_or_address,
        o.delivery_requires_verification ? 1 : 0,
        o.delivery_verification_reason || null,
        o.comment || null,
        o.total_amount_kop,
        o.ttn || null,
        o.internal_comment || null
      );
    }

    for (const it of items) {
      upsertItem.run(
        it.id,
        it.order_id,
        it.product_id,
        it.product_name,
        it.sku,
        it.price_kop,
        it.quantity
      );
    }

    for (const h of history) {
      upsertHistory.run(
        h.id,
        h.order_id,
        h.created_at,
        h.previous_status,
        h.new_status,
        h.comment || null
      );
    }

    // Save cursor ONLY after successful write
    const nowIso = new Date().toISOString();
    const updateState = db.prepare(`
      INSERT INTO sync_state (key, last_cursor, last_synced_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        last_cursor = excluded.last_cursor,
        last_synced_at = excluded.last_synced_at
    `);
    updateState.run('orders', next_cursor, nowIso);

    db.exec('COMMIT;');

    return {
      syncedCount: orders.length,
      hasMore: Boolean(has_more),
    };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

async function run() {
  console.log(`[Gen Sync Client] Підключення до: ${SERVER_URL}`);
  console.log(`[Gen Sync Client] Локальна база: ${sqliteFilePath}`);

  const db = initLocalDatabase(sqliteFilePath);

  if (isOnce) {
    try {
      let totalSynced = 0;
      let hasMore = true;
      while (hasMore) {
        const res = await performSync(db);
        totalSynced += res.syncedCount;
        hasMore = res.hasMore;
      }
      console.log(`[Gen Sync Client] Синхронізацію завершено. Оновлено/завантажено замовлень: ${totalSynced}`);
      process.exit(0);
    } catch (err: any) {
      console.error(`[Gen Sync Client] Помилка синхронізації:`, err.message);
      process.exit(1);
    }
  }

  // Continuous Mode (for background daemon or manual monitor)
  console.log('[Gen Sync Client] Запущено у фоновому режимі (опитування кожні 5 хвилин)...');
  const poll = async () => {
    try {
      let totalSynced = 0;
      let hasMore = true;
      while (hasMore) {
        const res = await performSync(db);
        totalSynced += res.syncedCount;
        hasMore = res.hasMore;
      }
      if (totalSynced > 0) {
        console.log(`[${new Date().toLocaleTimeString('uk-UA')}] Синхронізовано замовлень: ${totalSynced}`);
      }
    } catch (err: any) {
      console.warn(`[${new Date().toLocaleTimeString('uk-UA')}] Мережа недоступна або сервер офлайн. Повтор через 5 хв: ${err.message}`);
    }
  };

  await poll();
  setInterval(poll, 5 * 60 * 1000);
}

run();
