'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, ShoppingBag, ArrowRight, Zap, ArrowLeft } from 'lucide-react';
import { useCart } from '@/components/CartContext';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalItems, totalAmountKop } = useCart();

  const totalUah = (totalAmountKop / 100).toLocaleString('uk-UA', { minimumFractionDigits: 0 });

  if (items.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-graphite-200 p-12 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-graphite-900 mb-2">Ваш кошик порожній</h1>
          <p className="text-xs text-graphite-500 mb-6 leading-relaxed">
            Ви ще не обрали жодного генератора. Перейдіть до каталогу, щоб переглянути доступні моделі.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> До каталогу генераторів
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="pb-6 mb-8 border-b border-graphite-200">
        <h1 className="text-3xl font-black text-graphite-950 tracking-tight">Кошик замовлення</h1>
        <p className="text-xs text-graphite-500 mt-1">
          У вашому кошику <strong>{totalItems}</strong> {totalItems === 1 ? 'товар' : 'товари'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map(({ product, quantity }) => {
            const itemTotalUah = ((product.price_kop * quantity) / 100).toLocaleString('uk-UA');
            const mainImg = product.images?.[0] || null;

            return (
              <div
                key={product.id}
                className="flex flex-col sm:flex-row items-center gap-4 p-5 bg-white rounded-2xl border border-graphite-200 shadow-2xs hover:border-brand-200 transition-colors"
              >
                {/* Photo */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-graphite-50 rounded-xl overflow-hidden shrink-0 border border-graphite-100">
                  {mainImg ? (
                    <Image
                      src={mainImg}
                      alt={product.name}
                      fill
                      sizes="112px"
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-graphite-300">
                      <Zap className="w-8 h-8" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-brand-600 mb-0.5">
                    {product.brand} • Арт: {product.sku}
                  </div>
                  <Link
                    href={`/products/${product.slug}`}
                    className="font-bold text-sm text-graphite-900 hover:text-brand-600 line-clamp-2"
                  >
                    {product.name}
                  </Link>
                  <div className="text-xs text-graphite-500 mt-1">
                    Потужність: {product.nominal_power_kw} кВт
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center border border-graphite-300 rounded-xl bg-white overflow-hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className="px-3 py-1.5 text-graphite-600 hover:bg-graphite-100 font-bold text-sm"
                  >
                    -
                  </button>
                  <span className="px-3 py-1.5 text-xs font-bold text-graphite-900 min-w-[32px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= product.stock}
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    className="px-3 py-1.5 text-graphite-600 hover:bg-graphite-100 disabled:opacity-40 font-bold text-sm"
                  >
                    +
                  </button>
                </div>

                {/* Subtotal */}
                <div className="text-right shrink-0 min-w-[100px]">
                  <span className="text-base font-black text-graphite-950">{itemTotalUah} ₴</span>
                  <div className="text-[10px] text-graphite-400">
                    {(product.price_kop / 100).toLocaleString('uk-UA')} ₴/шт.
                  </div>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => removeFromCart(product.id)}
                  className="p-2 text-graphite-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                  title="Видалити з кошика"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Order Summary Box */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl border border-graphite-200 p-6 shadow-xs space-y-6 sticky top-24">
            <h2 className="text-lg font-bold text-graphite-900 pb-3 border-b border-graphite-200">
              Підсумок замовлення
            </h2>

            <div className="space-y-3 text-xs text-graphite-600">
              <div className="flex justify-between">
                <span>Товарів у кошику:</span>
                <span className="font-semibold text-graphite-900">{totalItems} шт.</span>
              </div>
              <div className="flex justify-between">
                <span>Вартість товарів:</span>
                <span className="font-bold text-graphite-900">{totalUah} ₴</span>
              </div>
              <div className="flex justify-between">
                <span>Вартість доставки:</span>
                <span className="text-graphite-500 font-medium">За тарифами перевізника</span>
              </div>
            </div>

            <div className="pt-4 border-t border-graphite-200 flex items-baseline justify-between">
              <span className="text-sm font-bold text-graphite-900">Разом до оплати:</span>
              <span className="text-2xl font-black text-brand-600">{totalUah} ₴</span>
            </div>

            <Link
              href="/checkout"
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-brand-500/20 flex items-center justify-center gap-2"
            >
              <span>Перейти до оформлення</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/"
              className="w-full py-2.5 bg-graphite-100 hover:bg-graphite-200 text-graphite-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Продовжити покупки
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
