import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  SwitchCamera,
  Upload,
  Wrench,
  X,
} from 'lucide-react';
import { CATEGORY_LABELS } from '../data/services';
import { diagnoseWithCamera } from '../lib/api';
import { DiagnosticResult, ServiceCategoryId } from '../types';

interface CameraDiagnosticsProps {
  onBookFromDiagnosis: (diagnosis: DiagnosticResult) => void;
}

const HINT_OPTIONS: { id: 'auto' | ServiceCategoryId; label: string }[] = [
  { id: 'auto', label: 'Avtomatik' },
  { id: 'kondisioner', label: 'Kondisioner' },
  { id: 'paltaryuyan', label: 'Paltaryuyan' },
  { id: 'televizor', label: 'Televizor' },
  { id: 'santexnika', label: 'Santexnika' },
  { id: 'elektrik', label: 'Elektrik' },
  { id: 'ev_temiri', label: 'Ev Təmiri' },
];

async function compressImageDataUrl(
  sourceDataUrl: string,
  maxDimension = 1400
): Promise<{ base64: string; mimeType: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Şəkil emalı üçün qrafik kontekst yaradıla bilmədi.'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.86);
      const base64 = jpegDataUrl.replace(/^data:image\/jpeg;base64,/, '');
      resolve({ base64, mimeType: 'image/jpeg', previewUrl: jpegDataUrl });
    };
    img.onerror = () => reject(new Error('Seçilən fayl etibarlı şəkil deyil.'));
    img.src = sourceDataUrl;
  });
}

