'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface HeroUploadProps {
  onProcess: (options: { text?: string; audioFile?: File; useMock?: boolean; mode?: 'file' | 'text' }) => void;
  isProcessing: boolean;
  activeTab?: 'file' | 'text';
  onTabChange?: (tab: 'file' | 'text') => void;
}

export function HeroUpload({
  onProcess,
  isProcessing,
  activeTab = 'file',
  onTabChange
}: HeroUploadProps) {
  const [internalTab, setInternalTab] = useState<'file' | 'text'>('file');
  const [textInput, setTextInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <div className="text-center max-w-2xl mx-auto pt-8 pb-3">
        <h1 className="text-3xl sm:text-5xl font-normal tracking-normal text-white leading-[1.2]">
          From raw audio to<br />
          verified story in<br />
          minutes.
        </h1>
        <p className="mt-5 text-xs sm:text-sm text-neutral-400 font-normal max-w-xl mx-auto leading-relaxed">
          Transcribe bilingual interviews, flag verification risks, and generate publication-ready drafts under full editorial control.
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
            File
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
            Text
          </span>
        </motion.button>
      </div>

      {/* Upload Zone */}
      <div className="w-full max-w-[880px] mt-8">
        {currentTab === 'file' ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="relative w-full rounded-[24px] bg-[#191919] p-10 sm:p-14 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden transition-colors select-none"
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
              Drag and drop an audio file here or click to select.
            </p>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1.5 max-w-md">
              MP3, WAV, and M4A files up to 25 MB are supported (Kazakh/Russian languages).
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
              Choose file
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
                placeholder="Insert raw interview text, audio transcript, or press release here..."
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
                {isProcessing ? 'Processing...' : 'Process text'}
              </motion.button>
            </div>
          </form>
        )}
      </div>

      {/* 4 Feature Cards below the upload box */}
      <div className="w-full max-w-[880px] mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Audio to Text */}
        <div className="rounded-[20px] border border-[#2d2d2d] bg-[#191919] p-5 flex flex-col justify-between min-h-[170px] hover:border-[#444444] transition-all select-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-500">01</span>
            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-normal text-white">Audio to Text</h3>
            <p className="text-xs text-neutral-400 mt-1 leading-snug">
              Билингвальная транскрибация речи (KZ/RU) с таймкодами и разделением спикеров.
            </p>
          </div>
        </div>

        {/* Card 2: Fact Checking */}
        <div className="rounded-[20px] border border-[#2d2d2d] bg-[#191919] p-5 flex flex-col justify-between min-h-[170px] hover:border-[#444444] transition-all select-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-500">02</span>
            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-normal text-white">Fact Checking</h3>
            <p className="text-xs text-neutral-400 mt-1 leading-snug">
              Автоматическая проверка цифр, фактов и цитат с валидацией рисков перед печатью.
            </p>
          </div>
        </div>

        {/* Card 3: Lead Draft */}
        <div className="rounded-[20px] border border-[#2d2d2d] bg-[#191919] p-5 flex flex-col justify-between min-h-[170px] hover:border-[#444444] transition-all select-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-500">03</span>
            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" x2="8" y1="13" y2="13" />
                <line x1="16" x2="8" y1="17" y2="17" />
                <line x1="10" x2="8" y1="9" y2="9" />
              </svg>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-normal text-white">Lead Draft</h3>
            <p className="text-xs text-neutral-400 mt-1 leading-snug">
              Генерация готового журналистского черновика под полным контролем редактора.
            </p>
          </div>
        </div>

        {/* Card 4: Multi-Export */}
        <div className="rounded-[20px] border border-[#2d2d2d] bg-[#191919] p-5 flex flex-col justify-between min-h-[170px] hover:border-[#444444] transition-all select-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-500">04</span>
            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
                <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
              </svg>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-normal text-white">Multi-Export</h3>
            <p className="text-xs text-neutral-400 mt-1 leading-snug">
              Адаптация материала в 1 клик для Telegram, соцсетей и информационных лент.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
