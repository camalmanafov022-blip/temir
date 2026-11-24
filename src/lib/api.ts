import {
  DiagnosticResult,
  OrderStatus,
  OrderUrgency,
  ServiceCategoryId,
  ServiceOrder,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const LOCAL_ORDERS_KEY = 'ustalab_orders_v1';

const TECHNICIANS_BY_CATEGORY: Record<ServiceCategoryId, string[]> = {
  kondisioner: ['Rəşad Məmmədov (İqlim sistemləri)', 'Elvin Qasımov (Soyutma texnikası)'],
  paltaryuyan: ['Tural Əliyev (Məişət texnikası)', 'Orxan Həsənov (Ağ əşya ustası)'],
  televizor: ['Kamran Nəsirov (Elektronika və TV)', 'Fərid İsmayılov (Plata mütəxəssisi)'],
  santexnika: ['Vüsal Rzayev (Santexnika və istilik)', 'Samir Babayev (Boru və kombi)'],
  elektrik: ['Nurlan Cəfərov (Baş elektrik)', 'Elnur Kərimov (Şit və xətt ustası)'],
  ev_temiri: ['Cavid Quliyev (Daxili təmir)', 'Anar Hüseynov (Montaj və bərpa)'],
};

function readLocalOrders(): ServiceOrder[] {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalOrders(orders: ServiceOrder[]): void {
  try {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // Ignore storage quota errors
  }
}

function isJsonResponse(response: Response): boolean {
  const ct = response.headers.get('content-type') || '';
  return ct.includes('application/json');
}

export async function fetchOrdersList(): Promise<ServiceOrder[]> {
  try {
    const response = await fetch(`${API_BASE}/api/orders`);
    if (response.ok && isJsonResponse(response)) {
      const data = await response.json();
      const serverOrders = Array.isArray(data.orders) ? data.orders : [];
      writeLocalOrders(serverOrders);
      return serverOrders;
    }
  } catch {
    // Static host or offline mode — use localStorage seamlessly
  }
  return readLocalOrders();
}

export interface CreateOrderPayload {
  customerName: string;
  phone: string;
  district: string;
  address: string;
  category: ServiceCategoryId;
  issueTitle: string;
  description: string;
  urgency: OrderUrgency;
  preferredTime: string;
  estimatedCostAzn: string;
  diagnosticSummary?: ServiceOrder['diagnosticSummary'];
}

export async function createServiceOrder(
  payload: CreateOrderPayload
): Promise<ServiceOrder> {
  try {
    const response = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (isJsonResponse(response)) {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Sifariş qeydə alınarkən xəta baş verdi.');
      }
      const existing = readLocalOrders();
      writeLocalOrders([data.order, ...existing]);
      return data.order;
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('xəta')) {
      throw err;
    }
    // Static host (404/405 HTML) or offline -> fall through to localStorage persistence
  }

  const existing = readLocalOrders();
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const techPool =
    TECHNICIANS_BY_CATEGORY[payload.category] || TECHNICIANS_BY_CATEGORY.ev_temiri;

  const localOrder: ServiceOrder = {
    id: `${Date.now()}-${randomDigits}`,
    orderNumber: `UL-${randomDigits}`,
    customerName: payload.customerName,
    phone: payload.phone,
    district: payload.district,
    address: payload.address,
    category: payload.category,
    issueTitle: payload.issueTitle,
    description: payload.description,
    urgency: payload.urgency,
    preferredTime: payload.preferredTime,
    status: payload.urgency === 'Təcili' ? 'Usta təyin edilib' : 'Gözləmədə',
    estimatedCostAzn: payload.estimatedCostAzn,
    assignedTechnician: techPool[existing.length % techPool.length],
    createdAt: new Date().toISOString(),
    diagnosticSummary: payload.diagnosticSummary,
  };

  writeLocalOrders([localOrder, ...existing]);
  return localOrder;
}

export async function updateServiceOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<ServiceOrder | null> {
  try {
    const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (response.ok && isJsonResponse(response)) {
      const data = await response.json();
      if (data.order) {
        const updated = readLocalOrders().map((o) =>
          o.id === orderId ? data.order : o
        );
        writeLocalOrders(updated);
        return data.order;
      }
    }
  } catch {
    // Fall back to localStorage update
  }

  const existing = readLocalOrders();
  let updatedOrder: ServiceOrder | null = null;
  const next = existing.map((item) => {
    if (item.id === orderId) {
      updatedOrder = { ...item, status };
      return updatedOrder;
    }
    return item;
  });
  writeLocalOrders(next);
  return updatedOrder;
}

export async function diagnoseWithCamera(params: {
  imageBase64: string;
  mimeType: string;
  categoryHint: string;
  userNote: string;
}): Promise<DiagnosticResult> {
  const response = await fetch(`${API_BASE}/api/diagnose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!isJsonResponse(response)) {
    throw new Error(
      'Kamera AI diaqnostikası üçün backend server (/api/diagnose) aktiv olmalıdır. GitHub Pages yalnız statik HTML faylları açdığı üçün backend hissəsini Render, Railway və ya Cloud Run üzərində işə salıb VITE_API_BASE_URL ilə bağlaya bilərsiniz.'
    );
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Diaqnostika zamanı server xətası baş verdi.');
  }

  return data as DiagnosticResult;
}
