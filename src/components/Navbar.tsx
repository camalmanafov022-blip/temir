import { ChevronLeft } from 'lucide-react';
import { MobileTabId } from './MobileBottomNav';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  orderCount: number;
  mobileTab: MobileTabId;
  onSelectMobileTab: (tab: MobileTabId) => void;
  onNavigate: (sectionId: string) => void;
}

const MOBILE_TITLES: Record<MobileTabId, string> = {
  home: 'UstaLab',
  camera: 'Kamera Diaqnostikası',
  services: 'Təmir Xidmətləri',
  orders: 'Usta Sifarişi',
};

export function Navbar({
  orderCount,
  mobileTab,
  onSelectMobileTab,
  onNavigate,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 pt-safe">
      {/* Mobile Compact Top App Bar (48px) */}
      <div className="md:hidden px-4 h-12 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 min-w-0">
          {mobileTab !== 'home' && (
            <button
              type="button"
              onClick={() => onSelectMobileTab('home')}
              aria-label="Əsas səhifəyə qayıt"
              className="min-w-[40px] min-h-[40px] -ml-2 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <span className="text-base font-bold tracking-tight text-slate-900 truncate">
            {MOBILE_TITLES[mobileTab]}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton compact />
          <button
            type="button"
            onClick={() => onSelectMobileTab('orders')}
            className="inline-flex items-center justify-center px-3 min-h-[36px] text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Usta Çağır
          </button>
        </div>
      </div>

      {/* Desktop Top Bar (Strict 3-Zone Contract) */}
      <div className="hidden md:flex max-w-7xl mx-auto px-6 lg:px-8 h-16 items-center justify-between gap-8">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('top');
          }}
          className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600"
        >
          UstaLab
        </a>

        <nav
          aria-label="Əsas naviqasiya"
          className="flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          <a
            href="#diaqnostika"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('diaqnostika');
            }}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Kamera Diaqnostikası
          </a>
          <a
            href="#xidmetler"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('xidmetler');
            }}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Xidmətlər
          </a>
          <a
            href="#sifaris"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('sifaris');
            }}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Sifariş Ver
          </a>
          <a
            href="#sifarislerim"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('sifarislerim');
            }}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 tabular-nums"
          >
            {orderCount > 0 ? `Sifarişlərim (${orderCount})` : 'Sifarişlərim'}
          </a>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('sifaris')}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          >
            Usta Çağır
          </button>
        </div>
      </div>
    </header>
  );
}
