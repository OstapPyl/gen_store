import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Product } from '@/types';

function parseProduct(row: any): Product {
  return {
    ...row,
    price_kop: Number(row.price_kop),
    stock: Number(row.stock),
    nominal_power_kw: Number(row.nominal_power_kw),
    max_power_kw: row.max_power_kw != null ? Number(row.max_power_kw) : null,
    nominal_power_petrol_kw: row.nominal_power_petrol_kw != null ? Number(row.nominal_power_petrol_kw) : null,
    max_power_petrol_kw: row.max_power_petrol_kw != null ? Number(row.max_power_petrol_kw) : null,
    nominal_power_gas_kw: row.nominal_power_gas_kw != null ? Number(row.nominal_power_gas_kw) : null,
    max_power_gas_kw: row.max_power_gas_kw != null ? Number(row.max_power_gas_kw) : null,
    is_inverter: Boolean(row.is_inverter),
    fuel_tank_capacity_l: row.fuel_tank_capacity_l != null ? Number(row.fuel_tank_capacity_l) : null,
    fuel_consumption_lh: row.fuel_consumption_lh != null ? Number(row.fuel_consumption_lh) : null,
    fuel_consumption_load_pct: row.fuel_consumption_load_pct != null ? Number(row.fuel_consumption_load_pct) : null,
    autonomy_hours: row.autonomy_hours != null ? Number(row.autonomy_hours) : null,
    autonomy_load_pct: row.autonomy_load_pct != null ? Number(row.autonomy_load_pct) : null,
    noise_level_db: row.noise_level_db != null ? Number(row.noise_level_db) : null,
    net_weight_kg: row.net_weight_kg != null ? Number(row.net_weight_kg) : null,
    shipping_weight_kg: row.shipping_weight_kg != null ? Number(row.shipping_weight_kg) : null,
    warranty_months: row.warranty_months != null ? Number(row.warranty_months) : null,
    images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images || [],
    voltage: typeof row.voltage === 'string' ? JSON.parse(row.voltage) : row.voltage || [],
    starting_methods: typeof row.starting_methods === 'string' ? JSON.parse(row.starting_methods) : row.starting_methods || [],
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const product = await db.get(
    `SELECT * FROM products WHERE (id = $1 OR slug = $1) AND status = 'PUBLISHED'`,
    [id]
  );

  if (!product) {
    return NextResponse.json({ error: 'Товар не знайдено або знято з публікації.' }, { status: 404 });
  }

  return NextResponse.json({ product: parseProduct(product) });
}
