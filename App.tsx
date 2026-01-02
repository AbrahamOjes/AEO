import React, { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingView } from './components/views/LandingView';
import { ProcessingView } from './components/views/ProcessingView';
import { ResultsView } from './components/views/ResultsView';
import { HistoryView } from './components/views/HistoryView';
import { CompetitiveIntelView } from './components/views/CompetitiveIntelView';
import { AEOReport, CompetitorIntel } from './types';
import { saveReport, isSupabaseConfigured } from './services/supabaseService';

// Declare external AI Studio functions
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'processing' | 'results' | 'history' | 'competitive'>('landing');
  const [activeBrand, setActiveBrand] = useState('');
  const [activeBrandUrl, setActiveBrandUrl] = useState('');
  const [activeQueries, setActiveQueries] = useState<string[]>([]);
  const [activeCompetitors, setActiveCompetitors] = useState<string[]>([]);
  const [deepThinking, setDeepThinking] = useState(true);
  const [activeIndustry, setActiveIndustry] = useState<string>('');
  const [finalReport, setFinalReport] = useState<AEOReport | null>(null);

  // Pre-fill data for competitive analysis (from Results view)
  const [competitivePreFill, setCompetitivePreFill] = useState<{
    brandName: string;
    brandUrl: string;
    competitors: string[];
  } | null>(null);

  const startAnalysis = (brand: string, url: string, queries: string[], competitors: string[], thinking: boolean, industry?: string) => {
    setActiveBrand(brand);
    setActiveBrandUrl(url);
    setActiveQueries(queries);
    setActiveCompetitors(competitors);
    setDeepThinking(thinking);
    setActiveIndustry(industry || '');
    setView('processing');
  };

  const handleReportComplete = async (report: AEOReport) => {
    setFinalReport(report);
    setView('results');

    // Auto-save to database if configured
    if (isSupabaseConfigured()) {
      try {
        await saveReport(report);
        console.log('Report saved to database');
      } catch (err) {
        console.error('Failed to save report:', err);
      }
    }
  };

  const updateIntel = (oldName: string, newIntel: CompetitorIntel) => {
    if (!finalReport) return;
    setFinalReport({
      ...finalReport,
      competitor_intel: finalReport.competitor_intel.map(ci => ci.name === oldName ? newIntel : ci)
    });
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-100 selection:text-indigo-900 font-sans text-gray-900">
      <Navbar onHistoryClick={() => setView('history')} onCompetitiveClick={() => setView('competitive')} />
      <main className="flex-grow bg-[#F8FAFC]">
        {view === 'landing' && <LandingView onStart={startAnalysis} />}
        {view === 'processing' && (
          <ProcessingView
            brand={activeBrand}
            brandUrl={activeBrandUrl}
            queries={activeQueries}
            trackedCompetitors={activeCompetitors}
            deepThinking={deepThinking}
            onComplete={handleReportComplete}
          />
        )}
        {view === 'results' && finalReport && (
          <ResultsView
            report={finalReport}
            onReset={() => { setView('landing'); setFinalReport(null); }}
            onUpdateIntel={updateIntel}
            onRunCompetitive={(brandName, brandUrl, competitors) => {
              setCompetitivePreFill({ brandName, brandUrl, competitors });
              setView('competitive');
            }}
          />
        )}
        {view === 'history' && (
          <HistoryView
            onSelectReport={(report) => { setFinalReport(report); setView('results'); }}
            onBack={() => setView('landing')}
          />
        )}
        {view === 'competitive' && (
          <CompetitiveIntelView
            onBack={() => setView('landing')}
            preFill={competitivePreFill}
            onClearPreFill={() => setCompetitivePreFill(null)}
            onRunQuickCheck={(brandName, brandUrl, queries) => {
              setActiveBrand(brandName);
              setActiveBrandUrl(brandUrl);
              setActiveQueries(queries);
              setActiveCompetitors([]);
              setDeepThinking(false);
              setView('processing');
            }}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
