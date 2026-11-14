import ExcelJS from 'exceljs';
import { Order } from '@/types';

function sanitizeCellValue(val: any): any {
  if (typeof val === 'string') {
    // Prevent formula injection in Excel (DDE / formula execution)
    if (/^[=+\-@\t\r]/.test(val)) {
      return `'${val}`;
    }
    return val;
  }
  return val;
}

export async function generateOrdersXlsx(orders: Order[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Gen Store';
  workbook.created = new Date();

  // Sheet 1: Замовлення
  const ordersSheet = workbook.addWorksheet('Замовлення', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  ordersSheet.columns = [
    { header: 'Номер замовлення', key: 'order_number', width: 20 },
    { header: 'Дата створення', key: 'created_at', width: 22 },
    { header: 'Статус замовлення', key: 'status', width: 20 },
    { header: 'Статус оплати', key: 'payment_status', width: 18 },
    { header: 'Ім’я', key: 'customer_first_name', width: 16 },
    { header: 'Прізвище', key: 'customer_last_name', width: 18 },
    { header: 'Телефон', key: 'customer_phone', width: 20 },
    { header: 'Email', key: 'customer_email', width: 24 },
    { header: 'Спосіб доставки', key: 'delivery_method', width: 24 },
    { header: 'Населений пункт', key: 'settlement', width: 22 },
    { header: 'Відділення / Адреса', key: 'branch_or_address', width: 35 },
    { header: 'Сума (грн)', key: 'total_amount_uah', width: 16 },
    { header: 'Номер ТТН', key: 'ttn', width: 24 },
    { header: 'Потребує перевірки', key: 'delivery_requires_verification', width: 20 },
    { header: 'Коментар клієнта', key: 'comment', width: 30 },
    { header: 'Внутрішній коментар', key: 'internal_comment', width: 30 },
  ];

  // Header styling
  ordersSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ordersSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }, // Graphite
  };

  const statusLabels: Record<string, string> = {
    NEW: 'Нове',
    CONFIRMED: 'Підтверджене',
    SHIPPED: 'Відправлене',
    COMPLETED: 'Виконане',
    CANCELLED: 'Скасоване',
  };

  const paymentLabels: Record<string, string> = {
    PENDING: 'Очікує оплати / Післяплата',
    PAID: 'Оплачено',
    REFUNDED: 'Повернення',
  };

  const deliveryLabels: Record<string, string> = {
    NOVA_POSHTA_BRANCH: 'Нова пошта (відділення)',
    COURIER: 'Адресна доставка кур’єром',
    PICKUP: 'Самовивіз',
  };

  for (const o of orders) {
    const row = ordersSheet.addRow({
      order_number: sanitizeCellValue(o.order_number),
      created_at: o.created_at,
      status: statusLabels[o.status] || o.status,
      payment_status: paymentLabels[o.payment_status] || o.payment_status,
      customer_first_name: sanitizeCellValue(o.customer_first_name),
      customer_last_name: sanitizeCellValue(o.customer_last_name),
      customer_phone: sanitizeCellValue(o.customer_phone),
      customer_email: sanitizeCellValue(o.customer_email || ''),
      delivery_method: deliveryLabels[o.delivery_method] || o.delivery_method,
      settlement: sanitizeCellValue(o.settlement),
      branch_or_address: sanitizeCellValue(o.branch_or_address),
      total_amount_uah: (o.total_amount_kop / 100).toFixed(2),
      ttn: sanitizeCellValue(o.ttn || ''),
      delivery_requires_verification: o.delivery_requires_verification ? 'ТАК' : 'НІ',
      comment: sanitizeCellValue(o.comment || ''),
      internal_comment: sanitizeCellValue(o.internal_comment || ''),
    });

    // Explicitly set phone, ttn, and order_number as TEXT format
    row.getCell('customer_phone').numFmt = '@';
    row.getCell('order_number').numFmt = '@';
    row.getCell('ttn').numFmt = '@';
  }

  // Sheet 2: Товари замовлень
  const itemsSheet = workbook.addWorksheet('Товари замовлень', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  itemsSheet.columns = [
    { header: 'Номер замовлення', key: 'order_number', width: 20 },
    { header: 'ID товару', key: 'product_id', width: 20 },
    { header: 'Артикул (SKU)', key: 'sku', width: 18 },
    { header: 'Назва товару', key: 'product_name', width: 40 },
    { header: 'Кількість', key: 'quantity', width: 12 },
    { header: 'Ціна за од. (грн)', key: 'price_uah', width: 18 },
    { header: 'Сума (грн)', key: 'subtotal_uah', width: 18 },
  ];

  itemsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  itemsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEA580C' }, // Orange accent
  };

  for (const o of orders) {
    if (!o.items) continue;
    for (const item of o.items) {
      const subtotal = ((item.price_kop * item.quantity) / 100).toFixed(2);
      const row = itemsSheet.addRow({
        order_number: sanitizeCellValue(o.order_number),
        product_id: sanitizeCellValue(item.product_id),
        sku: sanitizeCellValue(item.sku),
        product_name: sanitizeCellValue(item.product_name),
        quantity: item.quantity,
        price_uah: (item.price_kop / 100).toFixed(2),
        subtotal_uah: subtotal,
      });

      row.getCell('order_number').numFmt = '@';
      row.getCell('sku').numFmt = '@';
      row.getCell('product_id').numFmt = '@';
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
