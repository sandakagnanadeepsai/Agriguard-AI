import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Leaf, 
  FlaskConical, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Sparkles, 
  RotateCcw, 
  Bot, 
  Share2, 
  Download,
  Percent,
  Play,
  Pause,
  Languages,
  Activity,
  ArrowRight
} from 'lucide-react';
import { DiagnosticResult, SupportedLanguage } from '../types';
import { speakText, stopSpeaking } from '../services/tts';

interface DiagnosticResultViewProps {
  result: DiagnosticResult;
  onReset: () => void;
  onOpenAdvisoryBot: (result: DiagnosticResult) => void;
  onOpenMap: () => void;
  selectedLang: SupportedLanguage;
  setSelectedLang: (lang: SupportedLanguage) => void;
}

export const DiagnosticResultView: React.FC<DiagnosticResultViewProps> = ({
  result,
  onReset,
  onOpenAdvisoryBot,
  onOpenMap,
  selectedLang,
  setSelectedLang,
}) => {
  const [activeTab, setActiveTab] = useState<'organic' | 'chemical' | 'prevention'>('organic');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(0.95);
  const [translatedAdvisory, setTranslatedAdvisory] = useState<string>(result.actionableSummary);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // When language changes or on mount, translate actionable advisory if not English
  useEffect(() => {
    let isMounted = true;
    if (selectedLang.code === 'en') {
      setTranslatedAdvisory(result.actionableSummary);
      return;
    }

    const translate = async () => {
      setIsTranslating(true);
      try {
        const res = await fetch('/api/translate-advisory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: result.actionableSummary,
            targetLang: selectedLang.nativeName,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.translatedText) {
            setTranslatedAdvisory(data.translatedText);
          }
        }
      } catch (err) {
        console.warn('Translation error:', err);
      } finally {
        if (isMounted) setIsTranslating(false);
      }
    };

    translate();

    return () => {
      isMounted = false;
      stopSpeaking();
      setIsPlayingAudio(false);
    };
  }, [selectedLang, result]);

  // Audio Playback
  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      speakText(
        {
          text: `${result.cropName}: ${result.diseaseName}. ${translatedAdvisory}`,
          langCode: selectedLang.code,
          rate: speechRate,
        },
        () => setIsPlayingAudio(true),
        () => setIsPlayingAudio(false)
      );
    }
  };

  const handleShare = () => {
    const text = `🌾 AgriGuard AI Diagnosis:\nCrop: ${result.cropName}\nDisease: ${result.diseaseName} (${result.severityLevel})\nYield Risk: ${result.estimatedYieldImpactRisk}\nRemedy: ${result.actionableSummary}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    }
  };

  const isHealthy = result.diseaseName.toLowerCase().includes('healthy');

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 text-stone-200 border border-white/10 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
        >
          <RotateCcw className="w-3.5 h-3.5 text-lime-400" />
          <span>Scan Another Leaf</span>
        </button>

        <div className="flex items-center gap-3">
          {copiedNotification && (
            <span className="text-[11px] text-lime-300 font-bold bg-lime-500/20 border border-lime-500/30 px-3 py-1 rounded-xl animate-fade-in">
              Copied to clipboard!
            </span>
          )}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-stone-200 text-xs font-bold uppercase tracking-wider border border-white/10 transition-all cursor-pointer shadow-md"
          >
            <Share2 className="w-3.5 h-3.5 text-stone-300" />
            <span>Share Slip</span>
          </button>
        </div>
      </div>

      {/* Main Diagnostic Summary Card */}
      <div className={`rounded-3xl border shadow-2xl overflow-hidden bg-white/5 backdrop-blur-2xl ${
        isHealthy ? 'border-emerald-500/30' :
        result.severityLevel === 'Critical' ? 'border-rose-500/40 shadow-rose-950/40' :
        result.severityLevel === 'Severe' ? 'border-amber-500/40 shadow-amber-950/40' : 'border-emerald-500/30'
      }`}>
        {/* Header Ribbon */}
        <div className={`px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white relative ${
          isHealthy ? 'bg-gradient-to-r from-emerald-900/80 via-emerald-800/80 to-teal-900/80' :
          result.severityLevel === 'Critical' ? 'bg-gradient-to-r from-rose-950/90 via-rose-900/80 to-stone-950/90' :
          result.severityLevel === 'Severe' ? 'bg-gradient-to-r from-amber-950/90 via-amber-900/80 to-stone-950/90' :
          'bg-gradient-to-r from-emerald-950/90 via-teal-950/80 to-stone-950/90'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-lime-300">
                {result.cropName}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-black/40 border border-white/10 text-stone-300">
                {result.pathogenType}
              </span>
              {result.isOfflineDiagnosis && (
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-400 text-[#0a120a] shadow-xs">
                  Offline Fallback Engine
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-['Outfit'] tracking-tight text-white">
              {result.diseaseName}
            </h1>
          </div>

          {/* Severity & Confidence Gauge */}
          <div className="flex items-center gap-3">
            <div className="bg-black/50 backdrop-blur-md rounded-2xl px-3.5 py-2 text-right border border-white/10 shadow-inner">
              <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">AI Confidence</p>
              <div className="flex items-center gap-1 font-mono font-black text-lg text-lime-400 justify-end">
                <Percent className="w-4 h-4" />
                <span>{Math.round(result.confidenceScore * 100)}%</span>
              </div>
            </div>

            <div className="bg-black/50 backdrop-blur-md rounded-2xl px-3.5 py-2 text-right border border-white/10 shadow-inner">
              <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Severity</p>
              <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-md inline-block ${
                result.severityLevel === 'Critical' ? 'bg-rose-500 text-white' :
                result.severityLevel === 'Severe' ? 'bg-amber-400 text-[#0a120a]' :
                result.severityLevel === 'Moderate' ? 'bg-amber-300 text-[#0a120a]' :
                'bg-lime-400 text-[#0a120a]'
              }`}>
                {result.severityLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Inspection Image & Symptoms Split */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 border-b border-white/10">
          {/* Leaf Snapshot thumbnail */}
          <div className="md:col-span-4 aspect-[4/3] rounded-2xl overflow-hidden bg-black/60 relative border border-white/10 shadow-inner">
            <img
              src={result.imageUrl}
              alt={result.diseaseName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-md rounded-xl p-2 text-white text-[10px] flex items-center justify-between border border-white/10">
              <span className="font-semibold uppercase tracking-wider text-stone-300">Specimen</span>
              <span className="font-mono text-lime-400 font-bold">Gemini 3.7 Flash</span>
            </div>
          </div>

          {/* Identified Symptoms & Yield Impact */}
          <div className="md:col-span-8 flex flex-col justify-between space-y-4">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-lime-400 mb-3 flex items-center gap-2 font-['Outfit']">
                <Activity className="w-4 h-4 text-lime-400" />
                Pathology Diagnostics & Foliar Symptoms Identified
              </h2>
              <ul className="space-y-2">
                {result.symptomsIdentified.map((symptom, idx) => (
                  <li key={idx} className="text-xs text-stone-200 flex items-start gap-2.5 bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{symptom}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Estimated Yield Impact Risk Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">Yield Loss Risk: </span>
                  <span className="text-stone-200 font-medium">{result.estimatedYieldImpactRisk}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Multilingual Voice Audio Remediation Bar */}
        <div className="bg-[#0b140b] p-5 text-white border-b border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Audio narration button & visualizer */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleToggleAudio}
                className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all shadow-xl shrink-0 cursor-pointer ${
                  isPlayingAudio
                    ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse shadow-rose-500/30'
                    : 'bg-lime-400 hover:bg-lime-300 text-[#0a120a] font-bold shadow-lime-500/25 active:scale-95'
                }`}
                title={isPlayingAudio ? "Stop Audio Playback" : "Listen to Audio Advisory"}
              >
                {isPlayingAudio ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-lime-400" />
                  <p className="text-xs font-bold text-white uppercase tracking-wider">
                    Voice Narration ({selectedLang.nativeName})
                  </p>
                </div>
                {/* Audio Wave Visualizer Animation */}
                <div className="flex items-center gap-1.5 h-4 py-0.5">
                  {[4, 10, 16, 8, 14, 18, 12, 6, 14, 10, 16, 8].map((height, i) => (
                    <div
                      key={i}
                      style={{ height: isPlayingAudio ? `${height}px` : '3px' }}
                      className={`w-1 rounded-full transition-all duration-150 ${
                        isPlayingAudio ? 'bg-lime-400' : 'bg-stone-700'
                      }`}
                    />
                  ))}
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 ml-2 font-medium">
                    {isPlayingAudio ? 'Narration Active' : 'Tap play for audio playback'}
                  </span>
                </div>
              </div>
            </div>

            {/* Audio speed controls */}
            <div className="flex items-center gap-2 self-end sm:self-center bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Speed:</span>
              {[0.8, 1.0, 1.2].map(rate => (
                <button
                  key={rate}
                  onClick={() => setSpeechRate(rate)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    speechRate === rate
                      ? 'bg-lime-400 text-[#0a120a]'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Actionable Spoken Summary Text Box */}
          <div className="mt-4 p-4 rounded-2xl bg-black/50 border border-white/10 text-xs text-stone-200 leading-relaxed shadow-inner">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] uppercase font-black text-lime-400 tracking-widest">
                Actionable Advisory Summary ({selectedLang.name}):
              </span>
              {isTranslating && <span className="text-[10px] text-lime-400 animate-pulse font-semibold">Translating audio script...</span>}
            </div>
            <p className="font-medium text-stone-100 text-sm leading-relaxed">{translatedAdvisory}</p>
          </div>
        </div>

        {/* Structured Remediation Tabs (Organic / Chemical / Preventative) */}
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('organic')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'organic'
                  ? 'bg-lime-400 text-[#0a120a] shadow-lg shadow-lime-500/20 border border-lime-300'
                  : 'bg-white/5 text-stone-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              <Leaf className="w-3.5 h-3.5" />
              <span>Organic Bio-Remedies ({result.organicRemedies.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('chemical')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'chemical'
                  ? 'bg-lime-400 text-[#0a120a] shadow-lg shadow-lime-500/20 border border-lime-300'
                  : 'bg-white/5 text-stone-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Chemical Treatments ({result.chemicalRemedies.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('prevention')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'prevention'
                  ? 'bg-lime-400 text-[#0a120a] shadow-lg shadow-lime-500/20 border border-lime-300'
                  : 'bg-white/5 text-stone-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Preventative Practices ({result.preventativeMeasures.length})</span>
            </button>
          </div>

          {/* Tab 1: Organic Remedies */}
          {activeTab === 'organic' && (
            <div className="space-y-4">
              <p className="text-xs text-stone-400">
                Eco-friendly, accessible remedies using local bio-inputs safe for soil health and pollinators.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.organicRemedies.map((remedy, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 backdrop-blur-md">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-xs text-lime-300 flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-lime-400 shrink-0" />
                        {remedy.title}
                      </h3>
                      {remedy.availability && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-lime-500/20 text-lime-300 border border-lime-500/30 px-2 py-0.5 rounded-full">
                          {remedy.availability}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed">{remedy.description}</p>
                    <div className="text-[11px] text-stone-200 bg-black/40 p-2.5 rounded-xl border border-white/5">
                      <span className="font-bold text-lime-400">Application: </span>
                      {remedy.applicationMethod}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Chemical Remedies */}
          {activeTab === 'chemical' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Always wear protective eye goggles, face mask, and gloves when handling synthetic chemicals.</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.chemicalRemedies.map((chem, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 backdrop-blur-md">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-xs text-stone-100">{chem.activeIngredient}</h3>
                        {chem.commercialNameExample && (
                          <p className="text-[11px] text-stone-400 font-medium">Trade Names: {chem.commercialNameExample}</p>
                        )}
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-lg">
                        {chem.dosage}
                      </span>
                    </div>
                    <div className="text-[11px] text-rose-200 bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/30">
                      <span className="font-bold text-rose-400">Safety / Pre-Harvest: </span>
                      {chem.safetyCaution}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Preventative Practices */}
          {activeTab === 'prevention' && (
            <div className="space-y-4">
              <p className="text-xs text-stone-400">
                Cultural and agronomic practices to stop fungal/bacterial reinfection in upcoming cultivation cycles.
              </p>
              <div className="space-y-2.5">
                {result.preventativeMeasures.map((measure, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3 text-xs text-stone-200 backdrop-blur-md">
                    <ShieldCheck className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{measure}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Geo-tag Outbreak Log Confirmation Banner */}
        {result.location && (
          <div className="px-6 py-3.5 bg-black/40 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-300">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-lime-400 shrink-0" />
              <span>
                Geo-tagged detection logged at <strong className="font-mono text-lime-300">{result.location.latitude}°N, {result.location.longitude}°E</strong>
              </span>
            </div>
            <button
              onClick={onOpenMap}
              className="text-lime-400 hover:text-lime-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
            >
              <span>View on Regional Heatmap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Action Footer for Agronomist Q&A */}
      <div className="p-5 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-lime-400 to-emerald-500 text-[#0a120a] flex items-center justify-center font-bold shrink-0 shadow-lg shadow-lime-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-sm font-['Outfit'] text-white">Have questions about preparing this remedy?</h4>
            <p className="text-xs text-stone-400">Ask our Gemini AI Agronomist for dosage, mixing ratios, or weather timings.</p>
          </div>
        </div>
        <button
          onClick={() => onOpenAdvisoryBot(result)}
          className="px-5 py-3 rounded-2xl bg-lime-400 hover:bg-lime-300 text-[#0a120a] font-black text-xs uppercase tracking-widest shadow-xl shadow-lime-500/20 transition-all whitespace-nowrap cursor-pointer active:scale-95"
        >
          Ask AI Agronomist
        </button>
      </div>
    </div>
  );
};
