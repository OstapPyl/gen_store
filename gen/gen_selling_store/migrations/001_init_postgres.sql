-- Міграція 001: Створення таблиць інтернет-магазину генераторів (Gen)
-- Повна сумісність із PostgreSQL 14+

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

-- Категорія "Генератори" за замовчуванням
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

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price_kop);
CREATE INDEX IF NOT EXISTS idx_products_power ON products(nominal_power_kw);
CREATE INDEX IF NOT EXISTS idx_products_fuel ON products(fuel_type);

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
    settlement_ref VARCHAR(128),
    branch_or_address TEXT NOT NULL,
    branch_ref VARCHAR(128),
    delivery_requires_verification BOOLEAN DEFAULT FALSE NOT NULL,
    delivery_verification_reason TEXT,
    comment TEXT,
    total_amount_kop BIGINT NOT NULL,
    ttn VARCHAR(64),
    internal_comment TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders(updated_at);

CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(64) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(64) NOT NULL,
    price_kop BIGINT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

CREATE TABLE IF NOT EXISTS order_status_history (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    previous_status VARCHAR(32) NOT NULL,
    new_status VARCHAR(32) NOT NULL,
    comment TEXT
);

CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_status_history(order_id);

CREATE TABLE IF NOT EXISTS store_settings (
    key VARCHAR(64) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
