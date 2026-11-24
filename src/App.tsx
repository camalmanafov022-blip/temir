import { useCallback, useEffect, useState } from 'react';
import {
  AirVent,
  ArrowDownRight,
  Camera,
  ChevronRight,
  Droplets,
  Hammer,
  Tv,
  WashingMachine,
  Wrench,
  Zap,
} from 'lucide-react';
import { CameraDiagnostics } from './components/CameraDiagnostics';
import { MobileBottomNav, MobileTabId } from './components/MobileBottomNav';
import { Navbar } from './components/Navbar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { OrderForm } from './components/OrderForm';
import { OrdersPanel } from './components/OrdersPanel';
import { PWAInstallButton } from './components/PWAInstallButton';
import { ServicesCatalog } from './components/ServicesCatalog';
import { heroTechImg, SERVICE_CATALOG } from './data/services';
import { fetchOrdersList, updateServiceOrderStatus } from './lib/api';
import {
  DiagnosticResult,
  OrderStatus,
  ServiceCategoryId,
  ServiceOrder,
} from './types';

const QUICK_CATEGORY_ICONS: Record<ServiceCategoryId, typeof Wrench> = {
  kondisioner: AirVent,
  paltaryuyan: WashingMachine,
  televizor: Tv,
  santexnika: Droplets,
  elektrik: Zap,
  ev_temiri: Hammer,
};

