import { OutbreakRecord, OutbreakAlert } from '../types';

export const INITIAL_OUTBREAKS: OutbreakRecord[] = [
  // Kenya Rift Valley / Eldoret agricultural cluster
  {
    id: 'rec-ke-1',
    timestamp: Date.now() - 1000 * 60 * 45,
    cropName: 'Maize / Corn',
    diseaseName: 'Maize Lethal Necrosis',
    severityLevel: 'Critical',
    latitude: 0.5143,
    longitude: 35.2698,
    regionName: 'Uasin Gishu County, Kenya',
    farmIdAnon: 'Farm #KE-882',
    reportedBy: 'AgriGuard Field Unit #04'
  },
  {
    id: 'rec-ke-2',
    timestamp: Date.now() - 1000 * 60 * 120,
    cropName: 'Maize / Corn',
    diseaseName: 'Maize Lethal Necrosis',
    severityLevel: 'Severe',
    latitude: 0.5312,
    longitude: 35.2954,
    regionName: 'Uasin Gishu County, Kenya',
    farmIdAnon: 'Farm #KE-412',
    reportedBy: 'Kiprono Smallholder Coop'
  },
  {
    id: 'rec-ke-3',
    timestamp: Date.now() - 1000 * 60 * 180,
    cropName: 'Maize / Corn',
    diseaseName: 'Maize Lethal Necrosis',
    severityLevel: 'Critical',
    latitude: 0.4981,
    longitude: 35.2410,
    regionName: 'Uasin Gishu County, Kenya',
    farmIdAnon: 'Farm #KE-990',
    reportedBy: 'Eldoret Extension Worker'
  },
  {
    id: 'rec-ke-4',
    timestamp: Date.now() - 1000 * 60 * 300,
    cropName: 'Maize / Corn',
    diseaseName: 'Maize Lethal Necrosis',
    severityLevel: 'Severe',
    latitude: 0.5401,
    longitude: 35.2810,
    regionName: 'Uasin Gishu County, Kenya',
    farmIdAnon: 'Farm #KE-104',
    reportedBy: 'AgriGuard Mobile PWA'
  },
  // Uganda Potato / Tomato
  {
    id: 'rec-ug-1',
    timestamp: Date.now() - 1000 * 60 * 600,
    cropName: 'Potato',
    diseaseName: 'Potato Late Blight',
    severityLevel: 'Critical',
    latitude: -1.2864,
    longitude: 29.6897,
    regionName: 'Kabale District, Uganda',
    farmIdAnon: 'Farm #UG-331',
    reportedBy: 'Kigezi Highland Growers'
  },
  {
    id: 'rec-ug-2',
    timestamp: Date.now() - 1000 * 60 * 720,
    cropName: 'Potato',
    diseaseName: 'Potato Late Blight',
    severityLevel: 'Severe',
    latitude: -1.2510,
    longitude: 29.7120,
    regionName: 'Kabale District, Uganda',
    farmIdAnon: 'Farm #UG-194',
    reportedBy: 'District Agronomist'
  },
  // India Punjab / Haryana Rice Blast & Wheat Rust
  {
    id: 'rec-in-1',
    timestamp: Date.now() - 1000 * 60 * 90,
    cropName: 'Rice / Paddy',
    diseaseName: 'Rice Blast',
    severityLevel: 'Critical',
    latitude: 30.9010,
    longitude: 75.8573,
    regionName: 'Ludhiana District, Punjab, India',
    farmIdAnon: 'Farm #IN-771',
    reportedBy: 'Kisan Seva Kendra'
  },
  {
    id: 'rec-in-2',
    timestamp: Date.now() - 1000 * 60 * 150,
    cropName: 'Rice / Paddy',
    diseaseName: 'Rice Blast',
    severityLevel: 'Severe',
    latitude: 30.9250,
    longitude: 75.8310,
    regionName: 'Ludhiana District, Punjab, India',
    farmIdAnon: 'Farm #IN-382',
    reportedBy: 'Punjab Agri Extension'
  },
  {
    id: 'rec-in-3',
    timestamp: Date.now() - 1000 * 60 * 220,
    cropName: 'Rice / Paddy',
    diseaseName: 'Rice Blast',
    severityLevel: 'Severe',
    latitude: 30.8740,
    longitude: 75.8910,
    regionName: 'Ludhiana District, Punjab, India',
    farmIdAnon: 'Farm #IN-529',
    reportedBy: 'Gram Panchayat Field Log'
  },
  // Mexico Bajío Tomato Early Blight
  {
    id: 'rec-mx-1',
    timestamp: Date.now() - 1000 * 60 * 360,
    cropName: 'Tomato',
    diseaseName: 'Tomato Early Blight',
    severityLevel: 'Moderate',
    latitude: 20.6767,
    longitude: -101.3563,
    regionName: 'Irapuato, Guanajuato, Mexico',
    farmIdAnon: 'Farm #MX-201',
    reportedBy: 'Unidad de Sanidad Vegetal'
  }
];

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English (Global)', speechVoiceName: 'en-US-Standard-C', flag: '🌐' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी (भारत)', speechVoiceName: 'hi-IN-Standard-A', flag: '🇮🇳' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili (Afrika Mashariki)', speechVoiceName: 'sw-TZ-Standard-A', flag: '🇰🇪' },
  { code: 'es', name: 'Spanish', nativeName: 'Español (Latinoamérica)', speechVoiceName: 'es-US-Standard-A', flag: '🇲🇽' },
  { code: 'fr', name: 'French', nativeName: 'Français (Afrique de l\'Ouest)', speechVoiceName: 'fr-FR-Standard-A', flag: '🇨🇮' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు (భారత్)', speechVoiceName: 'te-IN-Standard-A', flag: '🌾' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা (বাংলাদেশ ও ভারত)', speechVoiceName: 'bn-IN-Standard-A', flag: '🇧🇩' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português (Moçambique & Brasil)', speechVoiceName: 'pt-BR-Standard-A', flag: '🇧🇷' }
];

