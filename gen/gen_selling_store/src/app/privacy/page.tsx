import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { getStoreSettings } from '@/lib/settings';

export default async function PrivacyPage() {
  const settings = await getStoreSettings();

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-graphite-500 hover:text-brand-600 mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Назад до каталогу
      </Link>

      <h1 className="text-3xl font-black text-graphite-950 tracking-tight mb-2">
        Політика конфіденційності та обробки даних
      </h1>
      <p className="text-sm text-graphite-500 mb-8">
        Інформація про захист персональних даних клієнтів інтернет-магазину {settings.store_name}
      </p>

      <div className="bg-white rounded-3xl border border-graphite-200 p-6 sm:p-10 shadow-xs space-y-6 text-xs sm:text-sm text-graphite-700 leading-relaxed">
        <div className="p-4 bg-graphite-50 rounded-2xl border border-graphite-200">
          <strong className="text-graphite-900 block mb-1">Володілець бази персональних даних:</strong>
          {settings.seller_legal_name ? (
            <div className="space-y-0.5 text-xs text-graphite-700">
              <p>Суб’єкт: {settings.seller_legal_name}</p>
              {settings.seller_edrpou && <p>Код: {settings.seller_edrpou}</p>}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Відомості про володільця даних: <em>Потребує заповнення в налаштуваннях магазину</em></span>
            </div>
          )}
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-graphite-950">1. Мета збору персональних даних</h2>
          <p>
            1.1. Збір та обробка персональних даних (ім’я, прізвище, номер телефону, адреса електронної пошти, адреса доставки) здійснюється відповідно до Закону України «Про захист персональних даних».
          </p>
          <p>
            1.2. Метою обробки є виключно виконання замовлення, підтвердження адреси та умов доставки перевізником «Нова пошта», а також гарантійне обслуговування.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-graphite-950">2. Передача третім особам</h2>
          <p>
            2.1. Дані покупця передаються виключно логістичним партнерам (ТОВ «Нова пошта») для забезпечення фізичної доставки замовлення.
          </p>
          <p>
            2.2. Ми не продаємо, не передаємо і не розголошуємо персональні дані рекламним мережам або іншим третім особам.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-graphite-950">3. Безпека даних</h2>
          <p>
            3.1. Усі сесії та передача даних захищені сучасними протоколами шифрування (HTTPS).
          </p>
          <p>
            3.2. Магазин не зберігає платіжні дані (номери банківських карток, CVV-коди).
          </p>
        </section>
      </div>
    </main>
  );
}
