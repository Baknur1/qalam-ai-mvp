'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/header';
import { HeroUpload } from '@/components/hero-upload';
import { ActiveFileStatus } from '@/components/active-file-status';
import { FactCheckingSection } from '@/components/fact-checking-section';
import { LeadDraftSection } from '@/components/lead-draft-section';
import { MultiPlatformExport } from '@/components/multi-platform-export';
import { MOCK_PIPELINE_RESULT } from '@/lib/mock-data';
import { PipelineResult, OutputLanguage } from '@/lib/types';

type DemoPhase = 'idle' | 'uploading' | 'decrypting' | 'factchecking' | 'drafting' | 'exporting' | 'ready';

export default function Home() {
  const [pipelineData, setPipelineData] = useState<PipelineResult>(MOCK_PIPELINE_RESULT);
  const [activeScreen, setActiveScreen] = useState<'hero' | 'results'>('hero');
  const [demoPhase, setDemoPhase] = useState<DemoPhase>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [logStep, setLogStep] = useState(0); // 0 (uploading) to 4 (ready)
  const [visibleFactCards, setVisibleFactCards] = useState(0); // 0 to 3
  const [streamedDraftText, setStreamedDraftText] = useState('');
  const [streamedExportText, setStreamedExportText] = useState('');
  const [fileName, setFileName] = useState('Someinterview_file.mp4');
  const [fileSize, setFileSize] = useState('10.5 mb');
  const [activeMode, setActiveMode] = useState<'file' | 'text'>('file');
  const [activeTabInHero, setActiveTabInHero] = useState<'file' | 'text'>('file');
  const [currentLang, setCurrentLang] = useState<OutputLanguage>('en');

  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  const fullDraftText =
    pipelineData.outputs[currentLang]?.web_article ||
    pipelineData.outputs.en?.web_article ||
    pipelineData.outputs.ru?.web_article ||
    '';

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
      // PHASE 0: File Uploading first (progress 0% -> 100%, NO logs below yet)
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
          const tCard1 = setTimeout(() => setVisibleFactCards(1), 250);
          const tCard2 = setTimeout(() => setVisibleFactCards(2), 500);
          const tCard3 = setTimeout(() => setVisibleFactCards(3), 750);
          timersRef.current.push(tCard1, tCard2, tCard3);

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
          const tCard1 = setTimeout(() => setVisibleFactCards(1), 200);
          const tCard2 = setTimeout(() => setVisibleFactCards(2), 450);
          const tCard3 = setTimeout(() => setVisibleFactCards(3), 700);
          timersRef.current.push(tCard1, tCard2, tCard3);

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
    <div className="min-h-screen flex flex-col bg-[#0b0b0b] text-white">
      {/* Header matching Figma */}
      <Header
        onTriggerDemo={() => handleProcess({ useMock: true, mode: activeTabInHero })}
        isDemoActive={activeScreen === 'results'}
        onExitDemo={handleReset}
        currentLang={currentLang}
        onLangChange={(lang) => setCurrentLang(lang)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {activeScreen === 'hero' ? (
          <HeroUpload
            onProcess={handleProcess}
            isProcessing={isProcessing}
            activeTab={activeTabInHero}
            onTabChange={(tab) => setActiveTabInHero(tab)}
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
              onModeChange={(mode) => {
                if (mode !== activeMode) {
                  setActiveTabInHero(mode);
                  handleReset();
                }
              }}
            />

            {/* 2-Column Section: Fact checking & Lead Draft (ends on the same height) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Column: Fact checking */}
              <div className="lg:col-span-4 w-full flex flex-col h-full">
                <FactCheckingSection
                  isLoading={isFactCheckingLoading}
                  visibleCardsCount={visibleFactCards}
                />
              </div>

              {/* Right Column: Lead Draft */}
              <div className="lg:col-span-8 w-full flex flex-col h-full">
                <LeadDraftSection
                  draftText={fullDraftText}
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
            />
          </div>
        )}
      </main>
    </div>
  );
}
