import React from 'react';
import { FileSpreadsheet, Download, ShieldCheck, Laptop, Database, ArrowRight } from 'lucide-react';

export default function AdminExportPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="pb-4 border-b border-graphite-200">
        <h1 className="text-2xl font-black text-graphite-950 tracking-tight">
          Експорт замовлень
        </h1>
        <p className="text-xs text-graphite-500 mt-0.5">
          Вивантаження структурованих даних для фінансового обліку, CRM та Excel
        </p>
      </div>

      {/* Manual XLSX Export Card */}
      <div className="bg-white rounded-3xl border border-graphite-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-graphite-950">Ручний експорт у Microsoft Excel (XLSX)</h2>
            <p className="text-xs text-graphite-500 mt-1 leading-relaxed">
              Формує книгу Excel із двома структурованими аркушами: <strong>«Замовлення»</strong> (номери, дати, клієнти, телефони, адреси, ТТН) та <strong>«Товари замовлень»</strong> (артикули, назви, кількості, ціни на момент покупки).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-graphite-50 rounded-2xl border border-graphite-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-graphite-900 font-bold">Безпека формул (Anti-CSV/Formula Injection):</strong>
              <span className="text-graphite-600 text-[11px]">
                Всі користувацькі значення екрануються для унеможливлення виконання шкідливих формул при відкритті в Excel.
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-graphite-50 rounded-2xl border border-graphite-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-graphite-900 font-bold">Текстовий формат полів:</strong>
              <span className="text-graphite-600 text-[11px]">
                Номери телефонів, артикули та ТТН зберігаються у текстовому форматі (@), тому нулі на початку не губляться.
              </span>
            </div>
          </div>
        </div>

        <div>
          <a
            href="/api/admin/export"
            download
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Завантажити XLSX файл замовлень</span>
          </a>
        </div>
      </div>

      {/* Local Synchronization to Laptop Card */}
      <div className="bg-white rounded-3xl border border-graphite-200 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Laptop className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-graphite-950">Автоматична синхронізація на ноутбук (orders.sqlite)</h2>
            <p className="text-xs text-graphite-500 mt-1 leading-relaxed">
              На вашому ноутбуці працює локальна фонова служба, яка кожні 5 хвилин автоматично завантажує нові замовлення та оновлення статусів у локальний файл <code>orders.sqlite</code> через захищений API.
            </p>
          </div>
        </div>

        <div className="p-4 bg-brand-50/50 rounded-2xl border border-brand-200 text-xs text-brand-900 space-y-2 leading-relaxed">
          <div className="flex items-center gap-2 font-bold">
            <Database className="w-4 h-4 text-brand-600" />
            <span>Як запустити або перевірити синхронізацію вручну на ноутбуці:</span>
          </div>
          <div className="bg-graphite-900 text-graphite-100 p-3 rounded-xl font-mono text-[11px]">
            npm run sync -- --once
          </div>
          <p className="text-[11px] text-brand-800">
            Для експорту локального <code>orders.sqlite</code> у файл Excel прямо на ноутбуці виконайте команду:
          </p>
          <div className="bg-graphite-900 text-graphite-100 p-3 rounded-xl font-mono text-[11px]">
            npm run export-xlsx
          </div>
        </div>
      </div>
    </div>
  );
}
