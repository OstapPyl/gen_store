'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';

interface AdminHeaderProps {
  adminName?: string;
}

export default function AdminHeader({ adminName = 'Адміністратор' }: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-graphite-200 px-6 flex items-center justify-between">
      <div className="text-xs font-semibold text-graphite-500">
        Магазин генераторів: <strong className="text-graphite-900 font-bold">Gen</strong>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-graphite-800">
          <div className="w-7 h-7 rounded-full bg-graphite-100 flex items-center justify-center text-graphite-600">
            <User className="w-4 h-4" />
          </div>
          <span>{adminName}</span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
          title="Вийти з панелі"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Вихід</span>
        </button>
      </div>
    </header>
  );
}
