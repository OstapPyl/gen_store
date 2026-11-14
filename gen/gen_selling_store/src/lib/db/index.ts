import path from 'path';
import fs from 'fs';

export interface DatabaseClient {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  get<T = any>(sql: string, params?: any[]): Promise<T | null>;
  run(sql: string, params?: any[]): Promise<{ changes: number }>;
  transaction<T>(fn: (tx: DatabaseClient) => Promise<T>): Promise<T>;
  isPostgres(): boolean;
}

let dbInstance: DatabaseClient | null = null;

// Helper to convert $1, $2, ... into ? for SQLite
function normalizeSqlForSqlite(sql: string): string {
  // Replace $1, $2, etc. with ?
  return sql.replace(/\$\d+/g, '?');
}

// Convert boolean parameters for SQLite (true -> 1, false -> 0)
function normalizeParamsForSqlite(params: any[]): any[] {
  return params.map(p => {
    if (typeof p === 'boolean') return p ? 1 : 0;
    if (p !== null && typeof p === 'object' && !(p instanceof Date)) {
      return JSON.stringify(p);
    }
    return p;
  });
}

function createSqliteClient(dbPath: string): DatabaseClient {
  // Ensure directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Use node:sqlite
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(dbPath);

  // Enable WAL mode and foreign keys for performance & safety
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  // Initialize SQLite schema
  initSqliteSchema(db);

  const client: DatabaseClient = {
    isPostgres: () => false,
    async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
      const preparedSql = normalizeSqlForSqlite(sql);
      const normalizedParams = normalizeParamsForSqlite(params);
      const stmt = db.prepare(preparedSql);
      return stmt.all(...normalizedParams) as T[];
    },
    async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
      const preparedSql = normalizeSqlForSqlite(sql);
      const normalizedParams = normalizeParamsForSqlite(params);
      const stmt = db.prepare(preparedSql);
      const row = stmt.get(...normalizedParams);
      return (row as T) || null;
    },
    async run(sql: string, params: any[] = []): Promise<{ changes: number }> {
      const preparedSql = normalizeSqlForSqlite(sql);
      const normalizedParams = normalizeParamsForSqlite(params);
      const stmt = db.prepare(preparedSql);
      const result = stmt.run(...normalizedParams);
      return { changes: Number(result.changes || 0) };
    },
    async transaction<T>(fn: (tx: DatabaseClient) => Promise<T>): Promise<T> {
      db.exec('BEGIN IMMEDIATE TRANSACTION;');
      try {
        const result = await fn(client);
        db.exec('COMMIT;');
        return result;
      } catch (err) {
        db.exec('ROLLBACK;');
        throw err;
      }
    },
  };

  return client;
}

