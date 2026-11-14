import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getDb } from '@/lib/db';
import { Product } from '@/types';
import ProductForm from '@/components/admin/ProductForm';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

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

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const db = getDb();
  const row = await db.get('SELECT * FROM products WHERE id = $1', [id]);

  if (!row) {
    notFound();
  }

  const product = parseProduct(row);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-graphite-200">
        <Link
          href="/admin/products"
          className="p-1.5 text-graphite-500 hover:text-graphite-900 hover:bg-graphite-200 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-graphite-950 tracking-tight">
            Редагування: {product.name}
          </h1>
          <p className="text-xs text-graphite-500 mt-0.5">
            Артикул: {product.sku} • ID: {product.id}
          </p>
        </div>
      </div>

      <ProductForm initialProduct={product} />
    </div>
  );
}
