'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Package,
  ShoppingCart,
  Settings,
  FileSpreadsheet,
  LayoutDashboard,
  Zap,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Огляд', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Товари', icon: Package },
  { href: '/admin/orders', label: 'Замовлення', icon: ShoppingCart },
  { href: '/admin/settings', label: 'Налаштування', icon: Settings },
  { href: '/admin/export', label: 'Експорт', icon: FileSpreadsheet },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-graphite-900 text-graphite-300 flex flex-col shrink-0 min-h-screen">
      {/* Brand */}
      <div className="h-16 flex items-center gap-2.5 px-6 border-b border-graphite-800">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-black text-white leading-none">
            Gen<span className="text-brand-500">.</span>Admin
          </span>
          <span className="text-[10px] text-graphite-400 font-bold uppercase tracking-wider mt-0.5">
            Панель керування
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="p-4 space-y-1.5 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-graphite-400 hover:text-white hover:bg-graphite-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer link to public store */}
      <div className="p-4 border-t border-graphite-800">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-graphite-400 hover:text-white bg-graphite-800/60 hover:bg-graphite-800 rounded-xl transition-colors"
        >
          <span>Перейти на сайт магазину ↗</span>
        </Link>
      </div>
    </aside>
  );
}
