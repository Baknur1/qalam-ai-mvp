'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/header';
import { HeroUpload } from '@/components/hero-upload';
import { ActiveFileStatus } from '@/components/active-file-status';
import { FactCheckingSection } from '@/components/fact-checking-section';
import { LeadDraftSection } from '@/components/lead-draft-section';
import { MultiPlatformExport } from '@/components/multi-platform-export';
import { MOCK_PIPELINE_RESULT } from '@/lib/mock-data';
import { PipelineResult, OutputLanguage, FactStatus, QuickFixType } from '@/lib/types';
import { FACT_CHECK_ITEMS } from '@/lib/fact-checking-data';
import { Volume2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type DemoPhase =
  | 'idle'
  | 'uploading'
  | 'decrypting'
  | 'factchecking'
  | 'drafting'
  | 'exporting'
  | 'ready';

export default function Home() {
  const [pipelineData, setPipelineData] = useState<PipelineResult>(MOCK_PIPELINE_RESULT);
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
  const [activeMode, setActiveMode] = useState<'file' | 'text'>('file');
  const [activeTabInHero, setActiveTabInHero] = useState<'file' | 'text'>('file');
  const [currentLang, setCurrentLang] = useState<OutputLanguage>('ru');

  // Human-in-the-Loop Fact Checking & Cross-Highlighting State
  const [factDecisions, setFactDecisions] = useState<Record<string, FactStatus>>({
    'fc-1': 'approved',
    'fc-2': 'pending',
    'fc-3': 'pending',
    'fc-4': 'pending'
  });
  const [hoveredFactId, setHoveredFactId] = useState<string | null>(null);
  const [selectedFactId, setSelectedFactId] = useState<string | null>(null);
  const [activeAudioPreview, setActiveAudioPreview] = useState<{
    time: string;
    speaker: string;
    text: string;
  } | null>(null);

  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const audioTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
    if (audioTimerRef.current) {
      clearTimeout(audioTimerRef.current);
      audioTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  const fullDraftText =
    pipelineData.outputs[currentLang]?.web_article ||
    pipelineData.outputs.en?.web_article ||
    pipelineData.outputs.ru?.web_article ||
    '';

  // Handle Play Timecode snippet
  const handlePlayAudioTimecode = (item: { time: string; speaker: string; text: string }) => {
    setActiveAudioPreview(item);
    if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
    audioTimerRef.current = setTimeout(() => {
      setActiveAudioPreview(null);
    }, 4500);
  };

  // Handle Quick Fix Action (Apply AI, Footnote, Remove)
  const handleQuickFix = (factId: string, fixType: QuickFixType) => {
    const card = FACT_CHECK_ITEMS.find((c) => c.id === factId);
    if (!card) return;

    // Apply auto-fix across multilingual outputs in pipelineData
    setPipelineData((prev) => {
      const updatedOutputs = { ...prev.outputs };

      const langs: OutputLanguage[] = ['ru', 'kz', 'en'];
      langs.forEach((lang) => {
        const langArticle = updatedOutputs[lang]?.web_article;
        if (!langArticle) return;

        const target = card.targetPhrases[lang];
        let newArticle = langArticle;

        if (fixType === 'apply_ai') {
          const replacement = card.fixes[lang].replacement;
          const targetBold = `**${target}**`;
          if (newArticle.includes(targetBold)) {
            newArticle = newArticle.replace(targetBold, `**${replacement}**`);
          } else if (newArticle.includes(target)) {
            newArticle = newArticle.replace(target, replacement);
          }
        } else if (fixType === 'footnote') {
          const footnote = card.fixes[lang].footnote;
          const targetBold = `**${target}**`;
          if (newArticle.includes(targetBold)) {
            newArticle = newArticle.replace(targetBold, footnote);
          } else if (newArticle.includes(target)) {
            newArticle = newArticle.replace(target, footnote);
          }
        } else if (fixType === 'remove') {
          const targetBold = `**${target}**`;
          // If the phrase is in a list item (e.g., "4. Сроки подачи..."), remove the entire list item line
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

  const handleProcess = async (options: {
    text?: string;
    audioFile?: File;
    useMock?: boolean;
    mode?: 'file' | 'text';
  }) => {
    clearAllTimers();
    setActiveScreen('results');
    setIsProcessing(true);
    setVisibleFactCards(0);
    setStreamedDraftText('');
    setStreamedExportText('');

    const targetMode = options.mode || (options.text ? 'text' : activeTabInHero);
    const isFile = targetMode === 'file' && !options.text;

    if (options.audioFile) {
      setFileName(options.audioFile.name);
      setFileSize(`${(options.audioFile.size / (1024 * 1024)).toFixed(1)} mb`);
      setActiveMode('file');
    } else if (options.text) {
      setFileName('Briefing_transcript.txt');
      setFileSize(`${(options.text.length / 1024).toFixed(1)} kb`);
      setActiveMode('text');
    } else if (isFile) {
      setFileName('Someinterview_file.mp4');
      setFileSize('10.5 mb');
      setActiveMode('file');
    } else {
      setFileName('Briefing_transcript.txt');
      setFileSize('3.8 kb');
      setActiveMode('text');
    }

    if (isFile) {
      // PHASE 0: File Uploading first (progress 0% -> 100%)
      setDemoPhase('uploading');
      setProgressPercent(0);
      setLogStep(0);

      const tUp1 = setTimeout(() => setProgressPercent(35), 250);
      const tUp2 = setTimeout(() => setProgressPercent(75), 600);
      const tUp3 = setTimeout(() => setProgressPercent(100), 950);
      timersRef.current.push(tUp1, tUp2, tUp3);

      // PHASE 1: Once file finishes uploading (at 100%), processing begins below!
      const tProc = setTimeout(() => {
        setDemoPhase('decrypting');
        setLogStep(1); // shows '...file decryption' with spinner

        // Decryption completes and Fact Checking begins
        const tFact = setTimeout(() => {
          setDemoPhase('factchecking');
          setLogStep(2); // shows '...fact checking'

          // Staggered reveal of Fact Checking cards
          const tCard1 = setTimeout(() => setVisibleFactCards(1), 200);
          const tCard2 = setTimeout(() => setVisibleFactCards(2), 400);
          const tCard3 = setTimeout(() => setVisibleFactCards(3), 600);
          const tCard4 = setTimeout(() => setVisibleFactCards(4), 800);
          timersRef.current.push(tCard1, tCard2, tCard3, tCard4);

          // Phase 3: Lead Draft Streaming begins
          const tDraft = setTimeout(() => {
            setDemoPhase('drafting');
            setLogStep(3); // shows '...generating a draft post'

            let charIndex = 0;
            const targetText = fullDraftText;
            const streamTimer = setInterval(() => {
              charIndex += 22;
              if (charIndex >= targetText.length) {
                setStreamedDraftText(targetText);
                clearInterval(streamTimer);

                // Phase 4: Social Media Export streaming begins
                setDemoPhase('exporting');
                setLogStep(4); // shows '...generating a post for social networks'

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
      // TEXT MODE DEMO
      setDemoPhase('uploading');
      setProgressPercent(100);
      setLogStep(0);

      const tTextProc = setTimeout(() => {
        setDemoPhase('decrypting');
        setLogStep(1); // '...file decryption'

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
    setActiveScreen('hero');
    setDemoPhase('idle');
    setProgressPercent(0);
    setLogStep(0);
    setVisibleFactCards(0);
    setStreamedDraftText('');
    setStreamedExportText('');
    setIsProcessing(false);
    setSelectedFactId(null);
    setHoveredFactId(null);
    setActiveAudioPreview(null);
  };

  // State calculations for sub-components
  const isFactCheckingLoading = demoPhase === 'uploading' || demoPhase === 'decrypting';
  const isDraftLoading =
    demoPhase === 'uploading' || demoPhase === 'decrypting' || demoPhase === 'factchecking';
  const isDraftStreaming = demoPhase === 'drafting';
  const isExportLoading =
    demoPhase === 'uploading' ||
    demoPhase === 'decrypting' ||
    demoPhase === 'factchecking' ||
    demoPhase === 'drafting';
  const isExportStreaming = demoPhase === 'exporting';

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0b0b] text-white relative">
      {/* Animated Timecode Audio Player Floating Toast */}
      <AnimatePresence>
        {activeAudioPreview && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 bg-[#141419] border border-amber-500/50 shadow-2xl rounded-2xl p-4 w-80 sm:w-96 text-white backdrop-blur-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Volume2 className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <span>Воспроизведение таймкода [{activeAudioPreview.time}]</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 mt-0.5 font-medium">
                    Спикер: {activeAudioPreview.speaker}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveAudioPreview(null)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Simulated Animated Equalizer Bars */}
            <div className="mt-3 flex items-center justify-between px-2 py-1.5 rounded-lg bg-black/40 border border-neutral-800">
              <div className="flex items-center gap-1 h-5">
                {[4, 12, 18, 8, 14, 20, 10, 16, 22, 6, 15, 9, 18, 12, 6].map((h, i) => (
                  <motion.span
                    key={i}
                    className="w-1 bg-gradient-to-t from-amber-500 to-amber-300 rounded-full"
                    animate={{ height: [`${h * 0.4}px`, `${h}px`, `${h * 0.3}px`] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.6 + (i % 5) * 0.1,
                      ease: 'easeInOut'
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] font-mono text-amber-400 animate-pulse">0:42 / 2:48</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-2 italic line-clamp-1">
              «{activeAudioPreview.text}»
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header matching Figma */}
      <Header
        onTriggerDemo={() => handleProcess({ useMock: true, mode: activeTabInHero })}
        isDemoActive={activeScreen === 'results'}
        onExitDemo={handleReset}
        currentLang={currentLang}
        onLangChange={(lang) => setCurrentLang(lang)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
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
              progressPercent={progressPercent}
              onReset={handleReset}
              activeMode={activeMode}
              logStep={logStep}
              currentLang={currentLang}
              onModeChange={(mode) => {
                if (mode !== activeMode) {
                  setActiveTabInHero(mode);
                  handleReset();
                }
              }}
            />

            {/* 2-Column Section: Fact checking & Lead Draft */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Fact checking */}
              <div className="lg:col-span-4 w-full flex flex-col">
                <FactCheckingSection
                  facts={FACT_CHECK_ITEMS}
                  decisions={factDecisions}
                  onDecision={handleToggleDecision}
                  onQuickFix={handleQuickFix}
                  hoveredFactId={hoveredFactId}
                  onHoverFact={setHoveredFactId}
                  selectedFactId={selectedFactId}
                  onSelectFact={setSelectedFactId}
                  activeAudioTimecode={activeAudioPreview?.time || null}
                  onPlayAudioTimecode={handlePlayAudioTimecode}
                  isLoading={isFactCheckingLoading}
                  visibleCardsCount={demoPhase === 'ready' ? 4 : visibleFactCards}
                  currentLang={currentLang}
                />
              </div>

              {/* Right Column: Lead Draft */}
              <div className="lg:col-span-8 w-full flex flex-col">
                <LeadDraftSection
                  draftText={fullDraftText}
                  facts={FACT_CHECK_ITEMS}
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
    </div>
  );
}
