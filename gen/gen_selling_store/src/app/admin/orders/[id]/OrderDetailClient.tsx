'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Truck,
  Phone,
  Mail,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { Order, OrderStatus, PaymentStatus } from '@/types';

interface OrderDetailClientProps {
  order: Order;
}

export default function OrderDetailClient({ order }: OrderDetailClientProps) {
  const router = useRouter();

  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.payment_status);
  const [ttn, setTtn] = useState(order.ttn || '');
  const [internalComment, setInternalComment] = useState(order.internal_comment || '');
  const [statusComment, setStatusComment] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSavedSuccess(false);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          payment_status: paymentStatus,
          ttn: ttn.trim() || null,
          internal_comment: internalComment.trim() || null,
          comment: statusComment.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Помилка оновлення статусу.');
      }

      setSavedSuccess(true);
      setStatusComment('');
      router.refresh();
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Не вдалося оновити статус.');
    } finally {
      setIsSaving(false);
    }
  };

  const deliveryLabels: Record<string, string> = {
    NOVA_POSHTA_BRANCH: 'Нова пошта (відділення)',
    COURIER: 'Адресна доставка кур’єром',
    PICKUP: 'Самовивіз',
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-graphite-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-1.5 text-graphite-500 hover:text-graphite-900 hover:bg-graphite-200 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-graphite-950 font-mono tracking-tight">
                {order.order_number}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                order.status === 'NEW'
                  ? 'bg-blue-100 text-blue-800'
                  : order.status === 'CONFIRMED'
                  ? 'bg-amber-100 text-amber-800'
                  : order.status === 'SHIPPED'
                  ? 'bg-purple-100 text-purple-800'
                  : order.status === 'COMPLETED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {order.status}
              </span>
            </div>
            <p className="text-xs text-graphite-500 mt-0.5">
              Створено: {new Date(order.created_at).toLocaleString('uk-UA')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Customer, Delivery, Items */}
        <div className="lg:col-span-8 space-y-6">
          {/* Customer Details */}
          <div className="bg-white rounded-3xl border border-graphite-200 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-graphite-950 flex items-center gap-2 pb-2 border-b border-graphite-100">
              <User className="w-4 h-4 text-brand-600" />
              Дані одержувача
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-graphite-400 block mb-0.5">Ім’я та прізвище</span>
                <strong className="text-sm text-graphite-900 font-bold block">
                  {order.customer_first_name} {order.customer_last_name}
                </strong>
              </div>

              <div>
                <span className="text-graphite-400 block mb-0.5">Номер телефону</span>
                <a
                  href={`tel:${order.customer_phone}`}
                  className="text-sm text-brand-600 font-bold font-mono hover:underline block"
                >
                  {order.customer_phone}
                </a>
              </div>

              {order.customer_email && (
                <div>
                  <span className="text-graphite-400 block mb-0.5">Електронна пошта</span>
                  <span className="text-graphite-800 font-medium">{order.customer_email}</span>
                </div>
              )}

              {order.comment && (
                <div className="sm:col-span-2 p-3 bg-graphite-50 rounded-xl border border-graphite-200">
                  <span className="text-graphite-400 block text-[11px] font-semibold mb-0.5">Коментар клієнта:</span>
                  <p className="text-graphite-800 italic">{order.comment}</p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Details */}
          <div className="bg-white rounded-3xl border border-graphite-200 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-graphite-950 flex items-center gap-2 pb-2 border-b border-graphite-100">
              <Truck className="w-4 h-4 text-brand-600" />
              Інформація про доставку
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-graphite-400 block">Спосіб доставки:</span>
                <span className="font-bold text-graphite-900 text-sm">
                  {deliveryLabels[order.delivery_method] || order.delivery_method}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-graphite-50 rounded-xl border border-graphite-200">
                  <span className="text-graphite-400 block text-[11px]">Населений пункт:</span>
                  <span className="font-bold text-graphite-900">{order.settlement}</span>
                </div>

                <div className="p-3 bg-graphite-50 rounded-xl border border-graphite-200">
                  <span className="text-graphite-400 block text-[11px]">Відділення або адреса:</span>
                  <span className="font-bold text-graphite-900">{order.branch_or_address}</span>
                </div>
              </div>

              {order.delivery_requires_verification && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <strong className="block text-xs font-bold">Потребує перевірки доставки:</strong>
                    <span className="text-[11px]">
                      {order.delivery_verification_reason || 'Введено вручну або потребує узгодження вантажного відділення.'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ordered Items Snapshot Table */}
          <div className="bg-white rounded-3xl border border-graphite-200 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-graphite-950 flex items-center gap-2 pb-2 border-b border-graphite-100">
              <Package className="w-4 h-4 text-brand-600" />
              Склад замовлення (знімок на момент оформлення)
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-graphite-400 uppercase tracking-wider font-bold border-b border-graphite-100 pb-2">
                  <tr>
                    <th className="py-2.5">Артикул</th>
                    <th className="py-2.5">Товар</th>
                    <th className="py-2.5 text-center">К-сть</th>
                    <th className="py-2.5 text-right">Ціна за од.</th>
                    <th className="py-2.5 text-right">Сума</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-graphite-100">
                  {order.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-graphite-50/50">
                      <td className="py-3 font-mono font-bold text-graphite-900">{item.sku}</td>
                      <td className="py-3 font-medium text-graphite-900">{item.product_name}</td>
                      <td className="py-3 text-center font-bold text-graphite-900">{item.quantity}</td>
                      <td className="py-3 text-right text-graphite-600 whitespace-nowrap">
                        {(item.price_kop / 100).toLocaleString('uk-UA')} ₴
                      </td>
                      <td className="py-3 text-right font-black text-graphite-950 whitespace-nowrap">
                        {((item.price_kop * item.quantity) / 100).toLocaleString('uk-UA')} ₴
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-graphite-200 font-bold text-sm">
                    <td colSpan={4} className="py-3 text-right text-graphite-700">Всього до сплати:</td>
                    <td className="py-3 text-right font-black text-brand-600 whitespace-nowrap">
                      {(order.total_amount_kop / 100).toLocaleString('uk-UA')} ₴
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Status Change History Log */}
          <div className="bg-white rounded-3xl border border-graphite-200 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-graphite-950 flex items-center gap-2 pb-2 border-b border-graphite-100">
              <Clock className="w-4 h-4 text-brand-600" />
              Історія змін статусу
            </h2>

            {order.history && order.history.length > 0 ? (
              <div className="space-y-3">
                {order.history.map((h) => (
                  <div key={h.id} className="flex items-start gap-3 text-xs border-l-2 border-brand-500 pl-3 py-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-graphite-900">
                          {h.previous_status} → {h.new_status}
                        </span>
                        <span className="text-[10px] text-graphite-400">
                          {new Date(h.created_at).toLocaleString('uk-UA')}
                        </span>
                      </div>
                      {h.comment && <p className="text-graphite-600 mt-0.5">{h.comment}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-graphite-400">Історія статусів порожня.</p>
            )}
          </div>
        </div>

        {/* Right Column: Status & TTN Management */}
        <div className="lg:col-span-4">
          <form
            onSubmit={handleSaveStatus}
            className="bg-white rounded-3xl border border-graphite-200 p-6 shadow-xs space-y-5 sticky top-24"
          >
            <h2 className="text-sm font-bold text-graphite-950 pb-2 border-b border-graphite-100">
              Керування статусом замовлення
            </h2>

            {savedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Зміни успішно збережено!</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-graphite-700 mb-1">
                Статус замовлення
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full px-3 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl font-bold cursor-pointer"
              >
                <option value="NEW">НОВЕ (NEW)</option>
                <option value="CONFIRMED">ПІДТВЕРДЖЕНЕ (CONFIRMED)</option>
                <option value="SHIPPED">ВІДПРАВЛЕНЕ (SHIPPED)</option>
                <option value="COMPLETED">ВИКОНАНЕ (COMPLETED)</option>
                <option value="CANCELLED">СКАСОВАНЕ (CANCELLED — повертає залишок)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-graphite-700 mb-1">
                Статус оплати
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full px-3 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl font-bold cursor-pointer"
              >
                <option value="PENDING">НЕ ОПЛАЧЕНО (PENDING)</option>
                <option value="PAID">ОПЛАЧЕНО (PAID)</option>
                <option value="REFUNDED">ПОВЕРНЕННЯ (REFUNDED)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-graphite-700 mb-1">
                Номер експрес-накладної (ТТН)
              </label>
              <input
                type="text"
                value={ttn}
                onChange={(e) => setTtn(e.target.value)}
                placeholder="20450000000000"
                className="w-full px-3 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-graphite-700 mb-1">
                Внутрішній коментар менеджера
              </label>
              <textarea
                rows={2}
                value={internalComment}
                onChange={(e) => setInternalComment(e.target.value)}
                placeholder="Нотатки для співробітників (клієнт не бачить)..."
                className="w-full px-3 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-graphite-700 mb-1">
                Примітка до зміни статусу
              </label>
              <input
                type="text"
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                placeholder="Наприклад: Підтверджено телефоном..."
                className="w-full px-3 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-graphite-400 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Збереження...</span>
                </>
              ) : (
                <span>Оновити замовлення</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
