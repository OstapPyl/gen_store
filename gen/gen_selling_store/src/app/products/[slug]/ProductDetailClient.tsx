'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Zap,
  Fuel,
  Activity,
  FileText,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  Package,
  Layers,
  Volume2,
} from 'lucide-react';
import { Product } from '@/types';
import ImageGallery from '@/components/ImageGallery';
import FastCheckoutModal from '@/components/FastCheckoutModal';
import { useCart } from '@/components/CartContext';

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isFastCheckoutOpen, setIsFastCheckoutOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const isAvailable = product.stock > 0 && product.availability_status === 'IN_STOCK';
  const priceUah = (product.price_kop / 100).toLocaleString('uk-UA', { minimumFractionDigits: 0 });

  const fuelLabels: Record<string, string> = {
    PETROL: 'Бензин',
    DIESEL: 'Дизель',
    GAS: 'Газ',
    DUAL_FUEL: 'Бензин/газ (гібридний)',
  };

  const phaseLabels: Record<string, string> = {
    SINGLE: '1 фаза (230 В)',
    THREE: '3 фази (400 В)',
    SWITCH_1_3: 'Перемикання 1 / 3 фази (230 / 400 В)',
  };

  const startLabels: Record<string, string> = {
    MANUAL: 'Ручний стартер',
    ELECTRIC: 'Електростартер',
    REMOTE: 'Дистанційний (пульт)',
    ATS: 'Автоматичний (ATS / АВР)',
  };

  const triStateLabel = (val: string) => {
    if (val === 'YES') return 'Є';
    if (val === 'NO') return 'Немає';
    return 'Не вказано';
  };

  const handleAddToCart = () => {
    if (!isAvailable) return;
    addToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="space-y-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-graphite-500">
        <Link href="/" className="hover:text-brand-600">
          Головна
        </Link>
        <span>/</span>
        <Link href="/" className="hover:text-brand-600">
          Генератори
        </Link>
        <span>/</span>
        <span className="text-graphite-900 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Hero Section: Gallery + Main Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Gallery */}
        <div className="lg:col-span-7">
          <ImageGallery images={product.images} productName={product.name} />
        </div>

        {/* Right: Buy Box & Specs */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-graphite-400 mb-1.5">
              <span className="font-bold uppercase tracking-wider text-brand-600">{product.brand}</span>
              <span>Артикул: <strong className="text-graphite-700 font-mono">{product.sku}</strong></span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-graphite-950 tracking-tight leading-tight">
              {product.name}
            </h1>
            <p className="text-xs text-graphite-500 mt-1">Модель: {product.model}</p>
          </div>

          {/* Availability Status */}
          <div className="flex items-center gap-2">
            {isAvailable ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                В наявності ({product.stock} шт.)
              </span>
            ) : product.availability_status === 'WAITING' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Очікується поставка
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                Немає в наявності
              </span>
            )}

            {product.is_inverter && (
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-wider">
                Інвертор
              </span>
            )}
          </div>

          {/* Price Box */}
          <div className="p-5 bg-graphite-50 rounded-2xl border border-graphite-200 space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-graphite-950">{priceUah}</span>
              <span className="text-lg font-bold text-graphite-600">грн</span>
            </div>

            {/* Quantity Selector & Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-graphite-300 rounded-xl bg-white overflow-hidden">
                  <button
                    type="button"
                    disabled={!isAvailable || quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 text-graphite-600 hover:bg-graphite-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-sm font-bold text-graphite-900 min-w-[36px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={!isAvailable || quantity >= product.stock}
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="px-3 py-2 text-graphite-600 hover:bg-graphite-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!isAvailable}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md ${
                    !isAvailable
                      ? 'bg-graphite-400 cursor-not-allowed shadow-none'
                      : justAdded
                      ? 'bg-emerald-600 shadow-emerald-600/20'
                      : 'bg-brand-600 hover:bg-brand-700 active:scale-98 shadow-brand-500/25'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{justAdded ? 'Додано у кошик!' : 'До кошика'}</span>
                </button>
              </div>

              {/* Buy Now Button */}
              <button
                type="button"
                onClick={() => setIsFastCheckoutOpen(true)}
                disabled={!isAvailable}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-graphite-900 bg-white hover:bg-graphite-100 border-2 border-graphite-900 disabled:border-graphite-300 disabled:text-graphite-400 disabled:cursor-not-allowed transition-all"
              >
                Купити зараз (в 1 клік)
              </button>
            </div>
          </div>

          {/* Quick Specifications Highlights */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white rounded-xl border border-graphite-200">
              <span className="text-graphite-400 block font-medium">Номінальна потужність</span>
              <strong className="text-base text-graphite-900 font-bold block mt-0.5">
                {product.nominal_power_kw} кВт
              </strong>
            </div>

            <div className="p-3 bg-white rounded-xl border border-graphite-200">
              <span className="text-graphite-400 block font-medium">Вид палива</span>
              <strong className="text-base text-graphite-900 font-bold block mt-0.5">
                {fuelLabels[product.fuel_type] || product.fuel_type}
              </strong>
            </div>

            <div className="p-3 bg-white rounded-xl border border-graphite-200">
              <span className="text-graphite-400 block font-medium">Кількість фаз</span>
              <strong className="text-base text-graphite-900 font-bold block mt-0.5">
                {product.phase_type === 'SINGLE' ? '1 фаза' : product.phase_type === 'THREE' ? '3 фази' : '1/3 фази'}
              </strong>
            </div>

            <div className="p-3 bg-white rounded-xl border border-graphite-200">
              <span className="text-graphite-400 block font-medium">Запуск</span>
              <strong className="text-base text-graphite-900 font-bold block mt-0.5 truncate">
                {product.starting_methods.map((m) => startLabels[m] || m).join(', ')}
              </strong>
            </div>
          </div>

          {/* Manual PDF download button if exists */}
          {product.pdf_manual_url && (
            <a
              href={product.pdf_manual_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-brand-50/60 hover:bg-brand-100 border border-brand-200 rounded-xl text-xs font-bold text-brand-900 transition-colors"
            >
              <FileText className="w-5 h-5 text-brand-600 shrink-0" />
              <span>Завантажити інструкцію користувача (PDF)</span>
            </a>
          )}
        </div>
      </div>

      {/* Product Description */}
      <div className="space-y-4 pt-6 border-t border-graphite-200">
        <h2 className="text-xl font-bold text-graphite-900">Опис товару</h2>
        <div className="prose prose-sm max-w-none text-graphite-700 bg-white p-6 rounded-2xl border border-graphite-200 leading-relaxed whitespace-pre-line">
          {product.full_description || product.short_description}
        </div>
      </div>

      {/* Specifications Table */}
      <div className="space-y-4 pt-6 border-t border-graphite-200">
        <h2 className="text-xl font-bold text-graphite-900">Технічні характеристики</h2>
        <div className="bg-white rounded-2xl border border-graphite-200 overflow-hidden shadow-2xs">
          <table className="w-full text-xs sm:text-sm text-left">
            <tbody className="divide-y divide-graphite-100">
              <tr className="hover:bg-graphite-50/60">
                <td className="py-3 px-4 font-semibold text-graphite-600 w-1/2 sm:w-1/3">Бренд</td>
                <td className="py-3 px-4 font-bold text-graphite-900">{product.brand}</td>
              </tr>
              <tr className="hover:bg-graphite-50/60">
                <td className="py-3 px-4 font-semibold text-graphite-600">Модель</td>
                <td className="py-3 px-4 font-bold text-graphite-900">{product.model}</td>
              </tr>
              <tr className="hover:bg-graphite-50/60">
                <td className="py-3 px-4 font-semibold text-graphite-600">Артикул</td>
                <td className="py-3 px-4 text-graphite-900 font-mono">{product.sku}</td>
              </tr>
              <tr className="hover:bg-graphite-50/60">
                <td className="py-3 px-4 font-semibold text-graphite-600">Номінальна потужність</td>
                <td className="py-3 px-4 font-bold text-graphite-900">{product.nominal_power_kw} кВт</td>
              </tr>
              {product.max_power_kw != null && (
                <tr className="hover:bg-graphite-50/60">
                  <td className="py-3 px-4 font-semibold text-graphite-600">Максимальна потужність</td>
                  <td className="py-3 px-4 font-bold text-graphite-900">{product.max_power_kw} кВт</td>
                </tr>
              )}
              {product.fuel_type === 'DUAL_FUEL' && product.nominal_power_petrol_kw != null && (
                <tr className="hover:bg-graphite-50/60">
                  <td className="py-3 px-4 font-semibold text-graphite-600">Потужність на бензині (ном / макс)</td>
                  <td className="py-3 px-4 text-graphite-900">
                    {product.nominal_power_petrol_kw} кВт / {product.max_power_petrol_kw ?? '-'} кВт
                  </td>
                </tr>
              )}
              {product.fuel_type === 'DUAL_FUEL' && product.nominal_power_gas_kw != null && (
                <tr className="hover:bg-graphite-50/60">
                  <td className="py-3 px-4 font-semibold text-graphite-600">Потужність на газі (ном / макс)</td>
                  <td className="py-3 px-4 text-graphite-900">
                    {product.nominal_power_gas_kw} кВт / {product.max_power_gas_kw ?? '-'} кВт
                  </td>
                </tr>
              )}
              <tr className="hover:bg-graphite-50/60">
                <td className="py-3 px-4 font-semibold text-graphite-600">Вид палива</td>
                <td className="py-3 px-4 text-graphite-900">{fuelLabels[product.fuel_type] || product.fuel_type}</td>
              </tr>
              <tr className="hover:bg-graphite-50/60">
                <td className="py-3 px-4 font-semibold text-graphite-600">Тип генератора</td>
                <td className="py-3 px-4 text-graphite-900">
                  {product.is_inverter ? 'Інверторний (чиста синусоїда)' : 'Синхронний'}
                </td>
              </tr>
              <tr className="hover:bg-graphite-50/60">
                <td className="py-3 px-4 font-semibold text-graphite-600">Кількість фаз</td>
                <td className="py-3 px-4 text-graphite-900">{phaseLabels[product.phase_type] || product.phase_type}</td>
              </tr>
              <tr className="hover:bg-graphite-50/60">
                <td className="py-3 px-4 font-semibold text-graphite-600">Вихідна напруга</td>
                <td className="py-3 px-4 text-graphite-900">
                  {product.voltage.map((v) => (v === '230V' ? '230 В' : v === '400V' ? '400 В' : v)).join(', ')}
                </td>
              </tr>
              <tr className="hover:bg-graphite-50/60">
                <td className="py-3 px-4 font-semibold text-graphite-600">Спосіб запуску</td>
                <td className="py-3 px-4 text-graphite-900">
                  {product.starting_methods.map((m) => startLabels[m] || m).join(', ')}
                </td>
              </tr>
              <tr className="hover:bg-graphite-50/60">
                <td className="py-3 px-4 font-semibold text-graphite-600">
                  AVR (автоматичне регулювання напруги)
                </td>
                <td className="py-3 px-4 text-graphite-900">{triStateLabel(product.has_avr)}</td>
              </tr>
              <tr className="hover:bg-graphite-50/60">
                <td className="py-3 px-4 font-semibold text-graphite-600">
                  Можливість підключення ATS / АВР
                </td>
                <td className="py-3 px-4 text-graphite-900">{triStateLabel(product.ats_compatible)}</td>
              </tr>
              <tr className="hover:bg-graphite-50/60">
                <td className="py-3 px-4 font-semibold text-graphite-600">
                  Блок ATS / АВР у комплекті
                </td>
                <td className="py-3 px-4 text-graphite-900">{triStateLabel(product.ats_unit_included)}</td>
              </tr>
              {product.fuel_tank_capacity_l != null && (
                <tr className="hover:bg-graphite-50/60">
                  <td className="py-3 px-4 font-semibold text-graphite-600">Об’єм паливного бака</td>
                  <td className="py-3 px-4 text-graphite-900">{product.fuel_tank_capacity_l} л</td>
                </tr>
              )}
              {product.fuel_consumption_lh != null && (
                <tr className="hover:bg-graphite-50/60">
                  <td className="py-3 px-4 font-semibold text-graphite-600">Витрата пального</td>
                  <td className="py-3 px-4 text-graphite-900">
                    {product.fuel_consumption_lh} л/год {product.fuel_consumption_load_pct ? `(при ${product.fuel_consumption_load_pct}% навантаженні)` : ''}
                  </td>
                </tr>
              )}
              {product.autonomy_hours != null && (
                <tr className="hover:bg-graphite-50/60">
                  <td className="py-3 px-4 font-semibold text-graphite-600">Автономність роботи</td>
                  <td className="py-3 px-4 text-graphite-900">
                    {product.autonomy_hours} год {product.autonomy_load_pct ? `(при ${product.autonomy_load_pct}% навантаженні)` : ''}
                  </td>
                </tr>
              )}
              {product.noise_level_db != null && (
                <tr className="hover:bg-graphite-50/60">
                  <td className="py-3 px-4 font-semibold text-graphite-600">Рівень шуму</td>
                  <td className="py-3 px-4 text-graphite-900">
                    {product.noise_level_db} дБА {product.noise_measurement_conditions ? `(${product.noise_measurement_conditions})` : ''}
                  </td>
                </tr>
              )}
              {product.net_weight_kg != null && (
                <tr className="hover:bg-graphite-50/60">
                  <td className="py-3 px-4 font-semibold text-graphite-600">Вага нетто</td>
                  <td className="py-3 px-4 text-graphite-900">{product.net_weight_kg} кг</td>
                </tr>
              )}
              {product.dimensions_mm && (
                <tr className="hover:bg-graphite-50/60">
                  <td className="py-3 px-4 font-semibold text-graphite-600">Габарити (Д×Ш×В)</td>
                  <td className="py-3 px-4 text-graphite-900">{product.dimensions_mm} мм</td>
                </tr>
              )}
              {product.shipping_weight_kg != null && (
                <tr className="hover:bg-graphite-50/60">
                  <td className="py-3 px-4 font-semibold text-graphite-600">Транспортна вага (з упаковкою)</td>
                  <td className="py-3 px-4 text-graphite-900">{product.shipping_weight_kg} кг</td>
                </tr>
              )}
              {product.has_noise_canopy !== 'UNKNOWN' && (
                <tr className="hover:bg-graphite-50/60">
                  <td className="py-3 px-4 font-semibold text-graphite-600">Шумоізоляційний кожух</td>
                  <td className="py-3 px-4 text-graphite-900">{triStateLabel(product.has_noise_canopy)}</td>
                </tr>
              )}
              {product.has_wheels !== 'UNKNOWN' && (
                <tr className="hover:bg-graphite-50/60">
                  <td className="py-3 px-4 font-semibold text-graphite-600">Колеса для транспортування</td>
                  <td className="py-3 px-4 text-graphite-900">{triStateLabel(product.has_wheels)}</td>
                </tr>
              )}
              {product.warranty_months != null && (
                <tr className="hover:bg-graphite-50/60">
                  <td className="py-3 px-4 font-semibold text-graphite-600">Офіційна гарантія</td>
                  <td className="py-3 px-4 font-bold text-graphite-900">{product.warranty_months} міс.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Included Equipment (Комплектація) */}
      {product.included_accessories && (
        <div className="space-y-4 pt-6 border-t border-graphite-200">
          <h2 className="text-xl font-bold text-graphite-900">Комплектація</h2>
          <div className="bg-white p-6 rounded-2xl border border-graphite-200 text-sm text-graphite-800 leading-relaxed whitespace-pre-line">
            {product.included_accessories}
          </div>
        </div>
      )}

      {/* Terms, Warranty, Delivery Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-graphite-200">
        <div className="p-5 bg-white rounded-2xl border border-graphite-200 space-y-2">
          <div className="flex items-center gap-2 text-brand-600 font-bold text-sm">
            <Truck className="w-5 h-5" /> Доставка
          </div>
          <p className="text-xs text-graphite-600 leading-relaxed">
            Нова пошта (відділення або кур’єр). Зверніть увагу: великогабаритні генератори відправляються у вантажні відділення.
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-graphite-200 space-y-2">
          <div className="flex items-center gap-2 text-brand-600 font-bold text-sm">
            <ShieldCheck className="w-5 h-5" /> Оплата
          </div>
          <p className="text-xs text-graphite-600 leading-relaxed">
            Післяплата після огляду товару та підтвердження менеджером. Жодних передоплат чи ризиків.
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-graphite-200 space-y-2">
          <div className="flex items-center gap-2 text-brand-600 font-bold text-sm">
            <RotateCcw className="w-5 h-5" /> Гарантія та повернення
          </div>
          <p className="text-xs text-graphite-600 leading-relaxed">
            14 днів на повернення згідно із Законом України «Про захист прав споживачів». Офіційні авторизовані сервісні центри.
          </p>
        </div>
      </div>

      {/* Fast Checkout Modal */}
      <FastCheckoutModal
        product={product}
        quantity={quantity}
        isOpen={isFastCheckoutOpen}
        onClose={() => setIsFastCheckoutOpen(false)}
      />
    </div>
  );
}
