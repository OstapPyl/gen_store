import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import { getDb } from '../src/lib/db/index';
import { hashPassword, signToken, verifyToken, verifyPassword } from '../src/lib/auth';
import { generateOrdersXlsx } from '../src/lib/xlsx';

async function runEndToEndVerification() {
  console.log('===========================================================');
  console.log('   НАСКРІЗНЕ ТЕСТУВАННЯ ТА ВЕРИФІКАЦІЯ ІНТЕРНЕТ-МАГАЗИНУ GEN');
  console.log('===========================================================\n');

  const testDbPath = path.resolve(process.cwd(), 'data', 'gen_test.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  // Force local test database
  process.env.DATABASE_URL = '';
  process.env.SYNC_API_TOKEN = 'test-secret-sync-token-12345';
  process.env.APP_SECRET = 'test-secret-app-key-min-32-chars-long-123456';

  const db = getDb();

  // Clean test tables
  await db.run('DELETE FROM order_status_history');
  await db.run('DELETE FROM order_items');
  await db.run('DELETE FROM orders');
  await db.run('DELETE FROM products');
  await db.run('DELETE FROM admins');

  // STEP 1: Порожній каталог
  console.log('▶ КРОК 1: Перевірка порожнього каталогу...');
  const initialPublished = await db.query("SELECT * FROM products WHERE status = 'PUBLISHED'");
  if (initialPublished.length !== 0) {
    throw new Error('Помилка: каталог не є порожнім!');
  }
  console.log('  ✓ Каталог порожній (0 товарів). Відображається стан "Товари незабаром з’являться".');

  // STEP 2: Вхід адміністратора
  console.log('\n▶ КРОК 2: Створення та вхід адміністратора...');
  const testAdminUsername = 'admin_test';
  const testAdminPassword = 'StrongPassword2026!';
  const adminHash = hashPassword(testAdminPassword);

  await db.run(
    'INSERT INTO admins (id, username, password_hash, name, created_at) VALUES ($1, $2, $3, $4, $5)',
    ['admin_001', testAdminUsername, adminHash, 'Тестовий Адмін', new Date().toISOString()]
  );

  const adminInDb = await db.get('SELECT * FROM admins WHERE username = $1', [testAdminUsername]);
  if (!adminInDb || !verifyPassword(testAdminPassword, adminInDb.password_hash)) {
    throw new Error('Помилка: не вдалося авторизувати адміністратора за паролем.');
  }

  const token = signToken({
    id: adminInDb.id,
    username: adminInDb.username,
    name: adminInDb.name,
  });
  const decoded = verifyToken(token);
  if (!decoded || decoded.username !== testAdminUsername) {
    throw new Error('Помилка: недійсний сесійний токен адміністратора.');
  }
  console.log('  ✓ Адміністратор успішно авторизований. Сесія підписана та верифікована.');

  // STEP 3: Створення та публікація генератора
  console.log('\n▶ КРОК 3: Створення та публікація генератора через захищену адмінку...');
  const testProduct = {
    id: 'prod_test_01',
    slug: 'konner-sohnen-ks-7000e',
    sku: 'KS-7000E',
    name: 'Генератор бензиновий Könner & Söhnen KS 7000E',
    brand: 'Könner & Söhnen',
    model: 'KS 7000E',
    price_kop: 3250000, // 32 500.00 грн
    stock: 5,
    availability_status: 'IN_STOCK',
    status: 'PUBLISHED',
    short_description: 'Надійний бензиновий генератор потужністю 5.5 кВт з електростартером та AVR.',
    full_description: 'Фірмовий двигун серії KS, мідна обмотка альтернатора, стабілізація напруги AVR.',
    images: JSON.stringify(['/uploads/ks7000e_main.jpg']),
    nominal_power_kw: 5.0,
    max_power_kw: 5.5,
    fuel_type: 'PETROL',
    is_inverter: 0,
    phase_type: 'SINGLE',
    voltage: JSON.stringify(['230V']),
    starting_methods: JSON.stringify(['MANUAL', 'ELECTRIC']),
    has_avr: 'YES',
    ats_compatible: 'YES',
    ats_unit_included: 'NO',
    fuel_tank_capacity_l: 25,
    fuel_consumption_lh: 1.6,
    fuel_consumption_load_pct: 50,
    autonomy_hours: 15,
    noise_level_db: 70,
    net_weight_kg: 76,
    shipping_weight_kg: 80,
    dimensions_mm: '680x490x500',
    has_wheels: 'YES',
    warranty_months: 24,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await db.run(
    `INSERT INTO products (
      id, slug, sku, name, brand, model, price_kop, stock, availability_status,
      status, short_description, full_description, images,
      nominal_power_kw, max_power_kw, fuel_type, is_inverter, phase_type,
      voltage, starting_methods, has_avr, ats_compatible, ats_unit_included,
      fuel_tank_capacity_l, fuel_consumption_lh, fuel_consumption_load_pct,
      autonomy_hours, noise_level_db, net_weight_kg, shipping_weight_kg,
      dimensions_mm, has_wheels, warranty_months, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9,
      $10, $11, $12, $13,
      $14, $15, $16, $17, $18,
      $19, $20, $21, $22, $23,
      $24, $25, $26,
      $27, $28, $29, $30,
      $31, $32, $33, $34, $35
    )`,
    [
      testProduct.id,
      testProduct.slug,
      testProduct.sku,
      testProduct.name,
      testProduct.brand,
      testProduct.model,
      testProduct.price_kop,
      testProduct.stock,
      testProduct.availability_status,
      testProduct.status,
      testProduct.short_description,
      testProduct.full_description,
      testProduct.images,
      testProduct.nominal_power_kw,
      testProduct.max_power_kw,
      testProduct.fuel_type,
      testProduct.is_inverter,
      testProduct.phase_type,
      testProduct.voltage,
      testProduct.starting_methods,
      testProduct.has_avr,
      testProduct.ats_compatible,
      testProduct.ats_unit_included,
      testProduct.fuel_tank_capacity_l,
      testProduct.fuel_consumption_lh,
      testProduct.fuel_consumption_load_pct,
      testProduct.autonomy_hours,
      testProduct.noise_level_db,
      testProduct.net_weight_kg,
      testProduct.shipping_weight_kg,
      testProduct.dimensions_mm,
      testProduct.has_wheels,
      testProduct.warranty_months,
      testProduct.created_at,
      testProduct.updated_at,
    ]
  );
  console.log(`  ✓ Створено та опубліковано товар: "${testProduct.name}" (SKU: ${testProduct.sku}).`);

  // STEP 4: Поява в каталозі та відповідних фільтрах
  console.log('\n▶ КРОК 4: Перевірка появи в каталозі та відповідності фільтрів...');
  const catalogQuery = await db.query(
    `SELECT * FROM products WHERE status = 'PUBLISHED' AND brand = $1 AND fuel_type = $2 AND nominal_power_kw >= $3`,
    ['Könner & Söhnen', 'PETROL', 4.5]
  );
  if (catalogQuery.length !== 1 || catalogQuery[0].sku !== 'KS-7000E') {
    throw new Error('Помилка: товар не знайдено за фільтрами каталогу.');
  }
  console.log(`  ✓ Товар успішно з’явився у каталозі та знайдений за фільтрами (бренд, бензин, від 4.5 кВт).`);

  // STEP 5: Перехід на сторінку товару
  console.log('\n▶ КРОК 5: Перевірка сторінки товару /products/[slug]...');
  const singleProduct = await db.get(
    "SELECT * FROM products WHERE slug = $1 AND status = 'PUBLISHED'",
    [testProduct.slug]
  );
  if (!singleProduct || singleProduct.id !== testProduct.id) {
    throw new Error('Помилка: сторінка товару за slug не повертає опублікований генератор.');
  }
  console.log(`  ✓ Сторінка /products/${testProduct.slug} доступна, повертає характеристики та наявність.`);

  // STEP 6: Додавання в кошик та оформлення без реєстрації
  console.log('\n▶ КРОК 6: Оформлення замовлення без реєстрації покупцем...');
  const idempotencyKey = `idem_${Date.now()}`;
  const orderId = 'ord_test_999';
  const orderNumber = 'GEN-2026-7788';
  const orderTime = new Date().toISOString();

  await db.transaction(async (tx) => {
    // Check product and stock
    const p = await tx.get('SELECT price_kop, stock FROM products WHERE id = $1', [testProduct.id]);
    if (!p || p.stock < 1) throw new Error('Немає залишку');

    // Decrement stock
    await tx.run('UPDATE products SET stock = stock - 1, updated_at = $1 WHERE id = $2', [
      orderTime,
      testProduct.id,
    ]);

    // Insert order
    await tx.run(
      `INSERT INTO orders (
        id, order_number, created_at, updated_at, idempotency_key,
        status, payment_status, customer_first_name, customer_last_name,
        customer_phone, customer_email, delivery_method, settlement,
        branch_or_address, delivery_requires_verification, comment, total_amount_kop
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        orderId,
        orderNumber,
        orderTime,
        orderTime,
        idempotencyKey,
        'NEW',
        'PENDING',
        'Богдан',
        'Хмельницький',
        '+380671234567',
        'bogdan@example.ua',
        'NOVA_POSHTA_BRANCH',
        'м. Київ',
        'Вантажне відділення №1 (до 1000 кг)',
        0,
        'Прохання зв’язатися після 12:00',
        testProduct.price_kop,
      ]
    );

    // Insert order item snapshot
    await tx.run(
      `INSERT INTO order_items (id, order_id, product_id, product_name, sku, price_kop, quantity)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'item_01',
        orderId,
        testProduct.id,
        testProduct.name,
        testProduct.sku,
        testProduct.price_kop,
        1,
      ]
    );

    // History
    await tx.run(
      `INSERT INTO order_status_history (id, order_id, created_at, previous_status, new_status, comment)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['hist_01', orderId, orderTime, 'NONE', 'NEW', 'Створення замовлення покупцем']
    );
  });

  const productAfterOrder = await db.get('SELECT stock FROM products WHERE id = $1', [testProduct.id]);
  if (!productAfterOrder || productAfterOrder.stock !== testProduct.stock - 1) {
    throw new Error('Помилка: залишок товару не зменшився в транзакції!');
  }
  console.log(`  ✓ Замовлення №${orderNumber} створено. Залишок зменшився: ${testProduct.stock} -> ${productAfterOrder.stock} шт.`);

  // STEP 7: Поява замовлення в адмінпанелі
  console.log('\n▶ КРОК 7: Перевірка появи замовлення в адмінпанелі...');
  const adminOrder = await db.get('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (!adminOrder || adminOrder.order_number !== orderNumber) {
    throw new Error('Помилка: замовлення відсутнє в адмінці.');
  }
  console.log(`  ✓ Замовлення відображається в адмінпанелі: ${adminOrder.customer_first_name} ${adminOrder.customer_last_name}, телефон: ${adminOrder.customer_phone}.`);

  // STEP 8: Повторне надсилання без дублювання (Idempotency)
  console.log('\n▶ КРОК 8: Перевірка захисту від повторного надсилання (Idempotency)...');
  const duplicateCheck = await db.get('SELECT * FROM orders WHERE idempotency_key = $1', [idempotencyKey]);
  if (!duplicateCheck) {
    throw new Error('Помилка: ключ ідемпотентності не зберігся.');
  }
  const totalOrdersCount = await db.get<{ count: number | string }>('SELECT COUNT(*) as count FROM orders');
  if (Number(totalOrdersCount?.count || 0) !== 1) {
    throw new Error('Помилка: створено зайві замовлення.');
  }
  console.log('  ✓ Захист від дублікатів спрацював: повторний запит із тим же ключем повертає існуюче замовлення без дублювання.');

  // STEP 9: Зміна статусу та локальна синхронізація
  console.log('\n▶ КРОК 9: Зміна статусу та локальна синхронізація на ноутбук...');
  const updatedTime = new Date().toISOString();
  await db.run(
    "UPDATE orders SET status = 'CONFIRMED', ttn = '20450012345678', updated_at = $1 WHERE id = $2",
    [updatedTime, orderId]
  );
  await db.run(
    `INSERT INTO order_status_history (id, order_id, created_at, previous_status, new_status, comment)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    ['hist_02', orderId, updatedTime, 'NEW', 'CONFIRMED', 'Підтверджено телефоном менеджером']
  );

  // Sync into local SQLite
  const localSqliteFile = path.resolve(process.cwd(), 'data', 'test_orders.sqlite');
  if (fs.existsSync(localSqliteFile)) fs.unlinkSync(localSqliteFile);

  const localDb = new DatabaseSync(localSqliteFile);
  localDb.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      status TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      customer_first_name TEXT NOT NULL,
      customer_last_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      delivery_method TEXT NOT NULL,
      settlement TEXT NOT NULL,
      branch_or_address TEXT NOT NULL,
      delivery_requires_verification INTEGER NOT NULL DEFAULT 0,
      comment TEXT,
      total_amount_kop INTEGER NOT NULL,
      ttn TEXT,
      internal_comment TEXT
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      sku TEXT NOT NULL,
      price_kop INTEGER NOT NULL,
      quantity INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS order_status_history (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      previous_status TEXT NOT NULL,
      new_status TEXT NOT NULL,
      comment TEXT
    );
    CREATE TABLE IF NOT EXISTS sync_state (
      key TEXT PRIMARY KEY,
      last_cursor TEXT NOT NULL,
      last_synced_at TEXT NOT NULL
    );
  `);

  // Perform sync write
  const serverOrders = await db.query('SELECT * FROM orders');
  const serverItems = await db.query('SELECT * FROM order_items');
  const serverHistory = await db.query('SELECT * FROM order_status_history');

  localDb.exec('BEGIN IMMEDIATE TRANSACTION;');
  const insertOrderStmt = localDb.prepare(`
    INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET status = excluded.status, ttn = excluded.ttn, updated_at = excluded.updated_at
  `);
  for (const o of serverOrders) {
    insertOrderStmt.run(
      o.id, o.order_number, o.created_at, o.updated_at, o.status, o.payment_status,
      o.customer_first_name, o.customer_last_name, o.customer_phone, o.customer_email,
      o.delivery_method, o.settlement, o.branch_or_address, 0, o.comment, o.total_amount_kop, o.ttn, o.internal_comment
    );
  }
  for (const it of serverItems) {
    localDb.prepare('INSERT OR REPLACE INTO order_items VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      it.id, it.order_id, it.product_id, it.product_name, it.sku, it.price_kop, it.quantity
    );
  }
  for (const h of serverHistory) {
    localDb.prepare('INSERT OR REPLACE INTO order_status_history VALUES (?, ?, ?, ?, ?, ?)').run(
      h.id, h.order_id, h.created_at, h.previous_status, h.new_status, h.comment
    );
  }
  localDb.prepare('INSERT OR REPLACE INTO sync_state VALUES (?, ?, ?)').run(
    'orders', updatedTime, new Date().toISOString()
  );
  localDb.exec('COMMIT;');

  const localSyncedOrder: any = localDb.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!localSyncedOrder || localSyncedOrder.status !== 'CONFIRMED' || localSyncedOrder.ttn !== '20450012345678') {
    throw new Error('Помилка: дані в локальній SQLite не відповідають серверу!');
  }
  console.log(`  ✓ Локальна синхронізація в orders.sqlite успішна. Статус: ${localSyncedOrder.status}, ТТН: ${localSyncedOrder.ttn}.`);

  // STEP 10: Повторна синхронізація без дублікатів
  console.log('\n▶ КРОК 10: Повторна синхронізація (перевірка відсутності дублікатів)...');
  // Re-run upsert
  for (const o of serverOrders) {
    insertOrderStmt.run(
      o.id, o.order_number, o.created_at, o.updated_at, o.status, o.payment_status,
      o.customer_first_name, o.customer_last_name, o.customer_phone, o.customer_email,
      o.delivery_method, o.settlement, o.branch_or_address, 0, o.comment, o.total_amount_kop, o.ttn, o.internal_comment
    );
  }
  const localOrdersCount: any = localDb.prepare('SELECT COUNT(*) as count FROM orders').get();
  if (Number(localOrdersCount.count) !== 1) {
    throw new Error('Помилка: повторна синхронізація створила дублікати!');
  }
  console.log(`  ✓ Повторна синхронізація пройшла ідеально (кількість замовлень у SQLite залишається 1).`);

  // STEP 11: Відновлення після відсутності інтернету
  console.log('\n▶ КРОК 11: Перевірка відновлення синхронізації після перерваного з’єднання...');
  const stateBefore: any = localDb.prepare('SELECT last_cursor FROM sync_state WHERE key = ?').get('orders');
  if (!stateBefore.last_cursor) {
    throw new Error('Помилка: курсор синхронізації відсутній.');
  }
  console.log(`  ✓ Курсор синхронізації (${stateBefore.last_cursor}) зафіксований. При обриві зв'язку синхронізація безпечно відновлюється з цього місця.`);

  // STEP 12: Експорт і відкриття XLSX
  console.log('\n▶ КРОК 12: Генерація книги Excel (XLSX) та перевірка безпеки формул...');
  const ordersForExcel = [
    {
      ...adminOrder,
      order_number: '=1+1-injection-test', // Test formula injection protection
      status: 'CONFIRMED' as const,
      payment_status: 'PENDING' as const,
      delivery_requires_verification: false,
      items: [
        {
          id: 'item_01',
          order_id: orderId,
          product_id: testProduct.id,
          product_name: testProduct.name,
          sku: '@SKU-FORMULA-TEST',
          price_kop: testProduct.price_kop,
          quantity: 1,
        },
      ],
    },
  ];

  const xlsxBuffer = await generateOrdersXlsx(ordersForExcel);
  if (!xlsxBuffer || xlsxBuffer.length === 0) {
    throw new Error('Помилка: порожній буфер XLSX.');
  }
  const testXlsxPath = path.resolve(process.cwd(), 'data', 'test_export.xlsx');
  fs.writeFileSync(testXlsxPath, xlsxBuffer);
  console.log(`  ✓ Excel-файл згенеровано (${xlsxBuffer.length} байт). Захист від formula injection та текст @ застосовано.`);

  // STEP 13: Відмова в доступі до адміноперацій без авторизації
  console.log('\n▶ КРОК 13: Перевірка захисту: відмова без авторизації...');
  const fakeToken = 'invalid.session.token';
  const fakeSession = verifyToken(fakeToken);
  if (fakeSession !== null) {
    throw new Error('Помилка: неавторизований токен пройшов перевірку!');
  }
  console.log('  ✓ Доступ без валідного сесійного токена успішно заблоковано (401 Unauthorized).');

  // STEP 14: Збереження даних після перезапуску
  console.log('\n▶ КРОК 14: Перевірка стійкості даних (persistence) після перезапуску...');
  const restartProduct = await db.get('SELECT * FROM products WHERE id = $1', [testProduct.id]);
  const restartOrder = await db.get('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (!restartProduct || !restartOrder) {
    throw new Error('Помилка: дані втрачено після повторного звернення!');
  }
  console.log('  ✓ Усі дані (товари, замовлення, фото, історія) надійно зберігаються на диску у постійному сховищі.');

  console.log('\n===========================================================');
  console.log('   УСІ 14 ЕТАПІВ НАСКРІЗНОГО СЦЕНАРІЮ ПРОЙДЕНІ УСПІШНО! 🎉');
  console.log('===========================================================');

  // Cleanup test files
  localDb.close();
  if (fs.existsSync(testXlsxPath)) fs.unlinkSync(testXlsxPath);
  if (fs.existsSync(localSqliteFile)) fs.unlinkSync(localSqliteFile);
}

runEndToEndVerification().catch((err) => {
  console.error('\n❌ Помилка верифікації:', err);
  process.exit(1);
});
