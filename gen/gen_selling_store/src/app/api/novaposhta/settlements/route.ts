import { NextRequest, NextResponse } from 'next/server';
import { searchSettlements } from '@/lib/novaposhta';
import { getStoreSettings } from '@/lib/settings';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const settings = await getStoreSettings();

  if (!settings.nova_poshta_api_key) {
    return NextResponse.json({
      items: [],
      configured: false,
      message: 'API-ключ Нової пошти не налаштований. Дозволено ручне введення населеного пункту.',
    });
  }

  const items = await searchSettlements(q);
  return NextResponse.json({
    items,
    configured: true,
  });
}
