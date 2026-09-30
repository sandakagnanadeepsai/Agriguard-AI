import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  MapPin, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Leaf, 
  Info,
  Layers
} from 'lucide-react';
import { SAMPLE_LEAVES, SampleLeaf } from '../data/sampleLeaves';
import { DiagnosticResult } from '../types';

interface CropScannerProps {
  onDiagnosisComplete: (result: DiagnosticResult, wasOffline: boolean) => void;
  isOnline: boolean;
  onQueueOfflineScan: (scanPayload: {
    imageBase64: string;
    mimeType: string;
    cropHint?: string;
    latitude?: number;
    longitude?: number;
    regionName?: string;
  }) => void;
}

export const CropScanner: React.FC<CropScannerProps> = ({
  onDiagnosisComplete,
  isOnline,
  onQueueOfflineScan,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(SAMPLE_LEAVES[0].thumbnailUrl);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [cropHint, setCropHint] = useState<string>('Tomato');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // GPS Location state
  const [useGps, setUseGps] = useState<boolean>(true);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number; regionName: string }>({
    latitude: 0.5143,
    longitude: 35.2698,
    regionName: 'Uasin Gishu County, Kenya (Field Zone A)',
  });
  const [locatingGps, setLocatingGps] = useState<boolean>(false);

  // Quick regional presets for smallholder demonstrations
  const REGIONAL_PRESETS = [
    { label: 'Eldoret, Kenya', lat: 0.5143, lon: 35.2698, region: 'Uasin Gishu County, Kenya' },
    { label: 'Punjab, India', lat: 30.9010, lon: 75.8573, region: 'Ludhiana District, Punjab, India' },
    { label: 'Kabale, Uganda', lat: -1.2864, lon: 29.6897, region: 'Kigezi Highlands, Uganda' },
    { label: 'Bajío, Mexico', lat: 20.6767, lon: -101.3563, region: 'Irapuato, Guanajuato, Mexico' },
  ];

  // Request device GPS
  const handleGetDeviceGps = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported on this browser/device.');
      return;
    }
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates({
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
          regionName: 'Current Device GPS Location',
        });
        setLocatingGps(false);
      },
      (err) => {
        console.warn('GPS location error:', err);
        setLocatingGps(false);
        setErrorMsg('Unable to retrieve device GPS. Using default agricultural cluster coordinates.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Start Camera
  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      setErrorMsg(null);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setErrorMsg('Could not open camera stream. Please check camera permissions or upload an image file directly.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedImage(dataUrl);
      setMimeType('image/jpeg');
      stopCamera();
    }
  };

  // Handle File Upload / Drop
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select an image file (JPG, PNG, WEBP).');
      return;
    }
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setErrorMsg(null);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  // Handle Sample Leaf selection
  const handleSelectSample = (sample: SampleLeaf) => {
    stopCamera();
    setSelectedImage(sample.thumbnailUrl);
    setMimeType('image/jpeg');
    setCropHint(sample.crop);
    setErrorMsg(null);
  };

  // Convert remote or data URL to clean base64
  const getImageBase64 = async (imgSrc: string): Promise<string> => {
    if (imgSrc.startsWith('data:image')) {
      return imgSrc;
    }
    // If it's a URL, fetch and convert to base64
    const response = await fetch(imgSrc);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Main Diagnosis Trigger
  const handleDiagnose = async () => {
    if (!selectedImage) {
      setErrorMsg('Please upload, capture, or select a crop leaf image to analyze.');
      return;
    }

    setIsScanning(true);
    setErrorMsg(null);

    try {
      const base64Data = await getImageBase64(selectedImage);

      // If simulated or actual offline mode is active, store in IndexedDB and generate resilient instant result
      if (!isOnline) {
        onQueueOfflineScan({
          imageBase64: base64Data,
          mimeType,
          cropHint,
          latitude: useGps ? coordinates.latitude : undefined,
          longitude: useGps ? coordinates.longitude : undefined,
          regionName: useGps ? coordinates.regionName : undefined,
        });
        setIsScanning(false);
        return;
      }

      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType,
          cropHint,
          latitude: useGps ? coordinates.latitude : undefined,
          longitude: useGps ? coordinates.longitude : undefined,
          regionName: useGps ? coordinates.regionName : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.result) {
        const fullResult: DiagnosticResult = {
          ...data.result,
          imageUrl: selectedImage,
        };
        onDiagnosisComplete(fullResult, false);
      } else {
        throw new Error('Diagnosis response format unexpected');
      }
    } catch (err: any) {
      console.error('Diagnosis request error:', err);
      setErrorMsg(`Diagnosis connection error: ${err.message}. Storing in offline resilient queue.`);
      // Auto queue on network error
      const base64Data = await getImageBase64(selectedImage);
      onQueueOfflineScan({
        imageBase64: base64Data,
        mimeType,
        cropHint,
        latitude: useGps ? coordinates.latitude : undefined,
        longitude: useGps ? coordinates.longitude : undefined,
        regionName: useGps ? coordinates.regionName : undefined,
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Banner for Smallholder Context - Immersive Glass Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950/70 via-[#0d2012]/80 to-teal-950/70 border border-emerald-500/30 text-white rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
        {/* Subtle accent light */}
        <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-lime-400/60 to-transparent"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-lime-400 text-[#0a120a] font-black text-[10px] uppercase tracking-widest shadow-md shadow-lime-500/20">
                Google Gen AI Vision
              </span>
              <span className="text-xs text-lime-300 font-medium">Gemini 3.7 Flash Multimodal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-['Outfit'] tracking-tight text-white">
              Instant Crop Disease Scanner & Audio Remediation
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 max-w-xl leading-relaxed">
              Upload or capture a photo of an infected leaf. Receive instant pathology diagnosis, localized organic remedies, and audio playback in local dialects.
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-5">
            <span className="text-[11px] uppercase tracking-wider text-stone-400">Offline Resilience:</span>
            <span className="px-3 py-1.5 rounded-xl bg-black/40 border border-lime-500/40 text-lime-300 text-xs font-bold flex items-center gap-2 shadow-inner">
              <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" />
              Store & Forward Active
            </span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-amber-950/60 backdrop-blur-md border border-amber-500/40 text-amber-200 text-xs flex items-start gap-3 shadow-lg">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-amber-400 hover:text-white font-bold text-sm">×</button>
        </div>
      )}

      {/* Main Scanner Card */}
      <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative">
        {/* Top Edge Glow */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-lime-400/40 to-transparent"></div>

        {/* Visual Viewport / Camera Stream */}
        <div className="relative bg-black/80 aspect-[4/3] sm:aspect-[16/9] w-full max-h-[400px] flex items-center justify-center overflow-hidden">
          {isCameraActive ? (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Camera Overlays */}
              <div className="absolute inset-0 border-2 border-lime-400/40 pointer-events-none m-6 rounded-2xl flex items-center justify-center">
                <div className="w-52 h-52 border-2 border-dashed border-lime-400 rounded-2xl opacity-90 animate-pulse flex items-center justify-center shadow-lg shadow-lime-500/20">
                  <span className="text-[11px] font-bold text-lime-300 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-lime-400/30 uppercase tracking-wider">
                    Align leaf inside frame
                  </span>
                </div>
              </div>

              {/* Camera Controls Bar */}
              <div className="absolute bottom-5 inset-x-0 flex items-center justify-center gap-4 z-10 px-4">
                <button
                  onClick={() => {
                    setFacingMode(f => f === 'environment' ? 'user' : 'environment');
                    setTimeout(() => startCamera(), 100);
                  }}
                  className="p-3.5 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20 hover:bg-black/90 transition-all text-xs flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-lime-400" />
                </button>
                <button
                  onClick={capturePhoto}
                  className="px-7 py-3 rounded-full bg-lime-400 text-[#0a120a] font-extrabold hover:bg-lime-300 transition-all shadow-xl shadow-lime-500/30 flex items-center gap-2 text-sm uppercase tracking-wider cursor-pointer active:scale-95"
                >
                  <Camera className="w-5 h-5 text-[#0a120a]" />
                  Capture Photo
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-3 rounded-full bg-rose-600/80 backdrop-blur-md text-white hover:bg-rose-700 transition-all text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : selectedImage ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black/90 group">
              <img
                src={selectedImage}
                alt="Selected crop leaf for diagnosis"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              {/* Scanning Radar Overlay Animation during scan */}
              {isScanning && (
                <div className="absolute inset-0 bg-[#0a120a]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-lime-400 animate-ping opacity-75"></div>
                    <div className="w-20 h-20 rounded-full bg-lime-400/20 border-2 border-lime-400 backdrop-blur-md flex items-center justify-center text-lime-300 shadow-xl shadow-lime-500/30">
                      <Sparkles className="w-8 h-8 text-lime-400 animate-spin" />
                    </div>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-white font-extrabold text-base tracking-tight font-['Outfit']">Analyzing Pathology with Gemini Vision...</p>
                    <p className="text-lime-300 text-xs mt-1">Identifying foliar lesions, pathogen taxonomy & remedies</p>
                  </div>
                </div>
              )}

              {/* Action Overlays */}
              {!isScanning && (
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md text-stone-200 hover:text-white text-xs font-semibold border border-white/15 cursor-pointer shadow-lg"
                  >
                    Clear Image
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-8 cursor-pointer hover:bg-white/5 transition-all border-2 border-dashed border-white/10 m-4 rounded-2xl group"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-lime-400 mb-3 group-hover:scale-110 group-hover:border-lime-400/50 transition-all shadow-inner">
                <Upload className="w-8 h-8" />
              </div>
              <p className="text-stone-200 font-bold text-sm">Drop leaf photo here or tap to browse</p>
              <p className="text-stone-500 text-xs mt-1">Supports JPG, PNG, WEBP from mobile camera</p>
            </div>
          )}
        </div>

        {/* Input Bar Controls */}
        <div className="p-5 sm:p-6 space-y-4 bg-black/20">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Action Buttons: Camera vs Upload */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={startCamera}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-white/10 hover:bg-white/15 text-stone-100 border border-white/10 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              <Camera className="w-4 h-4 text-lime-400" />
              <span>Live Camera</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-white/10 hover:bg-white/15 text-stone-100 border border-white/10 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              <Upload className="w-4 h-4 text-stone-300" />
              <span>Upload Photo</span>
            </button>

            {/* Crop Type Selector */}
            <div className="col-span-2 sm:col-span-2 flex items-center gap-2 bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2 text-stone-200">
              <Leaf className="w-4 h-4 text-lime-400 shrink-0" />
              <label htmlFor="crop-type-select" className="text-xs text-stone-400 shrink-0 font-medium">Crop:</label>
              <select
                id="crop-type-select"
                aria-label="Target Crop Type"
                value={cropHint}
                onChange={(e) => setCropHint(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-stone-100 focus:outline-none cursor-pointer"
              >
                <option value="Tomato" className="bg-[#0f1b0f] text-stone-100">Tomato (Solanum lycopersicum)</option>
                <option value="Maize / Corn" className="bg-[#0f1b0f] text-stone-100">Maize / Corn (Zea mays)</option>
                <option value="Potato" className="bg-[#0f1b0f] text-stone-100">Potato (Solanum tuberosum)</option>
                <option value="Cassava" className="bg-[#0f1b0f] text-stone-100">Cassava (Manihot esculenta)</option>
                <option value="Rice / Paddy" className="bg-[#0f1b0f] text-stone-100">Rice / Paddy (Oryza sativa)</option>
                <option value="Wheat" className="bg-[#0f1b0f] text-stone-100">Wheat (Triticum aestivum)</option>
                <option value="Coffee" className="bg-[#0f1b0f] text-stone-100">Coffee (Coffea arabica)</option>
                <option value="Cotton" className="bg-[#0f1b0f] text-stone-100">Cotton (Gossypium)</option>
                <option value="Banana" className="bg-[#0f1b0f] text-stone-100">Banana / Plantain</option>
                <option value="Auto-Detect" className="bg-[#0f1b0f] text-stone-100">Auto-Detect Plant</option>
              </select>
            </div>
          </div>

          {/* Geo-tagging & Outbreak Cluster logging settings */}
          <div className="p-3.5 bg-black/40 border border-white/10 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-lime-400" />
                <span className="text-xs font-bold text-stone-200 uppercase tracking-wider">Geo-Tagged Outbreak Telemetry</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useGps}
                  onChange={(e) => setUseGps(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-500 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-lime-500"></div>
              </label>
            </div>

            {useGps && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-300 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1.5 truncate max-w-sm">
                  <span className="font-mono text-[11px] bg-white/10 px-2 py-0.5 rounded-lg text-lime-300 font-semibold border border-white/5">
                    {coordinates.latitude}°N, {coordinates.longitude}°E
                  </span>
                  <span className="truncate text-stone-400 text-[11px]">{coordinates.regionName}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleGetDeviceGps}
                    disabled={locatingGps}
                    className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer border border-white/10"
                  >
                    {locatingGps ? 'Locating...' : 'Get GPS'}
                  </button>
                  <select
                    aria-label="Select Regional Cluster Coordinates"
                    onChange={(e) => {
                      const preset = REGIONAL_PRESETS.find(p => p.label === e.target.value);
                      if (preset) {
                        setCoordinates({
                          latitude: preset.lat,
                          longitude: preset.lon,
                          regionName: preset.region,
                        });
                      }
                    }}
                    className="bg-black/50 text-stone-200 text-[11px] rounded-xl px-2 py-1 border border-white/10 cursor-pointer focus:outline-none"
                  >
                    <option value="" className="bg-[#0f1b0f] text-stone-100">Choose Cluster Preset...</option>
                    {REGIONAL_PRESETS.map(p => (
                      <option key={p.label} value={p.label} className="bg-[#0f1b0f] text-stone-100">{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Primary Diagnose Action Button */}
          <button
            onClick={handleDiagnose}
            disabled={!selectedImage || isScanning}
            className={`w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-2.5 ${
              !selectedImage || isScanning
                ? 'bg-white/10 text-stone-500 border border-white/5 cursor-not-allowed'
                : isOnline
                ? 'bg-lime-500 hover:bg-lime-400 text-[#0a120a] shadow-lime-500/25 active:scale-[0.98] cursor-pointer'
                : 'bg-amber-400 hover:bg-amber-300 text-[#0a120a] shadow-amber-500/25 active:scale-[0.98] cursor-pointer'
            }`}
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-[#0a120a]" />
                <span>Running Agronomic Diagnostic Analysis...</span>
              </>
            ) : isOnline ? (
              <>
                <Sparkles className="w-5 h-5 text-[#0a120a]" />
                <span>Diagnose with Google AI Vision</span>
              </>
            ) : (
              <>
                <Layers className="w-5 h-5 text-[#0a120a]" />
                <span>Store to Offline Queue & Instant Heuristic Diagnosis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pre-loaded Sample Leaves Carousel for Instant Testing */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-lime-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-300 font-['Outfit']">Instant Test Library (Sample Crops)</h2>
          </div>
          <span className="text-[11px] text-stone-400">Tap sample to test diagnosis</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {SAMPLE_LEAVES.map((sample) => (
            <div
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-2.5 hover:border-lime-400 hover:bg-white/10 hover:shadow-lg hover:shadow-lime-500/10 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="aspect-square rounded-xl overflow-hidden bg-black/40 mb-2 relative border border-white/5">
                <img
                  src={sample.thumbnailUrl}
                  alt={sample.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
                <span className={`absolute bottom-1 right-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                  sample.severity === 'Critical' ? 'bg-rose-500/80 text-white' :
                  sample.severity === 'Severe' ? 'bg-amber-500/80 text-[#0a120a]' :
                  sample.severity === 'Moderate' ? 'bg-yellow-400/80 text-[#0a120a]' : 'bg-lime-400/80 text-[#0a120a]'
                }`}>
                  {sample.severity}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-stone-100 line-clamp-1">{sample.crop}</p>
                <p className="text-[10px] text-stone-400 line-clamp-1">{sample.condition}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Educational Banner on How AgriGuard Works */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-xs text-stone-400 flex items-start gap-3">
        <Info className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-stone-200 uppercase tracking-wider text-[11px]">Empowering Smallholder Farmers with Google AI</p>
          <p className="leading-relaxed text-stone-400 text-xs">
            AgriGuard AI leverages Gemini 3.7 Flash's high-resolution visual comprehension to spot microscopic fungal spores, necrotic haloes, and viral mosaic patterns. For offline operations in rural areas with poor connectivity, scans are queued in browser IndexedDB and synced automatically when signal is restored.
          </p>
        </div>
      </div>
    </div>
  );
};
