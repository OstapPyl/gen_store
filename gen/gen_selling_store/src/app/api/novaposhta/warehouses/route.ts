import { NextRequest, NextResponse } from 'next/server';
import { getWarehouses, validateWarehouseWeight } from '@/lib/novaposhta';
import { getStoreSettings } from '@/lib/settings';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cityRef = searchParams.get('cityRef') || '';
  const search = searchParams.get('search') || '';
  const weight = Number(searchParams.get('weight') || 0);

  const settings = await getStoreSettings();
  if (!settings.nova_poshta_api_key) {
    return NextResponse.json({
      items: [],
      configured: false,
      message: 'API-ключ Нової пошти не налаштований. Дозволено ручне введення відділення.',
    });
  }

  if (!cityRef) {
    return NextResponse.json({ items: [], configured: true });
  }

  const rawWarehouses = await getWarehouses(cityRef, search);

  const items = rawWarehouses.map(wh => {
    const validation = validateWarehouseWeight(wh.maxWeightAllowed, weight);
    return {
      ...wh,
      isCompatible: validation.valid,
      warningMessage: validation.message || null,
      requiresManagerVerification: validation.requiresManagerVerification,
    };
  });

  return NextResponse.json({ items, configured: true });
}