// Helper to calculate distance in km using Haversine formula
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Outbreak threshold detector: groups records within a threshold radius (e.g. 25km) having the same disease
export function detectOutbreakClusters(records: OutbreakRecord[], thresholdCount = 3, maxDistanceKm = 30): OutbreakAlert[] {
  const alerts: OutbreakAlert[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < records.length; i++) {
    if (processed.has(records[i].id)) continue;
    const current = records[i];
    const cluster: OutbreakRecord[] = [current];

    for (let j = i + 1; j < records.length; j++) {
      const candidate = records[j];
      if (candidate.diseaseName.toLowerCase() === current.diseaseName.toLowerCase() && candidate.diseaseName.toLowerCase() !== 'healthy / no disease') {
        const dist = calculateDistanceKm(current.latitude, current.longitude, candidate.latitude, candidate.longitude);
        if (dist <= maxDistanceKm) {
          cluster.push(candidate);
          processed.add(candidate.id);
        }
      }
    }

    if (cluster.length >= thresholdCount) {
      processed.add(current.id);
      const avgLat = cluster.reduce((sum, r) => sum + r.latitude, 0) / cluster.length;
      const avgLon = cluster.reduce((sum, r) => sum + r.longitude, 0) / cluster.length;
      const highestSev = cluster.some(r => r.severityLevel === 'Critical') ? 'Critical' : 'Severe';

      alerts.push({
        id: `alert-${current.diseaseName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
        diseaseName: current.diseaseName,
        cropName: current.cropName,
        clusterCount: cluster.length,
        radiusKm: maxDistanceKm,
        regionName: current.regionName,
        centerCoords: [avgLat, avgLon],
        severity: highestSev,
        issuedAt: Math.max(...cluster.map(c => c.timestamp)),
        advisoryText: `EMERGENCY ADVISORY: ${cluster.length} confirmed cases of ${current.diseaseName} detected within ${maxDistanceKm}km in ${current.regionName}. Immediate sanitation, spore-barrier spraying, and quarantine protocol recommended.`
      });
    }
  }

  return alerts;
}
