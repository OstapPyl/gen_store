import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import { generateOrdersXlsx } from '@/lib/xlsx';
import { Order } from '@/types';

export async function GET(request: NextRequest) {
  const session = verifyAdminRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Потрібна авторизація.' }, { status: 401 });
  }

  const db = getDb();
  const orders = await db.query<Order>('SELECT * FROM orders ORDER BY created_at DESC');

  const orderIds = orders.map((o: any) => o.id);
  const itemsMap = new Map<string, any[]>();

  if (orderIds.length > 0) {
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

  const enrichedOrders = orders.map((o: any) => ({
    ...o,
    total_amount_kop: Number(o.total_amount_kop),
    delivery_requires_verification: Boolean(o.delivery_requires_verification),
    items: itemsMap.get(o.id) || [],
  }));

  const xlsxBuffer = await generateOrdersXlsx(enrichedOrders);
  const filename = `gen_orders_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(new Uint8Array(xlsxBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
