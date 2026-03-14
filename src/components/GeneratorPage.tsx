import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Wand2, 
  Video, 
  Settings, 
  Music, 
  Mic, 
  Clock, 
  Monitor,
  Check,
  ChevronRight,
  Loader2,
  AlertCircle,
  Sparkles,
  Upload,
  Star,
  Share2
} from 'lucide-react';
import { motion } from 'motion/react';
import { generateVideo, saveVideoToHistory } from '../services/videoService';
import { enhancePrompt, generateSuggestions } from '../services/geminiService';
import { VideoPlayer } from './VideoPlayer';
import { ShareModal } from './ShareModal';

const styles = [
  { id: 'cinematic', name: 'Cinematic', image: 'https://picsum.photos/seed/cinema/400/225' },
  { id: 'anime', name: 'Anime', image: 'https://picsum.photos/seed/anime/400/225' },
  { id: 'realistic', name: 'Realistic', image: 'https://picsum.photos/seed/real/400/225' },
  { id: 'cartoon', name: 'Cartoon', image: 'https://picsum.photos/seed/cartoon/400/225' },
  { id: 'cyberpunk', name: 'Cyberpunk', image: 'https://picsum.photos/seed/cyber/400/225' },
  { id: 'educational', name: 'Educational', image: 'https://picsum.photos/seed/edu/400/225' },
  { id: '3d-animation', name: '3D Animation', image: 'https://picsum.photos/seed/3d/400/225' },
  { id: 'kinetic-typography', name: 'Kinetic Typography', image: 'https://picsum.photos/seed/text/400/225' },
  { id: 'ad', name: 'Advertisement', image: 'https://picsum.photos/seed/ads/400/225' },
];

