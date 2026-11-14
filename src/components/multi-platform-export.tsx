'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  MultilingualOutputs,
  ContentFormat,
  OutputLanguage,
  FactCheckItem,
  FactStatus
} from '@/lib/types';
import { TRANSLATIONS } from '@/lib/translations';

interface MultiPlatformExportProps {
  outputs: MultilingualOutputs;
  isLoading?: boolean;
  isStreaming?: boolean;
  streamedText?: string;
  facts?: FactCheckItem[];
  decisions?: Record<string, FactStatus>;
  onSelectFact?: (factId: string) => void;
  currentLang?: OutputLanguage;
}

function normalizeTelegramMarkdown(text: string): string {
  if (!text) return '';
  const lines = text.split('\n');
  const normalized = lines.map((line, idx) => {
    let l = line.trimEnd();
    // 1. Hook line: Emoji Title -> Emoji **Title**
    if (idx === 0 && !l.includes('**')) {
      const emojiMatch = l.match(/^(\p{Extended_Pictographic}|\uFE0F|\u200D|\u26A1|\u2728)+\s*(.+)$/u);
      if (emojiMatch) {
        return `${emojiMatch[1]} **${emojiMatch[2].trim()}**`;
      }
    }
    // 2. Bullet lines with label: • Label: text -> • **Label:** text
    const bulletMatch = l.match(/^([•\-*]\s+)([^:\n]{2,40}:)(\s+)(.*)$/);
    if (bulletMatch && !bulletMatch[2].includes('**')) {
      return `${bulletMatch[1]}**${bulletMatch[2]}**${bulletMatch[3]}${bulletMatch[4]}`;
    }
    return l;
  });
  return normalized.join('\n');
}

