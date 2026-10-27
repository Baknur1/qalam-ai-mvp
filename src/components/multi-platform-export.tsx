'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { MultilingualOutputs, ContentFormat, OutputLanguage } from '@/lib/types';

interface MultiPlatformExportProps {
  outputs: MultilingualOutputs;
  isLoading?: boolean;
  isStreaming?: boolean;
  streamedText?: string;
}

export function MultiPlatformExport({
  outputs,
  isLoading = false,
  isStreaming = false,
  streamedText = ''
}: MultiPlatformExportProps) {
  const [activeFormat, setActiveFormat] = useState<'post' | 'telegram' | 'scenario'>('post');
  const [activeLang, setActiveLang] = useState<OutputLanguage>('en');
  const [copied, setCopied] = useState(false);

  const formatMap: Record<'post' | 'telegram' | 'scenario', ContentFormat> = {
    post: 'web_article',
    telegram: 'telegram_post',
    scenario: 'social_script'
  };

  const currentText = outputs[activeLang]?.[formatMap[activeFormat]] || '';
  const displayedText = isStreaming ? streamedText : currentText;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col w-full mt-10 select-none animate-pulse">
        {/* Title */}
        <h2 className="text-2xl font-normal text-white mb-5 tracking-tight">
          Multi-platform export
        </h2>

        {/* Skeleton Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="w-64 h-10 rounded-full bg-white/[0.05]" />
          <div className="w-36 h-10 rounded-full bg-white/[0.05]" />
        </div>

        {/* Skeleton Box */}
        <div className="rounded-[20px] bg-[#121214] border border-[#2a2a2a] p-6 min-h-[320px] space-y-4">
          <div className="h-5 w-48 rounded bg-white/[0.07]" />
          <div className="h-4 w-full rounded bg-white/[0.04]" />
          <div className="h-4 w-11/12 rounded bg-white/[0.04]" />
          <div className="h-4 w-9/12 rounded bg-white/[0.04]" />
          <div className="h-4 w-10/12 rounded bg-white/[0.04]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full mt-10 select-none">
      {/* Title */}
      <h2 className="text-[28px] font-normal text-white mb-5 tracking-tight">
        Multi-platform export
      </h2>

      {/* Control Bar exactly matching Figma with smooth sliding pill transitions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        {/* Left: Post | Telegram | Scenario */}
        <div className="flex items-center rounded-full bg-[#1e1e1e] border border-[#2e2e2e] p-[3px] relative">
          {(
            [
              { id: 'post', label: 'Post' },
              { id: 'telegram', label: 'Telegram' },
              { id: 'scenario', label: 'Scenario' }
            ] as const
          ).map((item) => (
            <motion.button
              key={item.id}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveFormat(item.id)}
              className="relative px-6 sm:px-7 py-2.5 rounded-full text-sm font-normal cursor-pointer"
            >
              {activeFormat === item.id && (
                <motion.div
                  layoutId="exportFormatIndicator"
                  className="absolute inset-0 rounded-full bg-[#111111] border border-[#2c2c2c]"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span
                className={`relative z-10 transition-colors duration-200 ${
                  activeFormat === item.id
                    ? 'text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {item.label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Right: ENG | KZ | RU */}
        <div className="flex items-center rounded-full bg-[#1e1e1e] border border-[#2e2e2e] p-[3px] relative">
          {(
            [
              { id: 'en', label: 'ENG' },
              { id: 'kz', label: 'KZ' },
              { id: 'ru', label: 'RU' }
            ] as const
          ).map((item) => (
            <motion.button
              key={item.id}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveLang(item.id)}
              className="relative px-5 sm:px-6 py-2.5 rounded-full text-sm font-normal cursor-pointer"
            >
              {activeLang === item.id && (
                <motion.div
                  layoutId="exportLangIndicator"
                  className="absolute inset-0 rounded-full bg-[#111111] border border-[#2c2c2c]"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span
                className={`relative z-10 transition-colors duration-200 ${
                  activeLang === item.id
                    ? 'text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {item.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Finished Export Box designed in the exact same style as Lead Draft */}
      <div className="rounded-[20px] bg-[#121214] border border-[#2a2a2a] flex flex-col min-h-[340px] overflow-hidden">
        {/* Top header row with thin horizontal divider */}
        <div className="h-13 px-6 sm:px-7 border-b border-[#222225] flex items-center justify-between text-sm text-neutral-400">
          <span className="text-sm text-neutral-400 font-normal capitalize">
            {activeFormat} • {activeLang.toUpperCase()}
          </span>

          <button
            type="button"
            onClick={handleCopy}
            className="text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center gap-2 text-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 sm:p-7 flex-1 overflow-y-auto">
          <div className="text-base sm:text-[16px] text-neutral-200 leading-[1.75] space-y-4">
            {displayedText.split('\n\n').map((block, idx) => {
              const trimmed = block.trim();
              if (trimmed.startsWith('## ')) {
                return (
                  <h3 key={idx} className="text-xl sm:text-[22px] font-semibold text-white pt-2 pb-1">
                    {trimmed.replace(/^##\s+/, '')}
                  </h3>
                );
              }
              if (trimmed.startsWith('### ')) {
                return (
                  <h4 key={idx} className="text-base sm:text-lg font-semibold text-neutral-200 pt-2">
                    {trimmed.replace(/^###\s+/, '')}
                  </h4>
                );
              }
              if (trimmed.startsWith('> ')) {
                return (
                  <blockquote key={idx} className="border-l-2 border-neutral-600 pl-4 text-neutral-400 italic my-2 text-[15px] sm:text-base leading-relaxed">
                    {trimmed.replace(/^>\s+/, '').replace(/\*\*(.*?)\*\*/g, '$1')}
                  </blockquote>
                );
              }
              return (
                <p key={idx} className="text-base sm:text-[16px] text-neutral-200 leading-[1.75] whitespace-pre-line">
                  {trimmed.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={pIdx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                  })}
                </p>
              );
            })}

            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-white/80 animate-pulse ml-1 align-middle" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
