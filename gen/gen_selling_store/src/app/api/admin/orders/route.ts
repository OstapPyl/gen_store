import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = verifyAdminRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Потрібна авторизація.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const query = searchParams.get('query')?.trim() || '';
  const dateFrom = searchParams.get('from');
  const dateTo = searchParams.get('to');

  const db = getDb();
  const whereClauses: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (status && ['NEW', 'CONFIRMED', 'SHIPPED', 'COMPLETED', 'CANCELLED'].includes(status)) {
    whereClauses.push(`status = $${paramIdx++}`);
    params.push(status);
  }

  if (query) {
    whereClauses.push(`(
      LOWER(order_number) LIKE $${paramIdx} OR 
      LOWER(customer_phone) LIKE $${paramIdx} OR 
      LOWER(customer_last_name) LIKE $${paramIdx} OR 
      LOWER(customer_first_name) LIKE $${paramIdx} OR
      LOWER(COALESCE(ttn, '')) LIKE $${paramIdx}
    )`);
    params.push(`%${query.toLowerCase()}%`);
    paramIdx++;
  }

  if (dateFrom) {
    whereClauses.push(`created_at >= $${paramIdx++}`);
    params.push(dateFrom);
  }

  if (dateTo) {
    whereClauses.push(`created_at <= $${paramIdx++}`);
    params.push(dateTo);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const orders = await db.query(
    `SELECT * FROM orders ${whereSql} ORDER BY created_at DESC`,
    params
  );

  // Fetch items for each order
  const orderIds = orders.map((o: any) => o.id);
  let itemsMap = new Map<string, any[]>();

  if (orderIds.length > 0) {
    // In batches if needed, or query all
    const placeholders = orderIds.map((_, i) => `$${i + 1}`).join(', ');
    const items = await db.query(
      `SELECT * FROM order_items WHERE order_id IN (${placeholders})`,
      orderIds
    );
    for (const item of items) {
      if (!itemsMap.has(item.order_id)) {
        itemsMap.set(item.order_id, []);
      }
      itemsMap.get(item.order_id)!.push({
        ...item,
        price_kop: Number(item.price_kop),
        quantity: Number(item.quantity),
      });
    }
  }

  return NextResponse.json({
    orders: orders.map((o: any) => ({
      ...o,
      total_amount_kop: Number(o.total_amount_kop),
      delivery_requires_verification: Boolean(o.delivery_requires_verification),
      items: itemsMap.get(o.id) || [],
    })),
  });
}
