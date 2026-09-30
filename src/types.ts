export type SeverityLevel = 'Low' | 'Moderate' | 'Severe' | 'Critical';
export type PathogenType = 'Fungal' | 'Bacterial' | 'Viral' | 'Pest / Insect' | 'Nutritional Deficiency' | 'Physiological / Environmental' | 'Healthy';

export interface DiagnosticResult {
  id: string;
  timestamp: number;
  imageUrl: string;
  cropName: string;
  diseaseName: string;
  pathogenType: PathogenType;
  confidenceScore: number; // 0 to 1
  severityLevel: SeverityLevel;
  symptomsIdentified: string[];
  organicRemedies: {
    title: string;
    description: string;
    applicationMethod: string;
    availability: string;
  }[];
  chemicalRemedies: {
    activeIngredient: string;
    commercialNameExample: string;
    dosage: string;
    safetyCaution: string;
  }[];
  preventativeMeasures: string[];
  actionableSummary: string;
  estimatedYieldImpactRisk: string;
  location?: {
    latitude: number;
    longitude: number;
    regionName?: string;
  };
  isOfflineDiagnosis?: boolean;
}

export interface OutbreakRecord {
  id: string;
  timestamp: number;
  cropName: string;
  diseaseName: string;
  severityLevel: SeverityLevel;
  latitude: number;
  longitude: number;
  regionName: string;
  farmIdAnon: string;
  reportedBy: string;
}

export interface OutbreakAlert {
  id: string;
  diseaseName: string;
  cropName: string;
  clusterCount: number;
  radiusKm: number;
  regionName: string;
  centerCoords: [number, number];
  severity: SeverityLevel;
  issuedAt: number;
  advisoryText: string;
}

export interface OfflineQueueItem {
  id: string;
  timestamp: number;
  imageBase64: string;
  mimeType: string;
  cropHint?: string;
  latitude?: number;
  longitude?: number;
  regionName?: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  errorMsg?: string;
  cachedResult?: DiagnosticResult;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  speechVoiceName: string;
  flag: string;
}
