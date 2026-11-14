import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, signToken, ADMIN_COOKIE_CONFIG } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rateKey = `login_${ip}`;
  const rate = checkRateLimit(rateKey, 5, 15 * 60); // 5 attempts per 15 min

  if (!rate.success) {
    return NextResponse.json(
      { error: 'Забагато спроб входу. Будь ласка, зачекайте 15 хвилин.' },
      { status: 429 }
    );
  }

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Введіть ім’я користувача та пароль.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const admin = await db.get<{ id: string; username: string; password_hash: string; name: string }>(
      'SELECT id, username, password_hash, name FROM admins WHERE username = $1',
      [username.trim()]
    );

    if (!admin || !verifyPassword(password, admin.password_hash)) {
      return NextResponse.json(
        { error: 'Невірне ім’я користувача або пароль.' },
        { status: 401 }
      );
    }

    const token = signToken({
      id: admin.id,
      username: admin.username,
      name: admin.name,
    });

    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
      },
    });

    response.cookies.set(ADMIN_COOKIE_CONFIG.name, token, ADMIN_COOKIE_CONFIG);
    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'Помилка сервера під час авторизації.' },
      { status: 500 }
    );
  }
}
