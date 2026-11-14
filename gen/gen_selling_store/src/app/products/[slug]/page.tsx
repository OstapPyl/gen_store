import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getDb } from '@/lib/db';
import { Product } from '@/types';
import ProductDetailClient from './ProductDetailClient';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
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

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();
  const row = await db.get(
    `SELECT name, brand, model, short_description, seo_title, seo_description FROM products WHERE (slug = $1 OR id = $1) AND status = 'PUBLISHED'`,
    [slug]
  );

  if (!row) {
    return {
      title: 'Товар не знайдено — Gen',
    };
  }

  return {
    title: row.seo_title || `${row.name} (${row.brand} ${row.model}) — купити в інтернет-магазині Gen`,
    description: row.seo_description || row.short_description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const db = getDb();

  const row = await db.get(
    `SELECT * FROM products WHERE (slug = $1 OR id = $1) AND status = 'PUBLISHED'`,
    [slug]
  );

  if (!row) {
    notFound();
  }

  const product = parseProduct(row);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <ProductDetailClient product={product} />
    </main>
  );
}
