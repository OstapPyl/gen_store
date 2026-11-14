import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { getStoreSettings } from '@/lib/settings';

export default async function TermsPage() {
  const settings = await getStoreSettings();

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-graphite-500 hover:text-brand-600 mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Назад до каталогу
      </Link>

      <h1 className="text-3xl font-black text-graphite-950 tracking-tight mb-2">
        Умови купівлі та публічна оферта
      </h1>
      <p className="text-sm text-graphite-500 mb-8">
        Правила замовлення, оплати та повернення товару в інтернет-магазині {settings.store_name}
      </p>

      <div className="bg-white rounded-3xl border border-graphite-200 p-6 sm:p-10 shadow-xs space-y-6 text-xs sm:text-sm text-graphite-700 leading-relaxed">
        {/* Seller Info Block */}
        <div className="p-4 bg-graphite-50 rounded-2xl border border-graphite-200">
          <strong className="text-graphite-900 block mb-1">Відомості про продавця:</strong>
          {settings.seller_legal_name ? (
            <div className="space-y-0.5 text-xs text-graphite-700">
              <p>Найменування: {settings.seller_legal_name}</p>
              {settings.seller_edrpou && <p>Код ЄДРПОУ / РНОКПП: {settings.seller_edrpou}</p>}
              {settings.seller_address && <p>Місцезнаходження: {settings.seller_address}</p>}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Офіційні реквізити суб’єкта господарювання: <em>Потребує заповнення в налаштуваннях магазину</em></span>
            </div>
          )}
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-graphite-950">1. Загальні положення</h2>
          <p>
            1.1. Цей документ є публічною офертою інтернет-магазину {settings.store_name} і визначає умови купівлі-продажу товарів (генераторів та супутнього обладнання) для фізичних та юридичних осіб на території України.
          </p>
          <p>
            1.2. Оформлення замовлення покупцем свідчить про повне і беззастережне прийняття умов цієї оферти.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-graphite-950">2. Оформлення замовлення та ціна</h2>
          <p>
            2.1. Замовлення приймаються через сайт цілодобово. Договір купівлі-продажу вважається укладеним після підтвердження замовлення менеджером магазину.
          </p>
          <p>
            2.2. Ціни вказуються у національній валюті України — гривні. У разі зміни ціни товару до моменту підтвердження замовлення покупець обов’язково повідомляється про це.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-graphite-950">3. Доставка та оплата</h2>
          <p>
            3.1. Доставка здійснюється перевізником «Нова пошта» або іншими узгодженими способами. Вартість доставки сплачується покупцем окремо за тарифами перевізника.
          </p>
          <p>
            3.2. Розрахунок здійснюється післяплатою у відділенні перевізника після огляду товару, якщо інше не узгоджено з менеджером.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-graphite-950">4. Гарантія та повернення</h2>
          <p>
            4.1. На всі генератори розповсюджується офіційна гарантія виробника або імпортера, строк якої зазначається у паспорті/гарантійному талоні товару.
          </p>
          <p>
            4.2. Повернення товару належної якості протягом 14 днів можливе виключно за умови відсутності слідів експлуатації, заправки технічними рідинами (бензин, мастило, дизель), збереження пломб, маркування та товарного вигляду.
          </p>
        </section>
      </div>
    </main>
  );
}
