import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Trash2,
  Wrench,
} from 'lucide-react';
import {
  BAKU_DISTRICTS,
  CATEGORY_LABELS,
  SERVICE_CATALOG,
} from '../data/services';
import { createServiceOrder } from '../lib/api';
import {
  DiagnosticResult,
  OrderUrgency,
  ServiceCategoryId,
  ServiceOrder,
} from '../types';

interface OrderFormProps {
  selectedCategory: ServiceCategoryId;
  prefilledIssue: string;
  attachedDiagnosis: DiagnosticResult | null;
  onClearDiagnosis: () => void;
  onOrderCreated: (order: ServiceOrder) => void;
  onViewOrders: () => void;
}

const TIME_SLOTS = [
  '1–2 saat ərzində (Təcili)',
  'Bu gün (14:00 – 18:00)',
  'Bu gün (18:00 – 21:00)',
  'Sabah səhər (09:00 – 13:00)',
  'Sabah günorta (13:00 – 18:00)',
];

export function OrderForm({
  selectedCategory,
  prefilledIssue,
  attachedDiagnosis,
  onClearDiagnosis,
  onOrderCreated,
  onViewOrders,
}: OrderFormProps) {
  const [category, setCategory] = useState<ServiceCategoryId>(selectedCategory);
  const [issueTitle, setIssueTitle] = useState(prefilledIssue);
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<OrderUrgency>('Planlı');
  const [preferredTime, setPreferredTime] = useState('Bu gün (14:00 – 18:00)');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState(BAKU_DISTRICTS[0]);
  const [address, setAddress] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedOrder, setSubmittedOrder] = useState<ServiceOrder | null>(null);

  useEffect(() => {
    setCategory(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    if (prefilledIssue) {
      setIssueTitle(prefilledIssue);
    }
  }, [prefilledIssue]);

  useEffect(() => {
    if (attachedDiagnosis) {
      setCategory(attachedDiagnosis.recommendedCategory);
      setIssueTitle(attachedDiagnosis.likelyFault);
      setDescription(attachedDiagnosis.technicalExplanation);
      if (attachedDiagnosis.severity === 'Təcili') {
        setUrgency('Təcili');
        setPreferredTime(TIME_SLOTS[0]);
      }
      setSubmittedOrder(null);
    }
  }, [attachedDiagnosis]);

  const activeService =
    SERVICE_CATALOG.find((s) => s.id === category) || SERVICE_CATALOG[0];

  const handleUrgencyChange = (nextUrgency: OrderUrgency) => {
    setUrgency(nextUrgency);
    if (nextUrgency === 'Təcili') {
      setPreferredTime(TIME_SLOTS[0]);
    } else if (preferredTime === TIME_SLOTS[0]) {
      setPreferredTime(TIME_SLOTS[1]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (customerName.trim().length < 2) {
      setFormError('Zəhmət olmasa ad və soyadınızı düzgün daxil edin.');
      return;
    }

    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 9) {
      setFormError('Zəhmət olmasa aktiv mobil nömrə daxil edin (məs. +994 50 123 45 67).');
      return;
    }

    if (address.trim().length < 5) {
      setFormError('Zəhmət olmasa küçə, bina və mənzil məlumatını qeyd edin.');
      return;
    }

    setSubmitting(true);

    try {
      const estimatedCostAzn =
        attachedDiagnosis?.estimatedCostRangeAzn || activeService.priceRangeAzn;

      const createdOrder = await createServiceOrder({
        customerName: customerName.trim(),
        phone: phone.trim(),
        district,
        address: address.trim(),
        category,
        issueTitle: issueTitle.trim() || activeService.title,
        description: description.trim(),
        urgency,
        preferredTime,
        estimatedCostAzn,
        diagnosticSummary: attachedDiagnosis
          ? {
              likelyFault: attachedDiagnosis.likelyFault,
              severity: attachedDiagnosis.severity,
              deviceOrArea: attachedDiagnosis.deviceOrArea,
              estimatedCostRangeAzn: attachedDiagnosis.estimatedCostRangeAzn,
            }
          : undefined,
      });

      setSubmittedOrder(createdOrder);
      onOrderCreated(createdOrder);
      onClearDiagnosis();
      setAddress('');
      setDescription('');
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Sifariş göndərilərkən xəta baş verdi.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="sifaris" className="py-6 sm:py-16 lg:py-20 bg-slate-50 md:border-t md:border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-6 sm:mb-10">
          <p className="text-xs sm:text-sm font-semibold text-orange-600">
            Xidmət Sifarişi
          </p>
          <h2 className="mt-1.5 text-xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            Usta çağırışı rəsmiləşdirin
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
            Məişət texnikası, santexnika, elektrik və ya ev təmiri üzrə sifariş göndərin. Təcili çağırışlarda usta dərhal yönləndirilir.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left: Form or Confirmation */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-8">
            {submittedOrder ? (
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Sifarişiniz qəbul edildi
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Sifariş nömrəsi{' '}
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {submittedOrder.orderNumber}
                      </span>{' '}
                      ilə sistemdə qeydə alındı.
                    </p>
                  </div>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-y border-slate-200 text-sm">
                  <div>
                    <dt className="text-slate-500">Xidmət sahəsi</dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                      {CATEGORY_LABELS[submittedOrder.category]}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Təyin edilən usta</dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                      {submittedOrder.assignedTechnician}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Gəliş vaxtı</dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                      {submittedOrder.preferredTime}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Təxmini qiymət aralığı</dt>
                    <dd className="mt-1 font-mono font-semibold text-slate-900 tabular-nums">
                      {submittedOrder.estimatedCostAzn}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSubmittedOrder(null)}
                    className="min-h-[46px] px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Yeni Sifariş Yarat
                  </button>
                  <button
                    type="button"
                    onClick={onViewOrders}
                    className="min-h-[46px] px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer text-center"
                  >
                    Sifarişlərimə Bax
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
                {formError && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="order-category"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Xidmət kateqoriyası
                    </label>
                    <select
                      id="order-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ServiceCategoryId)}
                      className="w-full min-h-[46px] px-3.5 py-2.5 text-base sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-orange-600"
                    >
                      {SERVICE_CATALOG.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Çağırış növü
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleUrgencyChange('Planlı')}
                        className={`min-h-[38px] py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                          urgency === 'Planlı'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Planlı Baxış
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUrgencyChange('Təcili')}
                        className={`min-h-[38px] py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                          urgency === 'Təcili'
                            ? 'bg-orange-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Təcili (1–2 saat)
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="order-issue"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Nasazlıq və ya görüləcək iş
                  </label>
                  <input
                    id="order-issue"
                    type="text"
                    value={issueTitle}
                    onChange={(e) => setIssueTitle(e.target.value)}
                    placeholder="Məsələn: Kondisioner soyutmur, su damcılayır"
                    className="w-full min-h-[46px] px-3.5 py-2.5 text-base sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-600"
                  />
                  <div className="mt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar sm:flex-wrap pb-1 sm:pb-0">
                    {activeService.commonIssues.slice(0, 3).map((quick) => (
                      <button
                        key={quick}
                        type="button"
                        onClick={() => setIssueTitle(quick)}
                        className="min-h-[36px] px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {quick}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="order-name"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Ad və Soyad
                    </label>
                    <input
                      id="order-name"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Kamran Əliyev"
                      className="w-full min-h-[46px] px-3.5 py-2.5 text-base sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-600"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="order-phone"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Əlaqə nömrəsi
                    </label>
                    <input
                      id="order-phone"
                      type="tel"
                      inputMode="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+994 50 000 00 00"
                      className="w-full min-h-[46px] px-3.5 py-2.5 text-base sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-600 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="order-district"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Rayon / Ərazi
                    </label>
                    <select
                      id="order-district"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full min-h-[46px] px-3.5 py-2.5 text-base sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-orange-600"
                    >
                      {BAKU_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="order-time"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Uyğun vaxt aralığı
                    </label>
                    <select
                      id="order-time"
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full min-h-[46px] px-3.5 py-2.5 text-base sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-orange-600"
                    >
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="order-address"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Dəqiq ünvan (küçə, bina, mənzil)
                  </label>
                  <input
                    id="order-address"
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Məsələn: Azadlıq pr. 48, blok 2, mənzil 14"
                    className="w-full min-h-[46px] px-3.5 py-2.5 text-base sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="order-notes"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Əlavə qeydlər (istəyə bağlı)
                  </label>
                  <textarea
                    id="order-notes"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Cihazın markası, modeli və ya əlavə məlumat..."
                    className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-600"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <span className="text-xs text-slate-500 tabular-nums">
                    İlkin qiymət aralığı:{' '}
                    <strong className="text-slate-800">
                      {attachedDiagnosis?.estimatedCostRangeAzn || activeService.priceRangeAzn}
                    </strong>
                  </span>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto min-h-[48px] px-6 py-3 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 active:scale-[0.98] rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    {submitting ? 'Göndərilir...' : 'Usta Sifarişini Təsdiqlə'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right: Attached AI Diagnosis & Service Standards */}
          <div className="lg:col-span-5 space-y-5">
            {attachedDiagnosis && (
              <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-orange-400">
                      Əlavə Edilmiş Kamera Diaqnozu
                    </span>
                    <h3 className="mt-1 text-base font-bold text-white">
                      {attachedDiagnosis.likelyFault}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={onClearDiagnosis}
                    aria-label="Diaqnozu ayır"
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {attachedDiagnosis.previewImageUrl && (
                  <img
                    src={attachedDiagnosis.previewImageUrl}
                    alt="Diaqnostika görüntüsü"
                    className="w-full h-40 object-cover rounded-xl border border-slate-800"
                  />
                )}

                <div className="text-xs text-slate-300 space-y-1.5 tabular-nums">
                  <p>
                    <span className="text-slate-400">Obyekt: </span>
                    {attachedDiagnosis.deviceOrArea}
                  </p>
                  <p>
                    <span className="text-slate-400">Prioritet: </span>
                    {attachedDiagnosis.severity}
                  </p>
                  <p>
                    <span className="text-slate-400">Təxmini büdcə: </span>
                    {attachedDiagnosis.estimatedCostRangeAzn}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Xidmət və Zəmanət Şərtləri
              </h3>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Wrench className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">
                      Yerində dəqiq qiymətləndirmə
                    </p>
                    <p className="mt-0.5 text-slate-600">
                      Usta işə başlamazdan əvvəl nasazlığı yoxlayır və dəqiq məbləği sizinlə razılaşdırır.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">
                      6–12 ay yazılı təmir zəmanəti
                    </p>
                    <p className="mt-0.5 text-slate-600">
                      Dəyişdirilən ehtiyat hissələri və görülən əsas təmir işlərinə rəsmi zəmanət verilir.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">
                      Təcili qəza briqadası
                    </p>
                    <p className="mt-0.5 text-slate-600">
                      Su sızması, qısaqapanma və kəskin nasazlıqlarda 1–2 saat ərzində ünvana çıxış təmin edilir.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
