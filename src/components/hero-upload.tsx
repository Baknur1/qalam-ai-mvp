'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, ShieldCheck, FileText, Type, Share2, Video, Music, X, ArrowRight, Maximize2, Minimize2, ArrowUp } from 'lucide-react';
import { OutputLanguage } from '@/lib/types';
import { TRANSLATIONS } from '@/lib/translations';
import { AlertModal } from './alert-modal';
import { extractAudioFromMedia } from '@/lib/audio-extractor';

interface HeroUploadProps {
  onProcess: (options: {
    text?: string;
    audioFile?: File;
    uploadId?: string;
    useMock?: boolean;
    mode?: 'file' | 'text';
  }) => void;
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
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState<'idle' | 'extracting' | 'uploading' | 'ready' | 'error'>('idle');
  const [preUploadedId, setPreUploadedId] = useState<string | null>(null);
  const preUploadPromiseRef = useRef<Promise<string | null> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [modalAlert, setModalAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    hint?: string;
    type?: 'warning' | 'error' | 'info';
    confirmText?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[currentLang]?.hero || TRANSLATIONS.ru.hero;
  const alerts = TRANSLATIONS[currentLang]?.alerts || TRANSLATIONS.ru.alerts;

  const textLabels = {
    ru: {
      expand: 'Развернуть',
      collapse: 'Свернуть',
      toTop: 'В начало',
      words: 'слов',
      chars: 'симв.'
    },
    kz: {
      expand: 'Жаю',
      collapse: 'Жию',
      toTop: 'Басына',
      words: 'сөз',
      chars: 'таңба'
    },
    en: {
      expand: 'Expand',
      collapse: 'Collapse',
      toTop: 'To top',
      words: 'words',
      chars: 'chars'
    }
  }[currentLang] || {
    expand: 'Развернуть',
    collapse: 'Свернуть',
    toTop: 'В начало',
    words: 'слов',
    chars: 'симв.'
  };

  const currentTab = onTabChange ? activeTab : internalTab;
  const setTab = (tab: 'file' | 'text') => {
    if (onTabChange) onTabChange(tab);
    else setInternalTab(tab);
  };

  const handleFile = (file: File) => {
    const validExtensions = ['.mp3', '.wav', '.m4a', '.mp4', '.aac', '.ogg', '.mov', '.webm'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setModalAlert({
        isOpen: true,
        type: 'warning',
        title: alerts.unsupportedFormatTitle,
        message: alerts.unsupportedFormatMsg(file.name),
        hint: alerts.unsupportedFormatHint,
        confirmText: alerts.understoodBtn
      });
      return;
    }

    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
    if (file.size > MAX_FILE_SIZE) {
      setModalAlert({
        isOpen: true,
        type: 'warning',
        title: alerts.sizeLimitTitle,
        message: alerts.sizeLimitMsg(file.name, (file.size / (1024 * 1024)).toFixed(1)),
        hint: alerts.sizeLimitHint,
        confirmText: alerts.goodBtn
      });
      return;
    }

    // Set file and immediately begin background pre-upload
    setSelectedFile(file);
    setPreUploadedId(null);
    setUploadProgress(10);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(file.name);
    setUploadState(isVideo ? 'extracting' : 'uploading');

    const uploadPromise = (async () => {
      try {
        let fileToUpload = file;
        if (isVideo) {
          setUploadProgress(20);
          fileToUpload = await extractAudioFromMedia(file, (stage) => {
            if (stage === 'decoding') setUploadProgress(25);
            if (stage === 'encoding') setUploadProgress(40);
          });
        }

        if (abortCtrl.signal.aborted) return null;

        setUploadState('uploading');
        setUploadProgress(50);

        const formData = new FormData();
        formData.append('file', fileToUpload);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          signal: abortCtrl.signal
        });

        if (!res.ok) {
          throw new Error('Upload failed');
        }

        const data = await res.json();
        if (data.uploadId) {
          setPreUploadedId(data.uploadId);
          setUploadState('ready');
          setUploadProgress(100);
          return data.uploadId as string;
        }
        return null;
      } catch (err: unknown) {
        if (abortCtrl.signal.aborted) return null;
        console.warn('[Pre-Upload] Background upload failed or skipped, will fallback on submit:', err);
        setUploadState('ready');
        setUploadProgress(100);
        return null;
      }
    })();

