'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Store,
  Truck,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { StoreSettings } from '@/types';

interface SettingsClientProps {
  initialSettings: StoreSettings;
}

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const router = useRouter();

  const [storeName, setStoreName] = useState(initialSettings.store_name);
  const [storePhone, setStorePhone] = useState(initialSettings.store_phone);
  const [storeEmail, setStoreEmail] = useState(initialSettings.store_email);
  const [workingHours, setWorkingHours] = useState(initialSettings.store_working_hours);
  const [pickupAddress, setPickupAddress] = useState(initialSettings.store_pickup_address);
  const [pickupEnabled, setPickupEnabled] = useState(initialSettings.pickup_enabled);
  const [courierEnabled, setCourierEnabled] = useState(initialSettings.courier_enabled);

  // Nova Poshta
  const [npApiKey, setNpApiKey] = useState(initialSettings.nova_poshta_api_key || '');

  // Seller Requisites
  const [sellerName, setSellerName] = useState(initialSettings.seller_legal_name || '');
  const [sellerEdrpou, setSellerEdrpou] = useState(initialSettings.seller_edrpou || '');
  const [sellerTaxInfo, setSellerTaxInfo] = useState(initialSettings.seller_tax_info || '');
  const [sellerAddress, setSellerAddress] = useState(initialSettings.seller_address || '');
  const [warrantyTerms, setWarrantyTerms] = useState(initialSettings.warranty_terms || '');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_name: storeName.trim() || 'Gen',
          store_phone: storePhone.trim(),
          store_email: storeEmail.trim(),
          store_working_hours: workingHours.trim(),
          store_pickup_address: pickupAddress.trim(),
          pickup_enabled: pickupEnabled,
          courier_enabled: courierEnabled,
          nova_poshta_api_key: npApiKey.trim() || null,
          seller_legal_name: sellerName.trim() || null,
          seller_edrpou: sellerEdrpou.trim() || null,
          seller_tax_info: sellerTaxInfo.trim() || null,
          seller_address: sellerAddress.trim() || null,
          warranty_terms: warrantyTerms.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Помилка збереження налаштувань.');
      }

      setSavedSuccess(true);
      router.refresh();
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Не вдалося зберегти налаштування.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">Налаштування магазину успішно оновлено!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Store Identity & Contacts */}
      <section className="bg-white rounded-3xl border border-graphite-200 p-6 sm:p-8 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-graphite-950 flex items-center gap-2 pb-2 border-b border-graphite-100">
          <Store className="w-5 h-5 text-brand-600" />
          Ідентичність магазину та контакти
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">
              Назва магазину
            </label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Gen"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">
              Контактний телефон
            </label>
            <input
              type="text"
              required
              value={storePhone}
              onChange={(e) => setStorePhone(e.target.value)}
              placeholder="+380 44 123 45 67"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">
              Email для зв’язку
            </label>
            <input
              type="email"
              required
              value={storeEmail}
              onChange={(e) => setStoreEmail(e.target.value)}
              placeholder="info@gen-store.ua"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">
              Графік роботи
            </label>
            <input
              type="text"
              required
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              placeholder="Пн-Сб: 09:00 - 19:00, Нд: 10:00 - 16:00"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-graphite-700 mb-1">
              Адреса точки самовивозу
            </label>
            <input
              type="text"
              required
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder="м. Київ, вул. Енергетиків, 10"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </section>

      {/* Nova Poshta API */}
      <section className="bg-white rounded-3xl border border-graphite-200 p-6 sm:p-8 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-graphite-950 flex items-center gap-2 pb-2 border-b border-graphite-100">
          <Truck className="w-5 h-5 text-brand-600" />
          Інтеграція з Новою поштою (API 2.0)
        </h2>

        <div>
          <label className="block text-xs font-semibold text-graphite-700 mb-1">
            API-ключ Нової пошти
          </label>
          <input
            type="password"
            value={npApiKey}
            onChange={(e) => setNpApiKey(e.target.value)}
            placeholder="Введіть 32-значний ключ API Нової пошти..."
            className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
          />
          <p className="text-[11px] text-graphite-500 mt-1.5 leading-relaxed">
            API-ключ зберігається виключно на сервері. Якщо ключ не налаштовано, покупці зможуть ввести населений пункт та відділення вручну із позначкою «Потребує перевірки доставки».
          </p>
        </div>
      </section>

      {/* Seller Legal Info */}
      <section className="bg-white rounded-3xl border border-graphite-200 p-6 sm:p-8 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-graphite-950 flex items-center gap-2 pb-2 border-b border-graphite-100">
          <ShieldCheck className="w-5 h-5 text-brand-600" />
          Реквізити суб’єкта господарювання (для публічної оферти)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">
              Офіційне найменування (ФОП / ТОВ)
            </label>
            <input
              type="text"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              placeholder="ФОП Іваненко І.І. або ТОВ «ГЕН ЕНЕРДЖІ»"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {!sellerName && (
              <span className="text-[10px] text-amber-600 mt-1 block">
                * Потребує заповнення власником магазину
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">
              Код ЄДРПОУ або РНОКПП (ІПН)
            </label>
            <input
              type="text"
              value={sellerEdrpou}
              onChange={(e) => setSellerEdrpou(e.target.value)}
              placeholder="12345678"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-graphite-700 mb-1">
              Юридична адреса
            </label>
            <input
              type="text"
              value={sellerAddress}
              onChange={(e) => setSellerAddress(e.target.value)}
              placeholder="01001, м. Київ, вул. Хрещатик, 1"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-graphite-700 mb-1">
              Гарантійні умови (текст у картках товарів)
            </label>
            <textarea
              rows={3}
              value={warrantyTerms}
              onChange={(e) => setWarrantyTerms(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </section>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="px-8 py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-graphite-400 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Збереження...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Зберегти всі налаштування</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
