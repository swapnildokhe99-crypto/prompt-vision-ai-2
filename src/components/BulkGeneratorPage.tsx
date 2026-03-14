import React, { useState } from 'react';
import { 
  Sparkles, 
  Zap, 
  Copy, 
  RefreshCw, 
  Video,
  Check,
  ChevronRight,
  Loader2,
  Trash2,
  Play,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { enhancePrompt } from '../services/geminiService';
import { generateVideo, saveVideoToHistory } from '../services/videoService';

interface PromptItem {
  text: string;
  status: 'idle' | 'enhancing' | 'generating' | 'completed' | 'error';
  videoUrl?: string;
  error?: string;
  progress?: string;
}

const styles = [
  "cinematic",
  "anime",
  "cyberpunk",
  "3D Pixar style",
  "realistic movie scene",
  "sci-fi futuristic",
  "space adventure",
  "fantasy magic world",
  "cartoon style",
  "dark cinematic"
];

const scenes = [
  "exploring Mars",
  "flying through space",
  "ancient temple adventure",
  "robot city future",
  "alien planet discovery",
  "time travel portal",
  "lost jungle expedition",
  "dragon fantasy battle"
];

const modifiers = [
  "ultra cinematic lighting",
  "4K resolution",
  "highly detailed",
  "masterpiece",
  "vibrant colors",
  "dramatic shadows",
  "8k",
  "unreal engine 5 render"
];

function generateRandomPrompt() {
  const style = styles[Math.floor(Math.random() * styles.length)];
  const scene = scenes[Math.floor(Math.random() * scenes.length)];
  const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];

  return `${style} video of ${scene}, ${modifier}`;
}

