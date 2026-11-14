import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Product } from '@/types';

function parseProductRow(row: any): Product {
  let images: string[] = [];
  try {
    images = typeof row.images === 'string' ? JSON.parse(row.images) : row.images || [];
  } catch {
    images = [];
  }

  let voltage: string[] = [];
  try {
    voltage = typeof row.voltage === 'string' ? JSON.parse(row.voltage) : row.voltage || [];
  } catch {
    voltage = [];
  }

  let starting_methods: any[] = [];
  try {
    starting_methods = typeof row.starting_methods === 'string' ? JSON.parse(row.starting_methods) : row.starting_methods || [];
  } catch {
    starting_methods = [];
  }

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
    images,
    voltage,
    starting_methods,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const db = getDb();

  const query = searchParams.get('query')?.trim() || '';
  const sort = searchParams.get('sort') || 'newest';
  const priceMin = searchParams.get('price_min') ? Number(searchParams.get('price_min')) : null;
  const priceMax = searchParams.get('price_max') ? Number(searchParams.get('price_max')) : null;
  const brands = searchParams.getAll('brand').filter(Boolean);
  const powerMin = searchParams.get('power_min') ? Number(searchParams.get('power_min')) : null;
  const powerMax = searchParams.get('power_max') ? Number(searchParams.get('power_max')) : null;
  const fuels = searchParams.getAll('fuel').filter(Boolean);
  const inverter = searchParams.get('inverter');
  const phases = searchParams.getAll('phase').filter(Boolean);
  const startMethods = searchParams.getAll('start').filter(Boolean);
  const inStockOnly = searchParams.get('in_stock') === '1' || searchParams.get('in_stock') === 'true';

  // Additional filters
  const voltage = searchParams.getAll('voltage').filter(Boolean);
  const avr = searchParams.get('avr');
  const atsCompatible = searchParams.get('ats_compatible');
  const atsUnitIncluded = searchParams.get('ats_unit_included');
  const tankMin = searchParams.get('tank_min') ? Number(searchParams.get('tank_min')) : null;
  const tankMax = searchParams.get('tank_max') ? Number(searchParams.get('tank_max')) : null;
  const weightMin = searchParams.get('weight_min') ? Number(searchParams.get('weight_min')) : null;
  const weightMax = searchParams.get('weight_max') ? Number(searchParams.get('weight_max')) : null;
  const canopy = searchParams.get('canopy');
  const wheels = searchParams.get('wheels');

  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') || 24)));
  const offset = (page - 1) * limit;

  const whereClauses: string[] = ["status = 'PUBLISHED'"];
  const params: any[] = [];
  let paramIdx = 1;

  if (query) {
    whereClauses.push(`(
      LOWER(name) LIKE $${paramIdx} OR 
      LOWER(brand) LIKE $${paramIdx} OR 
      LOWER(model) LIKE $${paramIdx} OR 
      LOWER(sku) LIKE $${paramIdx}
    )`);
    params.push(`%${query.toLowerCase()}%`);
    paramIdx++;
  }

  if (priceMin != null && !isNaN(priceMin)) {
    whereClauses.push(`price_kop >= $${paramIdx}`);
    params.push(Math.round(priceMin * 100));
    paramIdx++;
  }

  if (priceMax != null && !isNaN(priceMax)) {
    whereClauses.push(`price_kop <= $${paramIdx}`);
    params.push(Math.round(priceMax * 100));
    paramIdx++;
  }

  if (brands.length > 0) {
    const brandPlaceholders = brands.map(() => `$${paramIdx++}`).join(', ');
    whereClauses.push(`brand IN (${brandPlaceholders})`);
    params.push(...brands);
  }

  if (powerMin != null && !isNaN(powerMin)) {
    whereClauses.push(`nominal_power_kw >= $${paramIdx}`);
    params.push(powerMin);
    paramIdx++;
  }

  if (powerMax != null && !isNaN(powerMax)) {
    whereClauses.push(`nominal_power_kw <= $${paramIdx}`);
    params.push(powerMax);
    paramIdx++;
  }

  if (fuels.length > 0) {
    const fuelPlaceholders = fuels.map(() => `$${paramIdx++}`).join(', ');
    whereClauses.push(`fuel_type IN (${fuelPlaceholders})`);
    params.push(...fuels);
  }

  if (inverter === 'yes') {
    whereClauses.push(`is_inverter = 1`);
  } else if (inverter === 'no') {
    whereClauses.push(`is_inverter = 0`);
  }

  if (phases.length > 0) {
    const phasePlaceholders = phases.map(() => `$${paramIdx++}`).join(', ');
    whereClauses.push(`phase_type IN (${phasePlaceholders})`);
    params.push(...phases);
  }

  if (startMethods.length > 0) {
    // Each start method checked inside JSON string representation
    const methodClauses = startMethods.map(m => {
      params.push(`%"${m}"%`);
      return `starting_methods LIKE $${paramIdx++}`;
    });
    whereClauses.push(`(${methodClauses.join(' OR ')})`);
  }

  if (inStockOnly) {
    whereClauses.push(`stock > 0 AND availability_status = 'IN_STOCK'`);
  }

  // Additional filters
  if (voltage.length > 0) {
    const vClauses = voltage.map(v => {
      params.push(`%"${v}"%`);
      return `voltage LIKE $${paramIdx++}`;
    });
    whereClauses.push(`(${vClauses.join(' OR ')})`);
  }

  if (avr === 'yes') {
    whereClauses.push(`has_avr = 'YES'`);
  } else if (avr === 'no') {
    whereClauses.push(`has_avr = 'NO'`);
  }

  if (atsCompatible === 'yes') {
    whereClauses.push(`ats_compatible = 'YES'`);
  } else if (atsCompatible === 'no') {
    whereClauses.push(`ats_compatible = 'NO'`);
  }

  if (atsUnitIncluded === 'yes') {
    whereClauses.push(`ats_unit_included = 'YES'`);
  } else if (atsUnitIncluded === 'no') {
    whereClauses.push(`ats_unit_included = 'NO'`);
  }

  if (tankMin != null && !isNaN(tankMin)) {
    whereClauses.push(`fuel_tank_capacity_l >= $${paramIdx}`);
    params.push(tankMin);
    paramIdx++;
  }

  if (tankMax != null && !isNaN(tankMax)) {
    whereClauses.push(`fuel_tank_capacity_l <= $${paramIdx}`);
    params.push(tankMax);
    paramIdx++;
  }

  if (weightMin != null && !isNaN(weightMin)) {
    whereClauses.push(`net_weight_kg >= $${paramIdx}`);
    params.push(weightMin);
    paramIdx++;
  }

  if (weightMax != null && !isNaN(weightMax)) {
    whereClauses.push(`net_weight_kg <= $${paramIdx}`);
    params.push(weightMax);
    paramIdx++;
  }

  if (canopy === 'yes') {
    whereClauses.push(`has_noise_canopy = 'YES'`);
  } else if (canopy === 'no') {
    whereClauses.push(`has_noise_canopy = 'NO'`);
  }

  if (wheels === 'yes') {
    whereClauses.push(`has_wheels = 'YES'`);
  } else if (wheels === 'no') {
    whereClauses.push(`has_wheels = 'NO'`);
  }

  // Sorting
  let orderBy = 'created_at DESC';
  if (sort === 'price_asc') {
    orderBy = 'price_kop ASC';
  } else if (sort === 'price_desc') {
    orderBy = 'price_kop DESC';
  } else if (sort === 'power_asc') {
    orderBy = 'nominal_power_kw ASC';
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Get total count
  const countRow = await db.get<{ count: number | string }>(
    `SELECT COUNT(*) as count FROM products ${whereSql}`,
    params
  );
  const total = Number(countRow?.count || 0);

  // Get items with pagination
  const itemsSql = `SELECT * FROM products ${whereSql} ORDER BY ${orderBy} LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
  const itemsParams = [...params, limit, offset];
  const rows = await db.query(itemsSql, itemsParams);
  const items = rows.map(parseProductRow);

  // Compute facets from all published products for filter choices
  const facetRows = await db.query(`
    SELECT 
      MIN(price_kop) as min_price,
      MAX(price_kop) as max_price,
      MIN(nominal_power_kw) as min_power,
      MAX(nominal_power_kw) as max_power,
      MIN(fuel_tank_capacity_l) as min_tank,
      MAX(fuel_tank_capacity_l) as max_tank,
      MIN(net_weight_kg) as min_weight,
      MAX(net_weight_kg) as max_weight
    FROM products WHERE status = 'PUBLISHED'
  `);

  const brandRows = await db.query<{ brand: string }>(
    `SELECT DISTINCT brand FROM products WHERE status = 'PUBLISHED' AND brand IS NOT NULL AND brand != '' ORDER BY brand ASC`
  );

  const facets = {
    brands: brandRows.map(r => r.brand),
    priceRange: {
      min: facetRows[0]?.min_price ? Math.floor(Number(facetRows[0].min_price) / 100) : 0,
      max: facetRows[0]?.max_price ? Math.ceil(Number(facetRows[0].max_price) / 100) : 0,
    },
    powerRange: {
      min: facetRows[0]?.min_power != null ? Number(facetRows[0].min_power) : 0,
      max: facetRows[0]?.max_power != null ? Number(facetRows[0].max_power) : 0,
    },
    tankRange: {
      min: facetRows[0]?.min_tank != null ? Number(facetRows[0].min_tank) : 0,
      max: facetRows[0]?.max_tank != null ? Number(facetRows[0].max_tank) : 0,
    },
    weightRange: {
      min: facetRows[0]?.min_weight != null ? Number(facetRows[0].min_weight) : 0,
      max: facetRows[0]?.max_weight != null ? Number(facetRows[0].max_weight) : 0,
    },
  };

  return NextResponse.json({
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    facets,
  });
}
