import React from 'react';
import Link from 'next/link';
import { getDb } from '@/lib/db';
import { Package, ShoppingCart, TrendingUp, AlertTriangle, ArrowRight, PlusCircle, FileSpreadsheet } from 'lucide-react';

export default async function AdminDashboardPage() {
  const db = getDb();

  // Metrics
  const prodPublishedRow = await db.get<{ count: number | string }>(
    "SELECT COUNT(*) as count FROM products WHERE status = 'PUBLISHED'"
  );
  const prodDraftRow = await db.get<{ count: number | string }>(
    "SELECT COUNT(*) as count FROM products WHERE status = 'DRAFT'"
  );
  const prodOutRow = await db.get<{ count: number | string }>(
    "SELECT COUNT(*) as count FROM products WHERE stock = 0 AND status = 'PUBLISHED'"
  );

  const orderTotalRow = await db.get<{ count: number | string }>(
    'SELECT COUNT(*) as count FROM orders'
  );
  const orderNewRow = await db.get<{ count: number | string }>(
    "SELECT COUNT(*) as count FROM orders WHERE status = 'NEW'"
  );
  const revenueRow = await db.get<{ total: number | string }>(
    "SELECT SUM(total_amount_kop) as total FROM orders WHERE status != 'CANCELLED'"
  );

  const publishedCount = Number(prodPublishedRow?.count || 0);
  const draftCount = Number(prodDraftRow?.count || 0);
  const outOfStockCount = Number(prodOutRow?.count || 0);
  const totalOrders = Number(orderTotalRow?.count || 0);
  const newOrders = Number(orderNewRow?.count || 0);
  const totalRevenueUah = (Number(revenueRow?.total || 0) / 100).toLocaleString('uk-UA');

  // Recent 5 orders
  const recentOrders = await db.query(
    'SELECT * FROM orders ORDER BY created_at DESC LIMIT 5'
  );

  return (
    <div className="space-y-8">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-graphite-200">
        <div>
          <h1 className="text-2xl font-black text-graphite-950 tracking-tight">
            Огляд магазину
          </h1>
          <p className="text-xs text-graphite-500 mt-0.5">
            Стан каталогу генераторів, обробка замовлень та статистика
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Додати генератор</span>
          </Link>
          <Link
            href="/admin/export"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-graphite-50 text-graphite-800 border border-graphite-300 font-bold text-xs rounded-xl shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Експорт у XLSX</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: New Orders */}
        <div className="bg-white rounded-2xl border border-graphite-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-graphite-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-graphite-500">Нові замовлення</span>
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-graphite-950">{newOrders}</div>
          <p className="text-[11px] text-graphite-400 mt-1">Всього замовлень: {totalOrders}</p>
        </div>

        {/* Card 2: Revenue */}
        <div className="bg-white rounded-2xl border border-graphite-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-graphite-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-graphite-500">Загальний обіг</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-graphite-950">{totalRevenueUah} ₴</div>
          <p className="text-[11px] text-graphite-400 mt-1">Без урахування скасованих</p>
        </div>

        {/* Card 3: Published Products */}
        <div className="bg-white rounded-2xl border border-graphite-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-graphite-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-graphite-500">Опубліковано</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-graphite-950">{publishedCount}</div>
          <p className="text-[11px] text-graphite-400 mt-1">Чернеток: {draftCount}</p>
        </div>

        {/* Card 4: Out of Stock */}
        <div className="bg-white rounded-2xl border border-graphite-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-graphite-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-graphite-500">Немає в наявності</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-graphite-950">{outOfStockCount}</div>
          <p className="text-[11px] text-graphite-400 mt-1">Потребують поповнення залишку</p>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="bg-white rounded-3xl border border-graphite-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-graphite-200">
          <h2 className="text-sm font-bold text-graphite-950">Останні замовлення</h2>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
          >
            <span>Всі замовлення</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-xs text-graphite-400 py-6 text-center">
            Замовлень поки що немає. Коли клієнти зроблять замовлення, вони з’являться тут.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-graphite-400 uppercase tracking-wider border-b border-graphite-100 pb-2">
                  <th className="py-2.5 font-bold">Номер</th>
                  <th className="py-2.5 font-bold">Дата</th>
                  <th className="py-2.5 font-bold">Клієнт</th>
                  <th className="py-2.5 font-bold">Телефон</th>
                  <th className="py-2.5 font-bold">Сума</th>
                  <th className="py-2.5 font-bold">Статус</th>
                  <th className="py-2.5 font-bold text-right">Дія</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-100">
                {recentOrders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-graphite-50/60">
                    <td className="py-3 font-bold text-graphite-900">{o.order_number}</td>
                    <td className="py-3 text-graphite-500">{new Date(o.created_at).toLocaleString('uk-UA')}</td>
                    <td className="py-3 font-medium text-graphite-900">{o.customer_first_name} {o.customer_last_name}</td>
                    <td className="py-3 font-mono text-graphite-600">{o.customer_phone}</td>
                    <td className="py-3 font-black text-graphite-950">{(Number(o.total_amount_kop) / 100).toLocaleString('uk-UA')} ₴</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.status === 'NEW'
                          ? 'bg-blue-100 text-blue-800'
                          : o.status === 'CONFIRMED'
                          ? 'bg-amber-100 text-amber-800'
                          : o.status === 'SHIPPED'
                          ? 'bg-purple-100 text-purple-800'
                          : o.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-800"
                      >
                        Переглянути →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
