'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, ShieldCheck, FileText, Share2 } from 'lucide-react';
import { OutputLanguage } from '@/lib/types';
import { TRANSLATIONS } from '@/lib/translations';

interface HeroUploadProps {
  onProcess: (options: { text?: string; audioFile?: File; useMock?: boolean; mode?: 'file' | 'text' }) => void;
  isProcessing: boolean;
  activeTab?: 'file' | 'text';
  onTabChange?: (tab: 'file' | 'text') => void;
  currentLang?: OutputLanguage;
}

export function HeroUpload({
  onProcess,
  isProcessing,
  activeTab = 'file',
  onTabChange,
  currentLang = 'ru'
}: HeroUploadProps) {
  const [internalTab, setInternalTab] = useState<'file' | 'text'>('file');
  const [textInput, setTextInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[currentLang]?.hero || TRANSLATIONS.ru.hero;

  const currentTab = onTabChange ? activeTab : internalTab;
  const setTab = (tab: 'file' | 'text') => {
    if (onTabChange) onTabChange(tab);
    else setInternalTab(tab);
  };

  const handleFile = (file: File) => {
    const validExtensions = ['.mp3', '.wav', '.m4a', '.mp4'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      alert('Supported audio formats: MP3, WAV, M4A, MP4');
      return;
    }
    onProcess({ audioFile: file, mode: 'file' });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const textToSubmit =
      textInput.trim() ||
      'At a central press briefing in Astana, government officials unveiled new funding initiatives aimed at sustaining independent local journalism. The pilot program provides direct grant aid of 500 million tenge to small digital newsrooms.';
    onProcess({ text: textToSubmit, mode: 'text', useMock: true });
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hero Title matching Figma exact line breaks and typography */}
      <div className="text-center max-w-4xl mx-auto pt-8 pb-3">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-normal text-white leading-[1.25]">
          <span className="block sm:whitespace-nowrap">{t.titleLine1}</span>
          <span className="block sm:whitespace-nowrap">{t.titleLine2}</span>
          <span className="block sm:whitespace-nowrap">{t.titleLine3}</span>
        </h1>
        <p className="mt-5 text-xs sm:text-sm text-neutral-400 font-normal max-w-xl mx-auto leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {/* Segmented control: File / Text with smooth sliding pill transition */}
      <div className="mt-8 w-[290px] sm:w-[310px] h-[44px] rounded-full border border-[#2d2d2d] bg-[#1e1e1e] p-[3px] flex items-center select-none relative">
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => setTab('file')}
          className="relative flex-1 h-full rounded-full flex items-center justify-center text-[15px] cursor-pointer"
        >
          {currentTab === 'file' && (
            <motion.div
              layoutId="heroTabIndicator"
              className="absolute inset-0 rounded-full bg-[#111111] border border-[#2c2c2c]"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span
            className={`relative z-10 transition-colors duration-200 ${
              currentTab === 'file' ? 'text-white font-normal' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {t.tabFile}
          </span>
        </motion.button>

        <div className="w-[1px] h-5 bg-[#3a3a3a] shrink-0 mx-0.5 z-10" />

        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => setTab('text')}
          className="relative flex-1 h-full rounded-full flex items-center justify-center text-[15px] cursor-pointer"
        >
          {currentTab === 'text' && (
            <motion.div
              layoutId="heroTabIndicator"
              className="absolute inset-0 rounded-full bg-[#111111] border border-[#2c2c2c]"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span
            className={`relative z-10 transition-colors duration-200 ${
              currentTab === 'text' ? 'text-white font-normal' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {t.tabText}
          </span>
        </motion.button>
      </div>

      {/* Upload Zone (reduced by 10% from 880px to 792px) */}
      <div className="w-full max-w-[792px] mt-8">
        {currentTab === 'file' ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="relative w-full rounded-[24px] bg-[#191919] p-9 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden transition-colors select-none"
          >
            {/* Custom SVG dashed border for long prominent dashes matching Figma */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="1.5"
                y="1.5"
                width="calc(100% - 3px)"
                height="calc(100% - 3px)"
                rx="22.5"
                fill="none"
                stroke="#9e9e9e"
                strokeWidth="1.5"
                strokeDasharray="14 10"
                className={isDragging ? 'stroke-white' : 'stroke-[#9e9e9e]'}
              />
            </svg>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
              accept=".mp3,.wav,.m4a,.mp4"
              className="hidden"
            />

            {/* Down arrow icon inside upload box */}
            <div className="mb-4 text-white">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
                <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
              </svg>
            </div>

            <p className="text-sm sm:text-base font-normal text-neutral-300">
              {t.dropPrompt}
            </p>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1.5 max-w-md">
              {t.dropFormats}
            </p>

            {/* Choose file pill button */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="mt-6 rounded-full bg-white text-black text-xs sm:text-sm font-normal px-7 py-2.5 hover:bg-neutral-200 transition-all cursor-pointer"
            >
              {t.chooseFile}
            </motion.button>
          </div>
        ) : (
          <form
            onSubmit={handleTextSubmit}
            className="w-full rounded-[24px] bg-[#191919] p-4 sm:p-5 flex flex-col border border-[#282828]/60 transition-all"
          >
            {/* Inner text box with compact padding and matching Figma placeholder */}
            <div className="w-full rounded-[16px] bg-[#111111] border border-[#2f2f2f] p-4 sm:p-5 transition-colors focus-within:border-neutral-500">
              <textarea
                rows={4}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={t.textPlaceholder}
                className="w-full bg-transparent border-0 outline-none resize-none text-sm text-neutral-200 placeholder:text-neutral-500 leading-relaxed font-sans min-h-[110px]"
              />
            </div>

            {/* Compact action row: Process text with animated click */}
            <div className="flex items-center justify-end pt-3">
              <motion.button
                type="submit"
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.02 }}
                disabled={isProcessing}
                className="rounded-full bg-white text-black text-xs sm:text-sm font-normal px-7 py-2.5 hover:bg-neutral-200 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? t.processing : t.processText}
              </motion.button>
            </div>
          </form>
        )}
      </div>

      {/* 4 Feature Cards below the upload box (Wide horizontal cards, strictly original #191919 background, watermark icons) */}
      <div className="w-full max-w-[1520px] mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4.5">
        {/* Card 1: Audio to Text */}
        <div className="relative overflow-hidden rounded-[20px] border border-[#2d2d2d] bg-[#191919] hover:border-[#444444] p-5 sm:px-6 sm:py-5.5 flex flex-col justify-between min-h-[140px] sm:min-h-[148px] transition-all duration-200 select-none group">
          {/* Large background watermark icon */}
          <div className="absolute -bottom-2.5 -right-2 pointer-events-none select-none text-white/[0.04] group-hover:text-white/[0.07] transition-all duration-300 group-hover:scale-105">
            <Mic className="w-24 h-24 sm:w-28 sm:h-28 stroke-[1.2]" />
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full pr-4 sm:pr-6">
            <div>
              <h3 className="text-base sm:text-[17.5px] font-medium text-white tracking-tight">
                {t.feature1Title}
              </h3>
              <p className="text-xs sm:text-[13px] text-neutral-400 mt-2 leading-relaxed">
                {t.feature1Desc}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Fact Checking */}
        <div className="relative overflow-hidden rounded-[20px] border border-[#2d2d2d] bg-[#191919] hover:border-[#444444] p-5 sm:px-6 sm:py-5.5 flex flex-col justify-between min-h-[140px] sm:min-h-[148px] transition-all duration-200 select-none group">
          {/* Large background watermark icon */}
          <div className="absolute -bottom-2.5 -right-2 pointer-events-none select-none text-white/[0.04] group-hover:text-white/[0.07] transition-all duration-300 group-hover:scale-105">
            <ShieldCheck className="w-24 h-24 sm:w-28 sm:h-28 stroke-[1.2]" />
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full pr-4 sm:pr-6">
            <div>
              <h3 className="text-base sm:text-[17.5px] font-medium text-white tracking-tight">
                {t.feature2Title}
              </h3>
              <p className="text-xs sm:text-[13px] text-neutral-400 mt-2 leading-relaxed">
                {t.feature2Desc}
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Lead Draft */}
        <div className="relative overflow-hidden rounded-[20px] border border-[#2d2d2d] bg-[#191919] hover:border-[#444444] p-5 sm:px-6 sm:py-5.5 flex flex-col justify-between min-h-[140px] sm:min-h-[148px] transition-all duration-200 select-none group">
          {/* Large background watermark icon */}
          <div className="absolute -bottom-2.5 -right-2 pointer-events-none select-none text-white/[0.04] group-hover:text-white/[0.07] transition-all duration-300 group-hover:scale-105">
            <FileText className="w-24 h-24 sm:w-28 sm:h-28 stroke-[1.2]" />
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full pr-4 sm:pr-6">
            <div>
              <h3 className="text-base sm:text-[17.5px] font-medium text-white tracking-tight">
                {t.feature3Title}
              </h3>
              <p className="text-xs sm:text-[13px] text-neutral-400 mt-2 leading-relaxed">
                {t.feature3Desc}
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Multi-Export */}
        <div className="relative overflow-hidden rounded-[20px] border border-[#2d2d2d] bg-[#191919] hover:border-[#444444] p-5 sm:px-6 sm:py-5.5 flex flex-col justify-between min-h-[140px] sm:min-h-[148px] transition-all duration-200 select-none group">
          {/* Large background watermark icon */}
          <div className="absolute -bottom-2.5 -right-2 pointer-events-none select-none text-white/[0.04] group-hover:text-white/[0.07] transition-all duration-300 group-hover:scale-105">
            <Share2 className="w-24 h-24 sm:w-28 sm:h-28 stroke-[1.2]" />
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full pr-4 sm:pr-6">
            <div>
              <h3 className="text-base sm:text-[17.5px] font-medium text-white tracking-tight">
                {t.feature4Title}
              </h3>
              <p className="text-xs sm:text-[13px] text-neutral-400 mt-2 leading-relaxed">
                {t.feature4Desc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
