'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Невірне ім’я користувача або пароль.');
      }

      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Помилка авторизації.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-graphite-200 p-8 sm:p-10 shadow-xl">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 mb-3">
          <Zap className="w-7 h-7 fill-current" />
        </div>
        <h1 className="text-2xl font-black text-graphite-950 tracking-tight">
          Панель керування Gen
        </h1>
        <p className="text-xs text-graphite-500 mt-1">
          Вхід для авторизованих адміністраторів магазину
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 mb-6">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-graphite-700 uppercase tracking-wider mb-1.5">
            Ім’я користувача
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-graphite-50 border border-graphite-300 rounded-xl text-graphite-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <User className="w-4 h-4 text-graphite-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-graphite-700 uppercase tracking-wider mb-1.5">
            Пароль
          </label>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-graphite-50 border border-graphite-300 rounded-xl text-graphite-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
            <Lock className="w-4 h-4 text-graphite-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-graphite-400 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Перевірка...</span>
            </>
          ) : (
            <span>Увійти в панель</span>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-graphite-100 text-center">
        <p className="text-[11px] text-graphite-400">
          Публічна реєстрація вимкнена. Облікові записи створюються через CLI-скрипт або головним адміністратором.
        </p>
      </div>
    </div>
  );
}
