'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Send, Video, Newspaper, Sparkles, Eye } from 'lucide-react';
import { MultilingualOutputs, ContentFormat, OutputLanguage } from '@/lib/types';
import { SmoothTabs } from './ui/smooth-tabs';
import { CopyButton } from './ui/copy-button';
import { cn } from '@/lib/utils';

interface OneToManyOutputProps {
  outputs: MultilingualOutputs;
  className?: string;
}

export function OneToManyOutput({ outputs, className }: OneToManyOutputProps) {
  const [activeFormat, setActiveFormat] = useState<ContentFormat>('web_article');
  const [activeLang, setActiveLang] = useState<OutputLanguage>('ru');

  const formatTabs = [
    {
      id: 'web_article' as ContentFormat,
      label: 'Веб-статья (CMS)',
      icon: <Newspaper className="w-4 h-4" />
    },
    {
      id: 'telegram_post' as ContentFormat,
      label: 'Telegram-канал',
      icon: <Send className="w-4 h-4" />
    },
    {
      id: 'social_script' as ContentFormat,
      label: 'Instagram / Reels',
      icon: <Video className="w-4 h-4" />
    }
  ];

  const langTabs = [
    { id: 'ru' as OutputLanguage, label: 'Русский (RU)' },
    { id: 'kz' as OutputLanguage, label: 'Қазақша (KZ)' }
  ];

  const currentContent = outputs[activeLang][activeFormat];

  return (
    <div className={cn('p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-sm', className)}>
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-purple-500/20 text-purple-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              3. Мультиплатформенный экспорт (One-Source-to-Many)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Автоматическая мультиязычная адаптация одного инфоповода под целевые каналы редакции
          </p>
        </div>

        {/* Language switch */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-400" />
          <SmoothTabs
            tabs={langTabs}
            activeTab={activeLang}
            onChange={(id) => setActiveLang(id)}
            size="sm"
          />
        </div>
      </div>

      {/* Format Switcher and Copy Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <SmoothTabs
          tabs={formatTabs}
          activeTab={activeFormat}
          onChange={(id) => setActiveFormat(id)}
          size="md"
        />

        <CopyButton
          textToCopy={currentContent}
          label="Копировать формат"
          copiedLabel="Скопировано в буфер!"
        />
      </div>

      {/* Channel-Specific Preview Canvas */}
      <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950/70 p-4 min-h-[380px]">
        <AnimatePresence mode="wait">
          {activeFormat === 'telegram_post' && (
            <motion.div
              key={`tg-${activeLang}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-xl mx-auto"
            >
              {/* Telegram message bubble mock */}
              <div className="p-4 rounded-2xl bg-[#1e293b]/90 border border-slate-700/80 shadow-lg text-slate-100">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/50">
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                    TG
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      {activeLang === 'ru' ? 'Казахстанские Медиа | Новости' : 'Қазақстан Медиасы | Жаңалықтар'}
                    </div>
                    <div className="text-[10px] text-slate-400">новостной канал • 2.4k подписчиков</div>
                  </div>
                </div>

                <div className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-slate-200">
                  {currentContent}
                </div>

                <div className="text-[10px] text-slate-400 text-right mt-3 font-mono flex items-center justify-end gap-1">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • </span>
                  <Eye className="w-3 h-3 text-slate-400" />
                  <span>1.2k</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeFormat === 'social_script' && (
            <motion.div
              key={`social-${activeLang}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-pink-500/20 shadow-xl">
                <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-pink-400 text-xs font-semibold">
                    <Video className="w-4 h-4" />
                    <span>Instagram Reels / TikTok Scenario (0–45s)</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                    5 кадров • Готов к озвучке
                  </span>
                </div>

                <div className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-slate-200 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
                  {currentContent}
                </div>
              </div>
            </motion.div>
          )}

          {activeFormat === 'web_article' && (
            <motion.div
              key={`web-${activeLang}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl mx-auto"
            >
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 text-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                  <span className="flex items-center gap-1.5 font-medium text-blue-400">
                    <Newspaper className="w-3.5 h-3.5" />
                    <span>Формат публикации для сайта (CMS Markdown)</span>
                  </span>
                  <span>{currentContent.split(/\s+/).length} слов</span>
                </div>

                <div className="prose prose-invert prose-sm max-w-none">
                  {currentContent.split('\n\n').map((paragraph, idx) => {
                    if (paragraph.startsWith('## ')) {
                      return (
                        <h2 key={idx} className="text-lg font-bold text-white mt-1 mb-2">
                          {paragraph.replace('## ', '')}
                        </h2>
                      );
                    }
                    if (paragraph.startsWith('### ')) {
                      return (
                        <h3 key={idx} className="text-sm font-semibold text-blue-300 mt-4 mb-1">
                          {paragraph.replace('### ', '')}
                        </h3>
                      );
                    }
                    if (paragraph.startsWith('> ')) {
                      return (
                        <blockquote key={idx} className="border-l-2 border-blue-500 pl-3 italic text-slate-300 my-2">
                          {paragraph.replace('> ', '')}
                        </blockquote>
                      );
                    }
                    return (
                      <p key={idx} className="text-xs leading-relaxed text-slate-300">
                        {paragraph}
                      </p>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
