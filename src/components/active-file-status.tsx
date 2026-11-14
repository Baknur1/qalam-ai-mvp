'use client';

import React, { useState, useRef } from 'react';
import { FileText, X, Check, Loader2, Maximize2, Minimize2, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { OutputLanguage } from '@/lib/types';
import { TRANSLATIONS } from '@/lib/translations';

interface ActiveFileStatusProps {
  fileName: string;
  fileSize: string;
  submittedText?: string;
  progressPercent: number;
  onReset: () => void;
  activeMode?: 'file' | 'text';
  onModeChange?: (mode: 'file' | 'text') => void;
  logStep?: number; // 0 (uploading) to 4 (ready)
  currentLang?: OutputLanguage;
}

export function ActiveFileStatus({
  fileName,
  fileSize,
  submittedText = '',
  progressPercent,
  onReset,
  activeMode = 'file',
  onModeChange,
  logStep = 4,
  currentLang = 'ru'
}: ActiveFileStatusProps) {
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t = TRANSLATIONS[currentLang]?.activeFile || TRANSLATIONS.ru.activeFile;

  const textLabels = {
    ru: {
      expand: 'Развернуть',
      collapse: 'Свернуть',
      toTop: 'В начало',
      words: 'слов',
      chars: 'симв.',
      step1: '...обработка текста'
    },
    kz: {
      expand: 'Жаю',
      collapse: 'Жию',
      toTop: 'Басына',
      words: 'сөз',
      chars: 'таңба',
      step1: '...мәтінді өңдеу'
    },
    en: {
      expand: 'Expand',
      collapse: 'Collapse',
      toTop: 'To top',
      words: 'words',
      chars: 'chars',
      step1: '...processing text'
    }
  }[currentLang] || {
    expand: 'Развернуть',
    collapse: 'Свернуть',
    toTop: 'В начало',
    words: 'слов',
    chars: 'симв.',
    step1: '...обработка текста'
  };

  const LOGS = [
    { step: 1, text: activeMode === 'text' ? textLabels.step1 : t.logs[0] },
    { step: 2, text: t.logs[1] },
    { step: 3, text: t.logs[2] },
    { step: 4, text: t.logs[3] }
  ];

  const displayText = submittedText || fileName;
  const wordCount = displayText.trim() ? displayText.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = displayText.length;

  return (
    <div
      className={`w-full mx-auto flex flex-col items-center select-none transition-all duration-300 ${
        activeMode === 'text' ? 'max-w-[880px]' : 'max-w-[620px]'
      }`}
    >
      {/* Outer container matching Figma design */}
      {activeMode === 'text' ? (
        <div className="w-full rounded-[16px] bg-[#191919] p-2.5 sm:p-3 flex flex-col border border-[#282828]/60 transition-all">
          <div className="w-full rounded-[12px] bg-[#111111] border border-[#2f2f2f] p-3.5 sm:p-4 transition-colors flex flex-col">
            {/* Header toolbar */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#222222] text-xs text-neutral-400 select-none">
              <span className="text-[12px] text-neutral-400">
                {wordCount} {textLabels.words} • {charCount} {textLabels.chars}
              </span>

              <div className="flex items-center gap-1.5">
                {charCount > 60 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (textareaRef.current) {
                        textareaRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors cursor-pointer text-[11.5px]"
                    title="Прокрутить к первым предложениям"
                  >
                    <ArrowUp className="w-3 h-3" />
                    <span>{textLabels.toTop}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsTextExpanded((prev) => {
                      const next = !prev;
                      if (next && textareaRef.current) {
                        setTimeout(() => {
                          if (textareaRef.current) {
                            textareaRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }, 50);
                      }
                      return next;
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 hover:text-white transition-colors cursor-pointer text-[11.5px]"
                >
                  {isTextExpanded ? (
                    <>
                      <Minimize2 className="w-3 h-3 text-neutral-400" />
                      <span>{textLabels.collapse}</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3 h-3 text-neutral-400" />
                      <span>{textLabels.expand}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onReset}
                  className="w-5 h-5 ml-1 rounded-[4px] bg-[#d9383a] hover:bg-red-600 text-white p-0 flex items-center justify-center transition-colors cursor-pointer"
                  title="Отменить"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5] block" />
                </button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              readOnly
              rows={isTextExpanded ? 14 : 4}
              value={displayText}
              className={`w-full bg-transparent border-0 outline-none resize-none text-sm text-neutral-200 leading-relaxed font-sans cursor-default transition-[min-height] duration-200 ${
                isTextExpanded ? 'min-h-[280px] max-h-[420px]' : 'min-h-[96px] max-h-[140px]'
              }`}
            />

            {/* Dynamic progress bar at the bottom */}
            <div className="w-full h-1 bg-[#1e1e1e] overflow-hidden mt-3 rounded-full">
              <div
                className="h-full bg-[#22c55e] transition-all duration-400 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full rounded-[16px] bg-[#191919] p-4.5 sm:p-5 border border-[#282828]/60">
          {/* Inner Card with file info and progress bar inside */}
          <div className="w-full rounded-[10px] sm:rounded-[12px] bg-[#282828] overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between text-sm text-neutral-300 px-5 sm:px-6 pt-3.5 pb-2.5">
              <span className="font-normal text-white truncate text-sm sm:text-base">
                {fileName}
              </span>

              <div className="flex items-center gap-3.5 shrink-0">
                <span className="text-xs sm:text-sm text-neutral-400">
                  {fileSize}
                </span>
                <button
                  type="button"
                  onClick={onReset}
                  className="w-5 h-5 rounded-[4px] bg-[#d9383a] hover:bg-red-600 text-white p-0 flex items-center justify-center transition-colors cursor-pointer"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5] block" />
                </button>
              </div>
            </div>

            {/* Green progress bar with uncompleted white portion at the bottom of the inner card */}
            <div className="w-full h-1 bg-white overflow-hidden">
              <div
                className="h-full bg-[#22c55e] transition-all duration-400 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Under Progress Box Step Logs - only appears AFTER the file finishes uploading (logStep >= 1) */}
      <div className="w-full mt-4 flex flex-col gap-2 text-sm font-normal pl-2 min-h-[90px]">
        <AnimatePresence>
          {LOGS.map((log) => {
            const isVisible = logStep >= log.step;
            const isCurrent = logStep === log.step && logStep < 4;
            const isDone = logStep > log.step || (logStep === 4 && log.step === 4);

            if (!isVisible) return null;

            return (
              <motion.div
                key={log.step}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2.5"
              >
                <span
                  className={
                    isCurrent
                      ? 'text-white font-medium'
                      : isDone
                      ? 'text-neutral-400'
                      : 'text-neutral-600'
                  }
                >
                  {log.text}
                </span>
                {isDone ? (
                  <Check className="w-3.5 h-3.5 text-[#22c55e] shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin shrink-0" />
                ) : null}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