export const BulkGeneratorPage = ({ onUsePrompt }: { onUsePrompt: (p: string) => void }) => {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
  const [isCreatingVideos, setIsCreatingVideos] = useState(false);
  const [count, setCount] = useState(10);

  const handleGenerateBulk = () => {
    setIsGeneratingBulk(true);
    setTimeout(() => {
      const newPrompts: PromptItem[] = [];
      for (let i = 0; i < count; i++) {
        newPrompts.push({
          text: generateRandomPrompt(),
          status: 'idle'
        });
      }
      setPrompts(newPrompts);
      setIsGeneratingBulk(false);
    }, 800);
  };

  const handleEnhance = async (index: number) => {
    setPrompts(prev => prev.map((p, i) => i === index ? { ...p, status: 'enhancing' } : p));

    try {
      const enhanced = await enhancePrompt(prompts[index].text);
      setPrompts(prev => prev.map((p, i) => i === index ? { ...p, text: enhanced, status: 'idle' } : p));
    } catch (error) {
      console.error('Enhancement failed', error);
      setPrompts(prev => prev.map((p, i) => i === index ? { ...p, status: 'idle' } : p));
    }
  };

  const handleCreateVideo = async (index: number) => {
    setPrompts(prev => prev.map((p, i) => i === index ? { ...p, status: 'generating', progress: 'Initializing...' } : p));

    try {
      // Try to extract style from prompt text
      const promptText = prompts[index].text.toLowerCase();
      let detectedStyle: any = 'cinematic';
      const availableStyles = ['anime', 'realistic', 'cartoon', 'cyberpunk', 'educational', '3d-animation', 'kinetic-typography', 'ad'];
      for (const s of availableStyles) {
        if (promptText.includes(s)) {
          detectedStyle = s;
          break;
        }
      }

      const result = await generateVideo({
        prompt: prompts[index].text,
        style: detectedStyle,
        resolution: '720p',
        aspectRatio: '16:9',
        duration: '10s'
      }, (status) => {
        setPrompts(prev => prev.map((p, i) => i === index ? { ...p, progress: status } : p));
      });

      await saveVideoToHistory({
        id: result.id,
        prompt: prompts[index].text,
        style: detectedStyle,
        video_url: result.url,
        duration: '10s',
        resolution: '720p'
      });

      setPrompts(prev => prev.map((p, i) => i === index ? { ...p, status: 'completed', videoUrl: result.url } : p));
    } catch (error: any) {
      const errorMsg = error.message || "";
      let userFriendlyError = 'Generation failed';
      
      if (errorMsg === "PERMISSION_DENIED" || errorMsg.includes("403") || errorMsg.includes("permission")) {
        userFriendlyError = 'Paid API Key Required';
      } else if (errorMsg === "API_KEY_EXPIRED" || errorMsg.includes("Requested entity was not found")) {
        userFriendlyError = 'Session Expired';
      } else if (errorMsg === "RESOURCE_EXHAUSTED" || errorMsg.includes("429")) {
        userFriendlyError = 'Quota limit exceeded';
      } else if (errorMsg === "SAFETY_BLOCKED") {
        userFriendlyError = 'Safety blocked';
      } else if (errorMsg === "NETWORK_ERROR") {
        userFriendlyError = 'Network error';
      }
      
      setPrompts(prev => prev.map((p, i) => i === index ? { ...p, status: 'error', error: userFriendlyError } : p));
    }
  };

  const handleCreateAll = async () => {
    setIsCreatingVideos(true);
    // Sequential generation to avoid hitting quotas too hard
    for (let i = 0; i < prompts.length; i++) {
      if (prompts[i].status === 'idle' || prompts[i].status === 'error') {
        await handleCreateVideo(i);
      }
    }
    setIsCreatingVideos(false);
  };

  const removePrompt = (index: number) => {
    setPrompts(prompts.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-display font-bold">Bulk Prompt Generator</h2>
          <p className="text-white/60">Generate multiple creative ideas at once and pick your favorites.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2 rounded-2xl">
            <div className="flex items-center gap-2 px-4 border-r border-white/10">
              <span className="text-xs font-bold text-white/40 uppercase">Count:</span>
              <input 
                type="number" 
                min="1" 
                max="50" 
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                className="w-12 bg-transparent text-center font-bold focus:outline-none"
              />
            </div>
            <button 
              onClick={handleGenerateBulk}
              disabled={isGeneratingBulk || isCreatingVideos}
              className="px-6 py-2 bg-neon-blue text-dark-bg rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50"
            >
              {isGeneratingBulk ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
              Generate Ideas
            </button>
          </div>
          
          {prompts.length > 0 && (
            <button 
              onClick={handleCreateAll}
              disabled={isCreatingVideos}
              className="px-8 py-4 bg-gradient-to-r from-neon-blue to-neon-purple text-white rounded-2xl font-bold shadow-lg shadow-neon-blue/20 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isCreatingVideos ? <Loader2 className="animate-spin" size={20} /> : <Video size={20} />}
              Generate All Videos
            </button>
          )}
        </div>
      </header>

      {prompts.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-white/20">
            <Sparkles size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">No Prompts Generated Yet</h3>
            <p className="text-white/40 max-w-md mx-auto">Click the button above to generate a batch of creative video prompts based on trending styles and scenes.</p>
          </div>
          <button 
            onClick={handleGenerateBulk}
            className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all"
          >
            Generate My First Batch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {prompts.map((prompt, index) => (
              <motion.div 
                key={index}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`glass-card p-6 flex flex-col gap-4 group transition-all ${
                  prompt.status === 'generating' ? 'border-neon-blue/50 bg-neon-blue/5' : 
                  prompt.status === 'completed' ? 'border-green-500/30 bg-green-500/5' : 
                  'hover:border-neon-blue/30'
                }`}
              >
                <div className="flex-1 space-y-3">
                  <p className="text-sm text-white/80 italic leading-relaxed">"{prompt.text}"</p>
                  
                  {prompt.status === 'generating' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-neon-blue uppercase">
                        <span>{prompt.progress}</span>
                        <Loader2 size={12} className="animate-spin" />
                      </div>
                      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-neon-blue animate-[loading_2s_ease-in-out_infinite]" />
                      </div>
                    </div>
                  )}

                  {prompt.status === 'completed' && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-green-500 uppercase">
                      <Check size={12} />
                      Video Generated Successfully
                    </div>
                  )}

                  {prompt.status === 'error' && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-red-500 uppercase">
                      <AlertCircle size={12} />
                      {prompt.error}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex gap-2">
                    {prompt.status === 'idle' && (
                      <button 
                        onClick={() => handleEnhance(index)}
                        className="p-2 bg-white/5 rounded-lg text-neon-blue hover:bg-neon-blue/10 transition-all"
                        title="AI Enhance"
                      >
                        <Sparkles size={16} />
                      </button>
                    )}
                    {prompt.status === 'enhancing' && (
                      <div className="p-2 bg-neon-blue/10 rounded-lg text-neon-blue">
                        <Loader2 size={16} className="animate-spin" />
                      </div>
                    )}
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(prompt.text);
                      }}
                      className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                      title="Copy to Clipboard"
                    >
                      <Copy size={16} />
                    </button>
                    <button 
                      onClick={() => removePrompt(index)}
                      disabled={prompt.status === 'generating'}
                      className="p-2 bg-white/5 rounded-lg text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => onUsePrompt(prompt.text)}
                      className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-neon-blue hover:bg-neon-blue/10 transition-all"
                      title="Use in Main Generator"
                    >
                      <ChevronRight size={16} />
                    </button>
                    {prompt.status === 'completed' ? (
                      <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'history' }))}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-lg text-xs font-bold hover:bg-green-500 hover:text-white transition-all"
                      >
                        <Play size={14} />
                        View Video
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleCreateVideo(index)}
                        disabled={prompt.status === 'generating' || isCreatingVideos}
                        className="flex items-center gap-2 px-4 py-2 bg-neon-blue/10 text-neon-blue rounded-lg text-xs font-bold hover:bg-neon-blue hover:text-dark-bg transition-all disabled:opacity-50"
                      >
                        {prompt.status === 'generating' ? <Loader2 size={14} className="animate-spin" /> : <Video size={14} />}
                        {prompt.status === 'error' ? 'Retry' : 'Create Video'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {prompts.length > 0 && (
        <div className="flex justify-center pt-8">
          <button 
            onClick={handleGenerateBulk}
            disabled={isCreatingVideos}
            className="flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw size={20} />
            Generate Another Batch
          </button>
        </div>
      )}
    </div>
  );
};
