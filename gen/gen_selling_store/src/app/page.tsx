import React from 'react';
import Link from 'next/link';
import { getDb } from '@/lib/db';
import { Product } from '@/types';
import CatalogFilters from '@/components/CatalogFilters';
import ProductCard from '@/components/ProductCard';
import { AlertCircle, PackageX, Sparkles, SlidersHorizontal } from 'lucide-react';

interface HomePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

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
    is_inverter: Boolean(row.is_inverter),
    images,
    voltage,
    starting_methods,
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const db = getDb();

  // Check if store has any published products at all
  const totalPublishedRow = await db.get<{ count: number | string }>(
    "SELECT COUNT(*) as count FROM products WHERE status = 'PUBLISHED'"
  );
  const totalPublishedInStore = Number(totalPublishedRow?.count || 0);

  // Extract filter parameters
  const query = typeof params.query === 'string' ? params.query.trim() : '';
  const sort = typeof params.sort === 'string' ? params.sort : 'newest';
  const priceMin = params.price_min ? Number(params.price_min) : null;
  const priceMax = params.price_max ? Number(params.price_max) : null;
  const brands = Array.isArray(params.brand) ? params.brand : params.brand ? [params.brand] : [];
  const powerMin = params.power_min ? Number(params.power_min) : null;
  const powerMax = params.power_max ? Number(params.power_max) : null;
  const fuels = Array.isArray(params.fuel) ? params.fuel : params.fuel ? [params.fuel] : [];
  const inverter = typeof params.inverter === 'string' ? params.inverter : null;
  const phases = Array.isArray(params.phase) ? params.phase : params.phase ? [params.phase] : [];
  const startMethods = Array.isArray(params.start) ? params.start : params.start ? [params.start] : [];
  const inStockOnly = params.in_stock === '1' || params.in_stock === 'true';

  // Additional options
  const voltage = Array.isArray(params.voltage) ? params.voltage : params.voltage ? [params.voltage] : [];
  const avr = typeof params.avr === 'string' ? params.avr : null;
  const atsCompatible = typeof params.ats_compatible === 'string' ? params.ats_compatible : null;
  const atsUnitIncluded = typeof params.ats_unit_included === 'string' ? params.ats_unit_included : null;
  const canopy = typeof params.canopy === 'string' ? params.canopy : null;
  const wheels = typeof params.wheels === 'string' ? params.wheels : null;

  // Build filter query
  const whereClauses: string[] = ["status = 'PUBLISHED'"];
  const sqlParams: any[] = [];
  let paramIdx = 1;

  if (query) {
    whereClauses.push(`(
      LOWER(name) LIKE $${paramIdx} OR 
      LOWER(brand) LIKE $${paramIdx} OR 
      LOWER(model) LIKE $${paramIdx} OR 
      LOWER(sku) LIKE $${paramIdx}
    )`);
    sqlParams.push(`%${query.toLowerCase()}%`);
    paramIdx++;
  }

  if (priceMin != null && !isNaN(priceMin)) {
    whereClauses.push(`price_kop >= $${paramIdx++}`);
    sqlParams.push(Math.round(priceMin * 100));
  }
  if (priceMax != null && !isNaN(priceMax)) {
    whereClauses.push(`price_kop <= $${paramIdx++}`);
    sqlParams.push(Math.round(priceMax * 100));
  }

  if (brands.length > 0) {
    const brandPlaceholders = brands.map(() => `$${paramIdx++}`).join(', ');
    whereClauses.push(`brand IN (${brandPlaceholders})`);
    sqlParams.push(...brands);
  }

  if (powerMin != null && !isNaN(powerMin)) {
    whereClauses.push(`nominal_power_kw >= $${paramIdx++}`);
    sqlParams.push(powerMin);
  }
  if (powerMax != null && !isNaN(powerMax)) {
    whereClauses.push(`nominal_power_kw <= $${paramIdx++}`);
    sqlParams.push(powerMax);
  }

  if (fuels.length > 0) {
    const fuelPlaceholders = fuels.map(() => `$${paramIdx++}`).join(', ');
    whereClauses.push(`fuel_type IN (${fuelPlaceholders})`);
    sqlParams.push(...fuels);
  }

  if (inverter === 'yes') {
    whereClauses.push(`is_inverter = 1`);
  } else if (inverter === 'no') {
    whereClauses.push(`is_inverter = 0`);
  }

  if (phases.length > 0) {
    const phasePlaceholders = phases.map(() => `$${paramIdx++}`).join(', ');
    whereClauses.push(`phase_type IN (${phasePlaceholders})`);
    sqlParams.push(...phases);
  }

  if (startMethods.length > 0) {
    const sClauses = startMethods.map(m => {
      sqlParams.push(`%"${m}"%`);
      return `starting_methods LIKE $${paramIdx++}`;
    });
    whereClauses.push(`(${sClauses.join(' OR ')})`);
  }

  if (inStockOnly) {
    whereClauses.push(`stock > 0 AND availability_status = 'IN_STOCK'`);
  }

  if (voltage.length > 0) {
    const vClauses = voltage.map(v => {
      sqlParams.push(`%"${v}"%`);
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

  let orderBy = 'created_at DESC';
  if (sort === 'price_asc') orderBy = 'price_kop ASC';
  else if (sort === 'price_desc') orderBy = 'price_kop DESC';
  else if (sort === 'power_asc') orderBy = 'nominal_power_kw ASC';

  const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

  const rows = await db.query(`SELECT * FROM products ${whereSql} ORDER BY ${orderBy}`, sqlParams);
  const products: Product[] = rows.map(parseProductRow);

  // Compute facets for published products
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

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 mb-8 border-b border-graphite-200 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600 mb-1">
            <Sparkles className="w-4 h-4" /> Каталог обладнання
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-graphite-950 tracking-tight">
            Генератори
          </h1>
          <p className="text-sm text-graphite-500 mt-1">
            Надійне резервне живлення для дому, бізнесу та виробництва
          </p>
        </div>

        {totalPublishedInStore > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-graphite-500 font-medium whitespace-nowrap">
              Знайдено: <strong className="text-graphite-900 font-bold">{products.length}</strong> {products.length === 1 ? 'модель' : products.length > 1 && products.length < 5 ? 'моделі' : 'моделей'}
            </span>

            {/* Sorting */}
            <form method="GET" action="/" className="flex items-center gap-1.5">
              {/* Keep other filters */}
              {Object.entries(params).map(([key, val]) => {
                if (key === 'sort' || key === 'page' || !val) return null;
                if (Array.isArray(val)) {
                  return val.map((v, i) => <input key={`${key}-${i}`} type="hidden" name={key} value={v} />);
                }
                return <input key={key} type="hidden" name={key} value={val} />;
              })}
              <label htmlFor="sort-select" className="sr-only">
                Сортування
              </label>
              <select
                id="sort-select"
                name="sort"
                defaultValue={sort}
                className="text-xs font-semibold bg-white border border-graphite-300 rounded-xl px-3 py-2 text-graphite-800 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-2xs"
              >
                <option value="newest">Спочатку нові</option>
                <option value="price_asc">Спочатку дешевші</option>
                <option value="price_desc">Спочатку дорожчі</option>
                <option value="power_asc">За зростанням потужності</option>
              </select>
            </form>
          </div>
        )}
      </div>

      {/* Main Layout: Filters Left + Catalog Right */}
      {totalPublishedInStore === 0 ? (
        /* Empty Catalog State: "Товари незабаром з’являться" */
        <div className="bg-white rounded-3xl border border-graphite-200 p-12 sm:p-20 text-center max-w-2xl mx-auto shadow-xs my-8">
          <div className="w-20 h-20 rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <PackageX className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-graphite-900 mb-3">
            Товари незабаром з’являться
          </h2>
          <p className="text-sm text-graphite-500 max-w-md mx-auto leading-relaxed mb-6">
            Каталог наразі наповнюється. Справжні генератори додаються адміністратором через панель керування.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-graphite-100 rounded-xl text-xs font-semibold text-graphite-600">
            Очікуйте оновлення асортименту
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <CatalogFilters facets={facets} />

          {/* Catalog Grid Area */}
          <div className="flex-1 min-w-0">
            {products.length === 0 ? (
              /* Empty Filter State: "За вибраними фільтрами нічого не знайдено" */
              <div className="bg-white rounded-2xl border border-graphite-200 p-12 text-center shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-graphite-100 text-graphite-400 flex items-center justify-center mx-auto mb-4">
                  <SlidersHorizontal className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-graphite-900 mb-2">
                  За вибраними фільтрами нічого не знайдено
                </h3>
                <p className="text-xs text-graphite-500 max-w-sm mx-auto mb-6">
                  Спробуйте пом’якшити критерії пошуку або скиньте активні фільтри.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-sm"
                >
                  Скинути всі фільтри
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
