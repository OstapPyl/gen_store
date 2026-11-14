export type AvailabilityStatus = 'IN_STOCK' | 'WAITING' | 'OUT_OF_STOCK';
export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type FuelType = 'PETROL' | 'DIESEL' | 'GAS' | 'DUAL_FUEL';
export type PhaseType = 'SINGLE' | 'THREE' | 'SWITCH_1_3';
export type StartMethod = 'MANUAL' | 'ELECTRIC' | 'ATS' | 'REMOTE';
export type TriState = 'YES' | 'NO' | 'UNKNOWN';

export type OrderStatus = 'NEW' | 'CONFIRMED' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED';
export type DeliveryMethod = 'NOVA_POSHTA_BRANCH' | 'COURIER' | 'PICKUP';

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  model: string;
  price_kop: number; // in kopecks
  stock: number;
  availability_status: AvailabilityStatus;
  status: ProductStatus;
  short_description: string;
  full_description?: string | null;
  images: string[]; // URLs or paths
  pdf_manual_url?: string | null;

  // Power & Specs
  nominal_power_kw: number;
  max_power_kw?: number | null;
  fuel_type: FuelType;
  nominal_power_petrol_kw?: number | null;
  max_power_petrol_kw?: number | null;
  nominal_power_gas_kw?: number | null;
  max_power_gas_kw?: number | null;
  is_inverter: boolean;
  phase_type: PhaseType;
  voltage: string[]; // e.g. ["230V", "400V"]
  starting_methods: StartMethod[];

  // Additional options
  alternator_type?: string | null;
  has_avr: TriState;
  ats_compatible: TriState;
  ats_unit_included: TriState;
  fuel_tank_capacity_l?: number | null;
  fuel_consumption_lh?: number | null;
  fuel_consumption_load_pct?: number | null;
  autonomy_hours?: number | null;
  autonomy_load_pct?: number | null;
  noise_level_db?: number | null;
  noise_measurement_conditions?: string | null;
  engine_specs?: string | null;
  sockets?: string | null;
  net_weight_kg?: number | null;
  dimensions_mm?: string | null;
  shipping_weight_kg?: number | null;
  shipping_dimensions_mm?: string | null;
  has_wheels: TriState;
  has_handles: TriState;
  has_noise_canopy: TriState;
  warranty_months?: number | null;
  included_accessories?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;

  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  price_kop: number;
  quantity: number;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  created_at: string;
  previous_status: string;
  new_status: string;
  comment?: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  created_at: string;
  updated_at: string;
  idempotency_key?: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  customer_first_name: string;
  customer_last_name: string;
  customer_phone: string;
  customer_email?: string | null;
  delivery_method: DeliveryMethod;
  settlement: string;
  settlement_ref?: string | null;
  branch_or_address: string;
  branch_ref?: string | null;
  delivery_requires_verification: boolean;
  delivery_verification_reason?: string | null;
  comment?: string | null;
  total_amount_kop: number;
  ttn?: string | null;
  internal_comment?: string | null;
  items?: OrderItem[];
  history?: OrderStatusHistory[];
}

export interface StoreSettings {
  store_name: string;
  store_phone: string;
  store_email: string;
  store_working_hours: string;
  store_pickup_address: string;
  pickup_enabled: boolean;
  courier_enabled: boolean;
  seller_legal_name?: string | null;
  seller_edrpou?: string | null;
  seller_tax_info?: string | null;
  seller_address?: string | null;
  warranty_terms?: string | null;
  privacy_policy?: string | null;
  terms_of_service?: string | null;
  nova_poshta_api_key?: string | null;
}

export interface CatalogFilterParams {
  query?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'power_asc';
  price_min?: number;
  price_max?: number;
  brands?: string[];
  power_min?: number;
  power_max?: number;
  fuels?: FuelType[];
  inverter?: 'yes' | 'no';
  phases?: PhaseType[];
  start_methods?: StartMethod[];
  in_stock_only?: boolean;
  // Additional filters
  voltage?: string[];
  avr?: 'yes' | 'no';
  ats_compatible?: 'yes' | 'no';
  ats_unit_included?: 'yes' | 'no';
  tank_min?: number;
  tank_max?: number;
  weight_min?: number;
  weight_max?: number;
  canopy?: 'yes' | 'no';
  wheels?: 'yes' | 'no';
  page?: number;
  limit?: number;
}
