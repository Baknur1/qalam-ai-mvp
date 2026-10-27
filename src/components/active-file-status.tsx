'use client';

import React from 'react';
import { FileText, X, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActiveFileStatusProps {
  fileName: string;
  fileSize: string;
  progressPercent: number;
  onReset: () => void;
  activeMode?: 'file' | 'text';
  onModeChange?: (mode: 'file' | 'text') => void;
  logStep?: number; // 0 (uploading) to 4 (ready)
}

export function ActiveFileStatus({
  fileName,
  fileSize,
  progressPercent,
  onReset,
  activeMode = 'file',
  onModeChange,
  logStep = 4
}: ActiveFileStatusProps) {
  const LOGS = [
    { step: 1, text: '...file decryption' },
    { step: 2, text: '...fact checking' },
    { step: 3, text: '...generating a draft post' },
    { step: 4, text: '...generating a post for social networks' }
  ];

  return (
    <div className="w-full max-w-[880px] mx-auto flex flex-col items-center select-none">
      {/* Top Toggle Switch with smooth Framer Motion sliding pill */}
      <div className="w-[300px] h-[44px] rounded-full border border-[#2d2d2d] bg-[#1e1e1e] p-[3px] flex items-center mb-6 relative">
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => onModeChange && onModeChange('file')}
          className="relative flex-1 h-full rounded-full flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          {activeMode === 'file' && (
            <motion.div
              layoutId="activeStatusIndicator"
              className="absolute inset-0 rounded-full bg-[#111111] border border-[#2c2c2c]"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <FileText
            className={`relative z-10 w-4 h-4 transition-colors duration-200 ${
              activeMode === 'file' ? 'text-white' : 'text-neutral-400'
            }`}
          />
          <span
            className={`relative z-10 transition-colors duration-200 ${
              activeMode === 'file' ? 'text-white font-normal' : 'text-neutral-400'
            }`}
          >
            File
          </span>
        </motion.button>

        <div className="w-[1px] h-5 bg-[#3a3a3a] shrink-0 mx-0.5 z-10" />

        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => onModeChange && onModeChange('text')}
          className="relative flex-1 h-full rounded-full flex items-center justify-center text-sm cursor-pointer"
        >
          {activeMode === 'text' && (
            <motion.div
              layoutId="activeStatusIndicator"
              className="absolute inset-0 rounded-full bg-[#111111] border border-[#2c2c2c]"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span
            className={`relative z-10 transition-colors duration-200 ${
              activeMode === 'text' ? 'text-white font-normal' : 'text-neutral-400'
            }`}
          >
            Text
          </span>
        </motion.button>
      </div>

      {/* Outer container matching Figma design */}
      <div className="w-full rounded-[24px] bg-[#191919] p-5 sm:p-6 border border-[#282828]/60">
        {/* Inner Card with file info and progress bar inside */}
        <div className="w-full rounded-[14px] sm:rounded-[16px] bg-[#282828] overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between text-sm text-neutral-300 px-5 sm:px-6 pt-3.5 pb-2.5">
            <span className="font-normal text-white truncate text-sm sm:text-base">
              {fileName}
            </span>

            <div className="flex items-center gap-3.5 shrink-0">
              <span className="text-xs sm:text-sm text-neutral-400">
                {fileSize}
              </span>
              <motion.button
                type="button"
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.08 }}
                onClick={onReset}
                className="w-5.5 h-5.5 rounded-[4px] bg-[#d9383a] hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </motion.button>
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