export default function App() {
  const [selectedCategory, setSelectedCategory] =
    useState<ServiceCategoryId>('kondisioner');
  const [prefilledIssue, setPrefilledIssue] = useState('');
  const [attachedDiagnosis, setAttachedDiagnosis] =
    useState<DiagnosticResult | null>(null);

  const [mobileTab, setMobileTab] = useState<MobileTabId>('home');
  const [mobileOrderSubTab, setMobileOrderSubTab] = useState<'new' | 'list'>('new');

  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [heroImageFailed, setHeroImageFailed] = useState(false);

  const scrollToSection = useCallback((sectionId: string) => {
    if (sectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleSelectMobileTab = useCallback((tab: MobileTabId) => {
    setMobileTab(tab);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const loaded = await fetchOrdersList();
      setOrders(loaded);
    } catch (err: unknown) {
      setOrdersError(
        err instanceof Error ? err.message : 'Sifariş siyahısını yükləmək mümkün olmadı.'
      );
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSelectService = (
    category: ServiceCategoryId,
    defaultIssue?: string
  ) => {
    setSelectedCategory(category);
    if (defaultIssue) {
      setPrefilledIssue(defaultIssue);
    }
    setMobileTab('orders');
    setMobileOrderSubTab('new');
    scrollToSection('sifaris');
  };

  const handleBookFromDiagnosis = (diagnosis: DiagnosticResult) => {
    setAttachedDiagnosis(diagnosis);
    setSelectedCategory(diagnosis.recommendedCategory);
    setPrefilledIssue(diagnosis.likelyFault);
    setMobileTab('orders');
    setMobileOrderSubTab('new');
    scrollToSection('sifaris');
  };

  const handleOrderCreated = (newOrder: ServiceOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const updatedOrder = await updateServiceOrderStatus(orderId, status);
    if (updatedOrder) {
      setOrders((prev) =>
        prev.map((item) => (item.id === orderId ? updatedOrder : item))
      );
    }
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        orderCount={orders.length}
        mobileTab={mobileTab}
        onSelectMobileTab={handleSelectMobileTab}
        onNavigate={scrollToSection}
      />

      <OfflineIndicator />

      <main className="flex-1 pb-24 md:pb-0">
        {/* Hero & Mobile Home Overview */}
        <section
          className={`bg-white ${mobileTab === 'home' ? 'block' : 'hidden md:block'}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-16 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 lg:gap-12 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-center">
                <p className="text-xs sm:text-sm font-semibold text-orange-600">
                  Məişət Texnikası · Santexnika · Elektrik · Ev Təmiri
                </p>

                <h1 className="mt-2 sm:mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15] text-balance">
                  Nasazlığı kamera ilə göstərin, dəqiq diaqnoz və usta çağırışı alın
                </h1>

                <p className="mt-3 sm:mt-5 text-sm sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                  Kondisioner, paltaryuyan, televizor, santexnika və elektrik problemlərini tətbiq daxilində kamera ilə göstərin. Sistem nasazlığı avtomatik təhlil edir və ixtisaslaşmış ustaya sifarişi hazır edir.
                </p>

                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectMobileTab('camera');
                      scrollToSection('diaqnostika');
                    }}
                    className="inline-flex items-center justify-center gap-2.5 min-h-[48px] px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-orange-600 hover:bg-orange-700 active:scale-[0.98] rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Kamera ilə Diaqnostika Et</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleSelectMobileTab('services');
                      scrollToSection('xidmetler');
                    }}
                    className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-3.5 text-sm sm:text-base font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Xidmətlərə Bax</span>
                    <ArrowDownRight className="w-4 h-4" />
                  </button>

                  <div className="hidden md:block">
                    <PWAInstallButton />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 flex">
                {heroImageFailed ? (
                  <div className="w-full min-h-[220px] sm:min-h-[320px] lg:h-full rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center p-8 text-center">
                    <Wrench className="w-10 h-10 text-slate-400 mb-3" />
                    <p className="text-base font-semibold text-slate-700">
                      Peşəkar texniki servis və yerində diaqnostika
                    </p>
                  </div>
                ) : (
                  <div className="w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-[16/10] lg:aspect-auto lg:h-full">
                    <img
                      src={heroTechImg}
                      alt="Kondisioner sistemini diaqnostika edən peşəkar usta"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImageFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Quick-Access Touch Grid (visible only on mobile home tab) */}
            <div className="md:hidden mt-7 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900">
                  Sürətli Xidmət Seçimi
                </h2>
                <button
                  type="button"
                  onClick={() => handleSelectMobileTab('services')}
                  className="text-xs font-semibold text-orange-600 inline-flex items-center gap-0.5 min-h-[36px] px-1 cursor-pointer"
                >
                  <span>Hamısı</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {SERVICE_CATALOG.map((service) => {
                  const Icon = QUICK_CATEGORY_ICONS[service.id];
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => handleSelectService(service.id, service.commonIssues[0])}
                      className="min-h-[72px] p-3.5 bg-slate-50 hover:bg-slate-100 active:scale-[0.98] border border-slate-200 rounded-2xl text-left flex items-start gap-3 transition-all cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-orange-600 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {service.shortLabel}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500 font-mono tabular-nums truncate">
                          {service.priceRangeAzn}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4-Column Service Guarantee Strip */}
            <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div>
                <p className="text-base sm:text-lg font-bold text-slate-900 tabular-nums">
                  1 – 2 saat
                </p>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  Təcili santexnika və elektrik çağırışlarında ünvana çıxış
                </p>
              </div>
              <div>
                <p className="text-base sm:text-lg font-bold text-slate-900 tabular-nums">
                  6 – 12 ay
                </p>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  Görülən təmir işlərinə və detallara yazılı zəmanət
                </p>
              </div>
              <div>
                <p className="text-base sm:text-lg font-bold text-slate-900 tabular-nums">
                  6 əsas sahə
                </p>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  Kondisioner, paltaryuyan, TV, santexnika, elektrik, ev təmiri
                </p>
              </div>
              <div>
                <p className="text-base sm:text-lg font-bold text-slate-900 tabular-nums">
                  Pulsuz analiz
                </p>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  Kamera görüntüsü ilə avtomatik ilkin nasazlıq hesabatı
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Camera AI Diagnostic Workbench */}
        <div className={mobileTab === 'camera' ? 'block' : 'hidden md:block'}>
          <CameraDiagnostics onBookFromDiagnosis={handleBookFromDiagnosis} />
        </div>

        {/* Services Catalog */}
        <div className={mobileTab === 'services' ? 'block' : 'hidden md:block'}>
          <ServicesCatalog onSelectService={handleSelectService} />
        </div>

        {/* Mobile Sub-tab Switcher inside Sifariş tab */}
        <div
          className={`md:hidden px-4 pt-4 bg-slate-50 ${
            mobileTab === 'orders' ? 'block' : 'hidden'
          }`}
        >
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/80 rounded-xl">
            <button
              type="button"
              onClick={() => setMobileOrderSubTab('new')}
              className={`min-h-[40px] text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                mobileOrderSubTab === 'new'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              Yeni Sifariş
            </button>
            <button
              type="button"
              onClick={() => setMobileOrderSubTab('list')}
              className={`min-h-[40px] text-xs font-semibold rounded-lg transition-colors tabular-nums cursor-pointer ${
                mobileOrderSubTab === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              {orders.length > 0 ? `Sifarişlərim (${orders.length})` : 'Sifarişlərim'}
            </button>
          </div>
        </div>

        {/* Booking Form */}
        <div
          className={
            mobileTab === 'orders' && mobileOrderSubTab === 'new'
              ? 'block'
              : 'hidden md:block'
          }
        >
          <OrderForm
            selectedCategory={selectedCategory}
            prefilledIssue={prefilledIssue}
            attachedDiagnosis={attachedDiagnosis}
            onClearDiagnosis={() => setAttachedDiagnosis(null)}
            onOrderCreated={handleOrderCreated}
            onViewOrders={() => {
              setMobileTab('orders');
              setMobileOrderSubTab('list');
              scrollToSection('sifarislerim');
            }}
          />
        </div>

        {/* Orders Tracker */}
        <div
          className={
            mobileTab === 'orders' && mobileOrderSubTab === 'list'
              ? 'block'
              : 'hidden md:block'
          }
        >
          <OrdersPanel
            orders={orders}
            loading={ordersLoading}
            error={ordersError}
            onUpdateStatus={handleUpdateOrderStatus}
            onNavigateToBook={() => {
              setMobileTab('orders');
              setMobileOrderSubTab('new');
              scrollToSection('sifaris');
            }}
          />
        </div>
      </main>

      <footer className="hidden md:block bg-slate-900 text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span className="text-lg font-bold text-white tracking-tight">
              UstaLab
            </span>
            <p className="mt-1 text-xs text-slate-400">
              Bakı və Abşeron üzrə məişət texnikası, santexnika, elektrik və ev təmiri xidməti
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
            <a href="#diaqnostika" className="hover:text-white transition-colors">
              Kamera Diaqnostikası
            </a>
            <a href="#xidmetler" className="hover:text-white transition-colors">
              Xidmətlər
            </a>
            <a href="#sifaris" className="hover:text-white transition-colors">
              Sifariş Ver
            </a>
            <a href="#sifarislerim" className="hover:text-white transition-colors">
              Sifarişlərim
            </a>
          </div>
        </div>
      </footer>

      <MobileBottomNav
        activeTab={mobileTab}
        orderCount={orders.length}
        onSelectTab={handleSelectMobileTab}
      />
    </div>
  );
}
