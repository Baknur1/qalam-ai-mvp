'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Header } from '@/components/header';
import { HeroUpload } from '@/components/hero-upload';
import { ActiveFileStatus } from '@/components/active-file-status';
import { FactCheckingSection } from '@/components/fact-checking-section';
import { LeadDraftSection } from '@/components/lead-draft-section';
import { MultiPlatformExport } from '@/components/multi-platform-export';
import { PricingTable } from '@/components/pricing-table';
import { AlertModal } from '@/components/alert-modal';
import { MOCK_PIPELINE_RESULT, EMPTY_PIPELINE_RESULT, DEFAULT_DEMO_FILE } from '@/lib/mock-data';
import { PipelineResult, OutputLanguage, FactStatus, QuickFixType, FactCheckItem } from '@/lib/types';
import { FACT_CHECK_ITEMS } from '@/lib/fact-checking-data';
import { TRANSLATIONS } from '@/lib/translations';
import { runDemoSimulation } from '@/lib/demo-simulation';

type DemoPhase =
  | 'idle'
  | 'uploading'
  | 'decrypting'
  | 'factchecking'
  | 'drafting'
  | 'exporting'
  | 'ready';

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
  const [fileName, setFileName] = useState(DEFAULT_DEMO_FILE.name);
  const [fileSize, setFileSize] = useState(DEFAULT_DEMO_FILE.size);
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
  const [factDecisions, setFactDecisions] = useState<Record<string, FactStatus>>({});
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

  // Background translation trigger: seamlessly populates KZ and ENG in the background
  const triggerBackgroundTranslations = (result: PipelineResult) => {
    const primaryArticle = result.outputs.ru?.web_article || result.outputs[currentLang]?.web_article;
    if (!primaryArticle) return;

    const facts = result.factCheckItems || [];
    const targetPhrasesRu = facts.map(
      (f) => f.targetPhrases?.ru || f.highlightedFact || ''
    );
    const targetFixesRu = facts.map(
      (f) => f.fixes?.ru?.replacement || ''
    );

    const targetLangs: ('kz' | 'en')[] = ['kz', 'en'];

    targetLangs.forEach(async (targetLang) => {
      const ruArticle = (result.outputs.ru?.web_article || '').trim();
      const currentTargetArticle = (result.outputs[targetLang]?.web_article || '').trim();
      // If language already has a real translated article (not empty and not Russian fallback), skip
      if (currentTargetArticle && currentTargetArticle !== ruArticle) return;

      try {
        const transRes = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            article: primaryArticle,
            telegram: result.outputs.ru?.telegram_post || result.outputs[currentLang]?.telegram_post || '',
            scenario: result.outputs.ru?.social_script || result.outputs[currentLang]?.social_script || '',
            targetPhrases: targetPhrasesRu,
            targetFixes: targetFixesRu,
            facts,
            targetLang
          })
        });

        if (!transRes.ok) return;
        const transData = await transRes.json();
        if (!transData.outputs) return;

        setPipelineData((prev) => {
          const updatedOutputs = {
            ...prev.outputs,
            [targetLang]: transData.outputs
          };

          const prevFacts = prev.factCheckItems || [];
          const updatedFacts = prevFacts.map((fact, idx) => {
            const tf =
              transData.translatedFacts?.find((f: { id: string }) => f.id === fact.id) ||
              transData.translatedFacts?.[idx];

            return {
              ...fact,
              targetPhrases: {
                ...fact.targetPhrases,
                [targetLang]:
                  transData.translatedPhrases?.[idx] ||
                  fact.targetPhrases?.[targetLang] ||
                  fact.targetPhrases?.ru ||
                  fact.highlightedFact
              },
              fixes: {
                ...fact.fixes,
                [targetLang]: {
                  replacement:
                    transData.translatedFixes?.[idx] ||
                    fact.fixes?.[targetLang]?.replacement ||
                    fact.fixes?.ru?.replacement ||
                    '',
                  footnote:
                    fact.fixes?.[targetLang]?.footnote ||
                    fact.fixes?.ru?.footnote ||
                    ''
                }
              },
              translations: {
                ...fact.translations,
                [targetLang]: {
                  speaker: tf?.speaker || fact.speaker,
                  textBefore: tf?.textBefore || fact.textBefore,
                  underlinedPhrase: fact.underlinedPhrase,
                  textMid: '',
                  highlightedFact: tf?.highlightedFact || fact.highlightedFact,
                  textAfter: tf?.textAfter || fact.textAfter,
                  factCheckInfo: {
                    ...fact.factCheckInfo,
                    title: tf?.factCheckInfo?.title || fact.factCheckInfo.title,
                    claimed: tf?.factCheckInfo?.claimed || fact.factCheckInfo.claimed,
                    verified: tf?.factCheckInfo?.verified || fact.factCheckInfo.verified,
                    suggestedFix: tf?.factCheckInfo?.suggestedFix || fact.factCheckInfo.suggestedFix,
                    source: fact.factCheckInfo.source,
                    sourceUrl: (fact.factCheckInfo as any).sourceUrl
                  }
                }
              }
            };
          });

          return {
            ...prev,
            outputs: updatedOutputs,
            factCheckItems: updatedFacts
          };
        });
      } catch (err) {
        console.warn(`[Background Translate] Failed for ${targetLang}:`, err);
      }
    });
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
    setFactDecisions({});
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
    // PATH A: REAL MODE (Call Next.js API Route with SSE Streaming)
    // ==========================================
    if (!options.useMock && (options.text || options.audioFile || options.uploadId)) {
      try {
        const hasPreupload = Boolean(options.uploadId);
        setDemoPhase(hasPreupload ? 'decrypting' : 'uploading');
        setProgressPercent(hasPreupload ? 30 : 15);
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

        const res = await fetch('/api/process?stream=true', {
          method: 'POST',
          headers: {
            Accept: 'text/event-stream'
          },
          body: formData
        });

        if (!res.ok) {
          if (res.status === 413) {
            throw new Error(
              'Файл превышает лимит хостинга Vercel (максимум 4.5 МБ на запрос). Для тяжелых видеофайлов используйте локальную версию приложения или загружайте сжатое аудио (MP3/M4A).'
            );
          }
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || alerts.serverError(res.status));
        }

        const contentType = res.headers.get('content-type') || '';

        if (contentType.includes('text/event-stream') && res.body) {
          clearAllTimers();
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let sseBuffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            sseBuffer += decoder.decode(value, { stream: true });
            const events = sseBuffer.split('\n\n');
            sseBuffer = events.pop() || '';

            for (const eventBlock of events) {
              const lines = eventBlock.split('\n');
              let eventName = 'message';
              let eventData = '';

              for (const line of lines) {
                if (line.startsWith('event:')) {
                  eventName = line.slice(6).trim();
                } else if (line.startsWith('data:')) {
                  eventData = line.slice(5).trim();
                }
              }

              if (!eventData) continue;

              try {
                const payload = JSON.parse(eventData);

                if (eventName === 'step') {
                  setLogStep(payload.step);
                  if (payload.step === 1) {
                    setDemoPhase('decrypting');
                    setProgressPercent(35);
                  } else if (payload.step === 2) {
                    setDemoPhase('factchecking');
                    setProgressPercent(60);
                  }
                } else if (eventName === 'fact' && payload.fact) {
                  // A new fact item was verified in real time!
                  const newFact = payload.fact as FactCheckItem;
                  setPipelineData((prev) => {
                    const currentItems = prev.factCheckItems || [];
                    const exists = currentItems.some((f) => f.id === newFact.id);
                    if (exists) return prev;
                    return {
                      ...prev,
                      factCheckItems: [...currentItems, newFact]
                    };
                  });
                  setVisibleFactCards((prev) => prev + 1);
                  setFactDecisions((prev) => ({
                    ...prev,
                    [newFact.id]: prev[newFact.id] || 'pending'
                  }));
                  setDemoPhase('factchecking');
                  setProgressPercent((p) => Math.min(85, Math.max(p, 65) + 3));
                } else if (eventName === 'draft_chunk' && payload.chunk) {
                  setStreamedDraftText((prev) => prev + payload.chunk);
                  setDemoPhase('drafting');
                  setLogStep(3);
                  setProgressPercent((p) => Math.min(95, Math.max(p, 75) + 1));
                } else if (eventName === 'complete' && payload.result) {
                  const finalData = payload.result as PipelineResult;
                  setPipelineData(finalData);
                  setStreamedDraftText(
                    finalData.outputs[currentLang]?.web_article ||
                    finalData.outputs.ru?.web_article ||
                    ''
                  );
                  setVisibleFactCards(finalData.factCheckItems?.length || 0);
                  setDemoPhase('ready');
                  setLogStep(4);
                  setProgressPercent(100);
                  setIsProcessing(false);

                  // Trigger background translation for KZ and EN
                  triggerBackgroundTranslations(finalData);
                } else if (eventName === 'error') {
                  throw new Error(payload.error || 'Ошибка генерации');
                }
              } catch (parseErr) {
                if (eventName === 'error') throw parseErr;
              }
            }
          }
          return;
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

        setStreamedDraftText(data.outputs[currentLang]?.web_article || data.outputs.ru?.web_article || '');
        setDemoPhase('ready');
        setLogStep(4);
        setProgressPercent(100);
        setIsProcessing(false);
        triggerBackgroundTranslations(data);
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
    runDemoSimulation({
      isFile,
      fullDraftText,
      pipelineData,
      currentLang,
      setDemoPhase,
      setProgressPercent,
      setLogStep,
      setVisibleFactCards,
      setStreamedDraftText,
      setStreamedExportText,
      setIsProcessing,
      timersRef
    });
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
          <div className="w-full flex flex-col items-center">
            <HeroUpload
              onProcess={handleProcess}
              isProcessing={isProcessing}
              activeTab={activeTabInHero}
              onTabChange={(tab) => setActiveTabInHero(tab)}
              currentLang={currentLang}
            />
            <PricingTable currentLang={currentLang} />
          </div>
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

