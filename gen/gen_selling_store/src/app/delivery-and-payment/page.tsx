import React from 'react';
import Link from 'next/link';
import { Truck, ShieldCheck, CreditCard, ArrowLeft, Clock, AlertTriangle } from 'lucide-react';
import { getStoreSettings } from '@/lib/settings';

export default async function DeliveryAndPaymentPage() {
  const settings = await getStoreSettings();

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-graphite-500 hover:text-brand-600 mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Назад до каталогу
      </Link>

      <h1 className="text-3xl font-black text-graphite-950 tracking-tight mb-2">
        Доставка та оплата
      </h1>
      <p className="text-sm text-graphite-500 mb-8">
        Умови отримання та розрахунку за замовлення в інтернет-магазині {settings.store_name}
      </p>

      <div className="space-y-8">
        {/* Delivery methods */}
        <section className="bg-white rounded-3xl border border-graphite-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3 text-brand-600">
            <Truck className="w-6 h-6" />
            <h2 className="text-xl font-bold text-graphite-900">Способи доставки</h2>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-graphite-700 leading-relaxed">
            <div className="p-4 bg-graphite-50 rounded-2xl border border-graphite-200 space-y-1">
              <strong className="text-graphite-900 block text-sm">1. Нова пошта у відділення</strong>
              <p>
                Доставка здійснюється по всій території України у працюючі відділення перевізника «Нова пошта».
              </p>
              <div className="flex items-start gap-2 text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mt-2 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Зверніть увагу на обмеження ваги:</strong> Генератори масою понад 30 кг або з габаритами більше 120 см відправляються виключно у <strong>вантажні відділення</strong> (до 1000 кг або без обмежень).
                </span>
              </div>
            </div>

            <div className="p-4 bg-graphite-50 rounded-2xl border border-graphite-200 space-y-1">
              <strong className="text-graphite-900 block text-sm">2. Адресна доставка кур’єром Нової пошти</strong>
              <p>
                Кур’єр доставить генератор прямо до вашого під’їзду чи приватного будинку.
              </p>
            </div>

            <div className="p-4 bg-graphite-50 rounded-2xl border border-graphite-200 space-y-1">
              <strong className="text-graphite-900 block text-sm">3. Самовивіз у Києві</strong>
              <p>
                Адреса: {settings.store_pickup_address}. Самовивіз здійснюється за попереднім узгодженням із менеджером після резервування товару на складі.
              </p>
            </div>

            <p className="text-xs text-graphite-500 pt-2">
              Вартість доставки розраховується <strong>за тарифами перевізника та оплачується окремо</strong> при отриманні посилки.
            </p>
          </div>
        </section>

        {/* Payment methods */}
        <section className="bg-white rounded-3xl border border-graphite-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3 text-brand-600">
            <ShieldCheck className="w-6 h-6" />
            <h2 className="text-xl font-bold text-graphite-900">Спосіб оплати</h2>
          </div>

          <div className="p-4 bg-brand-50/50 rounded-2xl border border-brand-200 text-xs sm:text-sm text-graphite-800 space-y-2">
            <strong className="text-brand-950 block text-sm">
              Післяплата (накладений платіж) після підтвердження менеджером
            </strong>
            <p className="leading-relaxed">
              Ми дбаємо про вашу безпеку, тому на даному етапі не вимагаємо онлайн-оплати банківською карткою на сайті. Після оформлення замовлення наш менеджер зв’язується з вами телефоном для звірки характеристик і наявності.
            </p>
            <p className="leading-relaxed">
              Ви сплачуєте замовлення готівкою або карткою у відділенні перевізника після огляду зовнішнього вигляду, пломб і комплектності.
            </p>
          </div>
        </section>

        {/* Warranty and return */}
        <section className="bg-white rounded-3xl border border-graphite-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3 text-brand-600">
            <Clock className="w-6 h-6" />
            <h2 className="text-xl font-bold text-graphite-900">Гарантія та повернення</h2>
          </div>

          <div className="text-xs sm:text-sm text-graphite-700 leading-relaxed space-y-2">
            <p>{settings.warranty_terms}</p>
            <p>
              Відповідно до Закону України «Про захист прав споживачів», повернення або обмін товару належної якості можливий протягом 14 днів, якщо генератор не був у використанні, не заправлявся мастилом або паливом, збережено товарний вигляд, пломби та оригінальну упаковку.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