export const GeneratorPage = ({ 
  initialPrompt, 
  initialStyle,
  onClearInitialPrompt 
}: { 
  initialPrompt?: string; 
  initialStyle?: string;
  onClearInitialPrompt?: () => void 
}) => {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [selectedStyle, setSelectedStyle] = useState(initialStyle || 'cinematic');
  
  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
    if (initialStyle) {
      setSelectedStyle(initialStyle);
    }
    if (initialPrompt || initialStyle) {
      onClearInitialPrompt?.();
    }
  }, [initialPrompt, initialStyle]);
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [duration, setDuration] = useState('10s');
  const [selectedMusic, setSelectedMusic] = useState('none');
  const [showMusicMenu, setShowMusicMenu] = useState(false);
  const [customMusicFile, setCustomMusicFile] = useState<File | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('neutral');
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [pitch, setPitch] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [enableWatermark, setEnableWatermark] = useState(false);
  const [customWatermark, setCustomWatermark] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [status, setStatus] = useState('');
  const [generatedVideo, setGeneratedVideo] = useState<{ url: string; id: string } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const lastRequestTimestamp = React.useRef<number>(0);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    const res = await generateSuggestions();
    setSuggestions(res);
  };

  const presets = [
    { id: 'custom', name: 'Custom Settings', style: selectedStyle, ratio: aspectRatio },
    { id: 'cinematic_landscape', name: 'Cinematic Landscape', style: 'cinematic', ratio: '16:9' },
    { id: 'social_portrait', name: 'Social Media Portrait', style: 'realistic', ratio: '9:16' },
    { id: 'anime_short', name: 'Anime Short', style: 'anime', ratio: '9:16' },
    { id: 'cyberpunk_wide', name: 'Cyberpunk Wide', style: 'cyberpunk', ratio: '16:9' },
  ];

  const handlePresetChange = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset && preset.id !== 'custom') {
      setSelectedStyle(preset.style);
      setAspectRatio(preset.ratio as any);
    }
  };

  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomWatermark(reader.result as string);
        setEnableWatermark(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnhance = async () => {
    if (!prompt) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhancePrompt(prompt);
      setPrompt(enhanced);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!prompt) return;
    setIsSavingPrompt(true);
    try {
      await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      alert('Prompt saved successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  const handleGenerate = async () => {
    // 1. Prevent multiple API requests (Locking mechanism)
    if (isGenerating || !prompt) return;
    
    // 2. Add request throttling (Prevent rapid clicks within 2 seconds)
    const now = Date.now();
    if (now - lastRequestTimestamp.current < 2000) {
      console.warn("Throttling: Request ignored due to rapid clicking.");
      return;
    }
    lastRequestTimestamp.current = now;

    // 3. Add loading state & Clear previous state
    setIsGenerating(true);
    setError(null);
    setGeneratedVideo(null);
    setStatus('Initializing...');

    // 4. Ensure each video generation uses a unique ID/Timestamp
    const requestId = `req-${now}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[DEBUG] Starting generation request: ${requestId}`);

    try {
      const result = await generateVideo({
        prompt,
        style: selectedStyle,
        resolution,
        aspectRatio,
        duration,
        requestId // Passing unique ID for tracking
      }, (s) => setStatus(s));

      setGeneratedVideo(result);
      
      // Save to history
      await saveVideoToHistory({
        id: result.id,
        prompt,
        style: selectedStyle,
        video_url: result.url,
        duration,
        resolution
      });

      console.log(`[DEBUG] Generation successful for request: ${requestId}`);
    } catch (err: any) {
      // 6. Add error handling & Log errors in console for debugging
      console.error(`[DEBUG] Generation Error (Request ${requestId}):`, err);
      const errorMsg = err.message || "";
      
      if (errorMsg === "PERMISSION_DENIED" || errorMsg.includes("403") || errorMsg.includes("permission")) {
        setError('paid_key_required');
      } else if (errorMsg === "API_KEY_EXPIRED" || errorMsg.includes("Requested entity was not found")) {
        setError('session_expired');
      } else if (errorMsg === "RESOURCE_EXHAUSTED" || errorMsg.includes("429")) {
        setError('error_quota');
      } else if (errorMsg === "INVALID_ARGUMENT" || errorMsg.includes("400")) {
        setError('error_invalid');
      } else if (errorMsg === "INTERNAL_ERROR" || errorMsg.includes("500")) {
        setError('error_server');
      } else if (errorMsg === "SAFETY_BLOCKED") {
        setError('error_safety');
      } else if (errorMsg === "NETWORK_ERROR") {
        setError('error_network');
      } else if (errorMsg === "GENERATION_FAILED") {
        setError('error_failed');
      } else {
        setError(errorMsg || 'error_failed');
      }
    } finally {
      // Release the lock
      setIsGenerating(false);
    }
  };

  const handleSelectKey = async () => {
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setError(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-display font-bold mb-2 text-slate-900 dark:text-white">{t('create_new')}</h2>
        <p className="text-slate-500 dark:text-white/60">Turn your imagination into cinematic reality with Veo 3.1 AI.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-white/80">
                <Wand2 size={16} className="text-neon-blue" />
                {t('video_prompt')}
              </label>
              <div className="flex gap-4">
                <button 
                  onClick={handleSavePrompt}
                  disabled={!prompt || isSavingPrompt}
                  className="text-xs font-bold text-slate-400 hover:text-neon-blue transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  {isSavingPrompt ? <Loader2 size={12} className="animate-spin" /> : <Star size={12} />}
                  Save Prompt
                </button>
                <button 
                  onClick={handleEnhance}
                  disabled={!prompt || isEnhancing}
                  className="text-xs font-bold text-neon-blue hover:text-neon-purple transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  {isEnhancing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {t('ai_enhance')}
                </button>
              </div>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your video in detail... e.g., 'A majestic dragon soaring through a storm of golden lightning'"
              className="w-full h-32 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-neon-blue/50 transition-colors resize-none"
            />
            
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(s)}
                  className="text-[10px] px-3 py-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-all"
                >
                  {s.length > 40 ? s.substring(0, 40) + '...' : s}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 space-y-6">
            <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-white/80">
              <Settings size={16} className="text-neon-blue" />
              {t('visual_style')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`relative group rounded-xl overflow-hidden aspect-video border-2 transition-all ${
                    selectedStyle === style.id ? 'border-neon-blue shadow-lg shadow-neon-blue/20' : 'border-transparent'
                  }`}
                >
                  <img src={style.image} alt={style.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  <div className={`absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity ${selectedStyle === style.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <span className="text-xs font-bold">{style.name}</span>
                  </div>
                  {selectedStyle === style.id && (
                    <div className="absolute top-2 right-2 bg-neon-blue rounded-full p-1">
                      <Check size={10} className="text-dark-bg" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-6">
            <h3 className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-white/80">
              <Monitor size={16} className="text-neon-blue" />
              {t('output_settings')}
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-slate-400 dark:text-white/40 uppercase tracking-wider font-bold">Quick Presets</label>
                <select 
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-neon-blue/50"
                >
                  {presets.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 dark:text-white/40 uppercase tracking-wider font-bold">Duration</label>
                <select 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-neon-blue/50"
                >
                  <option value="10s">10 Seconds</option>
                  <option value="30s">30 Seconds</option>
                  <option value="1m">1 Minute</option>
                  <option value="2m">2 Minutes</option>
                  <option value="3m">3 Minutes</option>
                  <option value="5m">5 Minutes</option>
                  <option value="10m">10 Minutes</option>
                  <option value="15m">15 Minutes</option>
                  <option value="20m">20 Minutes</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 dark:text-white/40 uppercase tracking-wider font-bold">Resolution</label>
                <div className="grid grid-cols-2 gap-2">
                  {['720p', '1080p'].map((res) => (
                    <button
                      key={res}
                      onClick={() => setResolution(res as any)}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                        resolution === res ? 'bg-neon-blue/10 border-neon-blue text-neon-blue' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/10'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 dark:text-white/40 uppercase tracking-wider font-bold">Aspect Ratio</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: '16:9', label: 'Landscape' },
                    { id: '9:16', label: 'Portrait' }
                  ].map((ratio) => (
                    <button
                      key={ratio.id}
                      onClick={() => setAspectRatio(ratio.id as any)}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                        aspectRatio === ratio.id ? 'bg-neon-blue/10 border-neon-blue text-neon-blue' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/10'
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 dark:text-white/40 uppercase tracking-wider font-bold">{t('audio_features')}</label>
                <div className="space-y-2">
                  <div className="relative">
                    <button 
                      onClick={() => setShowMusicMenu(!showMusicMenu)}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Music size={14} />
                        <span className="text-xs">
                          {t('bg_music')}: {
                            customMusicFile 
                              ? `Custom (${customMusicFile.name.substring(0, 10)}...)` 
                              : (selectedMusic === 'none' ? t('no_music') : t(`music_${selectedMusic}`))
                          }
                        </span>
                      </div>
                      <ChevronRight size={14} className={`transition-transform ${showMusicMenu ? 'rotate-90' : ''}`} />
                    </button>
                    
                    {showMusicMenu && (
                      <div className="absolute bottom-full left-0 w-full mb-2 bg-light-card dark:bg-dark-card border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                        {['none', 'cinematic', 'lofi', 'upbeat', 'ambient'].map((m) => (
                          <button
                            key={m}
                            onClick={() => {
                              setSelectedMusic(m);
                              setShowMusicMenu(false);
                              setCustomMusicFile(null);
                            }}
                            className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${
                              selectedMusic === m && !customMusicFile ? 'text-neon-blue bg-neon-blue/5' : 'text-slate-500 dark:text-white/60'
                            }`}
                          >
                            {m === 'none' ? t('no_music') : t(`music_${m}`)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Custom Music Upload Section */}
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider">Custom Music Upload</label>
                      {customMusicFile && (
                        <button 
                          onClick={() => setCustomMusicFile(null)}
                          className="text-[10px] text-red-500 hover:text-red-400"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    {!customMusicFile ? (
                      <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload size={16} className="text-slate-400 dark:text-white/40 mb-2" />
                          <p className="text-[10px] text-slate-400 dark:text-white/40">Click to upload audio (MP3, WAV)</p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="audio/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setCustomMusicFile(e.target.files[0]);
                              setSelectedMusic('custom');
                            }
                          }}
                        />
                      </label>
                    ) : (
                      <div className="flex items-center gap-3 p-2 bg-neon-blue/5 border border-neon-blue/20 rounded-lg">
                        <div className="w-8 h-8 rounded-lg bg-neon-blue/20 flex items-center justify-center text-neon-blue">
                          <Music size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-slate-900 dark:text-white truncate">{customMusicFile.name}</p>
                          <p className="text-[8px] text-slate-500 dark:text-white/40">{(customMusicFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="relative">
                      <button 
                        onClick={() => setShowVoiceMenu(!showVoiceMenu)}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <Mic size={14} />
                          <span className="text-xs">{t('ai_voice')}: {t(`voice_${selectedVoice}`)}</span>
                        </div>
                        <ChevronRight size={14} className={`transition-transform ${showVoiceMenu ? 'rotate-90' : ''}`} />
                      </button>
                      
                      {showVoiceMenu && (
                        <div className="absolute bottom-full left-0 w-full mb-2 bg-light-card dark:bg-dark-card border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 p-4 space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] text-slate-400 dark:text-white/40 uppercase font-bold">{t('select_voice')}</label>
                            <div className="grid grid-cols-1 gap-1">
                              {['male', 'female', 'neutral'].map((v) => (
                                <button
                                  key={v}
                                  onClick={() => setSelectedVoice(v)}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                                    selectedVoice === v ? 'text-neon-blue bg-neon-blue/10 border border-neon-blue/20' : 'text-slate-500 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5'
                                  }`}
                                >
                                  {t(`voice_${v}`)}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/10">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-slate-400 dark:text-white/40">
                                <span>{t('pitch')}</span>
                                <span>{pitch}x</span>
                              </div>
                              <input 
                                type="range" 
                                min="0.5" 
                                max="2" 
                                step="0.1" 
                                value={pitch}
                                onChange={(e) => setPitch(parseFloat(e.target.value))}
                                className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-blue"
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-slate-400 dark:text-white/40">
                                <span>{t('speed')}</span>
                                <span>{speed}x</span>
                              </div>
                              <input 
                                type="range" 
                                min="0.5" 
                                max="2" 
                                step="0.1" 
                                value={speed}
                                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-purple"
                              />
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => setShowVoiceMenu(false)}
                            className="w-full py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-lg text-[10px] font-bold transition-all text-slate-900 dark:text-white"
                          >
                            {t('confirm')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-white/80">Video Watermark</label>
                        <p className="text-[10px] text-slate-400 dark:text-white/40">
                          Add a PromptVision watermark to your video
                        </p>
                      </div>
                      <button
                        onClick={() => setEnableWatermark(!enableWatermark)}
                        className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
                          enableWatermark ? 'bg-neon-blue' : 'bg-slate-200 dark:bg-white/10'
                        }`}
                      >
                        <div
                          className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${
                            enableWatermark ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    
                    {enableWatermark && (
                      <div className="mt-4 space-y-3 p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider">Custom Watermark</label>
                          {customWatermark && (
                            <button 
                              onClick={() => setCustomWatermark(null)}
                              className="text-[10px] text-red-500 hover:text-red-400"
                            >
                              Reset to Default
                            </button>
                          )}
                        </div>
                        
                        {!customWatermark ? (
                          <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                            <div className="flex flex-col items-center justify-center">
                              <Upload size={14} className="text-slate-400 dark:text-white/40 mb-1" />
                              <p className="text-[8px] text-slate-400 dark:text-white/40">Upload PNG/JPG logo</p>
                            </div>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={handleWatermarkUpload}
                            />
                          </label>
                        ) : (
                          <div className="flex items-center gap-3 p-2 bg-neon-blue/5 border border-neon-blue/20 rounded-lg">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                              <img src={customWatermark} alt="Preview" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-slate-900 dark:text-white truncate">Custom Logo Active</p>
                              <p className="text-[8px] text-slate-500 dark:text-white/40">Will appear in bottom-right</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              className="w-full py-4 bg-gradient-to-r from-neon-blue to-neon-purple text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-neon-blue/20 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Video size={18} />
                  {t('generate_video')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Result Section */}
      {(isGenerating || generatedVideo || error) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 flex flex-col items-center justify-center min-h-[400px] text-center"
        >
          {isGenerating ? (
            <div className="space-y-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-neon-blue/20 border-t-neon-blue animate-spin mx-auto" />
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neon-blue animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Creating Magic...</h3>
                <p className="text-white/60 max-w-md">{status}</p>
              </div>
              <div className="w-full max-w-xs bg-white/5 h-1 rounded-full overflow-hidden mx-auto">
                <div className="h-full bg-neon-blue animate-[loading_2s_ease-in-out_infinite]" />
              </div>
            </div>
          ) : error ? (
            <div className="space-y-6 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold">
                  {error === 'paid_key_required' ? t('paid_key_required') : 
                   error === 'session_expired' ? t('session_expired') : 
                   'Generation Failed'}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {error === 'paid_key_required' ? t('paid_key_desc') : 
                   error === 'session_expired' ? t('session_expired_desc') : 
                   t(error)}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {(error === 'paid_key_required' || error === 'session_expired') ? (
                  <>
                    <button 
                      onClick={handleSelectKey}
                      className="w-full py-3 bg-neon-blue text-dark-bg rounded-xl font-bold hover:bg-neon-blue/90 transition-all active:scale-95"
                    >
                      {t('connect_paid_key')}
                    </button>
                    <a 
                      href="https://ai.google.dev/gemini-api/docs/billing" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-neon-blue hover:underline"
                    >
                      {t('learn_billing')}
                    </a>
                  </>
                ) : (
                  <button 
                    onClick={handleGenerate} 
                    className="w-full py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20 transition-all active:scale-95"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          ) : generatedVideo ? (
            <div className="w-full max-w-4xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Generation Complete</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsShareModalOpen(true)}
                    className="px-4 py-2 bg-white/10 rounded-lg text-xs font-bold hover:bg-white/20 transition-colors flex items-center gap-2"
                  >
                    <Share2 size={14} />
                    Share
                  </button>
                  <button 
                    onClick={() => handleDownload(generatedVideo.url, `video_${generatedVideo.id}.mp4`)}
                    className="px-4 py-2 bg-neon-blue text-dark-bg rounded-lg text-xs font-bold hover:bg-neon-blue/90 transition-colors"
                  >
                    Download
                  </button>
                </div>
              </div>
              <VideoPlayer 
                src={generatedVideo.url} 
                showWatermark={enableWatermark} 
                customWatermark={customWatermark}
              />
              <div className="p-4 bg-white/5 rounded-xl text-left">
                <p className="text-xs text-white/40 uppercase font-bold mb-1">Prompt Used</p>
                <p className="text-sm text-white/80 italic">"{prompt}"</p>
              </div>
            </div>
          ) : null}
        </motion.div>
      )}

      {generatedVideo && (
        <ShareModal 
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          videoUrl={generatedVideo.url}
          title={`AI Video: ${prompt}`}
        />
      )}
    </div>
  );
};
