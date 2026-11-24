import { Camera, ClipboardList, Home, Wrench } from 'lucide-react';

export type MobileTabId = 'home' | 'camera' | 'services' | 'orders';

interface MobileBottomNavProps {
  activeTab: MobileTabId;
  orderCount: number;
  onSelectTab: (tab: MobileTabId) => void;
}

export function MobileBottomNav({
  activeTab,
  orderCount,
  onSelectTab,
}: MobileBottomNavProps) {
  const tabs: {
    id: MobileTabId;
    label: string;
    icon: typeof Home;
  }[] = [
    { id: 'home', label: 'Əsas', icon: Home },
    { id: 'camera', label: 'Kamera', icon: Camera },
    { id: 'services', label: 'Xidmətlər', icon: Wrench },
    {
      id: 'orders',
      label: orderCount > 0 ? `Sifariş (${orderCount})` : 'Sifariş',
      icon: ClipboardList,
    },
  ];

  return (
    <nav
      aria-label="Mobil alt menyu"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe"
    >
      <div className="grid grid-cols-4 items-center h-[60px]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`min-h-[44px] h-full flex flex-col items-center justify-center px-1 transition-colors cursor-pointer ${
                isActive
                  ? 'text-orange-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon
                className="w-[21px] h-[21px]"
                strokeWidth={isActive ? 2.3 : 1.8}
              />
              <span
                className={`mt-1 text-[11px] leading-none tracking-tight whitespace-nowrap truncate max-w-full tabular-nums ${
                  isActive ? 'font-bold' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