    preUploadPromiseRef.current = uploadPromise;
  };

  const handleConfirmFileSubmit = async () => {
    if (!selectedFile) return;

    let uploadId = preUploadedId;
    if (!uploadId && preUploadPromiseRef.current) {
      try {
        uploadId = await preUploadPromiseRef.current;
      } catch {
        uploadId = null;
      }
    }

    onProcess({
      audioFile: selectedFile,
      uploadId: uploadId || undefined,
      mode: 'file',
      useMock: false
    });
  };

  const handleClearSelectedFile = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setSelectedFile(null);
    setPreUploadedId(null);
    setUploadState('idle');
    setUploadProgress(0);
    preUploadPromiseRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    const textToSubmit = textInput.trim();
    if (!textToSubmit) {
      // Default sample if empty
      const sampleText = t.sampleText;
      onProcess({ text: sampleText, mode: 'text', useMock: false });
      return;
    }
    onProcess({ text: textToSubmit, mode: 'text', useMock: false });
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hero Title matching Figma exact line breaks and typography */}
      <div className="text-center max-w-4xl mx-auto pt-2 sm:pt-3 pb-2">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-normal text-white leading-[1.25]">
          <span className="block sm:whitespace-nowrap">{t.titleLine1}</span>
          <span className="block sm:whitespace-nowrap">{t.titleLine2}</span>
          <span className="block sm:whitespace-nowrap">{t.titleLine3}</span>
        </h1>
        <p className="mt-4 text-xs sm:text-sm text-neutral-400 font-normal max-w-xl mx-auto leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {/* Segmented control: File / Text perfectly centered & symmetrical */}
      <div className="mt-6 flex items-center justify-center select-none relative">
        <button
          type="button"
          onClick={() => setTab('file')}
          className="relative w-[112px] sm:w-[122px] h-[38px] rounded-full flex items-center justify-center gap-2 text-[15px] cursor-pointer"
        >
          {currentTab === 'file' && (
            <motion.div
              layoutId="heroTabIndicator"
              className="absolute inset-0 rounded-full bg-[#111111] border border-[#2c2c2c]"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <FileText
            className={`relative z-10 w-4 h-4 -translate-y-[1.5px] transition-colors duration-200 ${currentTab === 'file' ? 'text-white' : 'text-neutral-400'
              }`}
          />
          <span
            className={`relative z-10 transition-colors duration-200 ${currentTab === 'file' ? 'text-white font-normal' : 'text-neutral-400 hover:text-white'
              }`}
          >
            {t.tabFile}
          </span>
        </button>

        <div className="w-[1px] h-[30px] bg-[#3a3a3a] shrink-0 mx-1.5 z-10" />

        <button
          type="button"
          onClick={() => setTab('text')}
          className="relative w-[112px] sm:w-[122px] h-[38px] rounded-full flex items-center justify-center gap-2 text-[15px] cursor-pointer"
        >
          {currentTab === 'text' && (
            <motion.div
              layoutId="heroTabIndicator"
              className="absolute inset-0 rounded-full bg-[#111111] border border-[#2c2c2c]"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <Type
            className={`relative z-10 w-4 h-4 -translate-y-[1.5px] transition-colors duration-200 ${currentTab === 'text' ? 'text-white' : 'text-neutral-400'
              }`}
          />
          <span
            className={`relative z-10 transition-colors duration-200 ${currentTab === 'text' ? 'text-white font-normal' : 'text-neutral-400 hover:text-white'
              }`}
          >
            {t.tabText}
          </span>
        </button>
      </div>

      {/* Upload Zone (max-w-[620px] for file, spacious max-w-[880px]/[960px] for text with sleeker 16px radius) */}
      <div className={`w-full transition-all duration-300 mt-6 ${currentTab === 'text' ? (isTextExpanded ? 'max-w-[960px]' : 'max-w-[880px]') : 'max-w-[620px]'}`}>
        {currentTab === 'file' ? (
          selectedFile ? (
            <div className="w-full rounded-[16px] bg-[#191919] p-4.5 sm:p-5 border border-[#282828]/60 select-none">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
                accept=".mp3,.wav,.m4a,.mp4,.mov,.webm,video/mp4,video/quicktime,video/webm,audio/*"
                className="hidden"
              />

              {/* Inner Card matching Figma design with dynamic status and progress */}
              <div className="w-full rounded-[10px] sm:rounded-[12px] bg-[#282828] overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between text-sm text-neutral-300 px-5 sm:px-6 py-3 sm:py-3.5">
                  <div className="flex items-center gap-2.5 min-w-0 pr-4">
                    {selectedFile.name.toLowerCase().match(/\.(mp4|mov|webm)$/) ? (
                      <Video className="w-4 h-4 text-neutral-300 shrink-0" />
                    ) : (
                      <Music className="w-4 h-4 text-neutral-300 shrink-0" />
                    )}
                    <span className="font-normal text-white truncate text-sm sm:text-base">
                      {selectedFile.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5 shrink-0">
                    {uploadState === 'extracting' && (
                      <span className="text-xs text-amber-400">
                        {t.extractingAudio || 'Извлечение аудио...'}
                      </span>
                    )}
                    {uploadState === 'uploading' && (
                      <span className="text-xs text-neutral-400">
                        {t.uploadingFile || 'Загрузка...'}
                      </span>
                    )}
                    {uploadState === 'ready' && (
                      <span className="text-xs text-emerald-400">
                        {t.readyToProcess}
                      </span>
                    )}
                    <span className="text-xs sm:text-sm text-neutral-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(1)} mb
                    </span>
                    <button
                      type="button"
                      onClick={handleClearSelectedFile}
                      className="w-5 h-5 rounded-[4px] bg-[#d9383a] hover:bg-red-600 text-white p-0 flex items-center justify-center transition-colors cursor-pointer"
                      title={t.changeFile}
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5] block" />
                    </button>
                  </div>
                </div>

                {/* Dynamic upload progress bar */}
                <div className="w-full h-1 bg-[#1e1e1e] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${uploadState === 'ready'
                      ? 'bg-[#22c55e]'
                      : uploadState === 'extracting'
                        ? 'bg-amber-400'
                        : 'bg-[#22c55e]/80 animate-pulse'
                      }`}
                    style={{ width: `${Math.max(8, uploadProgress)}%` }}
                  />
                </div>
              </div>

              {/* Action button centered without redundant duplicate button */}
              <div className="mt-5 flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleConfirmFileSubmit}
                  disabled={isProcessing}
                  className="h-[42px] px-8 rounded-full bg-white text-black text-xs sm:text-sm font-normal hover:bg-neutral-200 transition-colors cursor-pointer flex items-center gap-2 shadow-lg shadow-white/10 disabled:opacity-50"
                >
                  <span>{isProcessing ? t.processing : t.processFile}</span>
                  {!isProcessing && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full rounded-[16px] bg-[#191919] p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden transition-colors select-none"
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
                  rx="14.5"
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
                accept=".mp3,.wav,.m4a,.mp4,.mov,.webm,video/mp4,video/quicktime,video/webm,audio/*"
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
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-6 rounded-full bg-white text-black text-xs sm:text-sm font-normal px-7 py-2.5 hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                {t.chooseFile}
              </button>
            </div>
          )
        ) : (
          <form
            onSubmit={handleTextSubmit}
            className="w-full flex flex-col"
          >
            {/* Single clean textarea card without nested rear container */}
            <div className="w-full rounded-[16px] bg-[#191919] border border-[#282828] p-4 sm:p-5 transition-colors focus-within:border-neutral-500 flex flex-col">
              {/* Header toolbar for text controls */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#282828] text-xs text-neutral-400 select-none">
                <span className="text-[12px] text-neutral-400 font-normal">
                  {textInput.trim()
                    ? `${textInput.trim().split(/\s+/).filter(Boolean).length} ${textLabels.words} • ${textInput.length} ${textLabels.chars}`
                    : t.tabText}
                </span>

                <div className="flex items-center gap-1.5">
                  {textInput.length > 60 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (textareaRef.current) {
                          textareaRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors cursor-pointer text-[11.5px]"
                      title="Прокрутить к первым предложениям"
                    >
                      <ArrowUp className="w-3 h-3 -translate-y-[0.5px]" />
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
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 hover:text-white transition-colors cursor-pointer text-[11.5px]"
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
                </div>
              </div>

              <textarea
                ref={textareaRef}
                rows={isTextExpanded ? 16 : 5}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={t.textPlaceholder}
                className={`w-full bg-transparent border-0 outline-none resize-none text-sm text-neutral-200 placeholder:text-neutral-500 leading-relaxed font-sans transition-[min-height] duration-200 ${
                  isTextExpanded ? 'min-h-[380px] max-h-[540px]' : 'min-h-[130px] max-h-[200px]'
                }`}
              />
            </div>

            {/* Action button pulled outside below the container */}
            <div className="mt-4 flex items-center justify-end">
              <button
                type="submit"
                disabled={isProcessing}
                className="rounded-full bg-white text-black text-xs sm:text-sm font-normal px-8 py-2.5 hover:bg-neutral-200 transition-colors cursor-pointer shadow-lg shadow-white/5 disabled:opacity-50"
              >
                {isProcessing ? t.processing : t.processText}
              </button>
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

      {/* Custom Alert Modal */}
      {modalAlert && (
        <AlertModal
          isOpen={modalAlert.isOpen}
          onClose={() => setModalAlert(null)}
          title={modalAlert.title}
          message={modalAlert.message}
          hint={modalAlert.hint}
          hintPrefix={alerts.hintPrefix}
          type={modalAlert.type}
          confirmText={modalAlert.confirmText}
        />
      )}
    </div>
  );
}
