import React from 'react';
import { 
  Database, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Wifi, 
  WifiOff, 
  AlertCircle,
  Eye
} from 'lucide-react';
import { OfflineQueueItem, DiagnosticResult } from '../types';

interface OfflineQueueManagerProps {
  queue: OfflineQueueItem[];
  isOnline: boolean;
  isSyncing: boolean;
  onSync: () => void;
  onClearQueue: () => void;
  onViewResult: (result: DiagnosticResult) => void;
}

export const OfflineQueueManager: React.FC<OfflineQueueManagerProps> = ({
  queue,
  isOnline,
  isSyncing,
  onSync,
  onClearQueue,
  onViewResult,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner explaining Store-and-Forward */}
      <div className="bg-white/5 backdrop-blur-2xl text-white rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                IndexedDB Store & Forward
              </span>
              <span className="text-xs text-stone-400 font-medium">Zero-Data Drop Guarantee</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-['Outfit'] tracking-tight text-white">
              Offline Cache & Field Synchronization
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 max-w-xl leading-relaxed">
              When smallholder farmers scout fields without cell tower signals, photos and GPS telemetry are securely buffered in browser storage and uploaded immediately once back in network range.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSync}
              disabled={!isOnline || isSyncing || queue.length === 0}
              className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 ${
                !isOnline || queue.length === 0
                  ? 'bg-white/5 text-stone-600 border border-white/5 cursor-not-allowed'
                  : 'bg-lime-400 hover:bg-lime-300 text-[#0a120a] shadow-lime-500/20 cursor-pointer active:scale-95'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronizing...' : `Sync All (${queue.length})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Network Status Card */}
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
            isOnline ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            {isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              {isOnline ? 'Active Internet Connection' : 'Offline / Low-Bandwidth Mode'}
            </h2>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {isOnline 
                ? 'Direct server connection to Gemini 2.5 Flash Vision & Google Cloud TTS'
                : 'Scans will be queued locally in IndexedDB with local heuristic diagnostic fallback'}
            </p>
          </div>
        </div>

        {queue.length > 0 && (
          <button
            onClick={onClearQueue}
            className="text-rose-400 hover:text-rose-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-500/30 hover:bg-rose-950/60 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Queue</span>
          </button>
        )}
      </div>

      {/* Queue Items List */}
      <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="font-bold text-xs uppercase tracking-widest text-lime-400 flex items-center gap-2">
            <span>Queued Farm Records</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-stone-200 text-[10px] font-mono">
              {queue.length} Pending
            </span>
          </h3>
        </div>

        {queue.length === 0 ? (
          <div className="text-center py-12 text-stone-400 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-lime-400 mx-auto" />
            <p className="font-bold text-white text-sm">All Field Scans are Fully Synchronized</p>
            <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
              Any photo captured while offline will appear here until connection is restored and processed with the cloud telemetry network.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((item) => {
              const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-lime-400/40 transition-all backdrop-blur-md"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-xl bg-black/60 overflow-hidden shrink-0 border border-white/10">
                      <img
                        src={item.imageBase64}
                        alt="Queued crop"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">
                          {item.cropHint || 'Unknown Crop'}
                        </span>
                        <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pending Sync
                        </span>
                      </div>
                      {item.latitude && item.longitude && (
                        <div className="text-[11px] text-stone-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-lime-400" />
                          <span>{item.latitude.toFixed(4)}°N, {item.longitude.toFixed(4)}°E ({item.regionName || 'Field Point'})</span>
                        </div>
                      )}
                      <p className="text-[10px] text-stone-500 font-mono">Captured at {timeStr}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {item.cachedResult && (
                      <button
                        onClick={() => onViewResult(item.cachedResult!)}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-lime-400 hover:text-[#0a120a] text-stone-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Offline Diagnosis</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
