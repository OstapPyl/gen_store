import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import ExcelJS from 'exceljs';

function sanitize(val: any): any {
  if (typeof val === 'string') {
    if (/^[=+\-@\t\r]/.test(val)) {
      return `'${val}`;
    }
    return val;
  }
  return val;
}

async function exportSqliteToXlsx() {
  const sqlitePath = process.argv[2] || path.resolve(process.cwd(), 'orders.sqlite');
  const outputPath = process.argv[3] || path.resolve(process.cwd(), 'orders_export.xlsx');

  if (!fs.existsSync(sqlitePath)) {
    console.error(`Помилка: файл бази ${sqlitePath} не знайдено.`);
    process.exit(1);
  }

  const db = new DatabaseSync(sqlitePath);
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as any[];
  const items = db.prepare('SELECT * FROM order_items').all() as any[];

  console.log(`Знайдено замовлень: ${orders.length}, товарних позицій: ${items.length}`);

  const itemsByOrder = new Map<string, any[]>();
  for (const it of items) {
    if (!itemsByOrder.has(it.order_id)) {
      itemsByOrder.set(it.order_id, []);
    }
    itemsByOrder.get(it.order_id)!.push(it);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Gen Store Laptop Exporter';
  workbook.created = new Date();

  // Sheet 1: Замовлення
  const ordersSheet = workbook.addWorksheet('Замовлення', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  ordersSheet.columns = [
    { header: 'Номер замовлення', key: 'order_number', width: 22 },
    { header: 'Дата створення', key: 'created_at', width: 22 },
    { header: 'Статус замовлення', key: 'status', width: 18 },
    { header: 'Статус оплати', key: 'payment_status', width: 18 },
    { header: 'Ім’я', key: 'customer_first_name', width: 16 },
    { header: 'Прізвище', key: 'customer_last_name', width: 18 },
    { header: 'Телефон', key: 'customer_phone', width: 20 },
    { header: 'Email', key: 'customer_email', width: 24 },
    { header: 'Спосіб доставки', key: 'delivery_method', width: 24 },
    { header: 'Населений пункт', key: 'settlement', width: 20 },
    { header: 'Відділення / Адреса', key: 'branch_or_address', width: 35 },
    { header: 'Сума (грн)', key: 'total_uah', width: 16 },
    { header: 'Номер ТТН', key: 'ttn', width: 24 },
    { header: 'Потребує перевірки', key: 'delivery_requires_verification', width: 20 },
    { header: 'Коментар клієнта', key: 'comment', width: 30 },
    { header: 'Внутрішній коментар', key: 'internal_comment', width: 30 },
  ];

  ordersSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ordersSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' },
  };

  for (const o of orders) {
    const row = ordersSheet.addRow({
      order_number: sanitize(o.order_number),
      created_at: o.created_at,
      status: o.status,
      payment_status: o.payment_status,
      customer_first_name: sanitize(o.customer_first_name),
      customer_last_name: sanitize(o.customer_last_name),
      customer_phone: sanitize(o.customer_phone),
      customer_email: sanitize(o.customer_email || ''),
      delivery_method: o.delivery_method,
      settlement: sanitize(o.settlement),
      branch_or_address: sanitize(o.branch_or_address),
      total_uah: (o.total_amount_kop / 100).toFixed(2),
      ttn: sanitize(o.ttn || ''),
      delivery_requires_verification: o.delivery_requires_verification ? 'ТАК' : 'НІ',
      comment: sanitize(o.comment || ''),
      internal_comment: sanitize(o.internal_comment || ''),
    });

    row.getCell('customer_phone').numFmt = '@';
    row.getCell('order_number').numFmt = '@';
    row.getCell('ttn').numFmt = '@';
  }

  // Sheet 2: Товари замовлень
  const itemsSheet = workbook.addWorksheet('Товари замовлень', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  itemsSheet.columns = [
    { header: 'Номер замовлення', key: 'order_number', width: 22 },
    { header: 'ID товару', key: 'product_id', width: 22 },
    { header: 'Артикул (SKU)', key: 'sku', width: 18 },
    { header: 'Назва товару', key: 'product_name', width: 40 },
    { header: 'Кількість', key: 'quantity', width: 14 },
    { header: 'Ціна за од. (грн)', key: 'price_uah', width: 18 },
    { header: 'Сума (грн)', key: 'subtotal_uah', width: 18 },
  ];

  itemsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  itemsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEA580C' },
  };

  const orderNumMap = new Map(orders.map((o) => [o.id, o.order_number]));

  for (const it of items) {
    const orderNumber = orderNumMap.get(it.order_id) || 'UNKNOWN';
    const subtotal = ((it.price_kop * it.quantity) / 100).toFixed(2);
    const row = itemsSheet.addRow({
      order_number: sanitize(orderNumber),
      product_id: sanitize(it.product_id),
      sku: sanitize(it.sku),
      product_name: sanitize(it.product_name),
      quantity: it.quantity,
      price_uah: (it.price_kop / 100).toFixed(2),
      subtotal_uah: subtotal,
    });

    row.getCell('order_number').numFmt = '@';
    row.getCell('sku').numFmt = '@';
    row.getCell('product_id').numFmt = '@';
  }

  await workbook.xlsx.writeFile(outputPath);
  console.log(`[XLSX Exporter] Успішно збережено Excel-файл: ${outputPath}`);
}

exportSqliteToXlsx().catch((err) => {
  console.error('Помилка експорту XLSX:', err);
  process.exit(1);
});
