'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Truck,
  Store,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  ArrowLeft,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { useCart } from '@/components/CartContext';
import { DeliveryMethod } from '@/types';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, totalItems, totalAmountKop } = useCart();

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('NOVA_POSHTA_BRANCH');
  const [settlement, setSettlement] = useState('');
  const [settlementRef, setSettlementRef] = useState('');
  const [branchOrAddress, setBranchOrAddress] = useState('');
  const [branchRef, setBranchRef] = useState('');
  const [comment, setComment] = useState('');

  // Nova Poshta Autocomplete State
  const [settlementSuggestions, setSettlementSuggestions] = useState<any[]>([]);
  const [isSearchingSettlements, setIsSearchingSettlements] = useState(false);
  const [warehouseList, setWarehouseList] = useState<any[]>([]);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const [npConfigured, setNpConfigured] = useState<boolean | null>(null);
  const [selectedWarehouseWarning, setSelectedWarehouseWarning] = useState<string | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<{
    orderNumber: string;
    totalAmountKop: number;
  } | null>(null);

  // Calculate total order weight for Nova Poshta branch limit check
  const totalShippingWeightKg = items.reduce((sum, item) => {
    const weight = item.product.shipping_weight_kg || item.product.net_weight_kg || 0;
    return sum + weight * item.quantity;
  }, 0);

  // Search settlements with debounce
  useEffect(() => {
    if (!settlement || settlement.length < 2 || settlementRef) {
      setSettlementSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingSettlements(true);
      try {
        const res = await fetch(`/api/novaposhta/settlements?q=${encodeURIComponent(settlement)}`);
        const data = await res.json();
        setNpConfigured(data.configured);
        if (data.configured && Array.isArray(data.items)) {
          setSettlementSuggestions(data.items);
        } else {
          setSettlementSuggestions([]);
        }
      } catch {
        setSettlementSuggestions([]);
      } finally {
        setIsSearchingSettlements(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [settlement, settlementRef]);

  // Load warehouses when settlementRef is selected
  useEffect(() => {
    if (!settlementRef || deliveryMethod !== 'NOVA_POSHTA_BRANCH') {
      setWarehouseList([]);
      return;
    }

    async function loadWhs() {
      setIsLoadingWarehouses(true);
      try {
        const res = await fetch(
          `/api/novaposhta/warehouses?cityRef=${encodeURIComponent(settlementRef)}&weight=${totalShippingWeightKg}`
        );
        const data = await res.json();
        if (data.configured && Array.isArray(data.items)) {
          setWarehouseList(data.items);
        } else {
          setWarehouseList([]);
        }
      } catch {
        setWarehouseList([]);
      } finally {
        setIsLoadingWarehouses(false);
      }
    }
    loadWhs();
  }, [settlementRef, deliveryMethod, totalShippingWeightKg]);

  const selectSettlement = (item: any) => {
    setSettlement(item.name);
    setSettlementRef(item.ref);
    setSettlementSuggestions([]);
    setBranchOrAddress('');
    setBranchRef('');
  };

  const handleWarehouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ref = e.target.value;
    const wh = warehouseList.find((w) => w.ref === ref);
    if (wh) {
      setBranchRef(wh.ref);
      setBranchOrAddress(wh.name);
      setSelectedWarehouseWarning(wh.warningMessage || null);
    } else {
      setBranchRef('');
      setBranchOrAddress('');
      setSelectedWarehouseWarning(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (items.length === 0) {
      setErrorMessage('Кошик порожній.');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('Вкажіть ваше ім’я та прізвище.');
      return;
    }

    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^(\+?380|0)\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setErrorMessage('Введіть дійсний номер телефону (+380XXXXXXXXX або 0XXXXXXXXX).');
      return;
    }

    if (!settlement.trim() || !branchOrAddress.trim()) {
      setErrorMessage('Вкажіть населений пункт та відділення/адресу доставки.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate client-side idempotency key based on form data & timestamp to prevent double submits
      const idempotencyKey = `ord_${cleanPhone}_${totalAmountKop}_${Date.now()}`;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          customer_first_name: firstName.trim(),
          customer_last_name: lastName.trim(),
          customer_phone: cleanPhone,
          customer_email: email.trim() || null,
          delivery_method: deliveryMethod,
          settlement: settlement.trim(),
          settlement_ref: settlementRef || null,
          branch_or_address: branchOrAddress.trim(),
          branch_ref: branchRef || null,
          delivery_requires_verification: !npConfigured || Boolean(selectedWarehouseWarning),
          delivery_verification_reason: selectedWarehouseWarning || (!npConfigured ? 'Ручне введення адреси без API' : null),
          comment: comment.trim() || null,
          items: items.map((i) => ({
            product_id: i.product.id,
            quantity: i.quantity,
            expected_price_kop: i.product.price_kop,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error(data.error || 'Ціна змінилася під час замовлення.');
        }
        throw new Error(data.error || 'Не вдалося оформити замовлення.');
      }

      setSuccessOrder({
        orderNumber: data.order_number,
        totalAmountKop: data.total_amount_kop,
      });

      clearCart();
    } catch (err: any) {
      setErrorMessage(err.message || 'Сталася помилка. Перевірте введені дані.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalUah = (totalAmountKop / 100).toLocaleString('uk-UA', { minimumFractionDigits: 0 });

  if (successOrder) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl border border-graphite-200 p-8 sm:p-14 shadow-lg space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600">
              Дякуємо за покупку!
            </span>
            <h1 className="text-3xl font-black text-graphite-950">
              Замовлення №{successOrder.orderNumber}
            </h1>
            <p className="text-sm font-semibold text-graphite-600">
              Сума замовлення: {(successOrder.totalAmountKop / 100).toLocaleString('uk-UA')} грн
            </p>
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-sm max-w-lg mx-auto leading-relaxed">
            Замовлення отримано. Менеджер зв’яжеться з вами для підтвердження.
          </div>

          <p className="text-xs text-graphite-500 max-w-md mx-auto">
            Оплата здійснюється післяплатою після огляду товару у відділенні або кур’єру.
          </p>

          <div className="pt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-graphite-900 hover:bg-graphite-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Повернутися до магазину
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl border border-graphite-200 p-10 shadow-xs">
          <h2 className="text-xl font-black text-graphite-900 mb-3">Кошик порожній</h2>
          <p className="text-xs text-graphite-500 mb-6">Додайте генератор перед оформленням.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl"
          >
            До каталогу
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="pb-6 mb-8 border-b border-graphite-200">
        <Link href="/cart" className="inline-flex items-center gap-1.5 text-xs font-semibold text-graphite-500 hover:text-brand-600 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Назад до кошика
        </Link>
        <h1 className="text-3xl font-black text-graphite-950 tracking-tight">Оформлення замовлення</h1>
        <p className="text-xs text-graphite-500 mt-1">
          Швидке оформлення без необхідності реєстрації
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left: Customer & Delivery Details */}
          <div className="lg:col-span-7 space-y-8">
            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Block 1: Контактні дані */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-graphite-200 shadow-xs space-y-5">
              <h2 className="text-base font-bold text-graphite-950 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-500 text-white text-xs font-black flex items-center justify-center">1</span>
                Контактні дані покупця
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="checkout-first-name" className="block text-xs font-semibold text-graphite-700 mb-1">
                    Ім’я *
                  </label>
                  <input
                    id="checkout-first-name"
                    name="given-name"
                    autoComplete="given-name"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Тарас"
                    className="w-full px-3.5 py-2.5 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-last-name" className="block text-xs font-semibold text-graphite-700 mb-1">
                    Прізвище *
                  </label>
                  <input
                    id="checkout-last-name"
                    name="family-name"
                    autoComplete="family-name"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Шевченко"
                    className="w-full px-3.5 py-2.5 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="checkout-phone" className="block text-xs font-semibold text-graphite-700 mb-1">
                  Номер телефону *
                </label>
                <input
                  id="checkout-phone"
                  name="tel"
                  autoComplete="tel"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+380 50 123 45 67"
                  className="w-full px-3.5 py-2.5 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
                <p className="text-[11px] text-graphite-500 mt-1">
                  Для підтвердження замовлення та доставки
                </p>
              </div>

              <div>
                <label htmlFor="checkout-email" className="block text-xs font-semibold text-graphite-700 mb-1">
                  Електронна пошта (необов’язково)
                </label>
                <input
                  id="checkout-email"
                  name="email"
                  autoComplete="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="taras@example.ua"
                  className="w-full px-3.5 py-2.5 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Block 2: Доставка */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-graphite-200 shadow-xs space-y-5">
              <h2 className="text-base font-bold text-graphite-950 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-500 text-white text-xs font-black flex items-center justify-center">2</span>
                Спосіб доставки
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('NOVA_POSHTA_BRANCH')}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    deliveryMethod === 'NOVA_POSHTA_BRANCH'
                      ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/30'
                      : 'border-graphite-200 hover:border-graphite-300 bg-white'
                  }`}
                >
                  <Truck className="w-5 h-5 text-brand-600 mb-2" />
                  <div>
                    <span className="font-bold text-xs text-graphite-900 block">Нова пошта</span>
                    <span className="text-[11px] text-graphite-500">У вантажне або стандартне відділення</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMethod('COURIER')}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    deliveryMethod === 'COURIER'
                      ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/30'
                      : 'border-graphite-200 hover:border-graphite-300 bg-white'
                  }`}
                >
                  <MapPin className="w-5 h-5 text-brand-600 mb-2" />
                  <div>
                    <span className="font-bold text-xs text-graphite-900 block">Кур’єрська доставка</span>
                    <span className="text-[11px] text-graphite-500">За адресою замовника</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMethod('PICKUP')}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    deliveryMethod === 'PICKUP'
                      ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/30'
                      : 'border-graphite-200 hover:border-graphite-300 bg-white'
                  }`}
                >
                  <Store className="w-5 h-5 text-brand-600 mb-2" />
                  <div>
                    <span className="font-bold text-xs text-graphite-900 block">Самовивіз</span>
                    <span className="text-[11px] text-graphite-500">Зі складу або магазину</span>
                  </div>
                </button>
              </div>

              {/* Settlement Input with Autocomplete */}
              <div className="relative">
                <label className="block text-xs font-semibold text-graphite-700 mb-1">
                  Населений пункт *
                </label>
                <input
                  type="text"
                  required
                  value={settlement}
                  onChange={(e) => {
                    setSettlement(e.target.value);
                    setSettlementRef('');
                  }}
                  placeholder="Введіть місто чи смт (наприклад, Київ, Львів, Одеса...)"
                  className="w-full px-3.5 py-2.5 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {isSearchingSettlements && (
                  <Loader2 className="w-4 h-4 animate-spin text-graphite-400 absolute right-3 top-8" />
                )}

                {/* Suggestions dropdown */}
                {settlementSuggestions.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-graphite-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                    {settlementSuggestions.map((item) => (
                      <button
                        type="button"
                        key={item.ref}
                        onClick={() => selectSettlement(item)}
                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-brand-50 hover:text-brand-900 border-b border-graphite-100 last:border-b-0"
                      >
                        <span className="font-bold">{item.name}</span>
                        {item.region && <span className="text-graphite-400 ml-1">({item.region})</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Branch / Address Selector */}
              {deliveryMethod === 'NOVA_POSHTA_BRANCH' ? (
                <div>
                  <label className="block text-xs font-semibold text-graphite-700 mb-1">
                    Відділення Нової пошти *
                  </label>
                  {warehouseList.length > 0 ? (
                    <select
                      required
                      value={branchRef}
                      onChange={handleWarehouseChange}
                      className="w-full px-3.5 py-2.5 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                    >
                      <option value="">Оберіть відділення...</option>
                      {warehouseList.map((wh) => (
                        <option key={wh.ref} value={wh.ref} disabled={!wh.isCompatible}>
                          {wh.name} {wh.maxWeightAllowed > 0 ? `(до ${wh.maxWeightAllowed} кг)` : '(без обмеження ваги)'} {!wh.isCompatible ? '— НЕСУМІСНЕ З ВАГОЮ' : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={branchOrAddress}
                      onChange={(e) => setBranchOrAddress(e.target.value)}
                      placeholder="Введіть номер відділення (наприклад: Відділення №1, вантажне)"
                      className="w-full px-3.5 py-2.5 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  )}

                  {selectedWarehouseWarning && (
                    <p className="text-[11px] text-amber-700 mt-1.5 flex items-center gap-1 font-medium bg-amber-50 p-2 rounded-lg border border-amber-200">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {selectedWarehouseWarning}
                    </p>
                  )}
                </div>
              ) : deliveryMethod === 'COURIER' ? (
                <div>
                  <label className="block text-xs font-semibold text-graphite-700 mb-1">
                    Адреса доставки (вулиця, будинок, квартира) *
                  </label>
                  <input
                    type="text"
                    required
                    value={branchOrAddress}
                    onChange={(e) => setBranchOrAddress(e.target.value)}
                    placeholder="вул. Незалежності, 15, кв. 42"
                    className="w-full px-3.5 py-2.5 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              ) : (
                <div className="p-3.5 bg-brand-50/50 border border-brand-200 rounded-2xl text-xs text-brand-900 space-y-1">
                  <strong>Адреса точки самовивозу:</strong>
                  <p>м. Київ, вул. Енергетиків, 10 (Пн-Сб: 09:00 - 19:00)</p>
                  <p className="text-[11px] text-brand-700">
                    Замовлення буде готове до видачі після дзвінка менеджера.
                  </p>
                </div>
              )}

              {/* Delivery cost note */}
              <div className="flex items-start gap-2 p-3 bg-graphite-50 rounded-xl border border-graphite-200 text-[11px] text-graphite-600">
                <Info className="w-4 h-4 text-graphite-400 shrink-0 mt-0.5" />
                <span>
                  Вартість доставки: <strong>За тарифами перевізника, оплачується окремо</strong> при отриманні посилки.
                </span>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-xs font-semibold text-graphite-700 mb-1">
                  Коментар до замовлення (необов’язково)
                </label>
                <textarea
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Додаткові побажання, бажаний час дзвінка тощо..."
                  className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Block 3: Оплата */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-graphite-200 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-graphite-950 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-500 text-white text-xs font-black flex items-center justify-center">3</span>
                Спосіб оплати
              </h2>

              <div className="p-4 rounded-2xl border-2 border-brand-500 bg-brand-50/30 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-xs text-graphite-950 block">
                    Післяплата після підтвердження менеджером
                  </span>
                  <p className="text-[11px] text-graphite-600 mt-0.5 leading-relaxed">
                    Оплата готівкою або карткою при отриманні у відділенні або кур’єру після перевірки комплектності та цілісності товару.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order Composition & Confirmation */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl border border-graphite-200 p-6 sm:p-7 shadow-xs space-y-6 sticky top-24">
              <h2 className="text-base font-bold text-graphite-950 pb-3 border-b border-graphite-200">
                Склад замовлення ({totalItems})
              </h2>

              {/* Items List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-graphite-100">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="pt-3 first:pt-0 flex items-center gap-3">
                    <div className="relative w-12 h-12 bg-graphite-50 rounded-lg overflow-hidden shrink-0 border border-graphite-100">
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          sizes="48px"
                          className="object-contain p-1"
                        />
                      ) : (
                        <Zap className="w-6 h-6 m-auto text-graphite-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-graphite-900 truncate">{product.name}</div>
                      <div className="text-[11px] text-graphite-500">
                        {quantity} шт. × {(product.price_kop / 100).toLocaleString('uk-UA')} ₴
                      </div>
                    </div>
                    <div className="text-xs font-black text-graphite-950 shrink-0">
                      {((product.price_kop * quantity) / 100).toLocaleString('uk-UA')} ₴
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Calculation */}
              <div className="pt-4 border-t border-graphite-200 space-y-2 text-xs">
                <div className="flex justify-between text-graphite-600">
                  <span>Вартість товарів:</span>
                  <span className="font-bold text-graphite-900">{totalUah} ₴</span>
                </div>
                <div className="flex justify-between text-graphite-600">
                  <span>Доставка:</span>
                  <span className="text-graphite-500">За тарифами перевізника</span>
                </div>
                <div className="pt-3 border-t border-graphite-200 flex items-baseline justify-between">
                  <span className="text-sm font-bold text-graphite-900">Разом до сплати:</span>
                  <span className="text-2xl font-black text-brand-600">{totalUah} ₴</span>
                </div>
              </div>

              {/* Legal Links & Notice */}
              <p className="text-[11px] text-graphite-500 leading-relaxed">
                Натискаючи кнопку, ви погоджуєтеся з{' '}
                <Link href="/terms" target="_blank" className="underline text-brand-600 hover:text-brand-800">
                  умовами покупки
                </Link>{' '}
                та надаєте згоду на{' '}
                <Link href="/privacy" target="_blank" className="underline text-brand-600 hover:text-brand-800">
                  обробку персональних даних
                </Link>.
              </p>

              {/* Confirm Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-brand-600 hover:bg-brand-700 disabled:bg-graphite-400 text-white font-black text-sm rounded-xl shadow-md shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Створення замовлення...</span>
                  </>
                ) : (
                  <span>Підтвердити замовлення</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}
