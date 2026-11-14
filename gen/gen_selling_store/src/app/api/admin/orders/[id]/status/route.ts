import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import { OrderStatus, PaymentStatus } from '@/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = verifyAdminRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Потрібна авторизація.' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  try {
    const body = await request.json();
    const { status, payment_status, ttn, internal_comment, comment } = body;

    const existingOrder = await db.get('SELECT * FROM orders WHERE id = $1', [id]);
    if (!existingOrder) {
      return NextResponse.json({ error: 'Замовлення не знайдено.' }, { status: 404 });
    }

    const oldStatus: OrderStatus = existingOrder.status;
    const newStatus: OrderStatus = status || oldStatus;
    const newPaymentStatus: PaymentStatus = payment_status || existingOrder.payment_status;
    const newTtn = ttn !== undefined ? ttn : existingOrder.ttn;
    const newInternalComment = internal_comment !== undefined ? internal_comment : existingOrder.internal_comment;
    const now = new Date().toISOString();

    await db.transaction(async (tx) => {
      // If order is being cancelled, restore stock
      if (oldStatus !== 'CANCELLED' && newStatus === 'CANCELLED') {
        const items = await tx.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [id]);
        for (const it of items) {
          await tx.run(
            `UPDATE products SET 
              stock = stock + $1,
              availability_status = CASE WHEN availability_status = 'OUT_OF_STOCK' THEN 'IN_STOCK' ELSE availability_status END,
              updated_at = $2
            WHERE id = $3`,
            [Number(it.quantity), now, it.product_id]
          );
        }
      }

      // If un-cancelling, reserve stock again
      if (oldStatus === 'CANCELLED' && newStatus !== 'CANCELLED') {
        const items = await tx.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [id]);
        for (const it of items) {
          const product = await tx.get('SELECT stock FROM products WHERE id = $1', [it.product_id]);
          if (product && Number(product.stock) < Number(it.quantity)) {
            throw new Error(`Неможливо відновити замовлення: недостатньо залишку для товару.`);
          }
          await tx.run(
            `UPDATE products SET stock = stock - $1, updated_at = $2 WHERE id = $3`,
            [Number(it.quantity), now, it.product_id]
          );
        }
      }

      // Update order record
      await tx.run(
        `UPDATE orders SET
          status = $1, payment_status = $2, ttn = $3,
          internal_comment = $4, updated_at = $5
        WHERE id = $6`,
        [newStatus, newPaymentStatus, newTtn || null, newInternalComment || null, now, id]
      );

      // Record history if status changed or comment provided
      if (oldStatus !== newStatus || comment?.trim()) {
        const histId = `hist_${crypto.randomBytes(12).toString('hex')}`;
        await tx.run(
          `INSERT INTO order_status_history (id, order_id, created_at, previous_status, new_status, comment)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [histId, id, now, oldStatus, newStatus, comment?.trim() || `Зміна статусу на ${newStatus}`]
        );
      }
    });

    return NextResponse.json({ success: true, oldStatus, newStatus });
  } catch (err: any) {
    console.error('Update order status error:', err);
    return NextResponse.json(
      { error: err.message || 'Не вдалося оновити статус замовлення.' },
      { status: 400 }
    );
  }
}
