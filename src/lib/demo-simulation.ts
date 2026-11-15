import React from 'react';
import { PipelineResult, OutputLanguage } from './types';

export interface DemoSimulationParams {
  isFile: boolean;
  fullDraftText: string;
  pipelineData: PipelineResult;
  currentLang: OutputLanguage;
  setDemoPhase: (phase: 'idle' | 'uploading' | 'decrypting' | 'factchecking' | 'drafting' | 'exporting' | 'ready') => void;
  setProgressPercent: (p: number | ((prev: number) => number)) => void;
  setLogStep: (step: number) => void;
  setVisibleFactCards: (count: number | ((prev: number) => number)) => void;
  setStreamedDraftText: (text: string) => void;
  setStreamedExportText: (text: string) => void;
  setIsProcessing: (val: boolean) => void;
  timersRef: React.MutableRefObject<NodeJS.Timeout[]>;
}

export function runDemoSimulation(params: DemoSimulationParams) {
  const {
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
  } = params;

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
    }, 600);
    timersRef.current.push(tTextProc);
  }
}

