import React from 'react';
import Link from 'next/link';
import { getDb } from '@/lib/db';
import { Search, ShoppingCart, FileSpreadsheet, Eye, Filter } from 'lucide-react';

interface AdminOrdersPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const params = await searchParams;
  const db = getDb();

  const query = typeof params.query === 'string' ? params.query.trim() : '';
  const status = typeof params.status === 'string' ? params.status : '';
  const from = typeof params.from === 'string' ? params.from : '';
  const to = typeof params.to === 'string' ? params.to : '';

  const whereClauses: string[] = [];
  const sqlParams: any[] = [];
  let paramIdx = 1;

  if (status && ['NEW', 'CONFIRMED', 'SHIPPED', 'COMPLETED', 'CANCELLED'].includes(status)) {
    whereClauses.push(`status = $${paramIdx++}`);
    sqlParams.push(status);
  }

  if (query) {
    whereClauses.push(`(
      LOWER(order_number) LIKE $${paramIdx} OR 
      LOWER(customer_phone) LIKE $${paramIdx} OR 
      LOWER(customer_last_name) LIKE $${paramIdx} OR 
      LOWER(customer_first_name) LIKE $${paramIdx} OR
      LOWER(COALESCE(ttn, '')) LIKE $${paramIdx}
    )`);
    sqlParams.push(`%${query.toLowerCase()}%`);
    paramIdx++;
  }

  if (from) {
    whereClauses.push(`created_at >= $${paramIdx++}`);
    sqlParams.push(from);
  }

  if (to) {
    whereClauses.push(`created_at <= $${paramIdx++}`);
    sqlParams.push(`${to}T23:59:59.999Z`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const orders = await db.query(
    `SELECT * FROM orders ${whereSql} ORDER BY created_at DESC`,
    sqlParams
  );

  const statusLabels: Record<string, string> = {
    NEW: 'Нове',
    CONFIRMED: 'Підтверджене',
    SHIPPED: 'Відправлене',
    COMPLETED: 'Виконане',
    CANCELLED: 'Скасоване',
  };

  const statusColors: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-800',
    CONFIRMED: 'bg-amber-100 text-amber-800',
    SHIPPED: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-emerald-100 text-emerald-800',
    CANCELLED: 'bg-rose-100 text-rose-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-graphite-200">
        <div>
          <h1 className="text-2xl font-black text-graphite-950 tracking-tight">
            Керування замовленнями
          </h1>
          <p className="text-xs text-graphite-500 mt-0.5">
            Знайдено замовлень: <strong>{orders.length}</strong>
          </p>
        </div>

        <Link
          href="/admin/export"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-graphite-50 text-graphite-800 border border-graphite-300 font-bold text-xs rounded-xl shadow-2xs transition-colors self-start"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Експортувати в XLSX</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-graphite-200 shadow-2xs space-y-3">
        <form method="GET" action="/admin/orders" className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <input
              type="text"
              name="query"
              defaultValue={query}
              placeholder="Пошук за номером, телефоном, прізвищем або ТТН..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Search className="w-4 h-4 text-graphite-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="sm:col-span-3">
            <select
              name="status"
              defaultValue={status}
              className="w-full px-3 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="">Всі статуси</option>
              <option value="NEW">Нове</option>
              <option value="CONFIRMED">Підтверджене</option>
              <option value="SHIPPED">Відправлене</option>
              <option value="COMPLETED">Виконане</option>
              <option value="CANCELLED">Скасоване</option>
            </select>
          </div>

          <div className="sm:col-span-3 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-graphite-900 hover:bg-graphite-800 text-white font-bold text-xs rounded-xl transition-colors"
            >
              Фільтрувати
            </button>
            <Link
              href="/admin/orders"
              className="px-3 py-2 bg-graphite-100 hover:bg-graphite-200 text-graphite-700 font-semibold text-xs rounded-xl flex items-center justify-center"
            >
              Скинути
            </Link>
          </div>
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-graphite-200 shadow-xs overflow-hidden">
        {orders.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingCart className="w-12 h-12 text-graphite-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-graphite-900 mb-1">Замовлень не знайдено</h3>
            <p className="text-xs text-graphite-500">
              Спробуйте змінити критерії пошуку або перевірте інший статус.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-graphite-50 border-b border-graphite-200 text-graphite-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Номер замовлення</th>
                  <th className="py-3 px-4">Дата</th>
                  <th className="py-3 px-4">Покупець</th>
                  <th className="py-3 px-4">Телефон</th>
                  <th className="py-3 px-4">Доставка / Місто</th>
                  <th className="py-3 px-4">Сума</th>
                  <th className="py-3 px-4">ТТН</th>
                  <th className="py-3 px-4">Статус</th>
                  <th className="py-3 px-4 text-right">Дія</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-100">
                {orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-graphite-50/50">
                    <td className="py-3.5 px-4 font-bold text-graphite-900 font-mono">
                      {o.order_number}
                    </td>
                    <td className="py-3.5 px-4 text-graphite-500 whitespace-nowrap">
                      {new Date(o.created_at).toLocaleString('uk-UA')}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-graphite-900">
                      {o.customer_first_name} {o.customer_last_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-graphite-700 whitespace-nowrap">
                      {o.customer_phone}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-graphite-900 block truncate max-w-xs">{o.settlement}</span>
                      <span className="text-[11px] text-graphite-400 truncate max-w-xs block">{o.branch_or_address}</span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-graphite-950 whitespace-nowrap">
                      {(Number(o.total_amount_kop) / 100).toLocaleString('uk-UA')} ₴
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-graphite-600">
                      {o.ttn || '—'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusColors[o.status] || 'bg-graphite-100'}`}>
                        {statusLabels[o.status] || o.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-graphite-100 hover:bg-brand-50 hover:text-brand-700 text-graphite-700 rounded-lg font-semibold text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Деталі</span>
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
