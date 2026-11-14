import React from 'react';
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { Order } from '@/types';
import OrderDetailClient from './OrderDetailClient';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const db = getDb();

  const order = await db.get<Order>('SELECT * FROM orders WHERE id = $1', [id]);
  if (!order) {
    notFound();
  }

  const items = await db.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
  const history = await db.query(
    'SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC',
    [id]
  );

  const fullOrder: Order = {
    ...order,
    total_amount_kop: Number(order.total_amount_kop),
    delivery_requires_verification: Boolean(order.delivery_requires_verification),
    items: items.map((it: any) => ({
      ...it,
      price_kop: Number(it.price_kop),
      quantity: Number(it.quantity),
    })),
    history,
  };

  return <OrderDetailClient order={fullOrder} />;
}
