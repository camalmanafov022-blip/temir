export type ServiceCategoryId =
  | 'kondisioner'
  | 'paltaryuyan'
  | 'televizor'
  | 'santexnika'
  | 'elektrik'
  | 'ev_temiri';

export type ServiceGroupFilter =
  | 'hamisi'
  | 'meiset'
  | 'santexnika'
  | 'elektrik'
  | 'ev_temiri';

export type DiagnosticSeverity = 'Təcili' | 'Orta' | 'Yüngül';

export interface ServiceCatalogItem {
  id: ServiceCategoryId;
  group: Exclude<ServiceGroupFilter, 'hamisi'>;
  title: string;
  shortLabel: string;
  subtitle: string;
  priceRangeAzn: string;
  avgDuration: string;
  imageUrl: string;
  imageAlt: string;
  commonIssues: string[];
  warrantyMonths: number;
}

export interface DiagnosticResult {
  isTechnicalProblemDetected: boolean;
  deviceOrArea: string;
  recommendedCategory: ServiceCategoryId;
  severity: DiagnosticSeverity;
  likelyFault: string;
  technicalExplanation: string;
  possibleCauses: string[];
  safetyWarnings: string[];
  diyChecks: string[];
  estimatedCostRangeAzn: string;
  estimatedRepairDuration: string;
  requiredParts: string[];
  capturedAt: string;
  previewImageUrl?: string;
}

export type OrderStatus =
  | 'Gözləmədə'
  | 'Usta təyin edilib'
  | 'Tamamlandı'
  | 'Ləğv edilib';

export type OrderUrgency = 'Planlı' | 'Təcili';

export interface ServiceOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  district: string;
  address: string;
  category: ServiceCategoryId;
  issueTitle: string;
  description: string;
  urgency: OrderUrgency;
  preferredTime: string;
  status: OrderStatus;
  estimatedCostAzn: string;
  assignedTechnician: string;
  createdAt: string;
  diagnosticSummary?: {
    likelyFault: string;
    severity: DiagnosticSeverity;
    deviceOrArea: string;
    estimatedCostRangeAzn: string;
  };
}
