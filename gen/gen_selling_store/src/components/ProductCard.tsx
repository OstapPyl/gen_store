'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Zap, Fuel, Activity, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from './CartContext';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = React.useState(false);

  const priceUah = (product.price_kop / 100).toLocaleString('uk-UA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const mainImage = product.images?.[0] || null;

  const fuelLabels: Record<string, string> = {
    PETROL: 'Бензин',
    DIESEL: 'Дизель',
    GAS: 'Газ',
    DUAL_FUEL: 'Бензин/газ',
  };

  const phaseLabels: Record<string, string> = {
    SINGLE: '1 фаза (230 В)',
    THREE: '3 фази (400 В)',
    SWITCH_1_3: '1 / 3 фази (230/400 В)',
  };

  const isAvailable = product.stock > 0 && product.availability_status === 'IN_STOCK';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAvailable) return;
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <div className="group bg-white rounded-2xl border border-graphite-200 overflow-hidden hover:shadow-xl hover:border-brand-300 transition-all duration-300 flex flex-col h-full focus-within:ring-2 focus-within:ring-brand-500">
      {/* Image Area */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[4/3] bg-graphite-50 overflow-hidden border-b border-graphite-100"
        tabIndex={-1}
      >
        {mainImage ? (
          <Image
            src={mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-graphite-300">
            <Zap className="w-12 h-12 stroke-1" />
            <span className="text-xs font-medium mt-1">Фото товару</span>
          </div>
        )}

        {/* Inverter Tag */}
        {product.is_inverter && (
          <span className="absolute top-3 left-3 bg-indigo-600/90 backdrop-blur-sm text-white text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
            Інверторний
          </span>
        )}

        {/* Availability Badge */}
        <div className="absolute top-3 right-3">
          {product.availability_status === 'IN_STOCK' && product.stock > 0 ? (
            <span className="inline-flex items-center gap-1 bg-emerald-500/90 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-sm">
              <CheckCircle2 className="w-3 h-3" /> В наявності
            </span>
          ) : product.availability_status === 'WAITING' ? (
            <span className="inline-flex items-center gap-1 bg-amber-500/90 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-sm">
              <Clock className="w-3 h-3" /> Очікується
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-rose-500/90 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-sm">
              <XCircle className="w-3 h-3" /> Немає в наявності
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Brand & Model */}
        <div className="flex items-center justify-between text-xs text-graphite-400 mb-1">
          <span className="font-bold uppercase tracking-wider text-graphite-500">{product.brand}</span>
          <span>Арт: {product.sku}</span>
        </div>

        {/* Product Title */}
        <h3 className="font-bold text-graphite-900 text-base leading-snug line-clamp-2 mb-3 group-hover:text-brand-600 transition-colors">
          <Link href={`/products/${product.slug}`} className="focus:outline-none">
            {product.name}
          </Link>
        </h3>

        {/* Specifications Grid */}
        <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-graphite-50 rounded-xl mb-4 text-xs">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-graphite-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-brand-500" /> Потужність
            </span>
            <span className="font-bold text-graphite-900 mt-0.5">
              {product.nominal_power_kw} кВт
            </span>
          </div>

          <div className="flex flex-col border-l border-graphite-200 pl-2">
            <span className="text-[10px] uppercase font-bold text-graphite-400 flex items-center gap-1">
              <Fuel className="w-3 h-3 text-brand-500" /> Паливо
            </span>
            <span className="font-semibold text-graphite-900 mt-0.5 truncate">
              {fuelLabels[product.fuel_type] || product.fuel_type}
            </span>
          </div>

          <div className="flex flex-col border-l border-graphite-200 pl-2">
            <span className="text-[10px] uppercase font-bold text-graphite-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-brand-500" /> Фази
            </span>
            <span className="font-semibold text-graphite-900 mt-0.5 truncate">
              {product.phase_type === 'SINGLE' ? '1 фаза' : product.phase_type === 'THREE' ? '3 фази' : '1/3 фази'}
            </span>
          </div>
        </div>

        {/* Price and Actions */}
        <div className="mt-auto pt-3 border-t border-graphite-100 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] text-graphite-400 font-medium">Ціна</span>
            <span className="text-xl font-black text-graphite-950">
              {priceUah} <span className="text-sm font-bold text-graphite-600">₴</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/products/${product.slug}`}
              className="px-3 py-2 text-xs font-semibold text-graphite-700 hover:text-graphite-900 bg-graphite-100 hover:bg-graphite-200 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              Детальніше
            </Link>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!isAvailable}
              className={`p-2.5 rounded-xl font-bold text-white transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                !isAvailable
                  ? 'bg-graphite-300 cursor-not-allowed text-graphite-400 shadow-none'
                  : justAdded
                  ? 'bg-emerald-600'
                  : 'bg-brand-600 hover:bg-brand-700 active:scale-95 shadow-brand-500/20'
              }`}
              title={isAvailable ? 'Додати до кошика' : 'Немає в наявності'}
              aria-label="Додати до кошика"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
