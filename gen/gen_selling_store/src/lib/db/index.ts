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

function createFallbackClient(): DatabaseClient {
  return {
    isPostgres: () => false,
    async query<T = any>(): Promise<T[]> {
      return [];
    },
    async get<T = any>(): Promise<T | null> {
      return null;
    },
    async run(): Promise<{ changes: number }> {
      return { changes: 0 };
    },
    async transaction<T>(fn: (tx: DatabaseClient) => Promise<T>): Promise<T> {
      return fn(this);
    },
  };
}

function createSqliteClient(dbPath: string): DatabaseClient {
  try {
    // In serverless environments (like Vercel), only /tmp is writable
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    const targetPath = isServerless ? path.join('/tmp', 'gen.db') : dbPath;

    // Ensure directory exists
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Use node:sqlite
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(targetPath);

    // Enable WAL mode and foreign keys for performance & safety
    try {
      db.exec('PRAGMA journal_mode = WAL;');
      db.exec('PRAGMA foreign_keys = ON;');
    } catch {
      // WAL may not be supported in some environments
    }

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
  } catch (err) {
    console.warn('[DB] SQLite initialization failed, falling back to safe memory client:', err);
    return createFallbackClient();
  }
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

let postgresInitRan = false;
async function ensurePostgresInit(pool: any) {
  if (postgresInitRan) return;
  postgresInitRan = true;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id VARCHAR(64) PRIMARY KEY,
        username VARCHAR(64) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(128) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(64) PRIMARY KEY,
        slug VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(128) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL
      );
      INSERT INTO categories (id, slug, name, is_active)
      VALUES ('cat_generators', 'generators', 'Генератори', TRUE)
      ON CONFLICT (id) DO NOTHING;
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(64) PRIMARY KEY,
        slug VARCHAR(128) UNIQUE NOT NULL,
        sku VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(128) NOT NULL,
        model VARCHAR(128) NOT NULL,
        price_kop BIGINT NOT NULL CHECK (price_kop > 0),
        stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
        availability_status VARCHAR(32) NOT NULL DEFAULT 'IN_STOCK',
        status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
        short_description TEXT NOT NULL,
        full_description TEXT,
        images JSONB NOT NULL DEFAULT '[]'::jsonb,
        pdf_manual_url TEXT,
        nominal_power_kw NUMERIC(8, 2) NOT NULL CHECK (nominal_power_kw > 0),
        max_power_kw NUMERIC(8, 2),
        fuel_type VARCHAR(32) NOT NULL,
        nominal_power_petrol_kw NUMERIC(8, 2),
        max_power_petrol_kw NUMERIC(8, 2),
        nominal_power_gas_kw NUMERIC(8, 2),
        max_power_gas_kw NUMERIC(8, 2),
        is_inverter BOOLEAN NOT NULL DEFAULT FALSE,
        phase_type VARCHAR(32) NOT NULL DEFAULT 'SINGLE',
        voltage JSONB NOT NULL DEFAULT '["230V"]'::jsonb,
        starting_methods JSONB NOT NULL DEFAULT '["MANUAL"]'::jsonb,
        alternator_type VARCHAR(128),
        has_avr VARCHAR(16) NOT NULL DEFAULT 'UNKNOWN',
        ats_compatible VARCHAR(16) NOT NULL DEFAULT 'UNKNOWN',
        ats_unit_included VARCHAR(16) NOT NULL DEFAULT 'UNKNOWN',
        fuel_tank_capacity_l NUMERIC(6, 2),
        fuel_consumption_lh NUMERIC(6, 2),
        fuel_consumption_load_pct INTEGER,
        autonomy_hours NUMERIC(6, 2),
        autonomy_load_pct INTEGER,
        noise_level_db NUMERIC(6, 2),
        noise_measurement_conditions TEXT,
        engine_specs TEXT,
        sockets TEXT,
        net_weight_kg NUMERIC(8, 2),
        dimensions_mm VARCHAR(128),
        shipping_weight_kg NUMERIC(8, 2),
        shipping_dimensions_mm VARCHAR(128),
        has_wheels VARCHAR(16) NOT NULL DEFAULT 'UNKNOWN',
        has_handles VARCHAR(16) NOT NULL DEFAULT 'UNKNOWN',
        has_noise_canopy VARCHAR(16) NOT NULL DEFAULT 'UNKNOWN',
        warranty_months INTEGER,
        included_accessories TEXT,
        seo_title VARCHAR(255),
        seo_description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(64) PRIMARY KEY,
        order_number VARCHAR(64) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        idempotency_key VARCHAR(128) UNIQUE,
        status VARCHAR(32) NOT NULL DEFAULT 'NEW',
        payment_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        customer_first_name VARCHAR(128) NOT NULL,
        customer_last_name VARCHAR(128) NOT NULL,
        customer_phone VARCHAR(32) NOT NULL,
        customer_email VARCHAR(128),
        delivery_method VARCHAR(32) NOT NULL,
        settlement VARCHAR(255) NOT NULL,
        settlement_ref VARCHAR(64),
        branch_or_address TEXT NOT NULL,
        branch_ref VARCHAR(64),
        delivery_requires_verification BOOLEAN DEFAULT FALSE NOT NULL,
        delivery_verification_reason TEXT,
        comment TEXT,
        total_amount_kop BIGINT NOT NULL,
        ttn VARCHAR(64),
        internal_comment TEXT
      );
      CREATE TABLE IF NOT EXISTS order_items (
        id VARCHAR(64) PRIMARY KEY,
        order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id VARCHAR(64) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        sku VARCHAR(64) NOT NULL,
        price_kop BIGINT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0)
      );
      CREATE TABLE IF NOT EXISTS order_status_history (
        id VARCHAR(64) PRIMARY KEY,
        order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        previous_status VARCHAR(32) NOT NULL,
        new_status VARCHAR(32) NOT NULL,
        comment TEXT
      );
      CREATE TABLE IF NOT EXISTS store_settings (
        key VARCHAR(64) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
  } catch (err) {
    console.warn('[DB] Auto Postgres init note (tables may already exist):', err);
  }
}

export function getDb(): DatabaseClient {
  if (dbInstance) return dbInstance;

  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))) {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: dbUrl.includes('sslmode=require') || process.env.VERCEL ? { rejectUnauthorized: false } : undefined,
    });

    // Run schema init once in the background
    ensurePostgresInit(pool);

    dbInstance = {
      isPostgres: () => true,
      async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
        await ensurePostgresInit(pool);
        const res = await pool.query(sql, params);
        return res.rows as T[];
      },
      async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
        await ensurePostgresInit(pool);
        const res = await pool.query(sql, params);
        return (res.rows[0] as T) || null;
      },
      async run(sql: string, params: any[] = []): Promise<{ changes: number }> {
        await ensurePostgresInit(pool);
        const res = await pool.query(sql, params);
        return { changes: res.rowCount || 0 };
      },
      async transaction<T>(fn: (tx: DatabaseClient) => Promise<T>): Promise<T> {
        await ensurePostgresInit(pool);
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

  // Fallback to SQLite (in /tmp on Vercel, or ./data locally)
  const defaultPath = process.env.VERCEL
    ? path.join('/tmp', 'gen.db')
    : path.resolve(process.cwd(), 'data', 'gen.db');
  dbInstance = createSqliteClient(defaultPath);
  return dbInstance;
}
