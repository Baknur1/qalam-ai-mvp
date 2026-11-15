'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Highlight } from '@tiptap/extension-highlight';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { Link } from '@tiptap/extension-link';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Markdown } from 'tiptap-markdown';
import MarkdownIt from 'markdown-it';
import { EditorToolbar } from './editor-toolbar';
import { FactCheckItem, FactStatus, OutputLanguage } from '@/lib/types';
import { FACT_CHECK_ITEMS } from '@/lib/fact-checking-data';
import { TRANSLATIONS } from '@/lib/translations';
import { normalizeMarkdownContent } from '@/lib/prompts';

const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
});

const factHighlightPluginKey = new PluginKey('factHighlightPlugin');

interface FactHighlightState {
  facts: FactCheckItem[];
  decisions: Record<string, FactStatus>;
  lang: OutputLanguage;
  hoveredId: string | null;
  selectedId: string | null;
}

const FactHighlightExtension = Extension.create({
  name: 'factHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: factHighlightPluginKey,
        state: {
          init(): FactHighlightState {
            return {
              facts: [],
              decisions: {},
              lang: 'ru',
              hoveredId: null,
              selectedId: null
            };
          },
          apply(tr, value): FactHighlightState {
            const meta = tr.getMeta(factHighlightPluginKey) as FactHighlightState | undefined;
            if (meta) return meta;
            return value;
          }
        },
        props: {
          decorations(state) {
            const pluginState = factHighlightPluginKey.getState(state) as FactHighlightState | undefined;
            const currentFacts = pluginState?.facts || [];
            const currentDecisions = pluginState?.decisions || {};
            const lang = pluginState?.lang || 'ru';
            const hoveredId = pluginState?.hoveredId ?? null;
            const selectedId = pluginState?.selectedId ?? null;

            if (!currentFacts || currentFacts.length === 0) return DecorationSet.empty;

            const decorations: Decoration[] = [];
            const doc = state.doc;

            doc.descendants((node, pos) => {
              if (node.isText && node.text) {
                const text = node.text;
                const textLower = text.toLowerCase();

                for (const card of currentFacts) {
                  const phrases = [
                    card.targetPhrases?.[lang],
                    card.targetPhrases?.ru,
                    card.targetPhrases?.en,
                    card.targetPhrases?.kz,
                    card.highlightedFact
                  ].filter(Boolean) as string[];

                  const unique = Array.from(new Set(phrases));
                  for (const phrase of unique) {
                    if (!phrase || phrase.length < 3) continue;
                    const phraseLower = phrase.toLowerCase();
                    let startIdx = 0;
                    while ((startIdx = textLower.indexOf(phraseLower, startIdx)) !== -1) {
                      const from = pos + startIdx;
                      const to = from + phrase.length;
                      const status = currentDecisions[card.id] || 'pending';
                      const isHovered = hoveredId === card.id;
                      const isSelected = selectedId === card.id;

                      // Clean underline styling matching Figma design system (no blocky badges)
                      let underlineClass = '';
                      if (isHovered || isSelected) {
                        if (status === 'approved') {
                          underlineClass =
                            'border-b-2 border-emerald-400 bg-emerald-500/10 text-white font-medium pb-0.5';
                        } else if (status === 'fixed') {
                          underlineClass =
                            'border-b-2 border-sky-400 bg-sky-500/10 text-white font-medium pb-0.5';
                        } else if (status === 'declined') {
                          underlineClass =
                            'border-b-2 border-red-400 bg-red-500/10 text-neutral-300 line-through pb-0.5';
                        } else {
                          underlineClass =
                            'border-b-2 border-amber-400 bg-amber-500/15 text-white font-medium pb-0.5';
                        }
                      } else if (status === 'approved') {
                        underlineClass = 'border-b-2 border-emerald-400 pb-0.5 text-inherit';
                      } else if (status === 'fixed') {
                        underlineClass = 'border-b-2 border-sky-400 pb-0.5 text-inherit';
                      } else if (status === 'declined') {
                        underlineClass =
                          'border-b-2 border-red-400 pb-0.5 line-through text-neutral-400';
                      } else {
                        underlineClass =
                          'border-b-2 border-dashed border-amber-400/80 pb-0.5 text-inherit hover:border-amber-300';
                      }

                      decorations.push(
                        Decoration.inline(from, to, {
                          class: `fact-outline inline transition-colors duration-150 cursor-pointer ${underlineClass}`,
                          'data-fact-id': card.id
                        })
                      );
                      startIdx += phrase.length;
                    }
                  }
                }
              }
            });

            decorations.sort((a, b) => a.from - b.from);

            const nonOverlapping: Decoration[] = [];
            let lastTo = -1;
            for (const dec of decorations) {
              if (dec.from >= lastTo) {
                nonOverlapping.push(dec);
                lastTo = dec.to;
              }
            }

            return DecorationSet.create(doc, nonOverlapping);
          }
        }
      })
    ];
  }
});

