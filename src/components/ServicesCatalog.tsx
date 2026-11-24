import { useState } from 'react';
import { ArrowRight, Check, Wrench } from 'lucide-react';
import { SERVICE_CATALOG } from '../data/services';
import { ServiceCatalogItem, ServiceCategoryId, ServiceGroupFilter } from '../types';

interface ServicesCatalogProps {
  onSelectService: (category: ServiceCategoryId, defaultIssue?: string) => void;
}

const FILTER_TABS: { id: ServiceGroupFilter; label: string }[] = [
  { id: 'hamisi', label: 'Hamısı' },
  { id: 'meiset', label: 'Məişət Texnikası' },
  { id: 'santexnika', label: 'Santexnika' },
  { id: 'elektrik', label: 'Elektrik' },
  { id: 'ev_temiri', label: 'Ev Təmiri' },
];

function ServiceCardImage({ item }: { item: ServiceCatalogItem }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-full aspect-[4/3] bg-slate-100 border-b border-slate-200 flex flex-col items-center justify-center p-6 text-center">
        <Wrench className="w-8 h-8 text-slate-400 mb-2" />
        <span className="text-sm font-medium text-slate-600">{item.title}</span>
      </div>
    );
  }

  return (
    <div className="w-full aspect-[4/3] bg-slate-100 overflow-hidden border-b border-slate-200">
      <img
        src={item.imageUrl}
        alt={item.imageAlt}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
    </div>
  );
}

export function ServicesCatalog({ onSelectService }: ServicesCatalogProps) {
  const [activeFilter, setActiveFilter] = useState<ServiceGroupFilter>('hamisi');

  const filteredServices =
    activeFilter === 'hamisi'
      ? SERVICE_CATALOG
      : SERVICE_CATALOG.filter((item) => item.group === activeFilter);

  return (
    <section id="xidmetler" className="py-6 sm:py-16 lg:py-20 bg-white md:border-t md:border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6 mb-6 sm:mb-10">
          <div className="max-w-2xl">
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
              Məişət texnikası və ev mühəndisliyi üzrə tam təmir xidmətləri
            </h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              Hər bir sahə üzrə ixtisaslaşmış ustalar yerində diaqnostika, orijinal ehtiyat hissələri və yazılı zəmanətlə xidmət göstərir.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Xidmət kateqoriyaları"
            className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar max-w-full"
          >
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredServices.map((service) => (
            <article
              key={service.id}
              className="group bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between transition-colors hover:border-slate-300"
            >
              <div>
                <ServiceCardImage item={service} />

                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 tabular-nums">
                    <span>{service.shortLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{service.priceRangeAzn}</span>
                    <span aria-hidden="true">·</span>
                    <span>{service.avgDuration}</span>
                  </div>

                  <h3 className="mt-2 text-lg font-bold text-slate-900">
                    {service.title}
                  </h3>

                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                    {service.subtitle}
                  </p>

                  <ul className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    {service.commonIssues.map((issue) => (
                      <li key={issue} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <Check className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-2 flex items-center justify-between gap-4">
                <span className="text-xs font-medium text-slate-500 tabular-nums">
                  {service.warrantyMonths} ay rəsmi zəmanət
                </span>
                <button
                  type="button"
                  onClick={() => onSelectService(service.id, service.commonIssues[0])}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-orange-600 active:scale-[0.98] rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Sifariş Et</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
