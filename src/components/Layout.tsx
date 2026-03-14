import React from 'react';
import { 
  Video, 
  Library, 
  History, 
  Home, 
  Sparkles,
  Menu,
  X,
  Languages,
  Megaphone,
  HelpCircle,
  Sun,
  Moon,
  Zap,
  LogOut,
  User,
  ShieldCheck,
  ShieldAlert,
  Settings,
  Film
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onShowOnboarding: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onShowOnboarding }) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showLangMenu, setShowLangMenu] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(true);
  const [hasApiKey, setHasApiKey] = React.useState(false);

  React.useEffect(() => {
    const checkApiKey = async () => {
      try {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } catch (e) {
        setHasApiKey(false);
      }
    };
    checkApiKey();
    const interval = setInterval(checkApiKey, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectKey = async () => {
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme ? savedTheme === 'dark' : true;
    setIsDarkMode(initialTheme);
    if (initialTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const navItems = [
    { id: 'home', label: t('home'), icon: Home },
    { id: 'generate', label: t('generate'), icon: Video },
    { id: 'studio', label: 'Studio', icon: Film },
    { id: 'bulk_generator', label: 'Bulk Ideas', icon: Sparkles },
    { id: 'ad_generator', label: t('ad_generator'), icon: Megaphone, pro: true },
    { id: 'library', label: t('library'), icon: Library },
    { id: 'history', label: t('my_videos'), icon: History },
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ja', name: '日本語' },
    { code: 'zh', name: '中文' },
    { code: 'pt', name: 'Português' },
    { code: 'it', name: 'Italiano' },
    { code: 'ru', name: 'Русский' },
  ];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setShowLangMenu(false);
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex flex-col md:flex-row transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-white/10 p-6 bg-light-card dark:bg-dark-card/50 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-12 group cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg shadow-neon-blue/20 group-hover:scale-110 transition-transform">
            <Video className="text-white w-5 h-5 absolute" />
            <Zap className="text-white w-3 h-3 absolute -top-1 -right-1 fill-neon-blue animate-pulse" />
          </div>
          <h1 className="text-xl font-display font-bold neon-text tracking-tighter">PromptVision</h1>
        </div>

        <nav className="space-y-2 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-slate-100 dark:bg-white/10 text-neon-blue border border-slate-200 dark:border-white/10 shadow-lg shadow-neon-blue/5'
                  : 'text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.pro && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
                  PRO
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-200 dark:border-white/10 space-y-4">
          {/* API Key Status */}
          <div className={`p-4 rounded-xl border transition-all ${
            hasApiKey 
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' 
              : 'bg-amber-500/5 border-amber-500/20 text-amber-500'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {hasApiKey ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {hasApiKey ? 'API Connected' : 'No API Key'}
                </span>
              </div>
              <button 
                onClick={handleSelectKey}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title="Change API Key"
              >
                <Settings size={12} />
              </button>
            </div>
            <p className="text-[9px] opacity-60 leading-tight">
              {hasApiKey 
                ? 'High-performance Veo models are active.' 
                : 'Connect a key to unlock Veo video models.'}
            </p>
            {!hasApiKey && (
              <button 
                onClick={handleSelectKey}
                className="mt-2 w-full py-1.5 bg-amber-500 text-white text-[9px] font-bold rounded-lg hover:bg-amber-600 transition-colors"
              >
                Connect Key
              </button>
            )}
          </div>

          {/* User Profile */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-white font-bold text-xs">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-white/40 truncate">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={12} />
              {t('logout') || 'Logout'}
            </button>
          </div>

          {/* Upgrade Button */}
          <button 
            className="w-full group relative p-4 rounded-2xl bg-gradient-to-br from-neon-blue/10 to-neon-purple/10 border border-neon-blue/20 hover:border-neon-blue/40 transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">{t('pro_access')}</span>
                <Sparkles size={14} className="text-neon-purple" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-white/60 leading-tight">Unlock 4K generation, no watermarks, and ad tools.</p>
              <div className="mt-1 w-full py-2 bg-gradient-to-r from-neon-blue to-neon-purple text-white text-[10px] font-bold rounded-lg text-center shadow-lg shadow-neon-blue/20">
                {t('upgrade_now')}
              </div>
            </div>
          </button>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-all text-xs"
          >
            <div className="flex items-center gap-2">
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
          </button>

          {/* Tutorial Button */}
          <button 
            onClick={onShowOnboarding}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-all text-xs"
          >
            <HelpCircle size={14} />
            <span>Show Tutorial</span>
          </button>

          {/* Language Switcher */}
          <div className="relative">
            <button 
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="w-full flex items-center justify-between px-4 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-all text-xs"
            >
              <div className="flex items-center gap-2">
                <Languages size={14} />
                <span>{languages.find(l => l.code === i18n.language)?.name || 'Language'}</span>
              </div>
            </button>
            
            <AnimatePresence>
              {showLangMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 w-full mb-2 bg-light-card dark:bg-dark-card border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
                >
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${
                        i18n.language === lang.code ? 'text-neon-blue bg-neon-blue/5' : 'text-slate-500 dark:text-white/60'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 bg-light-card dark:bg-dark-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-2" onClick={() => setActiveTab('home')}>
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
            <Video className="text-white w-4 h-4" />
            <Zap className="text-white w-2 h-2 absolute -top-0.5 -right-0.5 fill-neon-blue" />
          </div>
          <h1 className="text-lg font-display font-bold neon-text tracking-tighter">PromptVision</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-colors">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-900 dark:text-white">
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden fixed inset-0 z-40 bg-light-bg dark:bg-dark-bg pt-20 p-6"
        >
          <nav className="space-y-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-lg ${
                  activeTab === item.id ? 'bg-slate-100 dark:bg-white/10 text-neon-blue' : 'text-slate-500 dark:text-white/60'
                }`}
              >
                <item.icon size={24} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-6xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};
