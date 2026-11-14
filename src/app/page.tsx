'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Header } from '@/components/header';
import { HeroUpload } from '@/components/hero-upload';
import { ActiveFileStatus } from '@/components/active-file-status';
import { FactCheckingSection } from '@/components/fact-checking-section';
import { LeadDraftSection } from '@/components/lead-draft-section';
import { MultiPlatformExport } from '@/components/multi-platform-export';
import { AlertModal } from '@/components/alert-modal';
import { MOCK_PIPELINE_RESULT } from '@/lib/mock-data';
import { PipelineResult, OutputLanguage, FactStatus, QuickFixType, FactCheckItem } from '@/lib/types';
import { FACT_CHECK_ITEMS } from '@/lib/fact-checking-data';
import { TRANSLATIONS } from '@/lib/translations';

type DemoPhase =
  | 'idle'
  | 'uploading'
  | 'decrypting'
  | 'factchecking'
  | 'drafting'
  | 'exporting'
  | 'ready';

const EMPTY_PIPELINE_RESULT: PipelineResult = {
  id: '',
  title: '',
  sourceLang: 'ru',
  rawTranscriptText: '',
  transcript: [],
  factCheckItems: [],
  flags: [],
  outputs: {
    ru: { web_article: '', telegram_post: '', social_script: '' },
    kz: { web_article: '', telegram_post: '', social_script: '' },
    en: { web_article: '', telegram_post: '', social_script: '' }
  },
  isMock: false,
  createdAt: '',
  stats: {
    wordCount: 0,
    totalFlags: 0,
    verifiedFlags: 0,
    processingTimeSec: 0
  }
};

