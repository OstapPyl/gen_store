import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

interface CartItemInput {
  product_id: string;
  quantity: number;
  expected_price_kop: number;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rateLimitKey = `order_${ip}`;
  const rate = checkRateLimit(rateLimitKey, 10, 10 * 60); // 10 orders per 10 min

  if (!rate.success) {
    return NextResponse.json(
      { error: 'Забагато спроб оформлення. Будь ласка, зачекайте кілька хвилин.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const {
      customer_first_name,
      customer_last_name,
      customer_phone,
      customer_email,
      delivery_method,
      settlement,
      settlement_ref,
      branch_or_address,
      branch_ref,
      delivery_requires_verification,
      delivery_verification_reason,
      comment,
      items,
      idempotency_key: bodyIdempotencyKey,
    } = body;

    const idempotency_key = request.headers.get('x-idempotency-key') || bodyIdempotencyKey || null;

    const db = getDb();

    // Idempotency check: if an order with this key exists, return it cleanly
    if (idempotency_key) {
      const existingOrder = await db.get(
        'SELECT * FROM orders WHERE idempotency_key = $1',
        [idempotency_key]
      );
      if (existingOrder) {
        return NextResponse.json({
          success: true,
          order_number: existingOrder.order_number,
          order_id: existingOrder.id,
          total_amount_kop: Number(existingOrder.total_amount_kop),
          message: 'Замовлення отримано. Менеджер зв’яжеться з вами для підтвердження.',
          is_duplicate: true,
        });
      }
    }

    // Validation
    if (!customer_first_name?.trim() || !customer_last_name?.trim()) {
      return NextResponse.json(
        { error: 'Будь ласка, вкажіть ім’я та прізвище.' },
        { status: 400 }
      );
    }

    const cleanPhone = (customer_phone || '').replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^(\+?380|0)\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Введіть коректний номер телефону у форматі +380XXXXXXXXX або 0XXXXXXXXX.' },
        { status: 400 }
      );
    }

    if (!delivery_method || !['NOVA_POSHTA_BRANCH', 'COURIER', 'PICKUP'].includes(delivery_method)) {
      return NextResponse.json(
        { error: 'Оберіть коректний спосіб доставки.' },
        { status: 400 }
      );
    }

    if (!settlement?.trim() || !branch_or_address?.trim()) {
      return NextResponse.json(
        { error: 'Вкажіть населений пункт та адресу / відділення доставки.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Кошик порожній. Додайте хоча б один товар.' },
        { status: 400 }
      );
    }

    // Process order in a transaction
    const result = await db.transaction(async (tx) => {
      let totalAmountKop = 0;
      const verifiedItems: Array<{
        product_id: string;
        product_name: string;
        sku: string;
        price_kop: number;
        quantity: number;
      }> = [];

      for (const item of items as CartItemInput[]) {
        const qty = Math.floor(Number(item.quantity) || 0);
        if (qty <= 0) {
          throw new Error('Кількість товару повинна бути більшою за нуль.');
        }

        const product = await tx.get(
          'SELECT id, name, sku, price_kop, stock, availability_status, status FROM products WHERE id = $1',
          [item.product_id]
        );

        if (!product || product.status !== 'PUBLISHED') {
          throw new Error(`Товар "${item.product_id}" недоступний для замовлення.`);
        }

        const currentPriceKop = Number(product.price_kop);
        const currentStock = Number(product.stock);

        if (currentStock < qty) {
          throw new Error(`Недостатньо залишку для товару "${product.name}". Доступно: ${currentStock} шт.`);
        }

        // Price change detection
        if (item.expected_price_kop != null && Number(item.expected_price_kop) !== currentPriceKop) {
          const err: any = new Error('PRICE_CHANGED');
          err.product_name = product.name;
          err.new_price_kop = currentPriceKop;
          err.old_price_kop = Number(item.expected_price_kop);
          throw err;
        }

        totalAmountKop += currentPriceKop * qty;

        verifiedItems.push({
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          price_kop: currentPriceKop,
          quantity: qty,
        });

        // Decrement stock
        const newStock = currentStock - qty;
        const newAvailability = newStock > 0 ? product.availability_status : 'OUT_OF_STOCK';

        await tx.run(
          'UPDATE products SET stock = $1, availability_status = $2, updated_at = $3 WHERE id = $4',
          [newStock, newAvailability, new Date().toISOString(), product.id]
        );
      }

      const orderId = `ord_${crypto.randomBytes(12).toString('hex')}`;
      const now = new Date().toISOString();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `GEN-${new Date().getFullYear()}-${randomSuffix}`;

      await tx.run(
        `INSERT INTO orders (
          id, order_number, created_at, updated_at, idempotency_key,
          status, payment_status, customer_first_name, customer_last_name,
          customer_phone, customer_email, delivery_method, settlement,
          settlement_ref, branch_or_address, branch_ref, delivery_requires_verification,
          delivery_verification_reason, comment, total_amount_kop
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        )`,
        [
          orderId,
          orderNumber,
          now,
          now,
          idempotency_key,
          'NEW',
          'PENDING',
          customer_first_name.trim(),
          customer_last_name.trim(),
          cleanPhone,
          customer_email?.trim() || null,
          delivery_method,
          settlement.trim(),
          settlement_ref || null,
          branch_or_address.trim(),
          branch_ref || null,
          delivery_requires_verification ? 1 : 0,
          delivery_verification_reason || null,
          comment?.trim() || null,
          totalAmountKop,
        ]
      );

      for (const vItem of verifiedItems) {
        const itemId = `item_${crypto.randomBytes(12).toString('hex')}`;
        await tx.run(
          `INSERT INTO order_items (
            id, order_id, product_id, product_name, sku, price_kop, quantity
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            itemId,
            orderId,
            vItem.product_id,
            vItem.product_name,
            vItem.sku,
            vItem.price_kop,
            vItem.quantity,
          ]
        );
      }

      // Record initial status in history
      const historyId = `hist_${crypto.randomBytes(12).toString('hex')}`;
      await tx.run(
        `INSERT INTO order_status_history (id, order_id, created_at, previous_status, new_status, comment)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [historyId, orderId, now, 'NONE', 'NEW', 'Створення замовлення покупцем']
      );

      return {
        orderId,
        orderNumber,
        totalAmountKop,
      };
    });

    return NextResponse.json({
      success: true,
      order_id: result.orderId,
      order_number: result.orderNumber,
      total_amount_kop: result.totalAmountKop,
      message: 'Замовлення отримано. Менеджер зв’яжеться з вами для підтвердження.',
    });
  } catch (err: any) {
    if (err.message === 'PRICE_CHANGED') {
      return NextResponse.json(
        {
          error: `Ціна на товар "${err.product_name}" змінилася під час оформлення. Нова ціна: ${(err.new_price_kop / 100).toFixed(2)} грн. Будь ласка, перевірте кошик та підтвердіть замовлення знову.`,
          code: 'PRICE_CHANGED',
        },
        { status: 409 }
      );
    }
    console.error('Order creation error:', err);
    return NextResponse.json(
      { error: err.message || 'Не вдалося створити замовлення.' },
      { status: 400 }
    );
  }
}
