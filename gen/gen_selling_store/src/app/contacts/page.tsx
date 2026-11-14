import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, ArrowLeft, MessageSquare } from 'lucide-react';
import { getStoreSettings } from '@/lib/settings';

export default async function ContactsPage() {
  const settings = await getStoreSettings();

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-graphite-500 hover:text-brand-600 mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Назад до каталогу
      </Link>

      <h1 className="text-3xl font-black text-graphite-950 tracking-tight mb-2">
        Контакти
      </h1>
      <p className="text-sm text-graphite-500 mb-8">
        Зв’язок із відділом продажу та підтримки клієнтів інтернет-магазину {settings.store_name}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-graphite-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-graphite-400 uppercase tracking-wider">Телефон відділу продажу</span>
              <div className="text-lg font-black text-graphite-950 mt-1">{settings.store_phone}</div>
              <p className="text-xs text-graphite-500 mt-0.5">Консультації щодо потужності та наявності</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-graphite-400 uppercase tracking-wider">Електронна пошта</span>
              <div className="text-base font-bold text-graphite-950 mt-1">{settings.store_email}</div>
              <p className="text-xs text-graphite-500 mt-0.5">Для замовлень та комерційних запитів</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-graphite-400 uppercase tracking-wider">Графік роботи</span>
              <div className="text-sm font-bold text-graphite-950 mt-1">{settings.store_working_hours}</div>
              <p className="text-xs text-graphite-500 mt-0.5">Прийом замовлень на сайті — цілодобово</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-graphite-200 p-6 sm:p-8 shadow-xs space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-graphite-400 uppercase tracking-wider">Адреса точки видачі</span>
                <div className="text-base font-bold text-graphite-950 mt-1">{settings.store_pickup_address}</div>
                <p className="text-xs text-graphite-500 mt-0.5">Самовивіз після попереднього резервування</p>
              </div>
            </div>

            {settings.seller_legal_name ? (
              <div className="p-4 bg-graphite-50 rounded-2xl border border-graphite-200 text-xs text-graphite-600 space-y-1">
                <strong className="text-graphite-900 block">Юридичні реквізити:</strong>
                <div>{settings.seller_legal_name}</div>
                {settings.seller_edrpou && <div>ЄДРПОУ/РНОКПП: {settings.seller_edrpou}</div>}
                {settings.seller_address && <div>Адреса: {settings.seller_address}</div>}
              </div>
            ) : (
              <div className="p-4 bg-graphite-50 rounded-2xl border border-dashed border-graphite-300 text-xs text-graphite-500">
                Реквізити суб’єкта господарювання: <em>Потребує заповнення в налаштуваннях магазину</em>
              </div>
            )}
          </div>

          <div className="p-4 bg-brand-50/50 rounded-2xl border border-brand-200 text-xs text-brand-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-600 shrink-0" />
            <span>Потрібна консультація щодо підключення автоматики (ATS)? Зателефонуйте нам!</span>
          </div>
        </div>
      </div>
    </main>
  );
}
