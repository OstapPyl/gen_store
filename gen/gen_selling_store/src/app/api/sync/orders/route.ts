import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifySyncToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // Validate dedicated sync token
  if (!verifySyncToken(request)) {
    return NextResponse.json(
      { error: 'Доступ заборонено: недійсний токен синхронізації.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor')?.trim() || '1970-01-01T00:00:00.000Z';
  const limit = Math.max(1, Math.min(200, Number(searchParams.get('limit') || 100)));

  const db = getDb();

  // Fetch orders updated strictly after cursor, ordered by updated_at ASC
  const orders = await db.query(
    `SELECT * FROM orders WHERE updated_at > $1 ORDER BY updated_at ASC LIMIT $2`,
    [cursor, limit]
  );

  if (orders.length === 0) {
    return NextResponse.json({
      orders: [],
      items: [],
      history: [],
      next_cursor: cursor,
      has_more: false,
    });
  }

  const orderIds = orders.map((o: any) => o.id);
  const placeholders = orderIds.map((_, i) => `$${i + 1}`).join(', ');

  const items = await db.query(
    `SELECT * FROM order_items WHERE order_id IN (${placeholders})`,
    orderIds
  );

  const history = await db.query(
    `SELECT * FROM order_status_history WHERE order_id IN (${placeholders}) ORDER BY created_at ASC`,
    orderIds
  );

  const nextCursor = orders[orders.length - 1].updated_at;
  const hasMore = orders.length === limit;

  return NextResponse.json({
    orders: orders.map((o: any) => ({
      ...o,
      total_amount_kop: Number(o.total_amount_kop),
      delivery_requires_verification: Boolean(o.delivery_requires_verification),
    })),
    items: items.map((it: any) => ({
      ...it,
      price_kop: Number(it.price_kop),
      quantity: Number(it.quantity),
    })),
    history,
    next_cursor: nextCursor,
    has_more: hasMore,
  });
}