function initSqliteSchema(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    INSERT OR IGNORE INTO categories (id, slug, name, is_active)
    VALUES ('cat_generators', 'generators', 'Генератори', 1);

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      price_kop INTEGER NOT NULL CHECK (price_kop > 0),
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      availability_status TEXT NOT NULL DEFAULT 'IN_STOCK',
      status TEXT NOT NULL DEFAULT 'DRAFT',
      short_description TEXT NOT NULL,
      full_description TEXT,
      images TEXT NOT NULL DEFAULT '[]',
      pdf_manual_url TEXT,

      nominal_power_kw REAL NOT NULL CHECK (nominal_power_kw > 0),
      max_power_kw REAL,
      fuel_type TEXT NOT NULL,
      nominal_power_petrol_kw REAL,
      max_power_petrol_kw REAL,
      nominal_power_gas_kw REAL,
      max_power_gas_kw REAL,
      is_inverter INTEGER NOT NULL DEFAULT 0,
      phase_type TEXT NOT NULL DEFAULT 'SINGLE',
      voltage TEXT NOT NULL DEFAULT '["230V"]',
      starting_methods TEXT NOT NULL DEFAULT '["MANUAL"]',

      alternator_type TEXT,
      has_avr TEXT NOT NULL DEFAULT 'UNKNOWN',
      ats_compatible TEXT NOT NULL DEFAULT 'UNKNOWN',
      ats_unit_included TEXT NOT NULL DEFAULT 'UNKNOWN',
      fuel_tank_capacity_l REAL,
      fuel_consumption_lh REAL,
      fuel_consumption_load_pct INTEGER,
      autonomy_hours REAL,
      autonomy_load_pct INTEGER,
      noise_level_db REAL,
      noise_measurement_conditions TEXT,
      engine_specs TEXT,
      sockets TEXT,
      net_weight_kg REAL,
      dimensions_mm TEXT,
      shipping_weight_kg REAL,
      shipping_dimensions_mm TEXT,
      has_wheels TEXT NOT NULL DEFAULT 'UNKNOWN',
      has_handles TEXT NOT NULL DEFAULT 'UNKNOWN',
      has_noise_canopy TEXT NOT NULL DEFAULT 'UNKNOWN',
      warranty_months INTEGER,
      included_accessories TEXT,
      seo_title TEXT,
      seo_description TEXT,

      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
    CREATE INDEX IF NOT EXISTS idx_products_price ON products(price_kop);
    CREATE INDEX IF NOT EXISTS idx_products_power ON products(nominal_power_kw);
    CREATE INDEX IF NOT EXISTS idx_products_fuel ON products(fuel_type);

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      idempotency_key TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'NEW',
      payment_status TEXT NOT NULL DEFAULT 'PENDING',
      customer_first_name TEXT NOT NULL,
      customer_last_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      delivery_method TEXT NOT NULL,
      settlement TEXT NOT NULL,
      settlement_ref TEXT,
      branch_or_address TEXT NOT NULL,
      branch_ref TEXT,
      delivery_requires_verification INTEGER NOT NULL DEFAULT 0,
      delivery_verification_reason TEXT,
      comment TEXT,
      total_amount_kop INTEGER NOT NULL,
      ttn TEXT,
      internal_comment TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders(updated_at);

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      sku TEXT NOT NULL,
      price_kop INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0)
    );

    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

    CREATE TABLE IF NOT EXISTS order_status_history (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      previous_status TEXT NOT NULL,
      new_status TEXT NOT NULL,
      comment TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_status_history(order_id);

    CREATE TABLE IF NOT EXISTS store_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

async function createPostgresClient(connectionString: string): Promise<DatabaseClient> {
  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
  });

  // Verify connection
  const client = await pool.connect();
  client.release();

  const dbClient: DatabaseClient = {
    isPostgres: () => true,
    async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
      const res = await pool.query(sql, params);
      return res.rows as T[];
    },
    async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
      const res = await pool.query(sql, params);
      return (res.rows[0] as T) || null;
    },
    async run(sql: string, params: any[] = []): Promise<{ changes: number }> {
      const res = await pool.query(sql, params);
      return { changes: res.rowCount || 0 };
    },
    async transaction<T>(fn: (tx: DatabaseClient) => Promise<T>): Promise<T> {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const txClient: DatabaseClient = {
          isPostgres: () => true,
          async query<R = any>(sql: string, params: any[] = []): Promise<R[]> {
            const res = await client.query(sql, params);
            return res.rows as R[];
          },
          async get<R = any>(sql: string, params: any[] = []): Promise<R | null> {
            const res = await client.query(sql, params);
            return (res.rows[0] as R) || null;
          },
          async run(sql: string, params: any[] = []): Promise<{ changes: number }> {
            const res = await client.query(sql, params);
            return { changes: res.rowCount || 0 };
          },
          async transaction<R>(_innerFn: (innerTx: DatabaseClient) => Promise<R>): Promise<R> {
            throw new Error('Nested transactions are not supported');
          },
        };
        const result = await fn(txClient);
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },
  };

  return dbClient;
}

export function getDb(): DatabaseClient {
  if (dbInstance) return dbInstance;

  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))) {
    // Synchronous placeholder until async postgres connects, but for Next.js App Router we initialize:
    // In server environment, we can construct the pg client
    // For universal simplicity and speed, if DATABASE_URL is postgresql, we create it
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: dbUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
    });
    dbInstance = {
      isPostgres: () => true,
      async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
        const res = await pool.query(sql, params);
        return res.rows as T[];
      },
      async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
        const res = await pool.query(sql, params);
        return (res.rows[0] as T) || null;
      },
      async run(sql: string, params: any[] = []): Promise<{ changes: number }> {
        const res = await pool.query(sql, params);
        return { changes: res.rowCount || 0 };
      },
      async transaction<T>(fn: (tx: DatabaseClient) => Promise<T>): Promise<T> {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const txClient: DatabaseClient = {
            isPostgres: () => true,
            async query<R = any>(sql: string, params: any[] = []): Promise<R[]> {
              const res = await client.query(sql, params);
              return res.rows as R[];
            },
            async get<R = any>(sql: string, params: any[] = []): Promise<R | null> {
              const res = await client.query(sql, params);
              return (res.rows[0] as R) || null;
            },
            async run(sql: string, params: any[] = []): Promise<{ changes: number }> {
              const res = await client.query(sql, params);
              return { changes: res.rowCount || 0 };
            },
            async transaction<R>(_innerFn: (innerTx: DatabaseClient) => Promise<R>): Promise<R> {
              throw new Error('Nested transactions are not supported');
            },
          };
          const result = await fn(txClient);
          await client.query('COMMIT');
          return result;
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      },
    };
    return dbInstance;
  }

  // Fallback to local SQLite file in ./data/gen.db
  const defaultPath = path.resolve(process.cwd(), 'data', 'gen.db');
  dbInstance = createSqliteClient(defaultPath);
  return dbInstance;
}
