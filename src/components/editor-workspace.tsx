'use client';

import React, { useState } from 'react';
import { ShieldCheck, FileCheck2, Edit3, Check, Sparkles } from 'lucide-react';
import { TranscriptItem, VerificationFlag } from '@/lib/types';
import { TranscriptRow } from './ui/collapsible-quote';
import { CopyButton } from './ui/copy-button';
import { cn } from '@/lib/utils';

interface EditorWorkspaceProps {
  transcript: TranscriptItem[];
  flags: VerificationFlag[];
  draftText: string;
  onToggleVerify: (flagId: string) => void;
  className?: string;
}

export function EditorWorkspace({
  transcript,
  flags,
  draftText,
  onToggleVerify,
  className
}: EditorWorkspaceProps) {
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [editedText, setEditedText] = useState(draftText);
  const [prevDraft, setPrevDraft] = useState(draftText);

  if (draftText !== prevDraft) {
    setPrevDraft(draftText);
    setEditedText(draftText);
  }

  const totalFlags = flags.length;
  const verifiedCount = flags.filter(f => f.verified).length;
  const progressPercent = totalFlags > 0 ? Math.round((verifiedCount / totalFlags) * 100) : 100;

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-12 gap-5', className)}>
      {/* Left Column: Transcript with Verification Flags */}
      <div className="lg:col-span-6 flex flex-col p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3 pb-3 mb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-amber-500/20 text-amber-400">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                1. Транскрипт источника & Фактчекинг
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Сырая речь с таймкодами и интерактивными флагами Human-in-the-loop
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs font-semibold text-slate-200">
              <span className="text-emerald-400">{verifiedCount}</span> / {totalFlags} проверено
            </div>
            <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Legend for flags */}
        <div className="flex flex-wrap items-center gap-2 mb-3 px-1 py-1 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Утверждение
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-400" /> Персона/Госорган
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-400" /> Суммы ₸ / Даты
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Верифицировано
          </span>
        </div>

        {/* Transcript rows */}
        <div className="space-y-3 overflow-y-auto max-h-[560px] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          {transcript.map((item) => (
            <TranscriptRow
              key={item.id}
              item={item}
              flags={flags}
              onToggleVerify={onToggleVerify}
            />
          ))}
        </div>
      </div>

      {/* Right Column: Structured Lead Editorial Draft */}
      <div className="lg:col-span-6 flex flex-col p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3 pb-3 mb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-blue-500/20 text-blue-400">
                <FileCheck2 className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                2. Черновик редактора (Lead Draft)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Сформирован Agent 3 (Chief Editor) без шаблонных клише ИИ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditingDraft(!isEditingDraft)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors',
                isEditingDraft
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
              )}
            >
              {isEditingDraft ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Сохранить правки</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Редактировать</span>
                </>
              )}
            </button>
            <CopyButton textToCopy={editedText} size="sm" />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto max-h-[560px] pr-1">
          {isEditingDraft ? (
            <textarea
              rows={18}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full h-full p-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm text-slate-100 font-sans leading-relaxed resize-none"
            />
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3 text-slate-200">
              <div className="prose prose-invert prose-sm max-w-none">
                {editedText.split('\n\n').map((paragraph, idx) => {
                  if (paragraph.startsWith('## ')) {
                    return (
                      <h2 key={idx} className="text-lg font-bold text-white mt-0 mb-2">
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
                  if (paragraph.startsWith('* ')) {
                    return (
                      <div key={idx} className="text-xs text-slate-300 leading-relaxed pl-2">
                        {paragraph}
                      </div>
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
          )}
        </div>

        {/* Human in the loop confirmation footer */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Черновик проверен на соответствие журналистским стандартам РК</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            {editedText.split(/\s+/).length} слов
          </span>
        </div>
      </div>
    </div>
  );
}
