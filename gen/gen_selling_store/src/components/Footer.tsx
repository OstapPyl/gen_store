import React from 'react';
import Link from 'next/link';
import { Zap, ShieldCheck, Truck, Clock, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-graphite-900 text-graphite-300 mt-20 border-t border-graphite-800">
      {/* Top features strip */}
      <div className="border-b border-graphite-800 py-8 bg-graphite-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Офіційна гарантія</h4>
                <p className="text-xs text-graphite-400 mt-0.5">Вся техніка сертифікована для українського ринку</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Доставка по Україні</h4>
                <p className="text-xs text-graphite-400 mt-0.5">Нова пошта у відділення або кур’єром</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Підтримка та консультації</h4>
                <p className="text-xs text-graphite-400 mt-0.5">Допомога у підборі потужності та пускових струмів</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Gen<span className="text-brand-500">.</span>
              </span>
            </Link>
            <p className="text-xs text-graphite-400 leading-relaxed">
              Спеціалізований інтернет-магазин генераторів, резервного живлення та систем автоматичного вводу резерву.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h5 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Покупцям</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-brand-400 transition-colors">
                  Каталог генераторів
                </Link>
              </li>
              <li>
                <Link href="/delivery-and-payment" className="hover:text-brand-400 transition-colors">
                  Доставка та оплата
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="hover:text-brand-400 transition-colors">
                  Контакти та графік роботи
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h5 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Правова інформація</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/terms" className="hover:text-brand-400 transition-colors">
                  Умови покупки та повернення
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-brand-400 transition-colors">
                  Політика конфіденційності
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-brand-400 transition-colors text-graphite-500">
                  Вхід для співробітників
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h5 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Контакти</h5>
            <ul className="space-y-2.5 text-xs text-graphite-400">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-500 shrink-0" />
                <span className="text-graphite-200 font-medium">+380 44 123 45 67</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-500 shrink-0" />
                <span>info@gen-store.ua</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <span>м. Київ, вул. Енергетиків, 10</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-graphite-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-graphite-500 gap-4">
          <p>© {currentYear} Gen. Всі права захищено.</p>
          <p>Ціни вказано у національній валюті — гривнях (₴).</p>
        </div>
      </div>
    </footer>
  );
}
