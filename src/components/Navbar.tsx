import React from 'react';
import { 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Globe, 
  Camera, 
  MapPin, 
  Database, 
  Bot, 
  History 
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../data/sampleOutbreaks';
import { SupportedLanguage } from '../types';

interface NavbarProps {
  currentView: 'scanner' | 'map' | 'queue' | 'advisory' | 'history';
  setCurrentView: (view: 'scanner' | 'map' | 'queue' | 'advisory' | 'history') => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  selectedLang: SupportedLanguage;
  setSelectedLang: (lang: SupportedLanguage) => void;
  queueCount: number;
  isSyncing: boolean;
  onSync: () => void;
  alertsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  isOnline,
  setIsOnline,
  selectedLang,
  setSelectedLang,
  queueCount,
  isSyncing,
  onSync,
  alertsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0a120a]/85 backdrop-blur-2xl text-stone-100 border-b border-white/10 shadow-2xl">
      {/* Top Bar with brand & connection telemetry */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div 
          onClick={() => setCurrentView('scanner')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-lime-400 to-emerald-500 p-0.5 shadow-lg shadow-lime-500/20 flex items-center justify-center text-[#0a120a] font-bold group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6 text-[#0a120a] stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-['Outfit']">AgriGuard</span>
              <span className="text-[10px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded bg-lime-400 text-[#0a120a] shadow-xs">AI</span>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-lime-400/80 leading-none hidden sm:block font-semibold">Google Gen AI Early-Warning</p>
          </div>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online/Offline Simulator & Status Pill */}
          <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 text-xs shadow-inner">
            <button
              onClick={() => setIsOnline(!isOnline)}
              title={isOnline ? "Simulate Offline Mode" : "Switch to Online Mode"}
              className="flex items-center gap-2 transition-colors cursor-pointer"
            >
              {isOnline ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-400"></span>
                  </span>
                  <span className="text-lime-300 text-[11px] font-semibold hidden md:inline tracking-wide">Field Online</span>
                  <Wifi className="w-3.5 h-3.5 text-lime-400" />
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                  <span className="text-amber-300 text-[11px] font-semibold hidden md:inline tracking-wide">Store & Forward</span>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                </>
              )}
            </button>

            {queueCount > 0 && (
              <button
                onClick={onSync}
                disabled={!isOnline || isSyncing}
                title="Sync offline queue"
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-[#0a120a] transition-all shadow-sm ${
                  isSyncing ? 'opacity-70 animate-pulse' : 'hover:bg-amber-300 cursor-pointer active:scale-95'
                }`}
              >
                <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{queueCount} Queued</span>
              </button>
            )}
          </div>

          {/* Multilingual Selector */}
          <div className="relative flex items-center">
            <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 text-xs shadow-inner">
              <Globe className="w-3.5 h-3.5 text-lime-400" />
              <select
                aria-label="Select Application Language"
                value={selectedLang.code}
                onChange={(e) => {
                  const found = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
                  if (found) setSelectedLang(found);
                }}
                className="bg-transparent text-stone-200 text-xs font-semibold focus:outline-none cursor-pointer pr-1"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-[#0f1b0f] text-stone-100">
                    {lang.flag} {lang.name} ({lang.nativeName.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Glass Pill Row */}
      <div className="bg-black/30 border-t border-white/5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-around sm:justify-start sm:gap-2 py-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setCurrentView('scanner')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              currentView === 'scanner'
                ? 'bg-lime-400 text-[#0a120a] shadow-lg shadow-lime-500/20 border border-lime-300'
                : 'text-stone-300 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Crop Scanner</span>
          </button>

          <button
            onClick={() => setCurrentView('map')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap relative cursor-pointer ${
              currentView === 'map'
                ? 'bg-lime-400 text-[#0a120a] shadow-lg shadow-lime-500/20 border border-lime-300'
                : 'text-stone-300 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Outbreak Heatmap</span>
            {alertsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse shadow-sm">
                {alertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentView('advisory')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              currentView === 'advisory'
                ? 'bg-lime-400 text-[#0a120a] shadow-lg shadow-lime-500/20 border border-lime-300'
                : 'text-stone-300 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>AI Agronomist</span>
          </button>

          <button
            onClick={() => setCurrentView('queue')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              currentView === 'queue'
                ? 'bg-lime-400 text-[#0a120a] shadow-lg shadow-lime-500/20 border border-lime-300'
                : 'text-stone-300 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Store & Forward</span>
            {queueCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-[#0a120a] text-[10px] font-black flex items-center justify-center">
                {queueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentView('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              currentView === 'history'
                ? 'bg-lime-400 text-[#0a120a] shadow-lg shadow-lime-500/20 border border-lime-300'
                : 'text-stone-300 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Field Logs</span>
          </button>
        </div>
      </div>
    </header>
  );
};
