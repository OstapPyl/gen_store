import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { saveUploadedFile } from '@/lib/storage';

export async function POST(request: NextRequest) {
  const session = verifyAdminRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Потрібна авторизація.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'images';

    if (!file) {
      return NextResponse.json({ error: 'Файл не передано.' }, { status: 400 });
    }

    if (category !== 'images' && category !== 'manuals') {
      return NextResponse.json({ error: 'Невідома категорія файлу.' }, { status: 400 });
    }

    const saved = await saveUploadedFile(file, category);
    return NextResponse.json({ success: true, file: saved });
  } catch (err: any) {
    console.error('File upload error:', err);
    return NextResponse.json(
      { error: err.message || 'Не вдалося зберегти файл.' },
      { status: 400 }
    );
  }
}
