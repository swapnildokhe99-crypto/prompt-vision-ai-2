import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShoppingBag, 
  Users, 
  Megaphone, 
  ListChecks, 
  Sparkles,
  Loader2,
  ArrowRight,
  Video,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

interface AdGeneratorPageProps {
  onGenerateVideo: (prompt: string) => void;
}

export const AdGeneratorPage: React.FC<AdGeneratorPageProps> = ({ onGenerateVideo }) => {
  const { t } = useTranslation();
  const [productName, setProductName] = useState('');
  const [audience, setAudience] = useState('');
  const [features, setFeatures] = useState('');
  const [cta, setCta] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreateScript = async () => {
    if (!productName || !audience) return;
    
    setIsGenerating(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Create a highly cinematic, visually stunning video generation prompt for a 30-second professional advertisement.
        Product: ${productName}
        Target Audience: ${audience}
        Key Features: ${features}
        Call to Action: ${cta}
        
        The prompt should be extremely descriptive, focusing on high-end lighting (e.g., rim lighting, soft box), dynamic camera movements (e.g., dolly zoom, slow-motion macro), and emotional impact. 
        It MUST feel like a high-budget TV commercial.
        Format: Return ONLY the prompt text, no headers or explanations.`,
      });
      
      setGeneratedScript(response.text || '');
    } catch (err: any) {
      console.error("Script generation failed:", err);
      const errorMsg = err.message || "";
      if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
        setError(t('error_quota'));
      } else if (errorMsg.includes("SAFETY")) {
        setError(t('error_safety'));
      } else {
        setError(t('error_failed'));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2 text-slate-900 dark:text-white">{t('ad_generator')}</h2>
          <p className="text-slate-500 dark:text-white/60">Generate high-converting video advertisements for your brand.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-white/80">
                <ShoppingBag size={16} className="text-neon-blue" />
                {t('ad_product_name')}
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder={t('ad_placeholder_product')}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-neon-blue/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-white/80">
                <Users size={16} className="text-neon-blue" />
                {t('ad_target_audience')}
              </label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder={t('ad_placeholder_audience')}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-neon-blue/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-white/80">
                <ListChecks size={16} className="text-neon-blue" />
                {t('ad_features')}
              </label>
              <textarea
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                placeholder={t('ad_placeholder_features')}
                className="w-full h-24 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-neon-blue/50 transition-colors resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-white/80">
                <Megaphone size={16} className="text-neon-blue" />
                {t('ad_cta')}
              </label>
              <input
                type="text"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder={t('ad_placeholder_cta')}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-neon-blue/50 transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handleCreateScript}
            disabled={isGenerating || !productName || !audience}
            className="w-full py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles size={18} className="text-neon-blue" />
                {t('ad_generate_prompt')}
              </>
            )}
          </button>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 h-full flex flex-col">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-white/80">
              <Megaphone size={16} className="text-neon-purple" />
              Generated Ad Script
            </h3>
            
            <div className="flex-1 bg-slate-50 dark:bg-black/20 rounded-xl p-6 border border-slate-200 dark:border-white/5 relative group">
              {error ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-red-500">
                  <AlertCircle size={48} />
                  <p className="text-sm font-bold">{error}</p>
                  <button 
                    onClick={handleCreateScript}
                    className="text-xs underline hover:text-red-400"
                  >
                    Try Again
                  </button>
                </div>
              ) : generatedScript ? (
                <p className="text-sm text-slate-700 dark:text-white/80 leading-relaxed italic">
                  "{generatedScript}"
                </p>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 text-slate-400 dark:text-white/40">
                  <Sparkles size={48} />
                  <p className="text-xs">Fill in the details and click generate to create your ad script.</p>
                </div>
              )}
            </div>

            {generatedScript && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => onGenerateVideo(generatedScript)}
                className="mt-6 w-full py-4 bg-gradient-to-r from-neon-blue to-neon-purple text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-neon-blue/20"
              >
                <Video size={18} />
                Generate Ad Video
                <ArrowRight size={18} />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
