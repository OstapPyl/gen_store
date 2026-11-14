import React from 'react';
import { getStoreSettings } from '@/lib/settings';
import SettingsClient from './SettingsClient';

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-graphite-200">
        <h1 className="text-2xl font-black text-graphite-950 tracking-tight">
          Налаштування магазину
        </h1>
        <p className="text-xs text-graphite-500 mt-0.5">
          Контакти, адреси, ключі інтеграцій та юридичні реквізити суб’єкта господарювання
        </p>
      </div>

      <SettingsClient initialSettings={settings} />
    </div>
  );
}
