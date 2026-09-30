import { SUPPORTED_LANGUAGES } from '../data/sampleOutbreaks';

export interface TTSOptions {
  text: string;
  langCode: string; // e.g. 'hi', 'sw', 'en', 'es', 'fr', 'te', 'bn', 'pt'
  rate?: number;
}

let activeAudio: HTMLAudioElement | null = null;

export async function speakText(options: TTSOptions, onStart?: () => void, onEnd?: () => void): Promise<void> {
  stopSpeaking();

  const langObj = SUPPORTED_LANGUAGES.find(l => l.code === options.langCode) || SUPPORTED_LANGUAGES[0];

  // Try server-side TTS first if online
  if (navigator.onLine) {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: options.text,
          langCode: options.langCode,
          voiceName: langObj.speechVoiceName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioUrl || data.audioBase64) {
          const src = data.audioUrl || `data:audio/mp3;base64,${data.audioBase64}`;
          const audio = new Audio(src);
          activeAudio = audio;
          audio.playbackRate = options.rate || 1.0;
          if (onStart) audio.onplay = () => onStart();
          if (onEnd) {
            audio.onended = () => {
              activeAudio = null;
              onEnd();
            };
            audio.onerror = () => {
              activeAudio = null;
              onEnd();
            };
          }
          await audio.play();
          return;
        }
      }
    } catch (err) {
      console.warn('Server TTS unavailable, falling back to Web Speech API:', err);
    }
  }

  // Web Speech API fallback for offline / low-bandwidth capability
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(options.text);
    
    // Map language code to BCP 47 tag
    const langMap: Record<string, string> = {
      en: 'en-US',
      hi: 'hi-IN',
      sw: 'sw-TZ',
      es: 'es-ES',
      fr: 'fr-FR',
      te: 'te-IN',
      bn: 'bn-IN',
      pt: 'pt-BR'
    };
    utterance.lang = langMap[options.langCode] || 'en-US';
    utterance.rate = options.rate || 0.95; // slightly slower for maximum clarity for rural farmers

    if (onStart) utterance.onstart = () => onStart();
    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }

    window.speechSynthesis.speak(utterance);
  } else {
    if (onEnd) onEnd();
  }
}

export function stopSpeaking(): void {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
