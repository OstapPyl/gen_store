import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ProductForm from '@/components/admin/ProductForm';

export default function NewProductPage() {
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
            Додати генератор
          </h1>
          <p className="text-xs text-graphite-500 mt-0.5">
            Заповніть характеристики для створення нового товару в каталозі
          </p>
        </div>
      </div>

      <ProductForm />
    </div>
  );
}
