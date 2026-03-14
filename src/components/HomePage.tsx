import React, { useRef } from 'react';
import { 
  Sparkles, 
  Zap, 
  Play, 
  Shield, 
  Clock, 
  Layers,
  ChevronRight,
  Star
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

export const HomePage = ({ onStart, onShowTutorial }: { onStart: () => void; onShowTutorial?: () => void }) => {
  const { t } = useTranslation();
  const showcaseRef = useRef<HTMLElement>(null);

  const scrollToShowcase = () => {
    showcaseRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative py-20 text-center space-y-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-neon-blue/10 blur-[120px] rounded-full -z-10" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-neon-blue text-xs font-bold"
        >
          <Sparkles size={14} />
          Powered by Veo 3.1 AI
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-display font-bold leading-tight"
        >
          Turn Your Words Into <br />
          <span className="neon-text">Cinematic Masterpieces</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-white/60 max-w-2xl mx-auto"
        >
          PromptVision is the next generation of AI video creation. 
          Generate stunning 1080p videos from simple text prompts in seconds.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <button 
            onClick={onStart}
            className="px-8 py-4 bg-gradient-to-r from-neon-blue to-neon-purple text-white rounded-2xl font-bold text-lg shadow-lg shadow-neon-blue/20 hover:scale-105 transition-all flex items-center gap-2"
          >
            {t('start_creating')}
            <ChevronRight size={20} />
          </button>
          <button 
            onClick={scrollToShowcase}
            className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all"
          >
            {t('view_showcase')}
          </button>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'bulk_generator' }))}
            className="px-8 py-4 bg-white/5 border border-white/10 text-white/60 rounded-2xl font-bold text-lg hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <Sparkles size={20} className="text-neon-blue" />
            Bulk Ideas
          </button>
          <button 
            onClick={onShowTutorial}
            className="px-8 py-4 bg-white/5 border border-white/10 text-white/60 rounded-2xl font-bold text-lg hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
          >
            How it Works
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 max-w-4xl mx-auto"
        >
          {[
            { label: 'Videos Generated', value: '1.2M+' },
            { label: 'Active Creators', value: '50K+' },
            { label: 'Avg. Render Time', value: '45s' },
            { label: 'User Rating', value: '4.9/5' },
          ].map((stat, i) => (
            <div key={i} className="space-y-1">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            icon: Zap,
            title: 'Ultra-Fast Generation',
            desc: 'Powered by Veo 3.1 Fast, get results in under a minute without compromising quality.'
          },
          {
            icon: Shield,
            title: 'Cinematic Quality',
            desc: 'Generate up to 1080p resolution with professional-grade lighting and physics.'
          },
          {
            icon: Layers,
            title: 'Multi-Style Engine',
            desc: 'Choose from Anime, Realistic, Cyberpunk, and more to match your creative vision.'
          }
        ].map((feature, i) => (
          <div key={i} className="glass-card p-8 space-y-4 hover:border-neon-blue/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue group-hover:scale-110 transition-transform">
              <feature.icon size={24} />
            </div>
            <h3 className="text-xl font-bold">{feature.title}</h3>
            <p className="text-white/60 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </section>

      {/* Showcase Section */}
      <section ref={showcaseRef} className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-display font-bold">{t('trending_creations')}</h2>
          <p className="text-white/60">{t('see_others')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="group relative aspect-video rounded-2xl overflow-hidden glass-card">
              <img 
                src={`https://picsum.photos/seed/video${i}/800/450`} 
                alt="Showcase" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-bold">Featured Creation</span>
                </div>
                <p className="text-sm font-medium line-clamp-2">"A futuristic neon samurai walking through a rainy Tokyo street at night..."</p>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play size={24} className="text-white fill-white ml-1" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
