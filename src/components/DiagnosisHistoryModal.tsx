import React, { useState } from 'react';
import { 
  History, 
  Trash2, 
  Eye, 
  MapPin, 
  Leaf, 
  Calendar, 
  Percent, 
  Search,
  CheckCircle2
} from 'lucide-react';
import { DiagnosticResult } from '../types';

interface DiagnosisHistoryModalProps {
  history: DiagnosticResult[];
  onSelectResult: (result: DiagnosticResult) => void;
  onClearHistory: () => void;
}

export const DiagnosisHistoryModal: React.FC<DiagnosisHistoryModalProps> = ({
  history,
  onSelectResult,
  onClearHistory,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredHistory = history.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.cropName.toLowerCase().includes(q) ||
      item.diseaseName.toLowerCase().includes(q) ||
      (item.location?.regionName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white/5 backdrop-blur-2xl text-white rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-lime-400/20 text-lime-300 border border-lime-400/30 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md">
              <History className="w-3.5 h-3.5 text-lime-400" />
              Local Field Archive
            </span>
            <span className="text-xs text-stone-400 font-medium">Persistent IndexedDB Storage</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black font-['Outfit'] tracking-tight text-white">
            Field Inspection History & Diagnosis Logs
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl leading-relaxed">
            Review past disease assessments, historical symptoms, and verified treatment outcomes for your plots.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-rose-400 hover:text-rose-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-rose-950/40 border border-rose-500/30 hover:bg-rose-950/70 transition-all self-start sm:self-center cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Search & List */}
      <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by crop, disease, or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-xs sm:text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-lime-400 transition-colors"
            />
          </div>
          <span className="text-xs text-stone-400 font-mono font-bold">{filteredHistory.length} records found</span>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 text-stone-400 space-y-2">
            <Leaf className="w-12 h-12 text-stone-600 mx-auto" />
            <p className="font-bold text-white text-sm">No Diagnosis Records Found</p>
            <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
              Scan a crop leaf with the camera or choose a sample to log your first field diagnosis.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHistory.map((item) => {
              const dateStr = new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-lime-400/40 transition-all flex flex-col justify-between space-y-3.5 backdrop-blur-md"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-16 h-16 rounded-xl bg-black/60 overflow-hidden shrink-0 border border-white/10">
                      <img
                        src={item.imageUrl}
                        alt={item.diseaseName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-white line-clamp-1">{item.diseaseName}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded text-[#0a120a] ${
                          item.severityLevel === 'Critical' ? 'bg-rose-500 text-white' :
                          item.severityLevel === 'Severe' ? 'bg-amber-400' :
                          item.severityLevel === 'Moderate' ? 'bg-amber-300' : 'bg-lime-400'
                        }`}>
                          {item.severityLevel}
                        </span>
                      </div>
                      <p className="text-[11px] text-lime-400 font-bold uppercase tracking-wider">{item.cropName}</p>
                      <div className="flex items-center gap-2 text-[10px] text-stone-400">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3" />
                          {dateStr}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-lime-300">{Math.round(item.confidenceScore * 100)}% confidence</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                    {item.location ? (
                      <span className="text-[10px] text-stone-400 flex items-center gap-1 truncate max-w-[180px]">
                        <MapPin className="w-3 h-3 text-lime-400" />
                        {item.location.regionName || `${item.location.latitude}, ${item.location.longitude}`}
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-500">Manual specimen</span>
                    )}

                    <button
                      onClick={() => onSelectResult(item)}
                      className="px-3 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-[#0a120a] font-bold text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>
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
