import { useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  MapPin,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { CATEGORY_LABELS } from '../data/services';
import { OrderStatus, ServiceOrder } from '../types';

interface OrdersPanelProps {
  orders: ServiceOrder[];
  loading: boolean;
  error: string | null;
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onNavigateToBook: () => void;
}

const STATUS_FILTERS: ('Hamısı' | OrderStatus)[] = [
  'Hamısı',
  'Gözləmədə',
  'Usta təyin edilib',
  'Tamamlandı',
  'Ləğv edilib',
];

function formatDateTimeAz(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('az-AZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function OrdersPanel({
  orders,
  loading,
  error,
  onUpdateStatus,
  onNavigateToBook,
}: OrdersPanelProps) {
  const [filter, setFilter] = useState<'Hamısı' | OrderStatus>('Hamısı');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const visibleOrders =
    filter === 'Hamısı' ? orders : orders.filter((o) => o.status === filter);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await onUpdateStatus(orderId, status);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section id="sifarislerim" className="py-6 sm:py-16 lg:py-20 bg-white md:border-t md:border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Aktiv və Keçmiş Sifarişlər
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-slate-600">
              Göndərdiyiniz usta çağırışlarını və təyin edilmiş mütəxəssis statuslarını buradan izləyin.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar max-w-full">
            {STATUS_FILTERS.map((statusOption) => {
              const active = filter === statusOption;
              return (
                <button
                  key={statusOption}
                  type="button"
                  onClick={() => setFilter(statusOption)}
                  className={`min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {statusOption}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((skeleton) => (
              <div
                key={skeleton}
                className="h-32 bg-slate-100 border border-slate-200 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="p-8 sm:p-10 bg-slate-50 border border-slate-200 rounded-2xl text-center">
            <ClipboardList className="w-9 h-9 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">
              {orders.length === 0
                ? 'Hələ heç bir xidmət sifarişi yaradılmayıb'
                : 'Bu status üzrə sifariş tapılmadı'}
            </h3>
            <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
              {orders.length === 0
                ? 'Kamera ilə nasazlığı diaqnostika edin və ya birbaşa usta sifarişi formunu doldurun.'
                : 'Digər status filtrlərini seçərək bütün sifarişlərinizə baxa bilərsiniz.'}
            </p>
            {orders.length === 0 && (
              <button
                type="button"
                onClick={onNavigateToBook}
                className="mt-5 inline-flex items-center justify-center min-h-[46px] px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors cursor-pointer"
              >
                İlk Sifarişi Yarat
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {visibleOrders.map((order) => (
              <article
                key={order.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
                    <span className="font-mono font-semibold text-slate-900">
                      {order.orderNumber}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{CATEGORY_LABELS[order.category]}</span>
                    <span aria-hidden="true">·</span>
                    <span>{order.urgency}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDateTimeAz(order.createdAt)}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {order.issueTitle}
                  </h3>

                  {order.diagnosticSummary && (
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">
                        Kamera diaqnozu:{' '}
                      </span>
                      {order.diagnosticSummary.deviceOrArea} —{' '}
                      {order.diagnosticSummary.likelyFault} (Prioritet:{' '}
                      {order.diagnosticSummary.severity})
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>
                        {order.district}, {order.address}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-slate-400" />
                      <span>{order.assignedTechnician}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono tabular-nums text-slate-800">
                      <span>{order.estimatedCostAzn}</span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                  <div className="inline-flex items-center gap-1.5 text-sm font-semibold">
                    {order.status === 'Tamamlandı' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">Tamamlandı</span>
                      </>
                    ) : order.status === 'Ləğv edilib' ? (
                      <>
                        <XCircle className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-500">Ləğv edilib</span>
                      </>
                    ) : order.status === 'Usta təyin edilib' ? (
                      <>
                        <UserCheck className="w-4 h-4 text-sky-600" />
                        <span className="text-sky-700">Usta təyin edilib</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-amber-700">Gözləmədə</span>
                      </>
                    )}
                  </div>

                  {(order.status === 'Gözləmədə' ||
                    order.status === 'Usta təyin edilib') && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        disabled={updatingId === order.id}
                        onClick={() => handleStatusChange(order.id, 'Tamamlandı')}
                        className="flex-1 sm:flex-none min-h-[40px] px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Tamamlandı
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === order.id}
                        onClick={() => handleStatusChange(order.id, 'Ləğv edilib')}
                        className="flex-1 sm:flex-none min-h-[40px] px-3.5 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Ləğv Et
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
