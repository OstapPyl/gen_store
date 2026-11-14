import { getStoreSettings } from './settings';

export interface NovaPoshtaSettlement {
  ref: string;
  name: string;
  region: string;
  area: string;
  type: string;
}

export interface NovaPoshtaWarehouse {
  ref: string;
  name: string;
  number: string;
  address: string;
  maxWeightAllowed: number; // in kg (0 means no limit or freight)
  typeOfWarehouse: string;
}

export interface DeliveryValidationResult {
  valid: boolean;
  requiresManagerVerification: boolean;
  message?: string;
}

export async function searchSettlements(query: string): Promise<NovaPoshtaSettlement[]> {
  const settings = await getStoreSettings();
  const apiKey = settings.nova_poshta_api_key;
  if (!apiKey || query.trim().length < 2) {
    return [];
  }

  try {
    const res = await fetch('https://api.novaposhta.ua/v2.0/json/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        modelName: 'Address',
        calledMethod: 'searchSettlements',
        methodProperties: {
          CityName: query.trim(),
          Limit: '20',
          Page: '1',
        },
      }),
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!data.success || !data.data?.[0]?.Addresses) return [];

    return data.data[0].Addresses.map((addr: any) => ({
      ref: addr.DeliveryCity || addr.Ref,
      name: addr.Present || `${addr.MainDescription} (${addr.Area})`,
      region: addr.Area || '',
      area: addr.Region || '',
      type: addr.SettlementTypeCode || '',
    }));
  } catch (err) {
    console.error('Nova Poshta settlement search failed:', err);
    return [];
  }
}

export async function getWarehouses(cityRef: string, search = ''): Promise<NovaPoshtaWarehouse[]> {
  const settings = await getStoreSettings();
  const apiKey = settings.nova_poshta_api_key;
  if (!apiKey || !cityRef) {
    return [];
  }

  try {
    const res = await fetch('https://api.novaposhta.ua/v2.0/json/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        modelName: 'Address',
        calledMethod: 'getWarehouses',
        methodProperties: {
          CityRef: cityRef,
          FindByString: search,
          Limit: '100',
        },
      }),
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!data.success || !Array.isArray(data.data)) return [];

    return data.data.map((wh: any) => ({
      ref: wh.Ref,
      name: wh.Description,
      number: wh.Number,
      address: wh.ShortAddress || wh.Description,
      maxWeightAllowed: Number(wh.TotalMaxWeightAllowed || wh.PlaceMaxWeightAllowed || 0),
      typeOfWarehouse: wh.TypeOfWarehouse,
    }));
  } catch (err) {
    console.error('Nova Poshta warehouses search failed:', err);
    return [];
  }
}

export function validateWarehouseWeight(
  warehouseMaxWeight: number,
  orderTotalShippingWeightKg: number
): DeliveryValidationResult {
  // If warehouse limit is 0, it is usually a cargo department (вантажне відділення) with no max weight
  if (warehouseMaxWeight === 0) {
    return {
      valid: true,
      requiresManagerVerification: false,
    };
  }

  if (orderTotalShippingWeightKg <= 0) {
    return {
      valid: true,
      requiresManagerVerification: true,
      message: 'Маса товарів не вказана. Спосіб доставки потребує підтвердження менеджером.',
    };
  }

  if (orderTotalShippingWeightKg > warehouseMaxWeight) {
    return {
      valid: false,
      requiresManagerVerification: true,
      message: `Вага замовлення (${orderTotalShippingWeightKg} кг) перевищує обмеження відділення (${warehouseMaxWeight} кг). Оберіть вантажне відділення.`,
    };
  }

  return {
    valid: true,
    requiresManagerVerification: false,
  };
}
