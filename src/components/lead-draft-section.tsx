'use client';

import React, { useState, useEffect } from 'react';
import { EditorToolbar } from './editor-toolbar';

interface LeadDraftSectionProps {
  draftText: string;
  isLoading?: boolean;
  isStreaming?: boolean;
  streamedText?: string;
  onSaveDraft?: (newText: string) => void;
}

export function LeadDraftSection({
  draftText,
  isLoading = false,
  isStreaming = false,
  streamedText = '',
  onSaveDraft
}: LeadDraftSectionProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [content, setContent] = useState(draftText);
  const [prevDraft, setPrevDraft] = useState(draftText);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (draftText !== prevDraft) {
      setPrevDraft(draftText);
      setContent(draftText);
    }
  }, [draftText, prevDraft]);

  const displayedContent = isStreaming ? streamedText : content;

  const handleFormat = (cmd: string) => {
    switch (cmd) {
      case 'bold':
        setContent(prev => prev + ' **жирный текст**');
        break;
      case 'italic':
        setContent(prev => prev + ' *курсив*');
        break;
      case 'heading':
        setContent(prev => prev + '\n\n## Новый подзаголовок\n');
        break;
      case 'quote':
        setContent(prev => prev + '\n\n> Важная цитата спикера для публикации.\n');
        break;
      case 'bullet-list':
        setContent(prev => prev + '\n\n* Пункт списка 1\n* Пункт списка 2\n');
        break;
      case 'clear':
        setContent(draftText);
        break;
      default:
        break;
    }
  };

  const handleSave = () => {
    if (onSaveDraft) {
      onSaveDraft(content);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex flex-col w-full h-full select-none">
      {/* Title */}
      <h2 className="text-[28px] font-normal text-white mb-5 tracking-tight h-8 flex items-center">
        Lead Draft
      </h2>

      {/* Container with top toolbar matching user screenshot */}
      <div className="flex-1 rounded-[20px] bg-[#121214] border border-[#2a2a2a] flex flex-col overflow-hidden">
        {/* Rich-Text Editorial Toolbar (No emojis, full vector icons) */}
        <EditorToolbar
          onFormat={handleFormat}
          isPreviewMode={isPreviewMode}
          onTogglePreview={() => setIsPreviewMode(!isPreviewMode)}
          onSave={handleSave}
          isSaved={isSaved}
        />

        {/* Content Area */}
        <div className="flex-1 p-6 sm:p-7 overflow-y-auto">
          {isLoading ? (
            /* Skeleton State */
            <div className="space-y-4 animate-pulse">
              <div className="h-7 w-3/4 rounded-md bg-white/[0.07]" />
              <div className="h-5 w-full rounded-md bg-white/[0.04]" />
              <div className="h-5 w-5/6 rounded-md bg-white/[0.04]" />
              <div className="h-5 w-4/6 rounded-md bg-white/[0.04]" />
              <div className="pt-3 space-y-2.5">
                <div className="h-6 w-1/2 rounded-md bg-white/[0.06]" />
                <div className="h-5 w-full rounded-md bg-white/[0.04]" />
                <div className="h-5 w-11/12 rounded-md bg-white/[0.04]" />
                <div className="h-5 w-9/12 rounded-md bg-white/[0.04]" />
              </div>
              <div className="pt-2 pl-4 border-l-2 border-neutral-700 space-y-2">
                <div className="h-5 w-5/6 rounded-md bg-white/[0.05]" />
                <div className="h-5 w-4/6 rounded-md bg-white/[0.05]" />
              </div>
            </div>
          ) : !isPreviewMode && !isStreaming ? (
            /* Edit Mode (Textarea) */
            <textarea
              rows={18}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Введите или отредактируйте текст черновика..."
              className="w-full h-full bg-transparent border-0 outline-none resize-none text-base sm:text-[16px] text-neutral-200 leading-[1.75] font-sans placeholder:text-neutral-600"
            />
          ) : (
            /* Preview / Streaming Mode */
            <div className="text-base sm:text-[16px] text-neutral-200 leading-[1.75] space-y-4">
              {displayedContent.split('\n\n').map((block, idx) => {
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
                  <p key={idx} className="text-base sm:text-[16px] text-neutral-200 leading-[1.75]">
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
          )}
        </div>
      </div>
    </div>
  );
}
