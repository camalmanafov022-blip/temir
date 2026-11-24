import heroTechImg from '../assets/images/hero_repair_technician_1795521985797.jpg';
import appliancesImg from '../assets/images/service_appliances_repair_1795521986233.jpg';
import plumbingElectricalImg from '../assets/images/service_plumbing_electrical_1795521986897.jpg';
import tvDiagnosticsImg from '../assets/images/service_tv_diagnostics_1795521985299.jpg';
import { ServiceCatalogItem, ServiceCategoryId } from '../types';

export { heroTechImg };

export const SERVICE_CATALOG: ServiceCatalogItem[] = [
  {
    id: 'kondisioner',
    group: 'meiset',
    title: 'Kondisioner Təmiri və Servisi',
    shortLabel: 'Kondisioner',
    subtitle: 'İnverter və klassik split sistemlərin diaqnostikası, qaz dolumu və yuyulması',
    priceRangeAzn: '35 – 120 AZN',
    avgDuration: '45 – 90 dəq',
    imageUrl: heroTechImg,
    imageAlt: 'Kondisioner daxili blokunun texniki müayinəsi',
    commonIssues: [
      'Soyutmur və ya zəif vurur (freon sızması)',
      'Daxili blokdan su damcılayır (drenaj tutulması)',
      'Xəta kodları (E1, E4, F1) və plata nasazlığı',
      'Kompressor işə düşmür və ya yüksək səs çıxarır',
    ],
    warrantyMonths: 6,
  },
  {
    id: 'paltaryuyan',
    group: 'meiset',
    title: 'Paltaryuyan Maşın Təmiri',
    shortLabel: 'Paltaryuyan',
    subtitle: 'Baraban, nasos, qızdırıcı element və idarəetmə platasının yerində bərpası',
    priceRangeAzn: '30 – 110 AZN',
    avgDuration: '40 – 80 dəq',
    imageUrl: appliancesImg,
    imageAlt: 'Paltaryuyan maşın və usta alətləri',
    commonIssues: [
      'Suyu boşaltmır və ya yığım zamanı sızdırır',
      'Sıxma rejimində güclü titrəmə və podşipnik səsi',
      'Suyu qızdırmır (TEN və termostat problemi)',
      'Qapı kilidi açılmır və ya proqram donur',
    ],
    warrantyMonths: 6,
  },
  {
    id: 'televizor',
    group: 'meiset',
    title: 'Televizor Təmiri (LED / OLED / Smart)',
    shortLabel: 'Televizor',
    subtitle: 'Görüntü itməsi, arxa işıqlandırma, T-Con və qida bloku təmiri',
    priceRangeAzn: '45 – 160 AZN',
    avgDuration: '60 – 120 dəq',
    imageUrl: tvDiagnosticsImg,
    imageAlt: 'Televizor platası və LED işıqlandırma diaqnostikası',
    commonIssues: [
      'Səs var, lakin ekran qaranlıqdır (LED bar yanması)',
      'Ekranda şaquli xətlər və ya rəng pozuntusu',
      'Televizor açılmır, qırmızı işıq yanıb-sönür',
      'HDMI girişləri və ya Smart TV sistemi işləmir',
    ],
    warrantyMonths: 6,
  },
  {
    id: 'santexnika',
    group: 'santexnika',
    title: 'Santexnika və İstilik Xətləri',
    shortLabel: 'Santexnika',
    subtitle: 'Boru sızmalarının tapılması, kombi kollektoru, kran və kanalizasiya işləri',
    priceRangeAzn: '25 – 95 AZN',
    avgDuration: '30 – 90 dəq',
    imageUrl: plumbingElectricalImg,
    imageAlt: 'Santexnika kollektoru və təzyiq ölçən sistem',
    commonIssues: [
      'Divar və ya trap altından su sızması',
      'Mətbəx və hamam kanalizasiyasının açılması',
      'Kran, qarışdırıcı, unitaz və duş kabin montajı',
      'İsti döşəmə və radiator xətlərində təzyiq düşməsi',
    ],
    warrantyMonths: 12,
  },
  {
    id: 'elektrik',
    group: 'elektrik',
    title: 'Elektrik İşləri və Şit Təmiri',
    shortLabel: 'Elektrik',
    subtitle: 'Qısaqapanma axtarışı, avtomat açarlar, rozetka və işıqlandırma montajı',
    priceRangeAzn: '25 – 90 AZN',
    avgDuration: '30 – 75 dəq',
    imageUrl: plumbingElectricalImg,
    imageAlt: 'Müasir elektrik paylayıcı şit və avtomat açarlar',
    commonIssues: [
      'Avtomat tez-tez atır və ya faza kəsilir',
      'Rozetka və açarlarda qızma, qığılcım və yanma iyi',
      'Çilçıraq, LED gizli işıq və stabilizator quraşdırılması',
      'Torpaqlama və sızma cərəyanı relesi (UZO) yığılması',
    ],
    warrantyMonths: 12,
  },
  {
    id: 'ev_temiri',
    group: 'ev_temiri',
    title: 'Ev Təmiri və Məişət Montajı',
    shortLabel: 'Ev Təmiri',
    subtitle: 'Qapı-pəncərə tənzimlənməsi, alçıpan, kafel-metlax bərpası və mebel montajı',
    priceRangeAzn: '30 – 140 AZN',
    avgDuration: '45 – 150 dəq',
    imageUrl: appliancesImg,
    imageAlt: 'Məişət və ev təmiri üçün usta avadanlıqları',
    commonIssues: [
      'Plastik pəncərə və balkon qapısı sıx bağlanmır / hava keçirir',
      'Divarda rütubət sonrası alçıpan və boya bərpası',
      'Qopmuş kafel, silikon izolyasiya və plintus təmiri',
      'TV kronşteyni, şkaf, rəf və məişət aksesuarı bərkidilməsi',
    ],
    warrantyMonths: 6,
  },
];

export const CATEGORY_LABELS: Record<ServiceCategoryId, string> = {
  kondisioner: 'Kondisioner təmiri',
  paltaryuyan: 'Paltaryuyan təmiri',
  televizor: 'Televizor təmiri',
  santexnika: 'Santexnika işləri',
  elektrik: 'Elektrik işləri',
  ev_temiri: 'Ev təmiri və montaj',
};

export const BAKU_DISTRICTS: string[] = [
  'Nəsimi rayonu',
  'Nərimanov rayonu',
  'Yasamal rayonu',
  'Səbail rayonu',
  'Xətai rayonu',
  'Binəqədi rayonu',
  'Nizami rayonu',
  'Sabunçu rayonu',
  'Suraxanı rayonu',
  'Qaradağ rayonu',
  'Xəzər rayonu',
  'Abşeron / Xırdalan',
];
