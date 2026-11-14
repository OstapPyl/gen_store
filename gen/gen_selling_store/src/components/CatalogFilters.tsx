'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface CatalogFiltersProps {
  facets: {
    brands: string[];
    priceRange: { min: number; max: number };
    powerRange: { min: number; max: number };
    tankRange: { min: number; max: number };
    weightRange: { min: number; max: number };
  };
}

export default function CatalogFilters({ facets }: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showAdditional, setShowAdditional] = useState(false);

  // Price inputs state
  const [priceMin, setPriceMin] = useState(searchParams.get('price_min') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('price_max') || '');

  // Power inputs state
  const [powerMin, setPowerMin] = useState(searchParams.get('power_min') || '');
  const [powerMax, setPowerMax] = useState(searchParams.get('power_max') || '');

  // Selected arrays
  const selectedBrands = searchParams.getAll('brand');
  const selectedFuels = searchParams.getAll('fuel');
  const selectedPhases = searchParams.getAll('phase');
  const selectedStarts = searchParams.getAll('start');
  const selectedVoltages = searchParams.getAll('voltage');

  const inverter = searchParams.get('inverter') || '';
  const inStock = searchParams.get('in_stock') === '1';

  // Additional options
  const avr = searchParams.get('avr') || '';
  const atsCompatible = searchParams.get('ats_compatible') || '';
  const atsUnitIncluded = searchParams.get('ats_unit_included') || '';
  const canopy = searchParams.get('canopy') || '';
  const wheels = searchParams.get('wheels') || '';

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    if (value !== null && value !== '') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/?${params.toString()}`);
  };

  const toggleArrayParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    const existing = params.getAll(key);
    params.delete(key);
    if (existing.includes(value)) {
      existing.filter((v) => v !== value).forEach((v) => params.append(key, v));
    } else {
      [...existing, value].forEach((v) => params.append(key, v));
    }
    router.push(`/?${params.toString()}`);
  };

  const applyPrice = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    if (priceMin) params.set('price_min', priceMin);
    else params.delete('price_min');

    if (priceMax) params.set('price_max', priceMax);
    else params.delete('price_max');

    router.push(`/?${params.toString()}`);
  };

  const applyPower = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    if (powerMin) params.set('power_min', powerMin);
    else params.delete('power_min');

    if (powerMax) params.set('power_max', powerMax);
    else params.delete('power_max');

    router.push(`/?${params.toString()}`);
  };

  const resetAllFilters = () => {
    setPriceMin('');
    setPriceMax('');
    setPowerMin('');
    setPowerMax('');
    const query = searchParams.get('query');
    const sort = searchParams.get('sort');
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (sort) params.set('sort', sort);
    router.push(`/?${params.toString()}`);
  };

  // Count active filters
  let activeFilterCount = 0;
  if (searchParams.get('price_min') || searchParams.get('price_max')) activeFilterCount++;
  if (selectedBrands.length > 0) activeFilterCount += selectedBrands.length;
  if (searchParams.get('power_min') || searchParams.get('power_max')) activeFilterCount++;
  if (selectedFuels.length > 0) activeFilterCount += selectedFuels.length;
  if (inverter) activeFilterCount++;
  if (selectedPhases.length > 0) activeFilterCount += selectedPhases.length;
  if (selectedStarts.length > 0) activeFilterCount += selectedStarts.length;
  if (inStock) activeFilterCount++;
  if (selectedVoltages.length > 0) activeFilterCount += selectedVoltages.length;
  if (avr) activeFilterCount++;
  if (atsCompatible) activeFilterCount++;
  if (atsUnitIncluded) activeFilterCount++;
  if (canopy) activeFilterCount++;
  if (wheels) activeFilterCount++;

  const content = (
    <div className="space-y-6 text-sm text-graphite-800">
      {/* Active Filters Bar */}
      {activeFilterCount > 0 && (
        <div className="bg-brand-50/70 border border-brand-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-900">
              Активні фільтри ({activeFilterCount})
            </span>
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs text-brand-700 hover:text-brand-900 font-semibold flex items-center gap-1 focus:outline-none"
            >
              <RotateCcw className="w-3 h-3" /> Скинути всі
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {selectedBrands.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1 bg-white border border-brand-300 text-brand-900 text-xs px-2 py-0.5 rounded-md shadow-2xs"
              >
                {b}
                <button
                  type="button"
                  onClick={() => toggleArrayParam('brand', b)}
                  className="hover:text-rose-600 focus:outline-none"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedFuels.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1 bg-white border border-brand-300 text-brand-900 text-xs px-2 py-0.5 rounded-md shadow-2xs"
              >
                {f === 'PETROL' ? 'Бензин' : f === 'DIESEL' ? 'Дизель' : f === 'GAS' ? 'Газ' : 'Бензин/газ'}
                <button
                  type="button"
                  onClick={() => toggleArrayParam('fuel', f)}
                  className="hover:text-rose-600 focus:outline-none"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {inverter && (
              <span className="inline-flex items-center gap-1 bg-white border border-brand-300 text-brand-900 text-xs px-2 py-0.5 rounded-md">
                {inverter === 'yes' ? 'Інверторний: Так' : 'Інверторний: Ні'}
                <button
                  type="button"
                  onClick={() => updateParam('inverter', null)}
                  className="hover:text-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {inStock && (
              <span className="inline-flex items-center gap-1 bg-white border border-brand-300 text-brand-900 text-xs px-2 py-0.5 rounded-md">
                В наявності
                <button
                  type="button"
                  onClick={() => updateParam('in_stock', null)}
                  className="hover:text-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Availability Filter */}
      <div className="pb-4 border-b border-graphite-200">
        <label className="flex items-center gap-2.5 cursor-pointer font-medium text-graphite-900 hover:text-brand-600 transition-colors">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => updateParam('in_stock', e.target.checked ? '1' : null)}
            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-graphite-300"
          />
          <span>Тільки в наявності</span>
        </label>
      </div>

      {/* Price Filter */}
      <div className="pb-5 border-b border-graphite-200">
        <h4 className="font-bold text-graphite-900 mb-2.5 flex items-center justify-between">
          <span>Ціна (грн)</span>
        </h4>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input
            type="number"
            placeholder={facets.priceRange.min ? `від ${facets.priceRange.min}` : 'від 0'}
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            onBlur={applyPrice}
            onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
            className="w-full px-2.5 py-1.5 text-xs bg-graphite-50 border border-graphite-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <input
            type="number"
            placeholder={facets.priceRange.max ? `до ${facets.priceRange.max}` : 'до'}
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            onBlur={applyPrice}
            onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
            className="w-full px-2.5 py-1.5 text-xs bg-graphite-50 border border-graphite-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <button
          type="button"
          onClick={applyPrice}
          className="w-full py-1 text-xs font-semibold bg-graphite-100 hover:bg-graphite-200 text-graphite-700 rounded-lg transition-colors"
        >
          Застосувати ціну
        </button>
      </div>

      {/* Brands Filter */}
      {facets.brands.length > 0 && (
        <div className="pb-5 border-b border-graphite-200">
          <h4 className="font-bold text-graphite-900 mb-2.5">Бренд</h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {facets.brands.map((brand) => (
              <label
                key={brand}
                className="flex items-center gap-2.5 cursor-pointer text-xs hover:text-brand-600 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => toggleArrayParam('brand', brand)}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-graphite-300"
                />
                <span>{brand}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Nominal Power Filter */}
      <div className="pb-5 border-b border-graphite-200">
        <h4 className="font-bold text-graphite-900 mb-2.5">Номінальна потужність (кВт)</h4>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input
            type="number"
            step="0.1"
            placeholder="від кВт"
            value={powerMin}
            onChange={(e) => setPowerMin(e.target.value)}
            onBlur={applyPower}
            onKeyDown={(e) => e.key === 'Enter' && applyPower()}
            className="w-full px-2.5 py-1.5 text-xs bg-graphite-50 border border-graphite-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <input
            type="number"
            step="0.1"
            placeholder="до кВт"
            value={powerMax}
            onChange={(e) => setPowerMax(e.target.value)}
            onBlur={applyPower}
            onKeyDown={(e) => e.key === 'Enter' && applyPower()}
            className="w-full px-2.5 py-1.5 text-xs bg-graphite-50 border border-graphite-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <button
          type="button"
          onClick={applyPower}
          className="w-full py-1 text-xs font-semibold bg-graphite-100 hover:bg-graphite-200 text-graphite-700 rounded-lg transition-colors"
        >
          Застосувати потужність
        </button>
      </div>

      {/* Fuel Type */}
      <div className="pb-5 border-b border-graphite-200">
        <h4 className="font-bold text-graphite-900 mb-2.5">Паливо</h4>
        <div className="space-y-1.5">
          {[
            { id: 'PETROL', label: 'Бензин' },
            { id: 'DIESEL', label: 'Дизель' },
            { id: 'GAS', label: 'Газ' },
            { id: 'DUAL_FUEL', label: 'Бензин/газ (гібрид)' },
          ].map((f) => (
            <label
              key={f.id}
              className="flex items-center gap-2.5 cursor-pointer text-xs hover:text-brand-600 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedFuels.includes(f.id)}
                onChange={() => toggleArrayParam('fuel', f.id)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-graphite-300"
              />
              <span>{f.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Inverter */}
      <div className="pb-5 border-b border-graphite-200">
        <h4 className="font-bold text-graphite-900 mb-2.5">Інверторний</h4>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => updateParam('inverter', inverter === 'yes' ? null : 'yes')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              inverter === 'yes'
                ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                : 'bg-graphite-50 text-graphite-700 border-graphite-300 hover:bg-graphite-100'
            }`}
          >
            Так
          </button>
          <button
            type="button"
            onClick={() => updateParam('inverter', inverter === 'no' ? null : 'no')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              inverter === 'no'
                ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                : 'bg-graphite-50 text-graphite-700 border-graphite-300 hover:bg-graphite-100'
            }`}
          >
            Ні
          </button>
        </div>
      </div>

      {/* Phases */}
      <div className="pb-5 border-b border-graphite-200">
        <h4 className="font-bold text-graphite-900 mb-2.5">Кількість фаз</h4>
        <div className="space-y-1.5">
          {[
            { id: 'SINGLE', label: '1 фаза (230 В)' },
            { id: 'THREE', label: '3 фази (400 В)' },
            { id: 'SWITCH_1_3', label: 'Перемикання 1/3 фази' },
          ].map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-2.5 cursor-pointer text-xs hover:text-brand-600 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedPhases.includes(p.id)}
                onChange={() => toggleArrayParam('phase', p.id)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-graphite-300"
              />
              <span>{p.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Starting Method */}
      <div className="pb-5 border-b border-graphite-200">
        <h4 className="font-bold text-graphite-900 mb-2.5">Тип запуску</h4>
        <div className="space-y-1.5">
          {[
            { id: 'MANUAL', label: 'Ручний стартер' },
            { id: 'ELECTRIC', label: 'Електростартер (ключ/кнопка)' },
            { id: 'REMOTE', label: 'Дистанційний (пульт)' },
            { id: 'ATS', label: 'Автоматичний (ATS / АВР)' },
          ].map((s) => (
            <label
              key={s.id}
              className="flex items-center gap-2.5 cursor-pointer text-xs hover:text-brand-600 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedStarts.includes(s.id)}
                onChange={() => toggleArrayParam('start', s.id)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-graphite-300"
              />
              <span>{s.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Collapsible Additional Filters */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowAdditional(!showAdditional)}
          className="w-full flex items-center justify-between py-2 text-xs font-bold uppercase tracking-wider text-graphite-700 hover:text-brand-600 focus:outline-none"
        >
          <span>Додаткові характеристики</span>
          {showAdditional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdditional && (
          <div className="space-y-4 pt-3 border-t border-graphite-200 mt-2 animate-in fade-in duration-200">
            {/* Voltage */}
            <div>
              <h5 className="font-semibold text-xs text-graphite-800 mb-1.5">Вихідна напруга</h5>
              <div className="space-y-1">
                {['230V', '400V'].map((v) => (
                  <label key={v} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedVoltages.includes(v)}
                      onChange={() => toggleArrayParam('voltage', v)}
                      className="w-3.5 h-3.5 rounded text-brand-600"
                    />
                    <span>{v === '230V' ? '230 В (однофазна)' : '400 В (трифазна)'}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* AVR */}
            <div>
              <h5 className="font-semibold text-xs text-graphite-800 mb-1.5">
                AVR (автоматичне регулювання напруги)
              </h5>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateParam('avr', avr === 'yes' ? null : 'yes')}
                  className={`flex-1 py-1 text-xs rounded border ${
                    avr === 'yes' ? 'bg-brand-600 text-white border-brand-600' : 'bg-graphite-50 text-graphite-700'
                  }`}
                >
                  Так
                </button>
                <button
                  type="button"
                  onClick={() => updateParam('avr', avr === 'no' ? null : 'no')}
                  className={`flex-1 py-1 text-xs rounded border ${
                    avr === 'no' ? 'bg-brand-600 text-white border-brand-600' : 'bg-graphite-50 text-graphite-700'
                  }`}
                >
                  Ні
                </button>
              </div>
            </div>

            {/* ATS Compatible */}
            <div>
              <h5 className="font-semibold text-xs text-graphite-800 mb-1.5">
                Можливість підключення ATS / АВР
              </h5>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateParam('ats_compatible', atsCompatible === 'yes' ? null : 'yes')}
                  className={`flex-1 py-1 text-xs rounded border ${
                    atsCompatible === 'yes' ? 'bg-brand-600 text-white border-brand-600' : 'bg-graphite-50 text-graphite-700'
                  }`}
                >
                  Так
                </button>
                <button
                  type="button"
                  onClick={() => updateParam('ats_compatible', atsCompatible === 'no' ? null : 'no')}
                  className={`flex-1 py-1 text-xs rounded border ${
                    atsCompatible === 'no' ? 'bg-brand-600 text-white border-brand-600' : 'bg-graphite-50 text-graphite-700'
                  }`}
                >
                  Ні
                </button>
              </div>
            </div>

            {/* ATS Unit Included */}
            <div>
              <h5 className="font-semibold text-xs text-graphite-800 mb-1.5">
                Блок ATS / АВР у комплекті
              </h5>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateParam('ats_unit_included', atsUnitIncluded === 'yes' ? null : 'yes')}
                  className={`flex-1 py-1 text-xs rounded border ${
                    atsUnitIncluded === 'yes' ? 'bg-brand-600 text-white border-brand-600' : 'bg-graphite-50 text-graphite-700'
                  }`}
                >
                  Так
                </button>
                <button
                  type="button"
                  onClick={() => updateParam('ats_unit_included', atsUnitIncluded === 'no' ? null : 'no')}
                  className={`flex-1 py-1 text-xs rounded border ${
                    atsUnitIncluded === 'no' ? 'bg-brand-600 text-white border-brand-600' : 'bg-graphite-50 text-graphite-700'
                  }`}
                >
                  Ні
                </button>
              </div>
            </div>

            {/* Canopy */}
            <div>
              <h5 className="font-semibold text-xs text-graphite-800 mb-1.5">Шумоізоляційний кожух</h5>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateParam('canopy', canopy === 'yes' ? null : 'yes')}
                  className={`flex-1 py-1 text-xs rounded border ${
                    canopy === 'yes' ? 'bg-brand-600 text-white border-brand-600' : 'bg-graphite-50 text-graphite-700'
                  }`}
                >
                  Так
                </button>
                <button
                  type="button"
                  onClick={() => updateParam('canopy', canopy === 'no' ? null : 'no')}
                  className={`flex-1 py-1 text-xs rounded border ${
                    canopy === 'no' ? 'bg-brand-600 text-white border-brand-600' : 'bg-graphite-50 text-graphite-700'
                  }`}
                >
                  Ні
                </button>
              </div>
            </div>

            {/* Wheels */}
            <div>
              <h5 className="font-semibold text-xs text-graphite-800 mb-1.5">Колеса для транспортування</h5>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateParam('wheels', wheels === 'yes' ? null : 'yes')}
                  className={`flex-1 py-1 text-xs rounded border ${
                    wheels === 'yes' ? 'bg-brand-600 text-white border-brand-600' : 'bg-graphite-50 text-graphite-700'
                  }`}
                >
                  Так
                </button>
                <button
                  type="button"
                  onClick={() => updateParam('wheels', wheels === 'no' ? null : 'no')}
                  className={`flex-1 py-1 text-xs rounded border ${
                    wheels === 'no' ? 'bg-brand-600 text-white border-brand-600' : 'bg-graphite-50 text-graphite-700'
                  }`}
                >
                  Ні
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Trigger Button */}
      <div className="lg:hidden mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-graphite-900 text-white rounded-xl text-sm font-semibold shadow-md active:scale-95 transition-all"
        >
          <Filter className="w-4 h-4 text-brand-400" />
          <span>Фільтри</span>
          {activeFilterCount > 0 && (
            <span className="bg-brand-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={resetAllFilters}
            className="text-xs text-graphite-500 hover:text-brand-600 font-semibold"
          >
            Скинути фільтри
          </button>
        )}
      </div>

      {/* Desktop Sidebar Panel */}
      <aside className="hidden lg:block w-72 bg-white rounded-2xl border border-graphite-200 p-5 shadow-xs shrink-0 self-start sticky top-24">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-graphite-200">
          <div className="flex items-center gap-2 font-black text-graphite-900 uppercase tracking-wider text-xs">
            <Filter className="w-4 h-4 text-brand-600" />
            <span>Параметри підбору</span>
          </div>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs font-semibold text-brand-600 hover:text-brand-800"
            >
              Скинути
            </button>
          )}
        </div>
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-graphite-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Modal Panel */}
          <div className="relative ml-auto w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="px-5 py-4 border-b border-graphite-200 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-graphite-900">
                <Filter className="w-5 h-5 text-brand-600" />
                <span>Фільтри товарів</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="p-1 rounded-lg text-graphite-400 hover:text-graphite-700 hover:bg-graphite-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 overflow-y-auto flex-1">{content}</div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-graphite-200 bg-graphite-50 flex gap-3">
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex-1 py-2.5 text-xs font-semibold text-graphite-700 bg-white border border-graphite-300 rounded-xl hover:bg-graphite-100"
              >
                Скинути
              </button>
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm"
              >
                Застосувати
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
