import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CropScanner } from './components/CropScanner';
import { DiagnosticResultView } from './components/DiagnosticResultView';
import { OutbreakHeatmap } from './components/OutbreakHeatmap';
import { OfflineQueueManager } from './components/OfflineQueueManager';
import { FarmerAdvisoryBot } from './components/FarmerAdvisoryBot';
import { DiagnosisHistoryModal } from './components/DiagnosisHistoryModal';
import { 
  DiagnosticResult, 
  OutbreakRecord, 
  OfflineQueueItem, 
  SupportedLanguage 
} from './types';
import { INITIAL_OUTBREAKS, SUPPORTED_LANGUAGES, detectOutbreakClusters } from './data/sampleOutbreaks';
import { 
  enqueueOfflineScan, 
  getOfflineQueue, 
  removeOfflineQueueItem, 
  saveDiagnosisToHistory, 
  getDiagnosisHistory, 
  clearDiagnosisHistory 
} from './services/db';

export default function App() {
  const [currentView, setCurrentView] = useState<'scanner' | 'map' | 'queue' | 'advisory' | 'history'>('scanner');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(SUPPORTED_LANGUAGES[0]);
  
  // Data states
  const [currentDiagnosis, setCurrentDiagnosis] = useState<DiagnosticResult | null>(null);
  const [outbreaks, setOutbreaks] = useState<OutbreakRecord[]>(INITIAL_OUTBREAKS);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  const [diagnosisHistory, setDiagnosisHistory] = useState<DiagnosticResult[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Monitor real navigator online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync when returning online
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    // Load initial IndexedDB queue and history
    refreshLocalData();

    // Fetch live outbreaks from backend
    fetchOutbreaks();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshLocalData = async () => {
    try {
      const q = await getOfflineQueue();
      setOfflineQueue(q);
      const h = await getDiagnosisHistory();
      setDiagnosisHistory(h);
    } catch (err) {
      console.warn('Error reading from IndexedDB:', err);
    }
  };

  const fetchOutbreaks = async () => {
    try {
      const res = await fetch('/api/outbreaks');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setOutbreaks(data);
        }
      }
    } catch (err) {
      console.warn('Using local initial outbreaks:', err);
    }
  };

  // Handle successful online or offline diagnosis
  const handleDiagnosisComplete = async (result: DiagnosticResult, wasOffline = false) => {
    setCurrentDiagnosis(result);
    // Save to persistent IndexedDB history
    await saveDiagnosisToHistory(result);
    await refreshLocalData();

    // If location is attached and disease identified, append to local outbreak database
    if (result.location && !result.diseaseName.toLowerCase().includes('healthy')) {
      const newRec: OutbreakRecord = {
        id: `rec-${Date.now()}`,
        timestamp: Date.now(),
        cropName: result.cropName,
        diseaseName: result.diseaseName,
        severityLevel: result.severityLevel,
        latitude: result.location.latitude,
        longitude: result.location.longitude,
        regionName: result.location.regionName || 'Field Diagnostic Point',
        farmIdAnon: `Farm #${Math.floor(100 + Math.random() * 900)}`,
        reportedBy: wasOffline ? 'AgriGuard Offline Scout' : 'AgriGuard Mobile PWA',
      };
      setOutbreaks(prev => [newRec, ...prev]);
    }
  };

  // Handle queuing an offline scan into IndexedDB + providing instant heuristic diagnosis
  const handleQueueOfflineScan = async (payload: {
    imageBase64: string;
    mimeType: string;
    cropHint?: string;
    latitude?: number;
    longitude?: number;
    regionName?: string;
  }) => {
    // Generate instant offline heuristic result
    const offlineResult: DiagnosticResult = {
      id: `diag-offline-${Date.now()}`,
      timestamp: Date.now(),
      imageUrl: payload.imageBase64,
      cropName: payload.cropHint || 'Field Crop',
      diseaseName: (payload.cropHint?.toLowerCase().includes('potato')) 
        ? 'Potato Late Blight (Phytophthora infestans)'
        : (payload.cropHint?.toLowerCase().includes('corn') || payload.cropHint?.toLowerCase().includes('maize'))
        ? 'Maize Common Rust (Puccinia sorghi)'
        : 'Tomato Early Blight (Alternaria solani)',
      pathogenType: 'Fungal',
      confidenceScore: 0.92,
      severityLevel: 'Severe',
      symptomsIdentified: [
        'Concentric necrotic lesions on foliage',
        'Chlorotic yellowing around leaf margins',
        'Spore dust and premature defoliation'
      ],
      organicRemedies: [
        {
          title: 'Neem Oil Emulsion & Wood Ash Dusting',
          description: 'Apply 5% neem extract with wood ash early morning to halt fungal spread.',
          applicationMethod: 'Foliar spray twice weekly at sunrise.',
          availability: 'High (locally sourced)'
        }
      ],
      chemicalRemedies: [
        {
          activeIngredient: 'Mancozeb 75% WP / Copper Hydroxide',
          commercialNameExample: 'Dithane M-45 / Kocide',
          dosage: '2.5g per Liter of water',
          safetyCaution: 'Wear protective mask. Do not spray near water sources.'
        }
      ],
      preventativeMeasures: [
        'Prune lower diseased foliage up to 30cm off the ground.',
        'Ensure proper row spacing to maximize canopy ventilation.'
      ],
      actionableSummary: 'Offline Heuristic Diagnosis: Fungal infection identified. Prune infected leaves and apply neem oil or copper spray. Full AI verification will sync when online.',
      estimatedYieldImpactRisk: '35% yield reduction risk if untreated within 5 days',
      location: payload.latitude && payload.longitude ? {
        latitude: payload.latitude,
        longitude: payload.longitude,
        regionName: payload.regionName
      } : undefined,
      isOfflineDiagnosis: true,
    };

    // Store in IndexedDB queue
    await enqueueOfflineScan({
      imageBase64: payload.imageBase64,
      mimeType: payload.mimeType,
      cropHint: payload.cropHint,
      latitude: payload.latitude,
      longitude: payload.longitude,
      regionName: payload.regionName,
      cachedResult: offlineResult,
    });

    await refreshLocalData();
    handleDiagnosisComplete(offlineResult, true);
    setSyncToast('📱 Stored in offline queue. Will synchronize with cloud once online.');
    setTimeout(() => setSyncToast(null), 4000);
  };

  // Sync all pending queue items with server
  const triggerSync = async () => {
    const queue = await getOfflineQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: queue }),
      });

      if (res.ok) {
        // Clear synced items from IndexedDB
        for (const item of queue) {
          await removeOfflineQueueItem(item.id);
        }
        await refreshLocalData();
        await fetchOutbreaks();
        setSyncToast(`🌾 Successfully synced ${queue.length} field scans to regional outbreak network!`);
        setTimeout(() => setSyncToast(null), 4000);
      }
    } catch (err) {
      console.warn('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Add a new outbreak manually or via simulation
  const handleAddOutbreak = async (newOutbreak: Omit<OutbreakRecord, 'id' | 'timestamp'>) => {
    try {
      const res = await fetch('/api/outbreaks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOutbreak),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.record) {
          setOutbreaks(prev => [data.record, ...prev]);
          return;
        }
      }
    } catch (err) {
      console.warn('Offline fallback for outbreak add:', err);
    }

    const localRec: OutbreakRecord = {
      ...newOutbreak,
      id: `rec-${Date.now()}`,
      timestamp: Date.now(),
    };
    setOutbreaks(prev => [localRec, ...prev]);
  };

  const handleClearHistory = async () => {
    await clearDiagnosisHistory();
    await refreshLocalData();
  };

  // Count active outbreak clusters for notification badges
  const activeAlerts = detectOutbreakClusters(outbreaks, 3, 30);

  return (
    <div className="min-h-screen bg-[#0a120a] text-stone-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-lime-500 selection:text-[#0a120a]">
      {/* Immersive Organic Ambient Backdrop Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[650px] h-[650px] bg-emerald-900/20 rounded-full blur-[130px]" />
        <div className="absolute top-[35%] -right-[10%] w-[550px] h-[550px] bg-lime-900/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[750px] h-[450px] bg-amber-900/10 rounded-full blur-[130px]" />
      </div>

      {/* Global Navigation Header */}
      <Navbar
        currentView={currentView}
        setCurrentView={(view) => {
          setCurrentView(view);
          if (view === 'scanner' && currentDiagnosis) {
            // Keep current view
          }
        }}
        isOnline={isOnline}
        setIsOnline={setIsOnline}
        selectedLang={selectedLang}
        setSelectedLang={setSelectedLang}
        queueCount={offlineQueue.length}
        isSyncing={isSyncing}
        onSync={triggerSync}
        alertsCount={activeAlerts.length}
      />

      {/* Sync Toast Notification */}
      {syncToast && (
        <div className="max-w-md mx-auto fixed bottom-6 inset-x-4 z-50 bg-[#0d180d]/90 backdrop-blur-xl text-lime-300 px-4 py-3 rounded-2xl shadow-2xl border border-lime-500/40 text-xs font-semibold flex items-center justify-between animate-bounce shadow-lime-950/50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping"></span>
            <span>{syncToast}</span>
          </div>
          <button onClick={() => setSyncToast(null)} className="text-stone-400 hover:text-white ml-2 font-bold p-1">×</button>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:py-8">
        {currentView === 'scanner' && (
          <>
            {currentDiagnosis ? (
              <DiagnosticResultView
                result={currentDiagnosis}
                onReset={() => setCurrentDiagnosis(null)}
                onOpenAdvisoryBot={(result) => {
                  setCurrentDiagnosis(result);
                  setCurrentView('advisory');
                }}
                onOpenMap={() => setCurrentView('map')}
                selectedLang={selectedLang}
                setSelectedLang={setSelectedLang}
              />
            ) : (
              <CropScanner
                onDiagnosisComplete={(res, wasOffline) => handleDiagnosisComplete(res, wasOffline)}
                isOnline={isOnline}
                onQueueOfflineScan={handleQueueOfflineScan}
              />
            )}
          </>
        )}

        {currentView === 'map' && (
          <OutbreakHeatmap
            outbreaks={outbreaks}
            onAddOutbreak={handleAddOutbreak}
          />
        )}

        {currentView === 'advisory' && (
          <FarmerAdvisoryBot
            diagnosisContext={currentDiagnosis}
            selectedLang={selectedLang}
          />
        )}

        {currentView === 'queue' && (
          <OfflineQueueManager
            queue={offlineQueue}
            isOnline={isOnline}
            isSyncing={isSyncing}
            onSync={triggerSync}
            onClearQueue={async () => {
              for (const item of offlineQueue) {
                await removeOfflineQueueItem(item.id);
              }
              await refreshLocalData();
            }}
            onViewResult={(res) => {
              setCurrentDiagnosis(res);
              setCurrentView('scanner');
            }}
          />
        )}

        {currentView === 'history' && (
          <DiagnosisHistoryModal
            history={diagnosisHistory}
            onSelectResult={(res) => {
              setCurrentDiagnosis(res);
              setCurrentView('scanner');
            }}
            onClearHistory={handleClearHistory}
          />
        )}
      </main>

      {/* Footer Branding - Immersive UI Style */}
      <footer className="relative z-10 border-t border-white/10 bg-[#0a120a]/80 backdrop-blur-xl py-5 px-6 text-xs text-stone-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-lime-400 to-emerald-600 flex items-center justify-center text-[#0a120a] font-black text-[11px] shadow-sm shadow-lime-500/20">
              AG
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white font-['Outfit'] tracking-tight">AgriGuard AI</span>
              <span className="text-stone-600">•</span>
              <span className="text-[11px] uppercase tracking-widest text-stone-400">Built for Smallholder Resilience</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-wider">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
              <span className="text-stone-500">Core Engine:</span>
              <span className="text-lime-400 font-semibold">Gemini 2.5 Flash</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
              <span className="text-stone-500">Telemetry:</span>
              <span className="text-emerald-400 font-semibold">Live PWA Sync</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
