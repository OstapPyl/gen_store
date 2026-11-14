import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getDb } from '@/lib/db';
import { PlusCircle, Search, Edit3, ExternalLink, Zap, Package } from 'lucide-react';
import { Product } from '@/types';

interface AdminProductsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const params = await searchParams;
  const db = getDb();

  const query = typeof params.query === 'string' ? params.query.trim() : '';
  const statusFilter = typeof params.status === 'string' ? params.status : '';

  const whereClauses: string[] = [];
  const sqlParams: any[] = [];
  let paramIdx = 1;

  if (statusFilter && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(statusFilter)) {
    whereClauses.push(`status = $${paramIdx++}`);
    sqlParams.push(statusFilter);
  }

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

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const rows = await db.query(`SELECT * FROM products ${whereSql} ORDER BY updated_at DESC`, sqlParams);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-graphite-200">
        <div>
          <h1 className="text-2xl font-black text-graphite-950 tracking-tight">
            Керування товарами
          </h1>
          <p className="text-xs text-graphite-500 mt-0.5">
            Створення, редагування, публікація та архівування генераторів
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors self-start"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Додати новий генератор</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <form method="GET" action="/admin/products" className="relative flex-1 w-full">
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <input
            type="text"
            name="query"
            defaultValue={query}
            placeholder="Пошук за назвою, брендом, моделлю або артикулом..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-graphite-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <Search className="w-4 h-4 text-graphite-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </form>

        <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
          {[
            { id: '', label: 'Всі' },
            { id: 'PUBLISHED', label: 'Опубліковані' },
            { id: 'DRAFT', label: 'Чернетки' },
            { id: 'ARCHIVED', label: 'Архів' },
          ].map((st) => (
            <Link
              key={st.id}
              href={`/admin/products?status=${st.id}${query ? `&query=${encodeURIComponent(query)}` : ''}`}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                statusFilter === st.id
                  ? 'bg-graphite-900 text-white'
                  : 'bg-white text-graphite-600 hover:bg-graphite-200 border border-graphite-200'
              }`}
            >
              {st.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-graphite-200 shadow-xs overflow-hidden">
        {rows.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-12 h-12 text-graphite-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-graphite-900 mb-1">Товарів не знайдено</h3>
            <p className="text-xs text-graphite-500 mb-4">
              Створіть свій перший генератор або змініть фільтри пошуку.
            </p>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl"
            >
              <PlusCircle className="w-4 h-4" /> Додати товар
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-graphite-50 border-b border-graphite-200 text-graphite-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Фото</th>
                  <th className="py-3 px-4">Артикул / Модель</th>
                  <th className="py-3 px-4">Назва товару</th>
                  <th className="py-3 px-4">Потужність</th>
                  <th className="py-3 px-4">Ціна</th>
                  <th className="py-3 px-4">Залишок</th>
                  <th className="py-3 px-4">Статус</th>
                  <th className="py-3 px-4 text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-100">
                {rows.map((p: any) => {
                  let imgs: string[] = [];
                  try {
                    imgs = typeof p.images === 'string' ? JSON.parse(p.images) : p.images || [];
                  } catch {
                    imgs = [];
                  }
                  const firstImg = imgs[0] || null;

                  return (
                    <tr key={p.id} className="hover:bg-graphite-50/50">
                      <td className="py-3 px-4">
                        <div className="relative w-12 h-12 rounded-xl bg-graphite-50 border border-graphite-200 overflow-hidden shrink-0">
                          {firstImg ? (
                            <Image
                              src={firstImg}
                              alt={p.name}
                              fill
                              sizes="48px"
                              className="object-contain p-1"
                            />
                          ) : (
                            <Zap className="w-5 h-5 m-auto text-graphite-300" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-graphite-900 block">{p.sku}</span>
                        <span className="text-[11px] text-graphite-400">{p.brand} {p.model}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-graphite-900 max-w-xs block truncate">{p.name}</span>
                        <span className="text-[11px] text-graphite-400 truncate max-w-xs block">{p.short_description}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-graphite-900 whitespace-nowrap">
                        {p.nominal_power_kw} кВт
                      </td>
                      <td className="py-3 px-4 font-black text-graphite-950 whitespace-nowrap">
                        {(Number(p.price_kop) / 100).toLocaleString('uk-UA')} ₴
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`font-bold ${p.stock > 0 ? 'text-graphite-900' : 'text-rose-600'}`}>
                          {p.stock} шт.
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'DRAFT'
                            ? 'bg-graphite-100 text-graphite-700'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {p.status === 'PUBLISHED' ? 'Опубліковано' : p.status === 'DRAFT' ? 'Чернетка' : 'Архів'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {p.status === 'PUBLISHED' && (
                            <Link
                              href={`/products/${p.slug}`}
                              target="_blank"
                              title="Відкрити на сайті"
                              className="p-1.5 text-graphite-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          )}
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            title="Редагувати"
                            className="p-1.5 text-graphite-600 hover:text-graphite-900 hover:bg-graphite-100 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
