import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { getStoreSettings, updateStoreSettings } from '@/lib/settings';

export async function GET(request: NextRequest) {
  const session = verifyAdminRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Потрібна авторизація.' }, { status: 401 });
  }

  const settings = await getStoreSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  const session = verifyAdminRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Потрібна авторизація.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    await updateStoreSettings(body);
    const updated = await getStoreSettings();
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Не вдалося зберегти налаштування.' }, { status: 500 });
  }
}