export function CameraDiagnostics({ onBookFromDiagnosis }: CameraDiagnosticsProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [capturedMimeType, setCapturedMimeType] = useState<string>('image/jpeg');

  const [categoryHint, setCategoryHint] = useState<'auto' | ServiceCategoryId>('auto');
  const [userNote, setUserNote] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosticResult | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startCamera = useCallback(
    async (mode: 'environment' | 'user' = facingMode) => {
      setCameraError(null);
      setAnalysisError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          'Bu brauzerdə canlı kamera dəstəyi mövcud deyil. Aşağıdan şəkil faylı yükləyə bilərsiniz.'
        );
        return;
      }

      stopCamera();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        streamRef.current = stream;
        setCapturedPreview(null);
        setCapturedBase64(null);
        setDiagnosis(null);
        setCameraActive(true);

        requestAnimationFrame(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {
              // Autoplay fallback handled by muted + playsInline
            });
          }
        });
      } catch (err: unknown) {
        const name = err instanceof Error ? err.name : '';
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setCameraError(
            'Kamera icazəsi rədd edildi. Telefon və ya brauzer ayarlarından kamera icazəsi verin, yaxud şəkil yükləyin.'
          );
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          setCameraError(
            'Cihazda aktiv kamera tapılmadı. Problemin şəklini cihazınızdan yükləyə bilərsiniz.'
          );
        } else {
          setCameraError(
            'Kamera işə salına bilmədi. Zəhmət olmasa şəkil yükləmə üsulundan istifadə edin.'
          );
        }
      }
    },
    [facingMode, stopCamera]
  );

  const toggleFacingMode = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    if (cameraActive) {
      startCamera(next);
    }
  };

  const runDiagnosis = async (
    base64Data: string,
    mimeType: string,
    previewUrl: string
  ) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setDiagnosis(null);

    try {
      const data = await diagnoseWithCamera({
        imageBase64: base64Data,
        mimeType,
        categoryHint,
        userNote: userNote.trim(),
      });

      setDiagnosis({
        ...data,
        previewImageUrl: previewUrl,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Diaqnostika sorğusu göndərilərkən xəta baş verdi.';
      setAnalysisError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCaptureFrame = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      setCameraError('Kamera görüntüsü hələ hazır deyil. Bir saniyə gözləyin.');
      return;
    }

    const canvas = document.createElement('canvas');
    const maxW = 1400;
    const scale = video.videoWidth > maxW ? maxW / video.videoWidth : 1;
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
    const cleanBase64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');

    stopCamera();
    setCapturedPreview(dataUrl);
    setCapturedBase64(cleanBase64);
    setCapturedMimeType('image/jpeg');

    await runDiagnosis(cleanBase64, 'image/jpeg', dataUrl);
  };

  const handleFileChange = async (file: File | null | undefined) => {
    if (!file) return;
    setCameraError(null);
    setAnalysisError(null);

    if (!file.type.startsWith('image/')) {
      setAnalysisError('Zəhmət olmasa yalnız şəkil faylı (JPG, PNG, WEBP) seçin.');
      return;
    }

    stopCamera();

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const rawUrl = String(reader.result);
        const compressed = await compressImageDataUrl(rawUrl);
        setCapturedPreview(compressed.previewUrl);
        setCapturedBase64(compressed.base64);
        setCapturedMimeType(compressed.mimeType);
        await runDiagnosis(compressed.base64, compressed.mimeType, compressed.previewUrl);
      } catch (err: unknown) {
        setAnalysisError(
          err instanceof Error ? err.message : 'Şəkil oxunarkən xəta baş verdi.'
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    stopCamera();
    setCapturedPreview(null);
    setCapturedBase64(null);
    setDiagnosis(null);
    setAnalysisError(null);
    setCameraError(null);
  };

  return (
    <section
      id="diaqnostika"
      className="py-6 sm:py-16 lg:py-20 bg-slate-50 md:border-t md:border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-5 sm:mb-10">
          <p className="text-xs sm:text-sm font-semibold text-orange-600">
            Avtomatik Vizual Diaqnostika
          </p>
          <h2 className="mt-1.5 text-xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            Nasazlığı kamera ilə göstərin, sistem səbəbi və təmir dəyərini müəyyən etsin
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
            Kondisioner xəta kodunu, paltaryuyan ekranını, televizor görüntüsünü, su sızmasını və ya elektrik şitini kameraya tutun.
          </p>
        </div>

        <div className="bg-slate-900 text-slate-100 rounded-2xl sm:rounded-3xl border border-slate-800 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Column: Camera / Upload Viewport */}
            <div className="lg:col-span-6 p-4 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between gap-5">
              <div>
                <div className="flex items-center justify-between gap-4 mb-3">
                  <span className="text-sm font-semibold text-slate-200">
                    Kamera və Görüntü Paneli
                  </span>
                  {(cameraActive || capturedPreview) && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-1.5 min-h-[36px] px-2 text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      <span>Təmizlə</span>
                    </button>
                  )}
                </div>

                {/* Viewport Box */}
                <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
                  {cameraActive ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="pointer-events-none absolute inset-5 border border-white/25 rounded-xl" />
                      <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={toggleFacingMode}
                          aria-label="Kameranı dəyiş"
                          className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 text-xs font-medium text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-xl cursor-pointer"
                        >
                          <SwitchCamera className="w-4 h-4" />
                          <span className="hidden sm:inline">Kamera Dəyiş</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleCaptureFrame}
                          disabled={isAnalyzing}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 min-h-[48px] px-5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-500 active:scale-[0.98] rounded-xl shadow-md cursor-pointer disabled:opacity-60"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Şəkil Çək və Diaqnoz Et</span>
                        </button>
                      </div>
                    </>
                  ) : capturedPreview ? (
                    <>
                      <img
                        src={capturedPreview}
                        alt="Diaqnostika üçün çəkilmiş görüntü"
                        className="w-full h-full object-contain bg-slate-950"
                      />
                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
                          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mb-3" />
                          <p className="text-sm font-semibold text-white">
                            Görüntü texniki analiz olunur...
                          </p>
                          <p className="mt-1 text-xs text-slate-300">
                            Xəta kodları, zədə izləri və komponent vəziyyəti yoxlanılır
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleFileChange(e.dataTransfer.files?.[0]);
                      }}
                      className="p-5 sm:p-6 text-center max-w-sm"
                    >
                      <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-orange-500">
                        <Camera className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-white">
                        Problemi kamera ilə çəkin və ya foto yükləyin
                      </h3>
                      <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                        İşıqlı mühitdə nasaz hissəni və ya xəta kodunu yaxından göstərin.
                      </p>

                      <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => startCamera(facingMode)}
                          className="inline-flex items-center justify-center gap-2 min-h-[46px] px-4 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-500 active:scale-[0.98] rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Kameranı Aç</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center justify-center gap-2 min-h-[46px] px-4 py-2.5 text-sm font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-[0.98] rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Foto Yüklə</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                    className="hidden"
                  />
                </div>

                {cameraError && (
                  <div
                    role="alert"
                    className="mt-3 p-3.5 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs flex items-start gap-2.5"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{cameraError}</span>
                  </div>
                )}

                {/* Quick Context Controls */}
                <div className="mt-4 space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">
                      Sahəni seçin (istəyə bağlı)
                    </label>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar sm:flex-wrap pb-1 sm:pb-0">
                      {HINT_OPTIONS.map((opt) => {
                        const selected = categoryHint === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setCategoryHint(opt.id)}
                            className={`min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              selected
                                ? 'bg-orange-600 text-white'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="diagnostic-note"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Əlavə müşahidə və ya səs/xəta kodu (istəyə bağlı)
                    </label>
                    <input
                      id="diagnostic-note"
                      type="text"
                      value={userNote}
                      onChange={(e) => setUserNote(e.target.value)}
                      placeholder="Məsələn: E4 xətası verir, su axıdır..."
                      className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {capturedBase64 && (
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    disabled={isAnalyzing}
                    onClick={() =>
                      runDiagnosis(
                        capturedBase64,
                        capturedMimeType,
                        capturedPreview || ''
                      )
                    }
                    className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded-xl transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    <span>Yenidən Analiz Et</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => startCamera(facingMode)}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Yeni Çəkiliş</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Başqa Fayl</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Structured Diagnostic Output */}
            <div className="lg:col-span-6 p-4 sm:p-8 flex flex-col justify-between">
              {isAnalyzing ? (
                <div className="space-y-5 animate-pulse">
                  <div className="h-5 w-40 bg-slate-800 rounded" />
                  <div className="h-8 w-3/4 bg-slate-800 rounded" />
                  <div className="h-20 w-full bg-slate-800 rounded" />
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="h-28 bg-slate-800 rounded" />
                    <div className="h-28 bg-slate-800 rounded" />
                  </div>
                </div>
              ) : analysisError ? (
                <div className="my-auto p-5 rounded-2xl bg-red-950/50 border border-red-800/70">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-base font-semibold text-red-100">
                        Diaqnostika tamamlanmadı
                      </h3>
                      <p className="mt-1.5 text-sm text-red-200 leading-relaxed">
                        {analysisError}
                      </p>
                      {capturedBase64 && (
                        <button
                          type="button"
                          onClick={() =>
                            runDiagnosis(
                              capturedBase64,
                              capturedMimeType,
                              capturedPreview || ''
                            )
                          }
                          className="mt-4 inline-flex items-center gap-2 min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-600 rounded-xl cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Yenidən Cəhd Et</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : diagnosis ? (
                <div className="space-y-5">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-400">
                      <span>
                        {CATEGORY_LABELS[diagnosis.recommendedCategory]} · {diagnosis.deviceOrArea}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 font-semibold ${
                          diagnosis.severity === 'Təcili'
                            ? 'text-red-400'
                            : diagnosis.severity === 'Orta'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                        }`}
                      >
                        {diagnosis.severity === 'Təcili' ? (
                          <ShieldAlert className="w-4 h-4" />
                        ) : diagnosis.severity === 'Orta' ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>Prioritet: {diagnosis.severity}</span>
                      </span>
                    </div>

                    <h3 className="mt-2 text-xl sm:text-2xl font-bold text-white">
                      {diagnosis.likelyFault}
                    </h3>

                    <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                      {diagnosis.technicalExplanation}
                    </p>
                  </div>

                  {/* Cost & Duration Strip */}
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-800">
                    <div>
                      <span className="block text-xs text-slate-400">Təxmini təmir dəyəri</span>
                      <span className="mt-1 block text-base sm:text-lg font-bold text-white font-mono tabular-nums">
                        {diagnosis.estimatedCostRangeAzn}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-400">Ortalama iş müddəti</span>
                      <span className="mt-1 block text-base sm:text-lg font-bold text-white font-mono tabular-nums">
                        {diagnosis.estimatedRepairDuration}
                      </span>
                    </div>
                  </div>

                  {/* Causes & Safety */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {diagnosis.possibleCauses.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Mümkün Səbəblər
                        </h4>
                        <ul className="space-y-2 text-sm text-slate-200">
                          {diagnosis.possibleCauses.map((cause) => (
                            <li key={cause} className="flex items-start gap-2">
                              <span className="text-orange-500 mt-1" aria-hidden="true">
                                •
                              </span>
                              <span>{cause}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {diagnosis.safetyWarnings.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                          Təhlükəsizlik Tədbirləri
                        </h4>
                        <ul className="space-y-2 text-sm text-amber-100">
                          {diagnosis.safetyWarnings.map((warning) => (
                            <li key={warning} className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <span>{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {(diagnosis.diyChecks.length > 0 || diagnosis.requiredParts.length > 0) && (
                    <div className="pt-4 border-t border-slate-800 space-y-3.5">
                      {diagnosis.diyChecks.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 mb-2">
                            Usta gələnə qədər ilkin yoxlamalar
                          </h4>
                          <ul className="space-y-1.5 text-sm text-slate-300">
                            {diagnosis.diyChecks.map((check) => (
                              <li key={check} className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                                <span>{check}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {diagnosis.requiredParts.length > 0 && (
                        <p className="text-xs text-slate-400">
                          <span className="font-semibold text-slate-300">Ehtimal olunan hissələr: </span>
                          {diagnosis.requiredParts.join(' · ')}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => onBookFromDiagnosis(diagnosis)}
                      className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-500 active:scale-[0.99] rounded-xl transition-all cursor-pointer"
                    >
                      <span>Bu Diaqnoz üzrə Usta Sifariş Et</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="my-auto space-y-5">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-orange-500 mb-3">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      Diaqnostika hesabatı burada görünəcək
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">
                      Kameranı aktivləşdirin və ya nasazlığın fotosunu yükləyin. Sistem görüntünü analiz edərək aşağıdakıları avtomatik təqdim edəcək:
                    </p>
                  </div>

                  <div className="space-y-3.5 pt-4 border-t border-slate-800">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        01. Cihaz və ya kommunikasiya tanınması
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Kondisioner displeyindəki xəta kodları, paltaryuyan göstəriciləri, TV panel zədələri, su sızması və yanmış elektrik kontaktları aşkarlanır.
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        02. Təhlükəsizlik və ilkin tədbirlər
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Elektrik ayırma, su ventili bağlama və usta gələnə qədər təhlükəsiz yoxlama addımları göstərilir.
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        03. Birbaşa usta çağırışına keçid
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Aşkarlanan nasazlıq və təxmini qiymət aralığı bir kliklə sifariş formuna əlavə olunur.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
