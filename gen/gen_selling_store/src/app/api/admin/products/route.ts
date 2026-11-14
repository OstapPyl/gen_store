import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(request: NextRequest) {
  const session = verifyAdminRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Потрібна авторизація.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const query = searchParams.get('query')?.trim() || '';

  const db = getDb();
  const whereClauses: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (status && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
    whereClauses.push(`status = $${paramIdx++}`);
    params.push(status);
  }

  if (query) {
    whereClauses.push(`(
      LOWER(name) LIKE $${paramIdx} OR 
      LOWER(sku) LIKE $${paramIdx} OR 
      LOWER(brand) LIKE $${paramIdx} OR 
      LOWER(model) LIKE $${paramIdx}
    )`);
    params.push(`%${query.toLowerCase()}%`);
    paramIdx++;
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const rows = await db.query(
    `SELECT * FROM products ${whereSql} ORDER BY updated_at DESC`,
    params
  );

  return NextResponse.json({
    products: rows.map((r: any) => ({
      ...r,
      price_kop: Number(r.price_kop),
      stock: Number(r.stock),
      nominal_power_kw: Number(r.nominal_power_kw),
      max_power_kw: r.max_power_kw != null ? Number(r.max_power_kw) : null,
      images: typeof r.images === 'string' ? JSON.parse(r.images) : r.images || [],
      voltage: typeof r.voltage === 'string' ? JSON.parse(r.voltage) : r.voltage || [],
      starting_methods: typeof r.starting_methods === 'string' ? JSON.parse(r.starting_methods) : r.starting_methods || [],
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = verifyAdminRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Потрібна авторизація.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const db = getDb();

    const {
      name,
      brand,
      model,
      sku,
      slug: customSlug,
      price_uah,
      stock,
      availability_status = 'IN_STOCK',
      status = 'DRAFT',
      short_description,
      full_description,
      images = [],
      pdf_manual_url,
      nominal_power_kw,
      max_power_kw,
      fuel_type,
      nominal_power_petrol_kw,
      max_power_petrol_kw,
      nominal_power_gas_kw,
      max_power_gas_kw,
      is_inverter = false,
      phase_type = 'SINGLE',
      voltage = ['230V'],
      starting_methods = ['MANUAL'],
      alternator_type,
      has_avr = 'UNKNOWN',
      ats_compatible = 'UNKNOWN',
      ats_unit_included = 'UNKNOWN',
      fuel_tank_capacity_l,
      fuel_consumption_lh,
      fuel_consumption_load_pct,
      autonomy_hours,
      autonomy_load_pct,
      noise_level_db,
      noise_measurement_conditions,
      engine_specs,
      sockets,
      net_weight_kg,
      dimensions_mm,
      shipping_weight_kg,
      shipping_dimensions_mm,
      has_wheels = 'UNKNOWN',
      has_handles = 'UNKNOWN',
      has_noise_canopy = 'UNKNOWN',
      warranty_months,
      included_accessories,
      seo_title,
      seo_description,
    } = body;

    // Validate required fields
    if (!name?.trim() || !brand?.trim() || !model?.trim() || !sku?.trim()) {
      return NextResponse.json(
        { error: 'Назва, бренд, модель та артикул є обов’язковими.' },
        { status: 400 }
      );
    }

    const priceKop = Math.round(Number(price_uah || 0) * 100);
    if (isNaN(priceKop) || priceKop <= 0) {
      return NextResponse.json(
        { error: 'Ціна повинна бути більшою за нуль.' },
        { status: 400 }
      );
    }

    const stockNum = Math.floor(Number(stock != null ? stock : 0));
    if (isNaN(stockNum) || stockNum < 0) {
      return NextResponse.json(
        { error: 'Залишок не може бути від’ємним.' },
        { status: 400 }
      );
    }

    const nomPower = Number(nominal_power_kw || 0);
    const maxPower = max_power_kw != null && max_power_kw !== '' ? Number(max_power_kw) : null;

    if (maxPower != null && maxPower < nomPower) {
      return NextResponse.json(
        { error: 'Максимальна потужність не може бути меншою за номінальну.' },
        { status: 400 }
      );
    }

    // Publishing validations
    if (status === 'PUBLISHED') {
      if (!short_description?.trim()) {
        return NextResponse.json(
          { error: 'Для публікації обов’язковий короткий опис.' },
          { status: 400 }
        );
      }
      if (nomPower <= 0) {
        return NextResponse.json(
          { error: 'Для публікації номінальна потужність має бути більшою за 0 кВт.' },
          { status: 400 }
        );
      }
      if (!fuel_type) {
        return NextResponse.json(
          { error: 'Для публікації необхідно вказати вид палива.' },
          { status: 400 }
        );
      }
      if (!Array.isArray(images) || images.length === 0) {
        return NextResponse.json(
          { error: 'Для публікації необхідно завантажити хоча б одне фото.' },
          { status: 400 }
        );
      }
      if (!Array.isArray(voltage) || voltage.length === 0) {
        return NextResponse.json(
          { error: 'Для публікації вкажіть вихідну напругу.' },
          { status: 400 }
        );
      }
      if (!Array.isArray(starting_methods) || starting_methods.length === 0) {
        return NextResponse.json(
          { error: 'Для публікації вкажіть хоча б один спосіб запуску.' },
          { status: 400 }
        );
      }
    }

    // Check SKU uniqueness
    const existingSku = await db.get('SELECT id FROM products WHERE sku = $1', [sku.trim()]);
    if (existingSku) {
      return NextResponse.json(
        { error: `Товар з артикулом "${sku}" вже існує.` },
        { status: 400 }
      );
    }

    // Check or generate slug
    let slug = customSlug?.trim() ? slugify(customSlug) : slugify(`${brand}-${model}-${sku}`);
    if (!slug) slug = `gen-${Date.now()}`;

    const existingSlug = await db.get('SELECT id FROM products WHERE slug = $1', [slug]);
    if (existingSlug) {
      slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const productId = `prod_${crypto.randomBytes(12).toString('hex')}`;
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO products (
        id, slug, sku, name, brand, model, price_kop, stock, availability_status,
        status, short_description, full_description, images, pdf_manual_url,
        nominal_power_kw, max_power_kw, fuel_type, nominal_power_petrol_kw,
        max_power_petrol_kw, nominal_power_gas_kw, max_power_gas_kw,
        is_inverter, phase_type, voltage, starting_methods,
        alternator_type, has_avr, ats_compatible, ats_unit_included,
        fuel_tank_capacity_l, fuel_consumption_lh, fuel_consumption_load_pct,
        autonomy_hours, autonomy_load_pct, noise_level_db, noise_measurement_conditions,
        engine_specs, sockets, net_weight_kg, dimensions_mm,
        shipping_weight_kg, shipping_dimensions_mm, has_wheels, has_handles,
        has_noise_canopy, warranty_months, included_accessories, seo_title, seo_description,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14,
        $15, $16, $17, $18,
        $19, $20, $21,
        $22, $23, $24, $25,
        $26, $27, $28, $29,
        $30, $31, $32,
        $33, $34, $35, $36,
        $37, $38, $39, $40,
        $41, $42, $43, $44,
        $45, $46, $47, $48, $49,
        $50, $51
      )`,
      [
        productId,
        slug,
        sku.trim(),
        name.trim(),
        brand.trim(),
        model.trim(),
        priceKop,
        stockNum,
        availability_status,
        status,
        short_description?.trim() || '',
        full_description?.trim() || null,
        JSON.stringify(images),
        pdf_manual_url || null,
        nomPower,
        maxPower,
        fuel_type || 'PETROL',
        nominal_power_petrol_kw ? Number(nominal_power_petrol_kw) : null,
        max_power_petrol_kw ? Number(max_power_petrol_kw) : null,
        nominal_power_gas_kw ? Number(nominal_power_gas_kw) : null,
        max_power_gas_kw ? Number(max_power_gas_kw) : null,
        is_inverter ? 1 : 0,
        phase_type || 'SINGLE',
        JSON.stringify(voltage),
        JSON.stringify(starting_methods),
        alternator_type || null,
        has_avr || 'UNKNOWN',
        ats_compatible || 'UNKNOWN',
        ats_unit_included || 'UNKNOWN',
        fuel_tank_capacity_l ? Number(fuel_tank_capacity_l) : null,
        fuel_consumption_lh ? Number(fuel_consumption_lh) : null,
        fuel_consumption_load_pct ? Number(fuel_consumption_load_pct) : null,
        autonomy_hours ? Number(autonomy_hours) : null,
        autonomy_load_pct ? Number(autonomy_load_pct) : null,
        noise_level_db ? Number(noise_level_db) : null,
        noise_measurement_conditions || null,
        engine_specs || null,
        sockets || null,
        net_weight_kg ? Number(net_weight_kg) : null,
        dimensions_mm || null,
        shipping_weight_kg ? Number(shipping_weight_kg) : null,
        shipping_dimensions_mm || null,
        has_wheels || 'UNKNOWN',
        has_handles || 'UNKNOWN',
        has_noise_canopy || 'UNKNOWN',
        warranty_months ? Number(warranty_months) : null,
        included_accessories || null,
        seo_title || null,
        seo_description || null,
        now,
        now,
      ]
    );

    return NextResponse.json({
      success: true,
      productId,
      slug,
    });
  } catch (err: any) {
    console.error('Create product error:', err);
    return NextResponse.json(
      { error: err.message || 'Не вдалося створити товар.' },
      { status: 500 }
    );
  }
}
