import { getDb } from '@/lib/db';
import { StoreSettings } from '@/types';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  store_name: process.env.STORE_NAME || 'Gen',
  store_phone: process.env.STORE_PHONE || '+380 44 123 45 67',
  store_email: process.env.STORE_EMAIL || 'info@gen-store.ua',
  store_working_hours: process.env.STORE_WORKING_HOURS || 'Пн-Сб: 09:00 - 19:00, Нд: 10:00 - 16:00',
  store_pickup_address: process.env.STORE_PICKUP_ADDRESS || 'м. Київ, вул. Енергетиків, 10',
  pickup_enabled: true,
  courier_enabled: true,
  seller_legal_name: null,
  seller_edrpou: null,
  seller_tax_info: null,
  seller_address: null,
  warranty_terms: 'Офіційна гарантія від виробника. Термін гарантії вказано в характеристиках товару. Сервісне обслуговування здійснюється через авторизовані сервісні центри по всій Україні.',
  privacy_policy: null,
  terms_of_service: null,
  nova_poshta_api_key: process.env.NOVA_POSHTA_API_KEY || null,
};

export async function getStoreSettings(): Promise<StoreSettings> {
  const db = getDb();
  const rows = await db.query<{ key: string; value: string }>('SELECT key, value FROM store_settings');
  const dbMap = new Map(rows.map(r => [r.key, r.value]));

  return {
    store_name: dbMap.get('store_name') || DEFAULT_STORE_SETTINGS.store_name,
    store_phone: dbMap.get('store_phone') || DEFAULT_STORE_SETTINGS.store_phone,
    store_email: dbMap.get('store_email') || DEFAULT_STORE_SETTINGS.store_email,
    store_working_hours: dbMap.get('store_working_hours') || DEFAULT_STORE_SETTINGS.store_working_hours,
    store_pickup_address: dbMap.get('store_pickup_address') || DEFAULT_STORE_SETTINGS.store_pickup_address,
    pickup_enabled: dbMap.has('pickup_enabled') ? dbMap.get('pickup_enabled') === '1' : DEFAULT_STORE_SETTINGS.pickup_enabled,
    courier_enabled: dbMap.has('courier_enabled') ? dbMap.get('courier_enabled') === '1' : DEFAULT_STORE_SETTINGS.courier_enabled,
    seller_legal_name: dbMap.get('seller_legal_name') || null,
    seller_edrpou: dbMap.get('seller_edrpou') || null,
    seller_tax_info: dbMap.get('seller_tax_info') || null,
    seller_address: dbMap.get('seller_address') || null,
    warranty_terms: dbMap.get('warranty_terms') || DEFAULT_STORE_SETTINGS.warranty_terms,
    privacy_policy: dbMap.get('privacy_policy') || null,
    terms_of_service: dbMap.get('terms_of_service') || null,
    nova_poshta_api_key: dbMap.get('nova_poshta_api_key') || process.env.NOVA_POSHTA_API_KEY || null,
  };
}

export async function updateStoreSettings(settings: Partial<StoreSettings>): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();

  for (const [key, value] of Object.entries(settings)) {
    if (value === undefined) continue;
    const strVal = typeof value === 'boolean' ? (value ? '1' : '0') : (value === null ? '' : String(value));
    
    // SQLite / PostgreSQL compatible upsert
    if (db.isPostgres()) {
      await db.run(
        `INSERT INTO store_settings (key, value, updated_at) VALUES ($1, $2, $3)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
        [key, strVal, now]
      );
    } else {
      await db.run(
        `INSERT INTO store_settings (key, value, updated_at) VALUES ($1, $2, $3)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        [key, strVal, now]
      );
    }
  }
}
