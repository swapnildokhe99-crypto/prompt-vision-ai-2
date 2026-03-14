import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Video, 
  Zap, 
  ShieldCheck, 
  ChevronRight, 
  X,
  Megaphone,
  Star
} from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to PromptVision",
      description: "Transform your wildest ideas into stunning cinematic videos with the power of AI.",
      icon: Sparkles,
      color: "text-neon-blue",
      bg: "bg-neon-blue/10"
    },
    {
      title: "Master the Prompt",
      description: "Be descriptive! Mention lighting, camera angles, and mood to get the best results from our AI engine.",
      icon: Video,
      color: "text-neon-purple",
      bg: "bg-neon-purple/10"
    },
    {
      title: "Ad Generator",
      description: "Need to sell something? Use our specialized Ad Generator to create high-converting commercial scripts instantly.",
      icon: Megaphone,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10"
    },
    {
      title: "High Quality Exports",
      description: "Export your creations in high resolution and share them with the world instantly.",
      icon: Star,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10"
    },
    {
      title: "Connect Gemini API",
      description: "To use the high-performance Veo video models, you'll need to connect a paid Gemini API key from a Google Cloud project.",
      icon: ShieldCheck,
      color: "text-neon-blue",
      bg: "bg-neon-blue/10",
      isApiKeyStep: true
    }
  ];

  const handleApiKeySelection = async () => {
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      nextStep();
    } catch (error) {
      console.error("Failed to open key selection", error);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-dark-bg/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card max-w-lg w-full p-8 relative overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <motion.div 
            className="h-full bg-neon-blue"
            initial={{ width: "0%" }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        <button 
          onClick={onComplete}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 py-4"
          >
            <div className={`w-16 h-16 rounded-2xl ${steps[currentStep].bg} flex items-center justify-center`}>
              {React.createElement(steps[currentStep].icon, { 
                size: 32, 
                className: steps[currentStep].color 
              })}
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-display font-bold">{steps[currentStep].title}</h2>
              <p className="text-white/60 leading-relaxed">
                {steps[currentStep].description}
              </p>
              
              {(steps[currentStep] as any).isApiKeyStep && (
                <div className="pt-4 space-y-4">
                  <p className="text-xs text-white/40 italic">
                    Note: A paid Google Cloud project is required. See the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-neon-blue underline">billing documentation</a> for details.
                  </p>
                  <button
                    onClick={handleApiKeySelection}
                    className="w-full py-4 bg-neon-blue text-dark-bg rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                  >
                    <ShieldCheck size={20} />
                    Select Gemini API Key
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between pt-6 border-t border-white/10">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div 
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-6 bg-neon-blue' : 'w-1.5 bg-white/10'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextStep}
            disabled={(steps[currentStep] as any).isApiKeyStep}
            className={`px-6 py-3 bg-white text-dark-bg rounded-xl font-bold flex items-center gap-2 hover:bg-neon-blue hover:text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {currentStep === steps.length - 1 ? "Get Started" : "Next"}
            <ChevronRight size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