interface LeadDraftSectionProps {
  draftText: string;
  isLoading?: boolean;
  isStreaming?: boolean;
  streamedText?: string;
  onSaveDraft?: (newText: string) => void;
  hoveredFactId?: string | null;
  onHoverFact?: (factId: string | null) => void;
  selectedFactId?: string | null;
  onSelectFact?: (factId: string | null) => void;
  facts?: FactCheckItem[];
  decisions?: Record<string, FactStatus>;
  currentLang?: OutputLanguage;
}

export function LeadDraftSection({
  draftText,
  isLoading = false,
  isStreaming = false,
  streamedText = '',
  onSaveDraft,
  hoveredFactId,
  onHoverFact,
  selectedFactId,
  onSelectFact,
  facts = FACT_CHECK_ITEMS,
  decisions = {},
  currentLang = 'ru'
}: LeadDraftSectionProps) {
  // PREVIEW BY DEFAULT: User immediately sees the formatted publication
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [isRawMode, setIsRawMode] = useState(false);
  const [content, setContent] = useState(draftText);
  const [prevDraftText, setPrevDraftText] = useState(draftText);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  if (!isStreaming && draftText !== prevDraftText) {
    setPrevDraftText(draftText);
    setContent(draftText);
  }

  // Debounced auto-save function
  const triggerAutoSave = (newText: string) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      if (onSaveDraft) {
        onSaveDraft(newText);
      }
    }, 400);
  };

  // Initialize Tiptap WYSIWYG editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Highlight.configure({
        multicolor: true
      }),
      Table.configure({
        resizable: true
      }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: false
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true
      }),
      FactHighlightExtension
    ],
    content: mdParser.render(normalizeMarkdownContent(draftText || '')),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'tiptap focus:outline-none min-h-[420px] text-base sm:text-[16px] text-neutral-200 leading-[1.75]'
      }
    },
    onUpdate: ({ editor: currentEditor }) => {
      // @ts-expect-error tiptap-markdown storage
      const md = currentEditor.storage?.markdown?.getMarkdown?.() || currentEditor.getText();
      setContent(md);
      triggerAutoSave(md);
    }
  });

  // Sync draftText with editor when props change (language switch or demo finish or auto-fix applied)
  useEffect(() => {
    if (draftText && !isStreaming && editor) {
      const cleanDraft = normalizeMarkdownContent(draftText);
      editor.commands.setContent(mdParser.render(cleanDraft));
    }
  }, [draftText, isStreaming, editor]);

  // Keep plugin state updated and trigger decoration re-render
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.view.dispatch(
        editor.state.tr.setMeta(factHighlightPluginKey, {
          facts,
          decisions,
          lang: currentLang,
          hoveredId: hoveredFactId,
          selectedId: selectedFactId
        })
      );
    }
  }, [facts, decisions, currentLang, hoveredFactId, selectedFactId, editor]);

  // Synchronize content to editor when toggling preview/edit
  const handleTogglePreview = () => {
    if (isPreviewMode) {
      if (editor) {
        editor.commands.setContent(mdParser.render(normalizeMarkdownContent(content)));
      }
      setIsPreviewMode(false);
    } else {
      if (editor) {
        // @ts-expect-error tiptap-markdown storage
        const md = editor.storage?.markdown?.getMarkdown?.() || content;
        setContent(md);
        triggerAutoSave(md);
      }
      setIsPreviewMode(true);
    }
  };

  const handleRawChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    triggerAutoSave(val);
    if (editor) {
      editor.commands.setContent(mdParser.render(normalizeMarkdownContent(val)));
    }
  };

  // Rendered HTML for preview mode or streaming with cross-component fact highlights
  // In preview mode: NO boxes/rings, NO checkmarks, NO 'ФАКТ' labels.
  // Only bottom-border in the corresponding color.
  const displayedContent = isStreaming ? streamedText : content;

  const renderedHtml = useMemo(() => {
    const cleanContent = normalizeMarkdownContent(displayedContent || '');
    let html = mdParser.render(cleanContent);
    if (!facts || facts.length === 0) return html;

    facts.forEach((card) => {
      const status = decisions[card.id] || 'pending';
      const isHovered = hoveredFactId === card.id;
      const isSelected = selectedFactId === card.id;

      // Collect target phrases for current and alternative languages
      const phraseList = [
        card.targetPhrases?.[currentLang],
        card.targetPhrases?.ru,
        card.targetPhrases?.en,
        card.targetPhrases?.kz,
        card.highlightedFact
      ].filter(Boolean) as string[];

      const uniquePhrases = Array.from(new Set(phraseList));

      for (const phrase of uniquePhrases) {
        if (!phrase || phrase.length < 3) continue;

        // Escape regex special chars
        const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match occurrences inside HTML text (avoiding tags)
        const regex = new RegExp(`(?<!<[^>]*)(${escaped})(?![^<]*>)`, 'gi');

        if (regex.test(html)) {
          let styleClasses = '';

          if (isHovered || isSelected) {
            if (status === 'approved') {
              styleClasses =
                'border-b-2 border-emerald-400 bg-emerald-500/10 text-white font-medium pb-0.5';
            } else if (status === 'fixed') {
              styleClasses =
                'border-b-2 border-sky-400 bg-sky-500/10 text-white font-medium pb-0.5';
            } else if (status === 'declined') {
              styleClasses =
                'border-b-2 border-red-400 bg-red-500/10 text-neutral-300 line-through pb-0.5';
            } else {
              styleClasses =
                'border-b-2 border-amber-400 bg-amber-500/15 text-white font-medium pb-0.5';
            }
          } else if (status === 'approved') {
            styleClasses = 'border-b-2 border-emerald-400 pb-0.5 text-inherit';
          } else if (status === 'fixed') {
            styleClasses = 'border-b-2 border-sky-400 pb-0.5 text-inherit';
          } else if (status === 'declined') {
            styleClasses = 'border-b-2 border-red-400 pb-0.5 line-through text-neutral-400';
          } else {
            styleClasses =
              'border-b-2 border-dashed border-amber-400/80 pb-0.5 text-inherit hover:border-amber-300';
          }

          html = html.replace(
            regex,
            `<span data-fact-id="${card.id}" class="inline-block cursor-pointer transition-all ${styleClasses}">$1</span>`
          );
          break; // Match first occurrence for this card
        }
      }
    });

    return html;
  }, [displayedContent, facts, decisions, hoveredFactId, selectedFactId, currentLang]);

  // Click & hover event delegation on preview container
  const handleContainerClick = (e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest('[data-fact-id]');
    if (target) {
      const factId = target.getAttribute('data-fact-id');
      if (factId && onSelectFact) {
        onSelectFact(factId);
      }
    }
  };

  const handleContainerMouseOver = (e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest('[data-fact-id]');
    if (target) {
      const factId = target.getAttribute('data-fact-id');
      if (factId && onHoverFact) {
        onHoverFact(factId);
      }
    }
  };

  const handleContainerMouseOut = (e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest('[data-fact-id]');
    if (target && onHoverFact) {
      onHoverFact(null);
    }
  };

  // Scroll target fact into view when selectedFactId changes
  useEffect(() => {
    if (selectedFactId && previewScrollRef.current) {
      const el = previewScrollRef.current.querySelector(`[data-fact-id="${selectedFactId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedFactId]);

  // Auto-scroll to bottom during streaming
  useEffect(() => {
    if (isStreaming && previewScrollRef.current) {
      previewScrollRef.current.scrollTop = previewScrollRef.current.scrollHeight;
    }
  }, [isStreaming, streamedText]);

  return (
    <div className="flex flex-col w-full select-none">
      {/* Title */}
      <div className="flex items-center justify-between mb-5 h-8">
        <h2 className="text-[28px] font-normal text-white tracking-tight flex items-center gap-2">
          <span>{TRANSLATIONS[currentLang]?.leadDraft.title || 'Lead Draft'}</span>
        </h2>
      </div>

      {/* Container with top toolbar - Height matched to 820px to align with Fact Checking */}
      <div className="h-[820px] rounded-[20px] bg-[#121214] border border-[#2a2a2a] flex flex-col relative">
        {/* Real Tiptap Editorial Toolbar */}
        <EditorToolbar
          editor={editor}
          isPreviewMode={isPreviewMode}
          onTogglePreview={handleTogglePreview}
          isRawMode={isRawMode}
          onToggleRawMode={() => setIsRawMode(!isRawMode)}
          currentLang={currentLang}
        />

        {/* Content Area */}
        <div
          ref={previewScrollRef}
          onClick={handleContainerClick}
          onMouseOver={handleContainerMouseOver}
          onMouseOut={handleContainerMouseOut}
          className="flex-1 p-6 sm:p-7 overflow-y-auto overflow-x-hidden rounded-b-[20px] scrollbar-thin scrollbar-thumb-neutral-800"
        >
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
          ) : !displayedContent && !isStreaming && currentLang !== 'ru' ? (
            <div className="h-full py-28 flex flex-col items-center justify-center text-center select-none">
              <div className="w-7 h-7 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
              <p className="text-base font-normal text-neutral-300">
                {currentLang === 'kz'
                  ? 'Негізгі мақала қазақ тіліне бейімделуде...'
                  : 'Translating lead draft to English...'}
              </p>
              <span className="text-xs text-neutral-500 mt-2 max-w-sm">
                {currentLang === 'kz'
                  ? 'Редакциялық фактчек пен стильдік сараптама фонодық режимде жүргізіліп жатыр'
                  : 'Background translation with fact alignment in progress'}
              </span>
            </div>
          ) : isRawMode ? (
            /* Raw Markdown Mode */
            <textarea
              rows={22}
              value={content}
              onChange={handleRawChange}
              placeholder={TRANSLATIONS[currentLang]?.leadDraft.rawPlaceholder || 'Введите или отредактируйте Markdown код...'}
              className="w-full h-full bg-transparent border-0 outline-none resize-none text-sm sm:text-base font-mono text-neutral-300 leading-[1.75] placeholder:text-neutral-600"
            />
          ) : isPreviewMode || isStreaming ? (
            /* Preview Mode & Streaming Mode (Unified Rich Styling with Fact Highlights) */
            <div className="relative text-base sm:text-[16px] text-neutral-200 leading-[1.75]">
              <div
                className="tiptap select-text"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-white/80 animate-pulse ml-1 align-middle" />
              )}
            </div>
          ) : (
            /* Interactive WYSIWYG Mode (Tiptap) */
            <div className="w-full h-full select-text">
              <EditorContent editor={editor} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
