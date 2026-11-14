import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = verifyAdminRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Потрібна авторизація.' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const product = await db.get('SELECT * FROM products WHERE id = $1', [id]);

  if (!product) {
    return NextResponse.json({ error: 'Товар не знайдено.' }, { status: 404 });
  }

  return NextResponse.json({
    product: {
      ...product,
      price_kop: Number(product.price_kop),
      stock: Number(product.stock),
      nominal_power_kw: Number(product.nominal_power_kw),
      max_power_kw: product.max_power_kw != null ? Number(product.max_power_kw) : null,
      images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images || [],
      voltage: typeof product.voltage === 'string' ? JSON.parse(product.voltage) : product.voltage || [],
      starting_methods: typeof product.starting_methods === 'string' ? JSON.parse(product.starting_methods) : product.starting_methods || [],
    },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = verifyAdminRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Потрібна авторизація.' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const existing = await db.get('SELECT * FROM products WHERE id = $1', [id]);

  if (!existing) {
    return NextResponse.json({ error: 'Товар не знайдено.' }, { status: 404 });
  }

  try {
    const body = await request.json();
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

    if (status === 'PUBLISHED') {
      if (!short_description?.trim()) {
        return NextResponse.json({ error: 'Для публікації обов’язковий короткий опис.' }, { status: 400 });
      }
      if (nomPower <= 0) {
        return NextResponse.json({ error: 'Для публікації номінальна потужність має бути більшою за 0 кВт.' }, { status: 400 });
      }
      if (!fuel_type) {
        return NextResponse.json({ error: 'Для публікації необхідно вказати вид палива.' }, { status: 400 });
      }
      if (!Array.isArray(images) || images.length === 0) {
        return NextResponse.json({ error: 'Для публікації необхідно завантажити хоча б одне фото.' }, { status: 400 });
      }
      if (!Array.isArray(voltage) || voltage.length === 0) {
        return NextResponse.json({ error: 'Для публікації вкажіть вихідну напругу.' }, { status: 400 });
      }
      if (!Array.isArray(starting_methods) || starting_methods.length === 0) {
        return NextResponse.json({ error: 'Для публікації вкажіть хоча б один спосіб запуску.' }, { status: 400 });
      }
    }

    // Check SKU uniqueness
    const existingSku = await db.get('SELECT id FROM products WHERE sku = $1 AND id != $2', [sku.trim(), id]);
    if (existingSku) {
      return NextResponse.json({ error: `Товар з артикулом "${sku}" вже існує.` }, { status: 400 });
    }

    let slug = customSlug?.trim() ? slugify(customSlug) : existing.slug;
    const existingSlug = await db.get('SELECT id FROM products WHERE slug = $1 AND id != $2', [slug, id]);
    if (existingSlug) {
      slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const now = new Date().toISOString();

    await db.run(
      `UPDATE products SET
        slug = $1, sku = $2, name = $3, brand = $4, model = $5,
        price_kop = $6, stock = $7, availability_status = $8, status = $9,
        short_description = $10, full_description = $11, images = $12, pdf_manual_url = $13,
        nominal_power_kw = $14, max_power_kw = $15, fuel_type = $16,
        nominal_power_petrol_kw = $17, max_power_petrol_kw = $18,
        nominal_power_gas_kw = $19, max_power_gas_kw = $20,
        is_inverter = $21, phase_type = $22, voltage = $23, starting_methods = $24,
        alternator_type = $25, has_avr = $26, ats_compatible = $27, ats_unit_included = $28,
        fuel_tank_capacity_l = $29, fuel_consumption_lh = $30, fuel_consumption_load_pct = $31,
        autonomy_hours = $32, autonomy_load_pct = $33, noise_level_db = $34,
        noise_measurement_conditions = $35, engine_specs = $36, sockets = $37,
        net_weight_kg = $38, dimensions_mm = $39, shipping_weight_kg = $40,
        shipping_dimensions_mm = $41, has_wheels = $42, has_handles = $43,
        has_noise_canopy = $44, warranty_months = $45, included_accessories = $46,
        seo_title = $47, seo_description = $48, updated_at = $49
      WHERE id = $50`,
      [
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
        id,
      ]
    );

    return NextResponse.json({ success: true, id, slug });
  } catch (err: any) {
    console.error('Update product error:', err);
    return NextResponse.json({ error: err.message || 'Не вдалося оновити товар.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = verifyAdminRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Потрібна авторизація.' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  // If product has been ordered, archive it rather than delete to preserve foreign key integrity
  const orderCount = await db.get<{ count: number | string }>(
    'SELECT COUNT(*) as count FROM order_items WHERE product_id = $1',
    [id]
  );

  if (Number(orderCount?.count || 0) > 0) {
    await db.run("UPDATE products SET status = 'ARCHIVED', updated_at = $1 WHERE id = $2", [
      new Date().toISOString(),
      id,
    ]);
    return NextResponse.json({ success: true, archived: true });
  }

  await db.run('DELETE FROM products WHERE id = $1', [id]);
  return NextResponse.json({ success: true, deleted: true });
}
