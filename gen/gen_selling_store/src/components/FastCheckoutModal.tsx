'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, Truck, Store, MapPin } from 'lucide-react';
import { Product } from '@/types';

interface FastCheckoutModalProps {
  product: Product;
  quantity: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function FastCheckoutModal({ product, quantity, isOpen, onClose }: FastCheckoutModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'NOVA_POSHTA_BRANCH' | 'COURIER' | 'PICKUP'>('NOVA_POSHTA_BRANCH');
  const [settlement, setSettlement] = useState('');
  const [branchOrAddress, setBranchOrAddress] = useState('');
  const [comment, setComment] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<{ orderNumber: string } | null>(null);

  if (!isOpen) return null;

  const totalKop = product.price_kop * quantity;
  const totalUah = (totalKop / 100).toLocaleString('uk-UA', { minimumFractionDigits: 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('Будь ласка, вкажіть ваше ім’я та прізвище.');
      return;
    }

    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^(\+?380|0)\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setErrorMessage('Вкажіть дійсний номер телефону (+380XXXXXXXXX або 0XXXXXXXXX).');
      return;
    }

    if (!settlement.trim() || !branchOrAddress.trim()) {
      setErrorMessage('Вкажіть населений пункт та адресу/відділення доставки.');
      return;
    }

    setIsLoading(true);

    try {
      const idempotencyKey = `fast_${product.id}_${Date.now()}_${Math.random()}`;
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          customer_first_name: firstName.trim(),
          customer_last_name: lastName.trim(),
          customer_phone: cleanPhone,
          customer_email: email.trim() || null,
          delivery_method: deliveryMethod,
          settlement: settlement.trim(),
          branch_or_address: branchOrAddress.trim(),
          delivery_requires_verification: true,
          delivery_verification_reason: 'Швидке замовлення в 1 клік',
          comment: comment.trim() || null,
          items: [
            {
              product_id: product.id,
              quantity,
              expected_price_kop: product.price_kop,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Помилка під час створення замовлення.');
      }

      setSuccessOrder({ orderNumber: data.order_number });
    } catch (err: any) {
      setErrorMessage(err.message || 'Не вдалося оформити замовлення. Спробуйте ще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-graphite-200 flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-graphite-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div>
            <h3 className="text-lg font-bold text-graphite-900">Швидке замовлення</h3>
            <p className="text-xs text-graphite-500">Купівля в 1 клік без переходу в кошик</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-graphite-400 hover:text-graphite-700 hover:bg-graphite-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {successOrder ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-black text-graphite-900">
                Замовлення №{successOrder.orderNumber} отримано!
              </h4>
              <p className="text-sm text-graphite-600 max-w-sm mx-auto leading-relaxed">
                Менеджер зв’яжеться з вами найближчим часом для підтвердження деталей доставки та оплати.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-6 py-2.5 bg-graphite-900 hover:bg-graphite-800 text-white text-sm font-bold rounded-xl transition-all"
              >
                Зрозуміло
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product preview */}
              <div className="flex items-center gap-3 p-3 bg-graphite-50 rounded-2xl border border-graphite-200">
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-graphite-900 truncate">{product.name}</h4>
                  <div className="text-[11px] text-graphite-500 mt-0.5">
                    {quantity} шт. × {(product.price_kop / 100).toLocaleString('uk-UA')} ₴
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-graphite-950">{totalUah} ₴</span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-graphite-700 mb-1">Ім’я *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Тарас"
                    className="w-full px-3 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-graphite-700 mb-1">Прізвище *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Шевченко"
                    className="w-full px-3 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-xs font-semibold text-graphite-700 mb-1">Номер телефону *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+380 50 123 45 67"
                  className="w-full px-3 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
                <p className="text-[11px] text-graphite-400 mt-1">Для підтвердження замовлення та доставки</p>
              </div>

              {/* Optional Email */}
              <div>
                <label className="block text-xs font-semibold text-graphite-700 mb-1">Email (необов’язково)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.ua"
                  className="w-full px-3 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Delivery method */}
              <div>
                <label className="block text-xs font-semibold text-graphite-700 mb-1.5">Спосіб доставки *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('NOVA_POSHTA_BRANCH')}
                    className={`py-2 px-2 rounded-xl text-center border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                      deliveryMethod === 'NOVA_POSHTA_BRANCH'
                        ? 'border-brand-600 bg-brand-50/50 text-brand-900 font-bold'
                        : 'border-graphite-200 bg-white text-graphite-700 hover:bg-graphite-50'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-brand-600" />
                    <span>Нова пошта</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('COURIER')}
                    className={`py-2 px-2 rounded-xl text-center border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                      deliveryMethod === 'COURIER'
                        ? 'border-brand-600 bg-brand-50/50 text-brand-900 font-bold'
                        : 'border-graphite-200 bg-white text-graphite-700 hover:bg-graphite-50'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-brand-600" />
                    <span>Кур’єр</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('PICKUP')}
                    className={`py-2 px-2 rounded-xl text-center border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                      deliveryMethod === 'PICKUP'
                        ? 'border-brand-600 bg-brand-50/50 text-brand-900 font-bold'
                        : 'border-graphite-200 bg-white text-graphite-700 hover:bg-graphite-50'
                    }`}
                  >
                    <Store className="w-4 h-4 text-brand-600" />
                    <span>Самовивіз</span>
                  </button>
                </div>
              </div>

              {/* Settlement and branch/address */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-graphite-700 mb-1">Населений пункт *</label>
                  <input
                    type="text"
                    required
                    value={settlement}
                    onChange={(e) => setSettlement(e.target.value)}
                    placeholder="м. Київ"
                    className="w-full px-3 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-graphite-700 mb-1">
                    {deliveryMethod === 'NOVA_POSHTA_BRANCH' ? 'Відділення *' : 'Адреса *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={branchOrAddress}
                    onChange={(e) => setBranchOrAddress(e.target.value)}
                    placeholder={deliveryMethod === 'NOVA_POSHTA_BRANCH' ? 'Відділення №1' : 'вул. Хрещатик, 1'}
                    className="w-full px-3 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Delivery notice */}
              <p className="text-[11px] text-graphite-500 bg-graphite-50 p-2.5 rounded-xl border border-graphite-200">
                Вартість доставки: <strong>За тарифами перевізника, оплачується окремо</strong>.
                Оплата: <strong>Післяплата після підтвердження менеджером</strong>.
              </p>

              {/* Comment */}
              <div>
                <label className="block text-xs font-semibold text-graphite-700 mb-1">Коментар</label>
                <textarea
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Додаткові побажання..."
                  className="w-full px-3 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-graphite-400 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-brand-500/20 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Оформлення...</span>
                  </>
                ) : (
                  <span>Підтвердити замовлення • {totalUah} ₴</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
