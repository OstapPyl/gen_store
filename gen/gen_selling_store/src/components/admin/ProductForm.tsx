'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Upload,
  X,
  Plus,
  Loader2,
  AlertCircle,
  FileText,
  Star,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Product, TriState, FuelType, PhaseType, StartMethod } from '@/types';

interface ProductFormProps {
  initialProduct?: Product;
}

export default function ProductForm({ initialProduct }: ProductFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialProduct);

  // Form State
  const [name, setName] = useState(initialProduct?.name || '');
  const [brand, setBrand] = useState(initialProduct?.brand || '');
  const [model, setModel] = useState(initialProduct?.model || '');
  const [sku, setSku] = useState(initialProduct?.sku || '');
  const [slug, setSlug] = useState(initialProduct?.slug || '');
  const [priceUah, setPriceUah] = useState(
    initialProduct ? (initialProduct.price_kop / 100).toString() : ''
  );
  const [stock, setStock] = useState(initialProduct ? initialProduct.stock.toString() : '0');
  const [availabilityStatus, setAvailabilityStatus] = useState(
    initialProduct?.availability_status || 'IN_STOCK'
  );
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>(
    initialProduct?.status || 'DRAFT'
  );
  const [shortDescription, setShortDescription] = useState(
    initialProduct?.short_description || ''
  );
  const [fullDescription, setFullDescription] = useState(
    initialProduct?.full_description || ''
  );

  // Images & Manual
  const [images, setImages] = useState<string[]>(initialProduct?.images || []);
  const [pdfManualUrl, setPdfManualUrl] = useState<string | null>(
    initialProduct?.pdf_manual_url || null
  );

  // Power & Specs
  const [nominalPowerKw, setNominalPowerKw] = useState(
    initialProduct ? initialProduct.nominal_power_kw.toString() : ''
  );
  const [maxPowerKw, setMaxPowerKw] = useState(
    initialProduct?.max_power_kw != null ? initialProduct.max_power_kw.toString() : ''
  );
  const [fuelType, setFuelType] = useState<FuelType>(
    initialProduct?.fuel_type || 'PETROL'
  );
  const [nominalPowerPetrolKw, setNominalPowerPetrolKw] = useState(
    initialProduct?.nominal_power_petrol_kw != null ? initialProduct.nominal_power_petrol_kw.toString() : ''
  );
  const [maxPowerPetrolKw, setMaxPowerPetrolKw] = useState(
    initialProduct?.max_power_petrol_kw != null ? initialProduct.max_power_petrol_kw.toString() : ''
  );
  const [nominalPowerGasKw, setNominalPowerGasKw] = useState(
    initialProduct?.nominal_power_gas_kw != null ? initialProduct.nominal_power_gas_kw.toString() : ''
  );
  const [maxPowerGasKw, setMaxPowerGasKw] = useState(
    initialProduct?.max_power_gas_kw != null ? initialProduct.max_power_gas_kw.toString() : ''
  );
  const [isInverter, setIsInverter] = useState(initialProduct?.is_inverter || false);
  const [phaseType, setPhaseType] = useState<PhaseType>(
    initialProduct?.phase_type || 'SINGLE'
  );
  const [voltage, setVoltage] = useState<string[]>(initialProduct?.voltage || ['230V']);
  const [startingMethods, setStartingMethods] = useState<StartMethod[]>(
    initialProduct?.starting_methods || ['MANUAL']
  );

  // Additional Specs
  const [alternatorType, setAlternatorType] = useState(initialProduct?.alternator_type || '');
  const [hasAvr, setHasAvr] = useState<TriState>(initialProduct?.has_avr || 'UNKNOWN');
  const [atsCompatible, setAtsCompatible] = useState<TriState>(
    initialProduct?.ats_compatible || 'UNKNOWN'
  );
  const [atsUnitIncluded, setAtsUnitIncluded] = useState<TriState>(
    initialProduct?.ats_unit_included || 'UNKNOWN'
  );
  const [fuelTankCapacityL, setFuelTankCapacityL] = useState(
    initialProduct?.fuel_tank_capacity_l != null ? initialProduct.fuel_tank_capacity_l.toString() : ''
  );
  const [fuelConsumptionLh, setFuelConsumptionLh] = useState(
    initialProduct?.fuel_consumption_lh != null ? initialProduct.fuel_consumption_lh.toString() : ''
  );
  const [fuelConsumptionLoadPct, setFuelConsumptionLoadPct] = useState(
    initialProduct?.fuel_consumption_load_pct != null ? initialProduct.fuel_consumption_load_pct.toString() : ''
  );
  const [autonomyHours, setAutonomyHours] = useState(
    initialProduct?.autonomy_hours != null ? initialProduct.autonomy_hours.toString() : ''
  );
  const [autonomyLoadPct, setAutonomyLoadPct] = useState(
    initialProduct?.autonomy_load_pct != null ? initialProduct.autonomy_load_pct.toString() : ''
  );
  const [noiseLevelDb, setNoiseLevelDb] = useState(
    initialProduct?.noise_level_db != null ? initialProduct.noise_level_db.toString() : ''
  );
  const [noiseConditions, setNoiseConditions] = useState(
    initialProduct?.noise_measurement_conditions || ''
  );
  const [engineSpecs, setEngineSpecs] = useState(initialProduct?.engine_specs || '');
  const [sockets, setSockets] = useState(initialProduct?.sockets || '');
  const [netWeightKg, setNetWeightKg] = useState(
    initialProduct?.net_weight_kg != null ? initialProduct.net_weight_kg.toString() : ''
  );
  const [dimensionsMm, setDimensionsMm] = useState(initialProduct?.dimensions_mm || '');
  const [shippingWeightKg, setShippingWeightKg] = useState(
    initialProduct?.shipping_weight_kg != null ? initialProduct.shipping_weight_kg.toString() : ''
  );
  const [shippingDimensionsMm, setShippingDimensionsMm] = useState(
    initialProduct?.shipping_dimensions_mm || ''
  );
  const [hasWheels, setHasWheels] = useState<TriState>(initialProduct?.has_wheels || 'UNKNOWN');
  const [hasHandles, setHasHandles] = useState<TriState>(initialProduct?.has_handles || 'UNKNOWN');
  const [hasNoiseCanopy, setHasNoiseCanopy] = useState<TriState>(
    initialProduct?.has_noise_canopy || 'UNKNOWN'
  );
  const [warrantyMonths, setWarrantyMonths] = useState(
    initialProduct?.warranty_months != null ? initialProduct.warranty_months.toString() : ''
  );
  const [includedAccessories, setIncludedAccessories] = useState(
    initialProduct?.included_accessories || ''
  );
  const [seoTitle, setSeoTitle] = useState(initialProduct?.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(initialProduct?.seo_description || '');

  // Loading & error handling
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Voltage toggle
  const toggleVoltage = (val: string) => {
    if (voltage.includes(val)) {
      if (voltage.length > 1) {
        setVoltage(voltage.filter((v) => v !== val));
      }
    } else {
      setVoltage([...voltage, val]);
    }
  };

  // Start method toggle
  const toggleStart = (val: StartMethod) => {
    if (startingMethods.includes(val)) {
      if (startingMethods.length > 1) {
        setStartingMethods(startingMethods.filter((m) => m !== val));
      }
    } else {
      setStartingMethods([...startingMethods, val]);
    }
  };

  // Handle Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    setErrorMessage(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', 'images');

        const res = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Помилка завантаження фото.');
        }

        setImages((prev) => [...prev, data.file.url]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Не вдалося завантажити зображення.');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  // Handle PDF Upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPdf(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'manuals');

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Помилка завантаження PDF.');
      }

      setPdfManualUrl(data.file.url);
    } catch (err: any) {
      setErrorMessage(err.message || 'Не вдалося завантажити інструкцію.');
    } finally {
      setIsUploadingPdf(false);
      e.target.value = '';
    }
  };

  // Image actions: set main (index 0), remove
  const setAsMainImage = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Form Submit
  const handleSubmit = async (targetStatus?: 'DRAFT' | 'PUBLISHED') => {
    setErrorMessage(null);
    const finalStatus = targetStatus || status;

    if (!name.trim() || !brand.trim() || !model.trim() || !sku.trim()) {
      setErrorMessage('Вкажіть назву, бренд, модель та артикул.');
      return;
    }

    const price = Number(priceUah);
    if (isNaN(price) || price <= 0) {
      setErrorMessage('Ціна повинна бути більшою за нуль.');
      return;
    }

    const nomPower = Number(nominalPowerKw);
    if (isNaN(nomPower) || nomPower <= 0) {
      setErrorMessage('Номінальна потужність має бути більшою за 0 кВт.');
      return;
    }

    const maxPower = maxPowerKw ? Number(maxPowerKw) : null;
    if (maxPower != null && maxPower < nomPower) {
      setErrorMessage('Максимальна потужність не може бути меншою за номінальну.');
      return;
    }

    if (finalStatus === 'PUBLISHED') {
      if (!shortDescription.trim()) {
        setErrorMessage('Для публікації товару обов’язковий короткий опис.');
        return;
      }
      if (images.length === 0) {
        setErrorMessage('Для публікації товару завантажте хоча б одне фото.');
        return;
      }
      if (voltage.length === 0) {
        setErrorMessage('Вкажіть вихідну напругу.');
        return;
      }
      if (startingMethods.length === 0) {
        setErrorMessage('Вкажіть спосіб запуску.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        brand: brand.trim(),
        model: model.trim(),
        sku: sku.trim(),
        slug: slug.trim() || undefined,
        price_uah: price,
        stock: Math.max(0, parseInt(stock) || 0),
        availability_status: availabilityStatus,
        status: finalStatus,
        short_description: shortDescription.trim(),
        full_description: fullDescription.trim() || null,
        images,
        pdf_manual_url: pdfManualUrl,
        nominal_power_kw: nomPower,
        max_power_kw: maxPower,
        fuel_type: fuelType,
        nominal_power_petrol_kw: nominalPowerPetrolKw ? Number(nominalPowerPetrolKw) : null,
        max_power_petrol_kw: maxPowerPetrolKw ? Number(maxPowerPetrolKw) : null,
        nominal_power_gas_kw: nominalPowerGasKw ? Number(nominalPowerGasKw) : null,
        max_power_gas_kw: maxPowerGasKw ? Number(maxPowerGasKw) : null,
        is_inverter: isInverter,
        phase_type: phaseType,
        voltage,
        starting_methods: startingMethods,
        alternator_type: alternatorType.trim() || null,
        has_avr: hasAvr,
        ats_compatible: atsCompatible,
        ats_unit_included: atsUnitIncluded,
        fuel_tank_capacity_l: fuelTankCapacityL ? Number(fuelTankCapacityL) : null,
        fuel_consumption_lh: fuelConsumptionLh ? Number(fuelConsumptionLh) : null,
        fuel_consumption_load_pct: fuelConsumptionLoadPct ? parseInt(fuelConsumptionLoadPct) : null,
        autonomy_hours: autonomyHours ? Number(autonomyHours) : null,
        autonomy_load_pct: autonomyLoadPct ? parseInt(autonomyLoadPct) : null,
        noise_level_db: noiseLevelDb ? Number(noiseLevelDb) : null,
        noise_measurement_conditions: noiseConditions.trim() || null,
        engine_specs: engineSpecs.trim() || null,
        sockets: sockets.trim() || null,
        net_weight_kg: netWeightKg ? Number(netWeightKg) : null,
        dimensions_mm: dimensionsMm.trim() || null,
        shipping_weight_kg: shippingWeightKg ? Number(shippingWeightKg) : null,
        shipping_dimensions_mm: shippingDimensionsMm.trim() || null,
        has_wheels: hasWheels,
        has_handles: hasHandles,
        has_noise_canopy: hasNoiseCanopy,
        warranty_months: warrantyMonths ? parseInt(warrantyMonths) : null,
        included_accessories: includedAccessories.trim() || null,
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
      };

      const url = isEditing && initialProduct ? `/api/admin/products/${initialProduct.id}` : '/api/admin/products';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Помилка під час збереження товару.');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Не вдалося зберегти товар.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Main Info */}
      <section className="bg-white rounded-3xl border border-graphite-200 p-6 sm:p-8 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-graphite-950 pb-2 border-b border-graphite-100">
          Основна інформація про генератор
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-graphite-700 mb-1">
              Назва товару *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Генератор бензиновий Konner & Sohnen KS 7000E"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">
              Унікальний артикул (SKU) *
            </label>
            <input
              type="text"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="KS-7000E-01"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">Бренд *</label>
            <input
              type="text"
              required
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Konner & Sohnen, Daewoo, Hyundai, Honda..."
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">Модель *</label>
            <input
              type="text"
              required
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="KS 7000E"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">
              URL Slug (необов’язково)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="konner-sohnen-ks-7000e"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">Ціна (грн) *</label>
            <input
              type="number"
              step="1"
              required
              value={priceUah}
              onChange={(e) => setPriceUah(e.target.value)}
              placeholder="35000"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">Залишок (шт.) *</label>
            <input
              type="number"
              min="0"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="5"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">Статус наявності *</label>
            <select
              value={availabilityStatus}
              onChange={(e) => setAvailabilityStatus(e.target.value as any)}
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="IN_STOCK">В наявності</option>
              <option value="WAITING">Очікується</option>
              <option value="OUT_OF_STOCK">Немає в наявності</option>
            </select>
          </div>
        </div>
      </section>

      {/* Media Upload */}
      <section className="bg-white rounded-3xl border border-graphite-200 p-6 sm:p-8 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-graphite-950 pb-2 border-b border-graphite-100 flex items-center justify-between">
          <span>Фотографії генератора</span>
          <span className="text-xs font-normal text-graphite-400">
            Перше фото — головне у каталозі
          </span>
        </h2>

        {/* Photos Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {images.map((url, idx) => (
            <div
              key={url}
              className={`relative aspect-square rounded-2xl border-2 overflow-hidden bg-graphite-50 group ${
                idx === 0 ? 'border-brand-500 shadow-sm' : 'border-graphite-200'
              }`}
            >
              <Image
                src={url}
                alt={`Фото ${idx + 1}`}
                fill
                sizes="150px"
                className="object-contain p-2"
              />

              {idx === 0 && (
                <span className="absolute top-1.5 left-1.5 bg-brand-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-current" /> Головне
                </span>
              )}

              <div className="absolute inset-0 bg-graphite-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => setAsMainImage(idx)}
                    title="Зробити головним"
                    className="p-1.5 bg-white text-graphite-900 rounded-lg hover:bg-brand-50 hover:text-brand-600 text-xs shadow-xs"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  title="Видалити"
                  className="p-1.5 bg-white text-rose-600 rounded-lg hover:bg-rose-50 text-xs shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Upload Button */}
          <label className="aspect-square rounded-2xl border-2 border-dashed border-graphite-300 hover:border-brand-500 bg-graphite-50/50 hover:bg-brand-50/30 flex flex-col items-center justify-center cursor-pointer transition-colors p-2 text-center">
            {isUploadingImage ? (
              <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
            ) : (
              <>
                <Upload className="w-6 h-6 text-graphite-400 mb-1" />
                <span className="text-[11px] font-bold text-graphite-700">Додати фото</span>
                <span className="text-[9px] text-graphite-400">JPEG, PNG, WebP</span>
              </>
            )}
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              disabled={isUploadingImage}
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* PDF Manual Upload */}
        <div className="pt-4 border-t border-graphite-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <label className="block text-xs font-bold text-graphite-900">
              Інструкція користувача (PDF)
            </label>
            <p className="text-[11px] text-graphite-500">
              Завантажте PDF-паспорт для перегляду покупцями
            </p>
          </div>

          <div className="flex items-center gap-3">
            {pdfManualUrl ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-200 rounded-xl text-xs font-semibold text-brand-900">
                <FileText className="w-4 h-4 text-brand-600" />
                <a href={pdfManualUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  Інструкція прикріплена
                </a>
                <button
                  type="button"
                  onClick={() => setPdfManualUrl(null)}
                  className="text-rose-600 hover:text-rose-800 ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="px-4 py-2 bg-graphite-100 hover:bg-graphite-200 text-graphite-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5">
                {isUploadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>Завантажити PDF</span>
                <input
                  type="file"
                  accept="application/pdf"
                  disabled={isUploadingPdf}
                  onChange={handlePdfUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      </section>

      {/* Primary Technical Specs */}
      <section className="bg-white rounded-3xl border border-graphite-200 p-6 sm:p-8 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-graphite-950 pb-2 border-b border-graphite-100">
          Основні технічні параметри (фільтри)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">
              Номінальна потужність, кВт *
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={nominalPowerKw}
              onChange={(e) => setNominalPowerKw(e.target.value)}
              placeholder="5.0"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">
              Максимальна потужність, кВт
            </label>
            <input
              type="number"
              step="0.1"
              value={maxPowerKw}
              onChange={(e) => setMaxPowerKw(e.target.value)}
              placeholder="5.5"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">
              Вид палива *
            </label>
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value as FuelType)}
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer font-semibold"
            >
              <option value="PETROL">Бензин</option>
              <option value="DIESEL">Дизель</option>
              <option value="GAS">Газ</option>
              <option value="DUAL_FUEL">Бензин/газ (гібрид)</option>
            </select>
          </div>
        </div>

        {/* Dual Fuel Specific Inputs */}
        {fuelType === 'DUAL_FUEL' && (
          <div className="p-4 bg-brand-50/40 rounded-2xl border border-brand-200 space-y-3">
            <h4 className="text-xs font-bold text-brand-900">Потужність для кожного виду палива</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-graphite-700 mb-1">Ном. на бензині (кВт)</label>
                <input
                  type="number"
                  step="0.1"
                  value={nominalPowerPetrolKw}
                  onChange={(e) => setNominalPowerPetrolKw(e.target.value)}
                  placeholder="5.0"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-graphite-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-graphite-700 mb-1">Макс. на бензині (кВт)</label>
                <input
                  type="number"
                  step="0.1"
                  value={maxPowerPetrolKw}
                  onChange={(e) => setMaxPowerPetrolKw(e.target.value)}
                  placeholder="5.5"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-graphite-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-graphite-700 mb-1">Ном. на газі (кВт)</label>
                <input
                  type="number"
                  step="0.1"
                  value={nominalPowerGasKw}
                  onChange={(e) => setNominalPowerGasKw(e.target.value)}
                  placeholder="4.5"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-graphite-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-graphite-700 mb-1">Макс. на газі (кВт)</label>
                <input
                  type="number"
                  step="0.1"
                  value={maxPowerGasKw}
                  onChange={(e) => setMaxPowerGasKw(e.target.value)}
                  placeholder="5.0"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-graphite-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">Кількість фаз *</label>
            <select
              value={phaseType}
              onChange={(e) => setPhaseType(e.target.value as PhaseType)}
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="SINGLE">1 фаза (230 В)</option>
              <option value="THREE">3 фази (400 В)</option>
              <option value="SWITCH_1_3">Перемикання 1 / 3 фази</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">
              Інверторний генератор
            </label>
            <div className="flex gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setIsInverter(true)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                  isInverter
                    ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                    : 'bg-graphite-50 text-graphite-700 border-graphite-300'
                }`}
              >
                Так
              </button>
              <button
                type="button"
                onClick={() => setIsInverter(false)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                  !isInverter
                    ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                    : 'bg-graphite-50 text-graphite-700 border-graphite-300'
                }`}
              >
                Ні
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">
              Вихідна напруга (може бути декілька) *
            </label>
            <div className="flex gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => toggleVoltage('230V')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                  voltage.includes('230V')
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-graphite-50 text-graphite-700 border-graphite-300'
                }`}
              >
                230 В
              </button>
              <button
                type="button"
                onClick={() => toggleVoltage('400V')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                  voltage.includes('400V')
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-graphite-50 text-graphite-700 border-graphite-300'
                }`}
              >
                400 В
              </button>
            </div>
          </div>
        </div>

        {/* Starting Methods */}
        <div>
          <label className="block text-xs font-semibold text-graphite-700 mb-1.5">
            Способи запуску * (виберіть всі наявні)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'MANUAL', label: 'Ручний стартер' },
              { id: 'ELECTRIC', label: 'Електростартер' },
              { id: 'REMOTE', label: 'Дистанційний (пульт)' },
              { id: 'ATS', label: 'Автоматичний (ATS / АВР)' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleStart(m.id as StartMethod)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                  startingMethods.includes(m.id as StartMethod)
                    ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                    : 'bg-graphite-50 text-graphite-700 border-graphite-300 hover:bg-graphite-100'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Critical AVR & ATS Options */}
      <section className="bg-white rounded-3xl border border-graphite-200 p-6 sm:p-8 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-graphite-950 pb-2 border-b border-graphite-100">
          Системи автоматики (AVR та ATS/АВР)
        </h2>
        <p className="text-xs text-graphite-500">
          Увага: AVR (автоматичний регулятор напруги генератора) та ATS (автоматичний перемикач вводу резерву будівлі) — це різні технічні системи!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">
              AVR (регулятор напруги)
            </label>
            <select
              value={hasAvr}
              onChange={(e) => setHasAvr(e.target.value as TriState)}
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="UNKNOWN">Невідомо</option>
              <option value="YES">Так (встановлено)</option>
              <option value="NO">Ні</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">
              Підтримка підключення ATS/АВР
            </label>
            <select
              value={atsCompatible}
              onChange={(e) => setAtsCompatible(e.target.value as TriState)}
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="UNKNOWN">Невідомо</option>
              <option value="YES">Так (є роз’єм керування)</option>
              <option value="NO">Ні</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">
              Блок ATS/АВР у комплекті
            </label>
            <select
              value={atsUnitIncluded}
              onChange={(e) => setAtsUnitIncluded(e.target.value as TriState)}
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="UNKNOWN">Невідомо</option>
              <option value="YES">Так (блок у коробці)</option>
              <option value="NO">Ні (купується окремо)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Additional Generator Specifications */}
      <section className="bg-white rounded-3xl border border-graphite-200 p-6 sm:p-8 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-graphite-950 pb-2 border-b border-graphite-100">
          Додаткові характеристики
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">Об’єм бака (л)</label>
            <input
              type="number"
              step="0.5"
              value={fuelTankCapacityL}
              onChange={(e) => setFuelTankCapacityL(e.target.value)}
              placeholder="15"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">Витрата пального (л/год)</label>
            <input
              type="number"
              step="0.1"
              value={fuelConsumptionLh}
              onChange={(e) => setFuelConsumptionLh(e.target.value)}
              placeholder="1.6"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">Навантаження при витраті (%)</label>
            <input
              type="number"
              value={fuelConsumptionLoadPct}
              onChange={(e) => setFuelConsumptionLoadPct(e.target.value)}
              placeholder="50"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">Автономність (год)</label>
            <input
              type="number"
              step="0.5"
              value={autonomyHours}
              onChange={(e) => setAutonomyHours(e.target.value)}
              placeholder="10"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">Рівень шуму (дБА)</label>
            <input
              type="number"
              step="1"
              value={noiseLevelDb}
              onChange={(e) => setNoiseLevelDb(e.target.value)}
              placeholder="72"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">Умови вимірювання шуму</label>
            <input
              type="text"
              value={noiseConditions}
              onChange={(e) => setNoiseConditions(e.target.value)}
              placeholder="Lpa на відстані 7м"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">Вага нетто (кг)</label>
            <input
              type="number"
              step="0.5"
              value={netWeightKg}
              onChange={(e) => setNetWeightKg(e.target.value)}
              placeholder="45"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">Габарити (Д×Ш×В мм)</label>
            <input
              type="text"
              value={dimensionsMm}
              onChange={(e) => setDimensionsMm(e.target.value)}
              placeholder="680×490×500"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">Транспортна вага (кг)</label>
            <input
              type="number"
              step="0.5"
              value={shippingWeightKg}
              onChange={(e) => setShippingWeightKg(e.target.value)}
              placeholder="48"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">Габарити упаковки (мм)</label>
            <input
              type="text"
              value={shippingDimensionsMm}
              onChange={(e) => setShippingDimensionsMm(e.target.value)}
              placeholder="700×510×520"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">Шумоізоляційний кожух</label>
            <select
              value={hasNoiseCanopy}
              onChange={(e) => setHasNoiseCanopy(e.target.value as TriState)}
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="UNKNOWN">Невідомо</option>
              <option value="YES">Так (закритий корпус)</option>
              <option value="NO">Ні (відкрита рама)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">Колеса для перевезення</label>
            <select
              value={hasWheels}
              onChange={(e) => setHasWheels(e.target.value as TriState)}
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="UNKNOWN">Невідомо</option>
              <option value="YES">Так</option>
              <option value="NO">Ні</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">Офіційна гарантія (міс.)</label>
            <input
              type="number"
              value={warrantyMonths}
              onChange={(e) => setWarrantyMonths(e.target.value)}
              placeholder="24"
              className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-graphite-700 mb-1">Розетки та виходи</label>
          <input
            type="text"
            value={sockets}
            onChange={(e) => setSockets(e.target.value)}
            placeholder="1×16A (230В), 1×32A (230В), вихід 12В/8.3А"
            className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-graphite-700 mb-1">Комплектація</label>
          <textarea
            rows={2}
            value={includedAccessories}
            onChange={(e) => setIncludedAccessories(e.target.value)}
            placeholder="Генератор, свічковий ключ, вилки живлення 16А, інструкція, гарантійний талон..."
            className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </section>

      {/* Descriptions */}
      <section className="bg-white rounded-3xl border border-graphite-200 p-6 sm:p-8 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-graphite-950 pb-2 border-b border-graphite-100">
          Описи товару
        </h2>

        <div>
          <label className="block text-xs font-semibold text-graphite-700 mb-1">
            Короткий опис * (показується в картці та на початку сторінки)
          </label>
          <textarea
            rows={2}
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="Потужний бензиновий генератор на 5 кВт з електростартером..."
            className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-graphite-700 mb-1">
            Повний детальний опис (розділ «Опис товару»)
          </label>
          <textarea
            rows={6}
            value={fullDescription}
            onChange={(e) => setFullDescription(e.target.value)}
            placeholder="Повний опис переваг моделі, особливості двигуна та застосування..."
            className="w-full px-3.5 py-2 text-xs bg-graphite-50 border border-graphite-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed font-mono"
          />
        </div>
      </section>

      {/* Form Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-graphite-200 shadow-lg sticky bottom-4 z-20">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-graphite-600">Статус товару:</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            status === 'PUBLISHED'
              ? 'bg-emerald-100 text-emerald-800'
              : status === 'DRAFT'
              ? 'bg-graphite-100 text-graphite-700'
              : 'bg-rose-100 text-rose-800'
          }`}>
            {status === 'PUBLISHED' ? 'Опубліковано' : status === 'DRAFT' ? 'Чернетка' : 'В архіві'}
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit('DRAFT')}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-graphite-100 hover:bg-graphite-200 text-graphite-800 rounded-xl text-xs font-bold transition-colors"
          >
            Зберегти як чернетку
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit('PUBLISHED')}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Збереження...</span>
              </>
            ) : (
              <span>Опублікувати в каталозі</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