export default function Home() {
  const [pipelineData, setPipelineData] = useState<PipelineResult>(EMPTY_PIPELINE_RESULT);
  const [activeScreen, setActiveScreen] = useState<'hero' | 'results'>('hero');
  const [demoPhase, setDemoPhase] = useState<DemoPhase>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [logStep, setLogStep] = useState(0); // 0 (uploading) to 4 (ready)
  const [visibleFactCards, setVisibleFactCards] = useState(0); // 0 to 4
  const [streamedDraftText, setStreamedDraftText] = useState('');
  const [streamedExportText, setStreamedExportText] = useState('');
  const [fileName, setFileName] = useState('Someinterview_file.mp4');
  const [fileSize, setFileSize] = useState('10.5 mb');
  const [submittedText, setSubmittedText] = useState('');
  const [activeMode, setActiveMode] = useState<'file' | 'text'>('file');
  const [activeTabInHero, setActiveTabInHero] = useState<'file' | 'text'>('file');
  const [currentLang, setCurrentLang] = useState<OutputLanguage>('ru');
  const alerts = TRANSLATIONS[currentLang]?.alerts || TRANSLATIONS.ru.alerts;
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    hint?: string;
  } | null>(null);

  // Human-in-the-Loop Fact Checking & Cross-Highlighting State
  const [factDecisions, setFactDecisions] = useState<Record<string, FactStatus>>({
    'fc-1': 'approved',
    'fc-2': 'pending',
    'fc-3': 'pending',
    'fc-4': 'pending'
  });
  const [hoveredFactId, setHoveredFactId] = useState<string | null>(null);
  const [selectedFactId, setSelectedFactId] = useState<string | null>(null);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  // Compute active fact cards dynamically (never show mock cards in real mode)
  const currentFacts: FactCheckItem[] = useMemo(() => {
    if (pipelineData.factCheckItems && pipelineData.factCheckItems.length > 0) {
      return pipelineData.factCheckItems;
    }
    if (isDemoMode) {
      return FACT_CHECK_ITEMS;
    }
    return [];
  }, [pipelineData.factCheckItems, isDemoMode]);

  const fullDraftText = useMemo(() => {
    if (isDemoMode) {
      return (
        pipelineData.outputs[currentLang]?.web_article ||
        MOCK_PIPELINE_RESULT.outputs[currentLang]?.web_article ||
        MOCK_PIPELINE_RESULT.outputs.ru?.web_article ||
        ''
      );
    }
    return pipelineData.outputs[currentLang]?.web_article || '';
  }, [pipelineData.outputs, currentLang, isDemoMode]);

  // Handle Quick Fix Action (Apply AI, Footnote, Remove)
  const handleQuickFix = (factId: string, fixType: QuickFixType) => {
    const card = currentFacts.find((c) => c.id === factId);
    if (!card) return;

    // Apply auto-fix across multilingual outputs in pipelineData
    setPipelineData((prev) => {
      const updatedOutputs = { ...prev.outputs };

      const langs: OutputLanguage[] = ['ru', 'kz', 'en'];
      langs.forEach((lang) => {
        const langArticle = updatedOutputs[lang]?.web_article;
        if (!langArticle) return;

        const target = card.targetPhrases?.[lang] || card.highlightedFact;
        if (!target) return;

        let newArticle = langArticle;

        if (fixType === 'apply_ai') {
          const replacement = card.fixes?.[lang]?.replacement || card.factCheckInfo?.suggestedFix || target;
          const targetBold = `**${target}**`;
          if (newArticle.includes(targetBold)) {
            newArticle = newArticle.replace(targetBold, `**${replacement}**`);
          } else if (newArticle.includes(target)) {
            newArticle = newArticle.replace(target, replacement);
          }
        } else if (fixType === 'footnote') {
          const notePrefix = lang === 'kz' ? 'Ескертпе' : lang === 'en' ? 'Note' : 'Примечание';
          const footnote = card.fixes?.[lang]?.footnote || `${target} *(${notePrefix}: ${card.factCheckInfo?.verified})*`;
          const targetBold = `**${target}**`;
          if (newArticle.includes(targetBold)) {
            newArticle = newArticle.replace(targetBold, footnote);
          } else if (newArticle.includes(target)) {
            newArticle = newArticle.replace(target, footnote);
          }
        } else if (fixType === 'remove') {
          const targetBold = `**${target}**`;
          const lines = newArticle.split('\n');
          let removedListItem = false;
          const filteredLines = lines.filter((line) => {
            if (line.includes(target)) {
              if (/^\s*\d+\.\s+/.test(line)) {
                removedListItem = true;
                return false;
              }
            }
            return true;
          });

          if (removedListItem) {
            newArticle = filteredLines.join('\n');
          } else if (newArticle.includes(targetBold)) {
            newArticle = newArticle.replace(targetBold, '');
          } else {
            newArticle = newArticle.replace(target, '');
          }
        }

        updatedOutputs[lang] = {
          ...updatedOutputs[lang],
          web_article: newArticle
        };
      });

      return {
        ...prev,
        outputs: updatedOutputs
      };
    });

    // Update fact decision status
    const newStatus: FactStatus = fixType === 'remove' ? 'declined' : 'fixed';
    setFactDecisions((prev) => ({
      ...prev,
      [factId]: newStatus
    }));

    setSelectedFactId(factId);
  };

  const handleToggleDecision = (factId: string, status: FactStatus) => {
    setFactDecisions((prev) => ({
      ...prev,
      [factId]: status
    }));
  };

  // Main process trigger: connects real API or runs demo simulation
  const handleProcess = async (options: {
    text?: string;
    audioFile?: File;
    uploadId?: string;
    useMock?: boolean;
    mode?: 'file' | 'text';
  }) => {
    clearAllTimers();
    const isMock = Boolean(options.useMock);
    setIsDemoMode(isMock);
    setActiveScreen('results');
    setIsProcessing(true);
    setVisibleFactCards(0);
    setStreamedDraftText('');
    setStreamedExportText('');

    if (isMock) {
      setPipelineData(MOCK_PIPELINE_RESULT);
    } else {
      setPipelineData(EMPTY_PIPELINE_RESULT);
    }

    const targetMode = options.mode || (options.text ? 'text' : activeTabInHero);
    const isFile = targetMode === 'file' && !options.text;

    if (options.audioFile) {
      setFileName(options.audioFile.name);
      setFileSize(`${(options.audioFile.size / (1024 * 1024)).toFixed(1)} mb`);
      setSubmittedText('');
      setActiveMode('file');
    } else if (options.text) {
      setSubmittedText(options.text);
      setFileName('Текстовый материал');
      setFileSize(`${options.text.length} симв.`);
      setActiveMode('text');
    } else if (isFile) {
      setFileName('Someinterview_file.mp4');
      setFileSize('10.5 mb');
      setSubmittedText('');
      setActiveMode('file');
    } else {
      const defaultText = TRANSLATIONS[currentLang]?.hero?.sampleText || TRANSLATIONS.ru.hero.sampleText;
      setSubmittedText(defaultText);
      setFileName('Текстовый материал');
      setFileSize(`${defaultText.length} симв.`);
      setActiveMode('text');
    }

    // ==========================================
    // PATH A: REAL MODE (Call Next.js API Route)
    // ==========================================
    if (!options.useMock && (options.text || options.audioFile || options.uploadId)) {
      try {
        const hasPreupload = Boolean(options.uploadId);
        setDemoPhase(hasPreupload ? 'decrypting' : 'uploading');
        setProgressPercent(hasPreupload ? 40 : 20);
        setLogStep(hasPreupload ? 1 : 0);

        const formData = new FormData();
        if (options.uploadId) {
          formData.append('uploadId', options.uploadId);
        } else if (options.audioFile) {
          formData.append('audio', options.audioFile);
        }
        if (options.text) {
          formData.append('text', options.text);
        }

        // Animated progression while waiting for network response
        const t1 = setTimeout(() => {
          setProgressPercent(50);
          setDemoPhase('decrypting');
          setLogStep(1); // '...transcribing / decrypting'
        }, hasPreupload ? 300 : 800);

        const t2 = setTimeout(() => {
          setProgressPercent(75);
          setDemoPhase('factchecking');
          setLogStep(2); // '...fact checking'
        }, hasPreupload ? 1500 : 2200);

        timersRef.current.push(t1, t2);

        const res = await fetch('/api/process', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || alerts.serverError(res.status));
        }

        const data: PipelineResult = await res.json();
        clearAllTimers();

        setPipelineData(data);

        const factsList = data.factCheckItems && data.factCheckItems.length > 0 ? data.factCheckItems : [];
        setVisibleFactCards(factsList.length > 0 ? factsList.length : 4);

        // Initialize fact decisions for real items
        const initialDecisions: Record<string, FactStatus> = {};
        factsList.forEach((f) => {
          initialDecisions[f.id] = 'pending';
        });
        if (Object.keys(initialDecisions).length > 0) {
          setFactDecisions(initialDecisions);
        }

        // Start drafting typewriter streaming
        setDemoPhase('drafting');
        setLogStep(3);
        setProgressPercent(88);

        const targetDraft = data.outputs[currentLang]?.web_article || data.outputs.ru?.web_article || '';
        let charIndex = 0;
        const streamTimer = setInterval(() => {
          charIndex += 26;
          if (charIndex >= targetDraft.length) {
            setStreamedDraftText(targetDraft);
            clearInterval(streamTimer);

            // Move to export phase
            setDemoPhase('exporting');
            setLogStep(4);
            setProgressPercent(100);

            const targetExport =
              data.outputs[currentLang]?.web_article ||
              data.outputs.en?.web_article ||
              '';

            let exportIndex = 0;
            const streamExportTimer = setInterval(() => {
              exportIndex += 26;
              if (exportIndex >= targetExport.length) {
                setStreamedExportText(targetExport);
                clearInterval(streamExportTimer);

                const tReady = setTimeout(() => {
                  setDemoPhase('ready');
                  setIsProcessing(false);
                }, 300);
                timersRef.current.push(tReady);
              } else {
                setStreamedExportText(targetExport.slice(0, exportIndex));
              }
            }, 18);
            timersRef.current.push(streamExportTimer as unknown as NodeJS.Timeout);
          } else {
            setStreamedDraftText(targetDraft.slice(0, charIndex));
          }
        }, 18);
        timersRef.current.push(streamTimer as unknown as NodeJS.Timeout);
        return;
      } catch (err: unknown) {
        clearAllTimers();
        setIsProcessing(false);
        setDemoPhase('idle');
        setActiveScreen('hero');
        setPipelineData(EMPTY_PIPELINE_RESULT);
        const msg = err instanceof Error ? err.message : alerts.unknownError;
        setErrorModal({
          isOpen: true,
          title: alerts.processingErrorTitle,
          message: msg,
          hint: alerts.errorHint
        });
        return;
      }
    }

    // ==========================================
    // PATH B: DEMO MODE (Fast Interactive Simulation)
    // ==========================================
    if (isFile) {
      setDemoPhase('uploading');
      setProgressPercent(0);
      setLogStep(0);

      const tUp1 = setTimeout(() => setProgressPercent(35), 250);
      const tUp2 = setTimeout(() => setProgressPercent(75), 600);
      const tUp3 = setTimeout(() => setProgressPercent(100), 950);
      timersRef.current.push(tUp1, tUp2, tUp3);

      const tProc = setTimeout(() => {
        setDemoPhase('decrypting');
        setLogStep(1);

        const tFact = setTimeout(() => {
          setDemoPhase('factchecking');
          setLogStep(2);

          const tCard1 = setTimeout(() => setVisibleFactCards(1), 200);
          const tCard2 = setTimeout(() => setVisibleFactCards(2), 400);
          const tCard3 = setTimeout(() => setVisibleFactCards(3), 600);
          const tCard4 = setTimeout(() => setVisibleFactCards(4), 800);
          timersRef.current.push(tCard1, tCard2, tCard3, tCard4);

          const tDraft = setTimeout(() => {
            setDemoPhase('drafting');
            setLogStep(3);

            let charIndex = 0;
            const targetText = fullDraftText;
            const streamTimer = setInterval(() => {
              charIndex += 22;
              if (charIndex >= targetText.length) {
                setStreamedDraftText(targetText);
                clearInterval(streamTimer);

                setDemoPhase('exporting');
                setLogStep(4);

                let exportIndex = 0;
                const targetExport =
                  pipelineData.outputs[currentLang]?.web_article ||
                  pipelineData.outputs.en?.web_article ||
                  '';

                const streamExportTimer = setInterval(() => {
                  exportIndex += 22;
                  if (exportIndex >= targetExport.length) {
                    setStreamedExportText(targetExport);
                    clearInterval(streamExportTimer);

                    const tComplete = setTimeout(() => {
                      setDemoPhase('ready');
                      setIsProcessing(false);
                    }, 400);
                    timersRef.current.push(tComplete);
                  } else {
                    setStreamedExportText(targetExport.slice(0, exportIndex));
                  }
                }, 25);
                timersRef.current.push(streamExportTimer as unknown as NodeJS.Timeout);
              } else {
                setStreamedDraftText(targetText.slice(0, charIndex));
              }
            }, 25);
            timersRef.current.push(streamTimer as unknown as NodeJS.Timeout);
          }, 1000);
          timersRef.current.push(tDraft);
        }, 800);
        timersRef.current.push(tFact);
      }, 1100);
      timersRef.current.push(tProc);
    } else {
      setDemoPhase('uploading');
      setProgressPercent(100);
      setLogStep(0);

      const tTextProc = setTimeout(() => {
        setDemoPhase('decrypting');
        setLogStep(1);

        const tFact = setTimeout(() => {
          setDemoPhase('factchecking');
          setLogStep(2);
          const tCard1 = setTimeout(() => setVisibleFactCards(1), 150);
          const tCard2 = setTimeout(() => setVisibleFactCards(2), 350);
          const tCard3 = setTimeout(() => setVisibleFactCards(3), 550);
          const tCard4 = setTimeout(() => setVisibleFactCards(4), 750);
          timersRef.current.push(tCard1, tCard2, tCard3, tCard4);

          const tDraft = setTimeout(() => {
            setDemoPhase('drafting');
            setLogStep(3);

            let charIndex = 0;
            const targetText = fullDraftText;
            const streamTimer = setInterval(() => {
              charIndex += 22;
              if (charIndex >= targetText.length) {
                setStreamedDraftText(targetText);
                clearInterval(streamTimer);

                setDemoPhase('exporting');
                setLogStep(4);

                let exportIndex = 0;
                const targetExport =
                  pipelineData.outputs[currentLang]?.web_article ||
                  pipelineData.outputs.en?.web_article ||
                  '';

                const streamExportTimer = setInterval(() => {
                  exportIndex += 22;
                  if (exportIndex >= targetExport.length) {
                    setStreamedExportText(targetExport);
                    clearInterval(streamExportTimer);

                    const tComplete = setTimeout(() => {
                      setDemoPhase('ready');
                      setIsProcessing(false);
                    }, 400);
                    timersRef.current.push(tComplete);
                  } else {
                    setStreamedExportText(targetExport.slice(0, exportIndex));
                  }
                }, 25);
                timersRef.current.push(streamExportTimer as unknown as NodeJS.Timeout);
              } else {
                setStreamedDraftText(targetText.slice(0, charIndex));
              }
            }, 25);
            timersRef.current.push(streamTimer as unknown as NodeJS.Timeout);
          }, 900);
          timersRef.current.push(tDraft);
        }, 750);
        timersRef.current.push(tFact);
      }, 300);
      timersRef.current.push(tTextProc);
    }
  };

  const handleReset = () => {
    clearAllTimers();
    setIsDemoMode(false);
    setActiveScreen('hero');
    setDemoPhase('idle');
    setPipelineData(EMPTY_PIPELINE_RESULT);
    setProgressPercent(0);
    setLogStep(0);
    setVisibleFactCards(0);
    setStreamedDraftText('');
    setStreamedExportText('');
    setSubmittedText('');
    setIsProcessing(false);
    setSelectedFactId(null);
    setHoveredFactId(null);
  };

  // State calculations for sub-components
  const isFactCheckingLoading =
    isProcessing &&
    (demoPhase === 'uploading' ||
      demoPhase === 'decrypting' ||
      (demoPhase === 'factchecking' && visibleFactCards === 0));
  const isDraftLoading =
    isProcessing &&
    (demoPhase === 'uploading' || demoPhase === 'decrypting' || demoPhase === 'factchecking');
  const isDraftStreaming = isProcessing && demoPhase === 'drafting';
  const isExportLoading =
    isProcessing &&
    (demoPhase === 'uploading' ||
      demoPhase === 'decrypting' ||
      demoPhase === 'factchecking' ||
      demoPhase === 'drafting');
  const isExportStreaming = isProcessing && demoPhase === 'exporting';

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0b0b] text-white relative">
      {/* Header matching Figma */}
      <Header
        onTriggerDemo={() => handleProcess({ useMock: true, mode: activeTabInHero })}
        isDemoActive={activeScreen === 'results' && isDemoMode}
        isRealResultsActive={activeScreen === 'results' && !isDemoMode}
        onExitDemo={handleReset}
        onNewMaterial={handleReset}
        currentLang={currentLang}
        onLangChange={(lang) => setCurrentLang(lang)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-8 sm:pb-10">
        {activeScreen === 'hero' ? (
          <HeroUpload
            onProcess={handleProcess}
            isProcessing={isProcessing}
            activeTab={activeTabInHero}
            onTabChange={(tab) => setActiveTabInHero(tab)}
            currentLang={currentLang}
          />
        ) : (
          <div className="w-full flex flex-col space-y-10">
            {/* Active File Banner with sequential logs */}
            <ActiveFileStatus
              fileName={fileName}
              fileSize={fileSize}
              submittedText={submittedText}
              progressPercent={progressPercent}
              onReset={handleReset}
              activeMode={activeMode}
              logStep={logStep}
              currentLang={currentLang}
            />

            {/* 2-Column Section: Fact checking & Lead Draft */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Fact checking */}
              <div className="lg:col-span-4 w-full flex flex-col">
                <FactCheckingSection
                  facts={currentFacts}
                  decisions={factDecisions}
                  onDecision={handleToggleDecision}
                  onQuickFix={handleQuickFix}
                  hoveredFactId={hoveredFactId}
                  onHoverFact={setHoveredFactId}
                  selectedFactId={selectedFactId}
                  onSelectFact={setSelectedFactId}
                  isLoading={isFactCheckingLoading}
                  visibleCardsCount={demoPhase === 'ready' ? currentFacts.length : visibleFactCards}
                  currentLang={currentLang}
                />
              </div>

              {/* Right Column: Lead Draft */}
              <div className="lg:col-span-8 w-full flex flex-col">
                <LeadDraftSection
                  draftText={fullDraftText}
                  facts={currentFacts}
                  decisions={factDecisions}
                  currentLang={currentLang}
                  hoveredFactId={hoveredFactId}
                  onHoverFact={setHoveredFactId}
                  selectedFactId={selectedFactId}
                  onSelectFact={setSelectedFactId}
                  isLoading={isDraftLoading}
                  isStreaming={isDraftStreaming}
                  streamedText={streamedDraftText}
                  onSaveDraft={(newText) => {
                    setPipelineData((prev) => ({
                      ...prev,
                      outputs: {
                        ...prev.outputs,
                        [currentLang]: {
                          ...prev.outputs[currentLang],
                          web_article: newText
                        }
                      }
                    }));
                  }}
                />
              </div>
            </div>

            {/* Multi-platform export Section */}
            <MultiPlatformExport
              outputs={pipelineData.outputs}
              isLoading={isExportLoading}
              isStreaming={isExportStreaming}
              streamedText={streamedExportText}
              currentLang={currentLang}
            />
          </div>
        )}
      </main>

      {/* Error / Alert Modal */}
      {errorModal && (
        <AlertModal
          isOpen={errorModal.isOpen}
          onClose={() => setErrorModal(null)}
          title={errorModal.title}
          message={errorModal.message}
          hint={errorModal.hint}
          hintPrefix={alerts.hintPrefix}
          type="error"
          confirmText={alerts.closeBtn}
        />
      )}
    </div>
  );
}

