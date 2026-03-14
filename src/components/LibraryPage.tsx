import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Copy, 
  Zap, 
  Flame, 
  Star,
  ChevronRight,
  Trash2,
  Loader2,
  History,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const libraries = [
  {
    category: 'Cinematic Storytelling',
    prompts: [
      "A lone wanderer standing on the edge of a floating island overlooking a nebula",
      "An ancient temple hidden deep within a bioluminescent rainforest",
      "A futuristic train speeding through a desert of crystalline sand"
    ]
  },
  {
    category: 'Advertising & Marketing',
    prompts: [
      "A sleek luxury car driving through a neon-lit futuristic city",
      "Macro shot of a refreshing drink with ice cubes and condensation",
      "A professional workspace with high-tech holographic displays"
    ]
  },
  {
    category: 'Anime & Stylized',
    prompts: [
      "Studio Ghibli style meadow with rolling hills and fluffy white clouds",
      "Cyberpunk samurai battle in a rainy alleyway with neon reflections",
      "Magical girl transformation sequence with sparkles and ribbons"
    ]
  }
];

export const LibraryPage = ({ onUsePrompt }: { onUsePrompt: (p: string) => void }) => {
  const [savedPrompts, setSavedPrompts] = useState<any[]>([]);
  const [promptHistory, setPromptHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    Promise.all([fetchSavedPrompts(), fetchPromptHistory()]);
  }, []);

  const fetchSavedPrompts = async () => {
    try {
      const response = await fetch('/api/prompts');
      if (response.ok) {
        const data = await response.json();
        setSavedPrompts(data);
      }
    } catch (error) {
      console.error('Failed to fetch saved prompts', error);
    }
  };

  const fetchPromptHistory = async () => {
    try {
      const response = await fetch('/api/prompt-history');
      if (response.ok) {
        const data = await response.json();
        setPromptHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch prompt history', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePrompt = async (id: string, isHistory: boolean = false) => {
    const endpoint = isHistory ? `/api/prompt-history/${id}` : `/api/prompts/${id}`;
    try {
      const response = await fetch(endpoint, { method: 'DELETE' });
      if (response.ok) {
        if (isHistory) {
          setPromptHistory(promptHistory.filter(p => p.id !== id));
        } else {
          setSavedPrompts(savedPrompts.filter(p => p.id !== id));
        }
      }
    } catch (error) {
      console.error('Failed to delete prompt', error);
    }
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-display font-bold">Prompt Library</h2>
          <p className="text-white/60">Explore curated templates and trending prompts from the community.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
            <input 
              type="text" 
              placeholder="Search templates..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-neon-blue/50 transition-all"
            />
          </div>
          <button 
            onClick={() => {
              // We need a way to switch tabs from here.
              // LibraryPage doesn't have setActiveTab prop.
              // But it's okay, the user can just use the sidebar.
              // Actually, let's just add a nice card in the trending section.
            }}
            className="hidden"
          >
            Bulk Ideas
          </button>
        </div>
      </header>

      {/* Categories */}
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {['All', 'Saved', 'History', 'Cinematic', 'Anime', 'Marketing', 'Education', 'Shorts'].map((cat) => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap border transition-all ${
              activeCategory === cat ? 'bg-neon-blue text-dark-bg border-neon-blue' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Saved Prompts Section */}
      <AnimatePresence>
        {(activeCategory === 'All' || activeCategory === 'Saved') && savedPrompts.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2 text-neon-blue">
              <Star size={20} className="fill-neon-blue" />
              <h3 className="text-xl font-bold">My Saved Prompts</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {savedPrompts.map((p) => (
                <motion.div 
                  key={p.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="glass-card p-6 space-y-4 flex flex-col group"
                >
                  <p className="text-sm text-white/80 italic flex-1">"{p.prompt}"</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onUsePrompt(p.prompt)}
                      className="flex-1 py-2 bg-neon-blue/10 text-neon-blue rounded-lg text-xs font-bold hover:bg-neon-blue hover:text-dark-bg transition-all"
                    >
                      Use Prompt
                    </button>
                    <button 
                      onClick={() => handleDeletePrompt(p.id)}
                      className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Prompt History Section */}
      <AnimatePresence>
        {(activeCategory === 'All' || activeCategory === 'History') && promptHistory.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2 text-slate-400">
              <History size={20} />
              <h3 className="text-xl font-bold">Recent Prompt History</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {promptHistory.map((p) => (
                <motion.div 
                  key={p.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="glass-card p-6 space-y-4 flex flex-col group"
                >
                  <p className="text-sm text-white/60 italic flex-1">"{p.prompt}"</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onUsePrompt(p.prompt)}
                      className="flex-1 py-2 bg-white/5 text-white/80 rounded-lg text-xs font-bold hover:bg-white/10 transition-all"
                    >
                      Reuse
                    </button>
                    <button 
                      onClick={() => handleDeletePrompt(p.id, true)}
                      className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Trending Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-neon-purple">
          <Flame size={20} />
          <h3 className="text-xl font-bold">Trending Now</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Interstellar Voyage", desc: "A cinematic journey through a black hole with light distortion effects.", uses: "12.4K" },
            { title: "Cyberpunk Rain", desc: "Detailed close-up of a cyborg in the rain with neon reflections.", uses: "8.2K" }
          ].map((item, i) => (
            <div key={i} className="glass-card p-6 flex items-center justify-between group hover:border-neon-purple/30 transition-all">
              <div className="space-y-2">
                <h4 className="font-bold text-lg">{item.title}</h4>
                <p className="text-sm text-white/60 line-clamp-1">{item.desc}</p>
                <div className="flex items-center gap-4 text-[10px] font-bold text-white/40 uppercase">
                  <span className="flex items-center gap-1"><Zap size={10} className="text-neon-purple" /> {item.uses} uses</span>
                  <span className="flex items-center gap-1"><Star size={10} className="text-yellow-500" /> 4.9 rating</span>
                </div>
              </div>
              <button 
                onClick={() => onUsePrompt(item.desc)}
                className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-neon-purple group-hover:text-white transition-all"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          ))}
          
          <div className="glass-card p-6 bg-gradient-to-br from-neon-blue/10 to-neon-purple/10 border-neon-blue/20 flex flex-col justify-center gap-4 group">
            <div className="space-y-1">
              <h4 className="font-bold text-lg">Need more ideas?</h4>
              <p className="text-sm text-white/60">Generate a batch of 10+ creative prompts instantly.</p>
            </div>
            <button 
              onClick={() => {
                // This is a bit tricky since we can't easily change tab from here without passing setActiveTab
                // But the sidebar is right there.
                // Let's just make it a link-like button that explains where to go or just use a custom event.
                window.dispatchEvent(new CustomEvent('changeTab', { detail: 'bulk_generator' }));
              }}
              className="w-full py-3 bg-neon-blue text-dark-bg rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:scale-105 transition-all"
            >
              <Sparkles size={16} />
              Try Bulk Generator
            </button>
          </div>
        </div>
      </section>

      {/* Library Grid */}
      <div className="space-y-12">
        {libraries.map((lib, i) => (
          <section key={i} className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <BookOpen size={20} className="text-neon-blue" />
              {lib.category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {lib.prompts.map((prompt, j) => (
                <div key={j} className="glass-card p-6 space-y-4 flex flex-col">
                  <p className="text-sm text-white/80 italic flex-1">"{prompt}"</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onUsePrompt(prompt)}
                      className="flex-1 py-2 bg-neon-blue/10 text-neon-blue rounded-lg text-xs font-bold hover:bg-neon-blue hover:text-dark-bg transition-all"
                    >
                      Use Template
                    </button>
                    <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
                      <Copy size={16} className="text-white/40" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
