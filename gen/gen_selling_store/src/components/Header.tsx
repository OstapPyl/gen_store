'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingCart, Search, Menu, X, Zap } from 'lucide-react';
import { useCart } from './CartContext';

function HeaderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { totalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) {
      params.set('query', searchQuery.trim());
      params.set('page', '1');
    } else {
      params.delete('query');
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-graphite-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6 fill-current text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-graphite-900 leading-none">
                Gen<span className="text-brand-600">.</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-graphite-500 leading-none mt-1">
                Генератори
              </span>
            </div>
          </Link>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-xl mx-4 relative"
            role="search"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук за назвою, брендом, моделлю або артикулом..."
              className="w-full pl-11 pr-4 py-2.5 bg-graphite-50 border border-graphite-300 rounded-xl text-sm text-graphite-900 placeholder:text-graphite-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
            />
            <Search className="w-5 h-5 text-graphite-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              Знайти
            </button>
          </form>

          {/* Navigation Links & Cart */}
          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-graphite-700">
              <Link
                href="/delivery-and-payment"
                className="hover:text-brand-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded p-1"
              >
                Доставка та оплата
              </Link>
              <Link
                href="/contacts"
                className="hover:text-brand-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded p-1"
              >
                Контакти
              </Link>
            </nav>

            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative flex items-center gap-2 px-3 sm:px-4 py-2 bg-graphite-100 hover:bg-brand-50 hover:text-brand-700 text-graphite-900 rounded-xl font-semibold text-sm transition-all border border-graphite-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label={`Кошик, ${totalItems} товарів`}
            >
              <ShoppingCart className="w-5 h-5 text-brand-600" />
              <span className="hidden sm:inline">Кошик</span>
              {totalItems > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-brand-600 rounded-full shadow-sm animate-in fade-in zoom-in">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-graphite-700 hover:text-graphite-900 hover:bg-graphite-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Відкрити меню"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук за назвою, брендом, моделлю..."
              className="w-full pl-10 pr-16 py-2 bg-graphite-50 border border-graphite-300 rounded-xl text-sm text-graphite-900 placeholder:text-graphite-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Search className="w-4 h-4 text-graphite-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-brand-600 text-white text-xs font-semibold rounded-lg"
            >
              Знайти
            </button>
          </form>
        </div>

        {/* Mobile Dropdown Nav */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-graphite-200 py-3 space-y-2">
            <Link
              href="/delivery-and-payment"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-graphite-700 hover:bg-graphite-100 hover:text-brand-600"
            >
              Доставка та оплата
            </Link>
            <Link
              href="/contacts"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-graphite-700 hover:bg-graphite-100 hover:text-brand-600"
            >
              Контакти
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default function Header() {
  return (
    <Suspense fallback={
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-graphite-200 h-16 sm:h-20" />
    }>
      <HeaderContent />
    </Suspense>
  );
}