function normalizeScenarioSpacing(text: string): string {
  if (!text) return '';
  let str = text;
  // 1. If timestamp line like [00:00... is preceded by a single newline, convert to double newline
  str = str.replace(/([^\n])\r?\n(\[|\b\d{1,2}:\d{2})/g, '$1\n\n$2');
  str = str.replace(/([^\n])\r?\n(\[[0-9A-ZА-ЯЁ\s|:\-—–]+\])/g, '$1\n\n$2');
  // 2. Clean up excessive newlines
  str = str.replace(/\n{3,}/g, '\n\n');
  return str;
}

function formatInline(text: string): string {
  let str = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  str = str.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  str = str.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<i>$1</i>');
  str = str.replace(/`([^`]+)`/g, '<code>$1</code>');
  str = str.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return str;
}

function markdownToClipboardHtml(md: string, isTelegram: boolean): string {
  if (!md) return '';
  const text = isTelegram ? normalizeTelegramMarkdown(md) : normalizeScenarioSpacing(md);
  const blocks = text.split(/\n\n+/);

  const htmlBlocks = blocks.map((block) => {
    let trimmed = block.trim();
    if (!trimmed) return '';

    if (trimmed.startsWith('> ') || trimmed.startsWith('>')) {
      const quoteLines = trimmed
        .split('\n')
        .map((line) => line.replace(/^>\s*/, ''))
        .map((line) => formatInline(line))
        .join('<br>');
      return `<blockquote>${quoteLines}</blockquote>`;
    }

    if (/^#{1,4}\s+/.test(trimmed)) {
      const headingText = trimmed.replace(/^#{1,4}\s+/, '');
      return `<p><b>${formatInline(headingText)}</b></p>`;
    }

    const lines = trimmed.split('\n').map((line) => formatInline(line));
    return `<p>${lines.join('<br>')}</p>`;
  });

  return htmlBlocks.filter(Boolean).join('');
}

export function MultiPlatformExport({
  outputs,
  isLoading = false,
  isStreaming = false,
  streamedText = '',
  currentLang = 'ru'
}: MultiPlatformExportProps) {
  const [activeFormat, setActiveFormat] = useState<'post' | 'telegram' | 'scenario'>('post');
  const [selectedLang, setSelectedLang] = useState<OutputLanguage | null>(null);
  const [prevCurrentLang, setPrevCurrentLang] = useState(currentLang);
  const [copiedFormat, setCopiedFormat] = useState<'post' | 'telegram' | 'scenario' | null>(null);

  if (prevCurrentLang !== currentLang) {
    setPrevCurrentLang(currentLang);
    setSelectedLang(null);
  }

  const activeLang = selectedLang ?? currentLang;
  const setActiveLang = (lang: OutputLanguage) => setSelectedLang(lang);

  const t = TRANSLATIONS[currentLang]?.exportSection || TRANSLATIONS.ru.exportSection;

  const articleText = isStreaming
    ? streamedText
    : outputs[activeLang]?.web_article || '';
  const telegramText = normalizeTelegramMarkdown(outputs[activeLang]?.telegram_post || '');
  const scenarioText = normalizeScenarioSpacing(outputs[activeLang]?.social_script || '');

  const formatLabels: Record<'post' | 'telegram' | 'scenario', string> = {
    post: t.tabPost,
    telegram: t.tabTelegram,
    scenario: t.tabScenario
  };

  const handleCopy = async (format: 'post' | 'telegram' | 'scenario', textToCopy: string) => {
    const isTelegram = format === 'telegram';
    const isScenario = format === 'scenario';
    const plainText = isTelegram
      ? normalizeTelegramMarkdown(textToCopy)
      : isScenario
      ? normalizeScenarioSpacing(textToCopy)
      : textToCopy;
    const htmlText = markdownToClipboardHtml(textToCopy, isTelegram);

    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
        const textBlob = new Blob([plainText], { type: 'text/plain' });
        const htmlBlob = new Blob([htmlText], { type: 'text/html' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': textBlob,
            'text/html': htmlBlob
          })
        ]);
      } else {
        await navigator.clipboard.writeText(plainText);
      }
    } catch {
      await navigator.clipboard.writeText(plainText).catch(() => {});
    }

    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const renderContentBlocks = (text: string, streaming: boolean = false) => {
    if (!text && !streaming) {
      return (
        <p className="text-sm text-neutral-500 italic">
          {activeLang === 'ru' ? 'Контент формируется...' : 'Content generating...'}
        </p>
      );
    }

    const processedText = normalizeScenarioSpacing(text);

    return (
      <div className="text-sm sm:text-[15px] text-neutral-200 leading-[1.7] space-y-4 sm:space-y-4.5">
        {processedText.split(/\n\n+/).map((block, idx) => {
          const trimmed = block.trim();
          if (!trimmed) return null;

          if (trimmed.startsWith('## ')) {
            return (
              <h3
                key={idx}
                className="text-lg sm:text-[20px] font-semibold text-white pt-2 pb-0.5 tracking-tight"
              >
                {trimmed.replace(/^##\s+/, '')}
              </h3>
            );
          }
          if (trimmed.startsWith('### ')) {
            return (
              <h4
                key={idx}
                className="text-base font-semibold text-neutral-200 pt-1.5"
              >
                {trimmed.replace(/^###\s+/, '')}
              </h4>
            );
          }
          if (trimmed.startsWith('> ') || trimmed.startsWith('>')) {
            return (
              <blockquote
                key={idx}
                className="border-l-2 border-neutral-600 pl-3.5 text-neutral-400 italic my-2 text-[14px] sm:text-[14.5px] leading-relaxed"
              >
                {trimmed.replace(/^>\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1')}
              </blockquote>
            );
          }

          return (
            <p
              key={idx}
              className="text-sm sm:text-[15px] text-neutral-200 leading-[1.7] whitespace-pre-line"
            >
              {trimmed.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={pIdx} className="font-semibold text-white">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return part;
              })}
            </p>
          );
        })}

        {streaming && (
          <span className="inline-block w-2 h-4 bg-white/80 animate-pulse ml-1 align-middle" />
        )}
      </div>
    );
  };

  const renderCard = (
    format: 'post' | 'telegram' | 'scenario',
    content: string,
    streaming: boolean = false,
    cardClasses: string = 'min-h-[340px]'
  ) => {
    const isCopied = copiedFormat === format;
    return (
      <div
        className={`rounded-[20px] bg-[#121214] border border-[#2a2a2a] flex flex-col overflow-hidden transition-all duration-200 ${cardClasses}`}
      >
        {/* Header bar */}
        <div className="py-3.5 sm:py-4 px-5 sm:px-6 border-b border-[#222225] flex items-center justify-between text-sm text-neutral-400 bg-[#141416]">
          <span className="text-sm font-medium text-neutral-300">
            {formatLabels[format]}
          </span>

          <button
            type="button"
            onClick={() => handleCopy(format, content)}
            className="text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs sm:text-[13px] px-2.5 py-1 rounded-md hover:bg-white/[0.05]"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">{t.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{t.copy}</span>
              </>
            )}
          </button>
        </div>

        {/* Scrollable body */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800">
          {renderContentBlocks(content, streaming)}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col w-full mt-10 select-none animate-pulse">
        {/* Title */}
        <h2 className="text-2xl font-normal text-white mb-5 tracking-tight">
          {t.title}
        </h2>

        {/* Skeleton Box */}
        <div className="hidden lg:flex gap-5 sm:gap-6 items-start w-full">
          <div className="w-[60%] rounded-[20px] bg-[#121214] border border-[#2a2a2a] p-6 min-h-[640px]" />
          <div className="w-[40%] flex flex-col gap-5">
            <div className="rounded-[20px] bg-[#121214] border border-[#2a2a2a] p-5 h-[310px]" />
            <div className="rounded-[20px] bg-[#121214] border border-[#2a2a2a] p-5 h-[310px]" />
          </div>
        </div>
        <div className="lg:hidden rounded-[20px] bg-[#121214] border border-[#2a2a2a] p-6 min-h-[400px]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full mt-10 select-none">
      {/* Title & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <h2 className="text-[28px] font-normal text-white tracking-tight">
          {t.title}
        </h2>

        <div className="flex items-center gap-3">
          {/* Mobile Format Selector Tabs (Visible only on mobile for switching formats) */}
          <div className="flex lg:hidden items-center rounded-full bg-[#1e1e1e] border border-[#2e2e2e] p-[3px] relative">
            {(
              [
                { id: 'post', label: formatLabels.post },
                { id: 'telegram', label: formatLabels.telegram },
                { id: 'scenario', label: formatLabels.scenario }
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveFormat(item.id)}
                className="relative px-3.5 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-normal cursor-pointer"
              >
                {activeFormat === item.id && (
                  <motion.div
                    layoutId="mobileExportFormatIndicator"
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
              </button>
            ))}
          </div>

          {/* Language Switcher: ENG | KZ | RU (Available on both desktop & mobile) */}
          <div className="flex items-center rounded-full bg-[#1e1e1e] border border-[#2e2e2e] p-[3px] relative">
            {(
              [
                { id: 'en', label: 'ENG' },
                { id: 'kz', label: 'KZ' },
                { id: 'ru', label: 'RU' }
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveLang(item.id)}
                className="relative px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-normal cursor-pointer"
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
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop 60/40 Split Layout (Both sides visible simultaneously) */}
      <div className="hidden lg:flex gap-5 sm:gap-6 items-stretch w-full">
        {/* Left Column: 60% Web Article */}
        <div className="w-[60%] shrink-0 flex flex-col">
          {renderCard('post', articleText, isStreaming, 'h-full min-h-[680px] max-h-[960px]')}
        </div>

        {/* Right Column: 40% Telegram (top) + Scenario (bottom) */}
        <div className="w-[40%] flex-1 flex flex-col gap-5 sm:gap-6">
          {/* Top: Telegram Post */}
          {renderCard('telegram', telegramText, false, 'flex-1 min-h-[320px] max-h-[468px]')}

          {/* Bottom: 1-minute Script */}
          {renderCard('scenario', scenarioText, false, 'flex-1 min-h-[320px] max-h-[468px]')}
        </div>
      </div>

      {/* Mobile Single Tab View (Clean full-width card with selector on mobile) */}
      <div className="flex lg:hidden flex-col w-full">
        {activeFormat === 'post' && renderCard('post', articleText, isStreaming, 'min-h-[420px] max-h-[700px]')}
        {activeFormat === 'telegram' && renderCard('telegram', telegramText, false, 'min-h-[420px] max-h-[700px]')}
        {activeFormat === 'scenario' && renderCard('scenario', scenarioText, false, 'min-h-[420px] max-h-[700px]')}
      </div>
    </div>
  );
}
