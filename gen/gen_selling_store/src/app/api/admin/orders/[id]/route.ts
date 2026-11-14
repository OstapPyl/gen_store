import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = verifyAdminRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Потрібна авторизація.' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  const order = await db.get('SELECT * FROM orders WHERE id = $1', [id]);
  if (!order) {
    return NextResponse.json({ error: 'Замовлення не знайдено.' }, { status: 404 });
  }

  const items = await db.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
  const history = await db.query(
    'SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC',
    [id]
  );

  return NextResponse.json({
    order: {
      ...order,
      total_amount_kop: Number(order.total_amount_kop),
      delivery_requires_verification: Boolean(order.delivery_requires_verification),
      items: items.map((it: any) => ({
        ...it,
        price_kop: Number(it.price_kop),
        quantity: Number(it.quantity),
      })),
      history,
    },
  });
}
