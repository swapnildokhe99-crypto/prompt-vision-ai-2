import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { HomePage } from './components/HomePage';
import { GeneratorPage } from './components/GeneratorPage';
import { AdGeneratorPage } from './components/AdGeneratorPage';
import { HistoryPage } from './components/HistoryPage';
import { LibraryPage } from './components/LibraryPage';
import { BulkGeneratorPage } from './components/BulkGeneratorPage';
import { StudioPage } from './components/StudioPage';
import { Onboarding } from './components/Onboarding';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/AuthPage';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [initialPrompt, setInitialPrompt] = useState('');
  const [initialStyle, setInitialStyle] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasOnboarded = localStorage.getItem('promptvision_onboarded');
    if (!hasOnboarded) {
      setShowOnboarding(true);
    }

    const handleTabChange = (e: any) => {
      setActiveTab(e.detail);
    };
    window.addEventListener('changeTab', handleTabChange);
    return () => window.removeEventListener('changeTab', handleTabChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center">
        <Loader2 className="text-neon-blue animate-spin" size={48} />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleOnboardingComplete = () => {
    localStorage.setItem('promptvision_onboarded', 'true');
    setShowOnboarding(false);
  };

  const handleUsePrompt = (prompt: string) => {
    setInitialPrompt(prompt);
    setActiveTab('generate');
  };

  const handleGenerateAd = (prompt: string) => {
    setInitialPrompt(prompt);
    setInitialStyle('ad');
    setActiveTab('generate');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage onStart={() => setActiveTab('generate')} onShowTutorial={() => setShowOnboarding(true)} />;
      case 'generate':
        return (
          <GeneratorPage 
            initialPrompt={initialPrompt} 
            initialStyle={initialStyle}
            onClearInitialPrompt={() => {
              setInitialPrompt('');
              setInitialStyle('');
            }} 
          />
        );
      case 'ad_generator':
        return <AdGeneratorPage onGenerateVideo={handleGenerateAd} />;
      case 'studio':
        return <StudioPage />;
      case 'history':
        return <HistoryPage onUsePrompt={handleUsePrompt} />;
      case 'library':
        return <LibraryPage onUsePrompt={handleUsePrompt} />;
      case 'bulk_generator':
        return <BulkGeneratorPage onUsePrompt={handleUsePrompt} />;
      default:
        return <HomePage onStart={() => setActiveTab('generate')} />;
    }
  };

  return (
    <>
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onShowOnboarding={() => setShowOnboarding(true)}
      >
        {renderContent()}
      </Layout>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
