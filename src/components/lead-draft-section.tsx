'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Highlight } from '@tiptap/extension-highlight';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { Link } from '@tiptap/extension-link';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Markdown } from 'tiptap-markdown';
import MarkdownIt from 'markdown-it';
import { EditorToolbar } from './editor-toolbar';

const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
});

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
  // PREVIEW BY DEFAULT: User immediately sees the formatted publication
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [isRawMode, setIsRawMode] = useState(false);
  const [content, setContent] = useState(draftText);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      })
    ],
    content: mdParser.render(draftText || ''),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'tiptap focus:outline-none min-h-[420px] text-base sm:text-[16px] text-neutral-200 leading-[1.75]'
      }
    },
    onUpdate: ({ editor: currentEditor }) => {
      // @ts-expect-error tiptap-markdown storage
      const md = currentEditor.storage?.markdown?.getMarkdown?.() || currentEditor.getText();
      setContent(md);
      triggerAutoSave(md);
    }
  });

  // Sync draftText when props change (language switch or demo finish)
  useEffect(() => {
    if (draftText && !isStreaming) {
      setContent(draftText);
      if (editor) {
        editor.commands.setContent(mdParser.render(draftText));
      }
    }
  }, [draftText, isStreaming, editor]);

  // Synchronize content to editor when entering edit mode
  const handleTogglePreview = () => {
    if (isPreviewMode) {
      // Transition from Preview -> Edit
      if (editor) {
        editor.commands.setContent(mdParser.render(content));
      }
      setIsPreviewMode(false);
    } else {
      // Transition from Edit -> Preview
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
      editor.commands.setContent(mdParser.render(val));
    }
  };

  // Rendered HTML for preview mode or streaming
  const displayedContent = isStreaming ? streamedText : content;
  const renderedHtml = useMemo(() => {
    return mdParser.render(displayedContent || '');
  }, [displayedContent]);

  // Auto-scroll to bottom during streaming
  useEffect(() => {
    if (isStreaming && previewScrollRef.current) {
      previewScrollRef.current.scrollTop = previewScrollRef.current.scrollHeight;
    }
  }, [isStreaming, streamedText]);

  return (
    <div className="flex flex-col w-full select-none">
      {/* Title */}
      <h2 className="text-[28px] font-normal text-white mb-5 tracking-tight h-8 flex items-center">
        Lead Draft
      </h2>

      {/* Container with top toolbar - Height matched to 820px to align with Fact Checking */}
      <div className="h-[820px] rounded-[20px] bg-[#121214] border border-[#2a2a2a] flex flex-col relative">
        {/* Real Tiptap Editorial Toolbar */}
        <EditorToolbar
          editor={editor}
          isPreviewMode={isPreviewMode}
          onTogglePreview={handleTogglePreview}
          isRawMode={isRawMode}
          onToggleRawMode={() => setIsRawMode(!isRawMode)}
        />

        {/* Content Area */}
        <div
          ref={previewScrollRef}
          className="flex-1 p-6 sm:p-7 overflow-y-auto overflow-x-hidden rounded-b-[20px]"
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
          ) : isRawMode ? (
            /* Raw Markdown Mode */
            <textarea
              rows={22}
              value={content}
              onChange={handleRawChange}
              placeholder="Введите или отредактируйте Markdown код..."
              className="w-full h-full bg-transparent border-0 outline-none resize-none text-sm sm:text-base font-mono text-neutral-300 leading-[1.75] placeholder:text-neutral-600"
            />
          ) : isPreviewMode || isStreaming ? (
            /* Preview Mode & Streaming Mode (Unified Rich Styling) */
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
