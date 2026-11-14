'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Editor } from '@tiptap/react';
import {
  Eraser,
  Bold,
  Italic,
  Palette,
  MoreVertical,
  MoreHorizontal,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Image as ImageIcon,
  Film,
  Quote,
  Table as TableIcon,
  Undo2,
  Redo2,
  Brackets,
  FileSearch,
  Edit3,
  ChevronDown,
  Strikethrough,
  Underline as UnderlineIcon,
  Code as CodeIcon,
  Check
} from 'lucide-react';

import { OutputLanguage } from '@/lib/types';
import { TRANSLATIONS } from '@/lib/translations';

interface EditorToolbarProps {
  editor?: Editor | null;
  onFormat?: (command: string) => void;
  isPreviewMode?: boolean;
  onTogglePreview?: () => void;
  isRawMode?: boolean;
  onToggleRawMode?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  currentLang?: OutputLanguage;
}

export function EditorToolbar({
  editor,
  onFormat,
  isPreviewMode = false,
  onTogglePreview,
  isRawMode = false,
  onToggleRawMode,
  currentLang = 'ru'
}: EditorToolbarProps) {
  const t = TRANSLATIONS[currentLang]?.leadDraft || TRANSLATIONS.ru.leadDraft;
  const tb = TRANSLATIONS[currentLang]?.editorToolbar || TRANSLATIONS.ru.editorToolbar;
  // Dropdown / Popover states
  const [activeMenu, setActiveMenu] = useState<
    'heading' | 'palette' | 'more-styles' | 'lists' | 'align' | 'link' | 'more-elements' | null
  >(null);

  // Link state
  const [linkUrl, setLinkUrl] = useState('');

  // Mobile secondary tools row toggle
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

  const toolbarRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (menu: typeof activeMenu) => {
    if (activeMenu === menu) {
      setActiveMenu(null);
    } else {
      if (menu === 'link' && editor) {
        setLinkUrl(editor.getAttributes('link').href || '');
      }
      setActiveMenu(menu);
    }
  };

  const handleAction = (cmd: string) => {
    if (onFormat) onFormat(cmd);
  };

  // Helper active states
  const isBold = editor?.isActive('bold') ?? false;
  const isItalic = editor?.isActive('italic') ?? false;
  const isStrike = editor?.isActive('strike') ?? false;
  const isUnderline = editor?.isActive('underline') ?? false;
  const isCode = editor?.isActive('code') ?? false;
  const isQuote = editor?.isActive('blockquote') ?? false;
  const isBulletList = editor?.isActive('bulletList') ?? false;
  const isOrderedList = editor?.isActive('orderedList') ?? false;
  const isTable = editor?.isActive('table') ?? false;
  const canUndo = editor?.can().undo() ?? false;
  const canRedo = editor?.can().redo() ?? false;

  // Dynamic Alignment State
  const currentAlign: 'left' | 'center' | 'right' = editor?.isActive({ textAlign: 'center' })
    ? 'center'
    : editor?.isActive({ textAlign: 'right' })
    ? 'right'
    : 'left';

  const setLink = () => {
    if (!editor) return;
    if (linkUrl.trim() === '') {
      editor.chain().focus().unsetLink().run();
    } else {
      const url = linkUrl.startsWith('http://') || linkUrl.startsWith('https://')
        ? linkUrl
        : `https://${linkUrl}`;
      editor.chain().focus().setLink({ href: url }).run();
    }
    setActiveMenu(null);
  };

  return (
    <div
      ref={toolbarRef}
      className="relative flex flex-col border-b border-[#222225] bg-[#121214] rounded-t-[20px] text-neutral-400 select-none overflow-visible z-30"
    >
      {/* Row 1: Main Toolbar */}
      <div className="h-12 pl-2.5 sm:pl-3 pr-0 flex items-center justify-between w-full">
        {/* Left Formatting Cluster */}
        <div className="flex items-center gap-0.5 shrink-0 relative">
        {/* Clear formatting */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (editor) {
              editor.chain().focus().unsetAllMarks().clearNodes().run();
            } else {
              handleAction('clear');
            }
          }}
          title={tb.clearFormatting}
          className="w-7.5 h-7.5 flex items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <Eraser className="w-3.5 h-3.5" />
        </button>

        {/* Bold */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (editor) {
              editor.chain().focus().toggleBold().run();
            } else {
              handleAction('bold');
            }
          }}
          title={tb.bold}
          className={`w-7.5 h-7.5 flex items-center justify-center rounded-md transition-colors cursor-pointer font-bold ${
            isBold ? 'bg-white/20 text-white font-bold' : 'hover:bg-white/10 hover:text-white'
          }`}
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (editor) {
              editor.chain().focus().toggleItalic().run();
            } else {
              handleAction('italic');
            }
          }}
          title={tb.italic}
          className={`w-7.5 h-7.5 flex items-center justify-center rounded-md transition-colors cursor-pointer italic ${
            isItalic ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'
          }`}
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        {/* Headings (TT) Dropdown */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggleMenu('heading')}
            title={tb.headingStyles}
            className={`h-7.5 px-1 flex items-center gap-0.5 rounded-md transition-colors cursor-pointer ${
              activeMenu === 'heading'
                ? 'bg-white/20 text-white'
                : 'hover:bg-white/10 hover:text-white text-neutral-400'
            }`}
          >
            <div className="flex items-baseline font-bold leading-none text-[13px] tracking-tighter">
              <span>T</span><span className="text-[9px]">T</span>
            </div>
            <ChevronDown className="w-2 h-2 opacity-70 ml-0.5" />
          </button>

          <AnimatePresence>
            {activeMenu === 'heading' && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full left-0 mt-1.5 w-48 rounded-xl bg-[#1c1c20] border border-[#2e2e34] shadow-2xl p-1.5 flex flex-col gap-0.5 z-50 text-neutral-300 text-xs"
              >
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor?.chain().focus().toggleHeading({ level: 1 }).run();
                    setActiveMenu(null);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md hover:bg-white/10 hover:text-white flex items-center justify-between ${
                    editor?.isActive('heading', { level: 1 }) ? 'bg-white/15 text-white font-semibold' : ''
                  }`}
                >
                  <span className="text-base font-bold text-white">{tb.h1}</span>
                  {editor?.isActive('heading', { level: 1 }) && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor?.chain().focus().toggleHeading({ level: 2 }).run();
                    setActiveMenu(null);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md hover:bg-white/10 hover:text-white flex items-center justify-between ${
                    editor?.isActive('heading', { level: 2 }) ? 'bg-white/15 text-white font-semibold' : ''
                  }`}
                >
                  <span className="text-sm font-semibold text-white">{tb.h2}</span>
                  {editor?.isActive('heading', { level: 2 }) && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor?.chain().focus().toggleHeading({ level: 3 }).run();
                    setActiveMenu(null);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md hover:bg-white/10 hover:text-white flex items-center justify-between ${
                    editor?.isActive('heading', { level: 3 }) ? 'bg-white/15 text-white font-semibold' : ''
                  }`}
                >
                  <span className="text-xs font-semibold text-white">{tb.h3}</span>
                  {editor?.isActive('heading', { level: 3 }) && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>

                <div className="w-full h-[1px] bg-[#2a2a30] my-1" />

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor?.chain().focus().setParagraph().run();
                    setActiveMenu(null);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md hover:bg-white/10 hover:text-white flex items-center justify-between ${
                    editor?.isActive('paragraph') ? 'bg-white/15 text-white' : ''
                  }`}
                >
                  <span>{tb.paragraph}</span>
                  {editor?.isActive('paragraph') && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Palette (Highlights) Popover */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggleMenu('palette')}
            title={tb.highlightColor}
            className={`w-7.5 h-7.5 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
              activeMenu === 'palette'
                ? 'bg-white/20 text-white'
                : 'hover:bg-white/10 hover:text-white text-neutral-400'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
          </button>

          <AnimatePresence>
            {activeMenu === 'palette' && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full left-0 mt-1.5 w-52 rounded-xl bg-[#1c1c20] border border-[#2e2e34] shadow-2xl p-2 flex flex-col gap-1.5 z-50 text-neutral-300 text-xs"
              >
                <div className="text-[11px] font-medium text-neutral-400 px-1">{tb.editorialMarkers}</div>
                <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                  {/* Amber */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      editor?.chain().focus().toggleHighlight({ color: '#f59e0b' }).run();
                      setActiveMenu(null);
                    }}
                    title={tb.markerYellow}
                    className="h-7 rounded-md bg-amber-500/25 border border-amber-500/50 hover:brightness-125 transition-all flex items-center justify-center cursor-pointer"
                  >
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                  </button>

                  {/* Red */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      editor?.chain().focus().toggleHighlight({ color: '#ef4444' }).run();
                      setActiveMenu(null);
                    }}
                    title={tb.markerRed}
                    className="h-7 rounded-md bg-red-500/25 border border-red-500/50 hover:brightness-125 transition-all flex items-center justify-center cursor-pointer"
                  >
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                  </button>

                  {/* Green */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      editor?.chain().focus().toggleHighlight({ color: '#10b981' }).run();
                      setActiveMenu(null);
                    }}
                    title={tb.markerGreen}
                    className="h-7 rounded-md bg-emerald-500/25 border border-emerald-500/50 hover:brightness-125 transition-all flex items-center justify-center cursor-pointer"
                  >
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </button>

                  {/* Blue */}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      editor?.chain().focus().toggleHighlight({ color: '#3b82f6' }).run();
                      setActiveMenu(null);
                    }}
                    title={tb.markerBlue}
                    className="h-7 rounded-md bg-blue-500/25 border border-blue-500/50 hover:brightness-125 transition-all flex items-center justify-center cursor-pointer"
                  >
                    <div className="w-3 h-3 rounded-full bg-blue-400" />
                  </button>
                </div>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor?.chain().focus().unsetHighlight().run();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-md hover:bg-white/10 hover:text-white text-[11px] text-neutral-400 mt-1 cursor-pointer"
                >
                  {tb.removeHighlight}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile 3-Dots Button (Toggles Secondary Row on Mobile) */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setIsMobileMoreOpen(!isMobileMoreOpen)}
          title="Дополнительные инструменты"
          className={`flex sm:hidden w-7.5 h-7.5 items-center justify-center rounded-md transition-colors cursor-pointer ${
            isMobileMoreOpen
              ? 'bg-white/20 text-white'
              : 'hover:bg-white/10 text-neutral-400 hover:text-white'
          }`}
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>

        {/* Desktop Secondary Cluster (Hidden on mobile) */}
        <div className="hidden sm:flex items-center gap-0.5">
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggleMenu('more-styles')}
            title={tb.extraStyles}
            className={`w-5.5 h-7.5 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
              activeMenu === 'more-styles'
                ? 'bg-white/20 text-white'
                : 'hover:bg-white/10 hover:text-white text-neutral-400'
            }`}
          >
            <MoreVertical className="w-3 h-3" />
          </button>

          <AnimatePresence>
            {activeMenu === 'more-styles' && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full left-0 mt-1.5 w-44 rounded-xl bg-[#1c1c20] border border-[#2e2e34] shadow-2xl p-1.5 flex flex-col gap-0.5 z-50 text-neutral-300 text-xs"
              >
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor?.chain().focus().toggleStrike().run();
                    setActiveMenu(null);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md hover:bg-white/10 hover:text-white flex items-center gap-2 ${
                    isStrike ? 'bg-white/15 text-white' : ''
                  }`}
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                  <span>{tb.strike}</span>
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor?.chain().focus().toggleUnderline().run();
                    setActiveMenu(null);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md hover:bg-white/10 hover:text-white flex items-center gap-2 ${
                    isUnderline ? 'bg-white/15 text-white' : ''
                  }`}
                >
                  <UnderlineIcon className="w-3.5 h-3.5" />
                  <span>{tb.underline}</span>
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor?.chain().focus().toggleCode().run();
                    setActiveMenu(null);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md hover:bg-white/10 hover:text-white flex items-center gap-2 ${
                    isCode ? 'bg-white/15 text-white' : ''
                  }`}
                >
                  <CodeIcon className="w-3.5 h-3.5" />
                  <span>{tb.inlineCode}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-[1px] h-4 bg-[#2b2b30] shrink-0 mx-0.5" />

        {/* Structure & Media Cluster */}
        {/* Lists Dropdown */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggleMenu('lists')}
            title={tb.lists}
            className={`h-7.5 px-1 flex items-center gap-0.5 rounded-md transition-colors cursor-pointer ${
              activeMenu === 'lists'
                ? 'bg-white/20 text-white'
                : 'hover:bg-white/10 hover:text-white text-neutral-400'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <ChevronDown className="w-2 h-2 opacity-70 ml-0.5" />
          </button>

          <AnimatePresence>
            {activeMenu === 'lists' && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full left-0 mt-1.5 w-48 rounded-xl bg-[#1c1c20] border border-[#2e2e34] shadow-2xl p-1.5 flex flex-col gap-0.5 z-50 text-neutral-300 text-xs"
              >
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor?.chain().focus().toggleBulletList().run();
                    setActiveMenu(null);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md hover:bg-white/10 hover:text-white flex items-center justify-between ${
                    isBulletList ? 'bg-white/15 text-white font-medium' : ''
                  }`}
                >
                  <span>{tb.bulletList}</span>
                  {isBulletList && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor?.chain().focus().toggleOrderedList().run();
                    setActiveMenu(null);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md hover:bg-white/10 hover:text-white flex items-center justify-between ${
                    isOrderedList ? 'bg-white/15 text-white font-medium' : ''
                  }`}
                >
                  <span>{tb.orderedList}</span>
                  {isOrderedList && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Alignment Dropdown with Dynamic Active Icon */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggleMenu('align')}
            title={`${tb.alignment}: ${
              currentAlign === 'center'
                ? tb.alignCenter
                : currentAlign === 'right'
                ? tb.alignRight
                : tb.alignLeft
            }`}
            className={`h-7.5 px-1.5 flex items-center gap-0.5 rounded-md transition-colors cursor-pointer ${
              activeMenu === 'align'
                ? 'bg-white/20 text-white'
                : 'hover:bg-white/10 hover:text-white text-neutral-400'
            }`}
          >
            {currentAlign === 'center' ? (
              <AlignCenter className="w-3.5 h-3.5 text-white" />
            ) : currentAlign === 'right' ? (
              <AlignRight className="w-3.5 h-3.5 text-white" />
            ) : (
              <AlignLeft className="w-3.5 h-3.5" />
            )}
            <ChevronDown className="w-2 h-2 opacity-70 ml-0.5" />
          </button>

          <AnimatePresence>
            {activeMenu === 'align' && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full left-0 mt-1.5 w-44 rounded-xl bg-[#1c1c20] border border-[#2e2e34] shadow-2xl p-1.5 flex flex-col gap-0.5 z-50 text-neutral-300 text-xs"
              >
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor?.chain().focus().setTextAlign('left').run();
                    setActiveMenu(null);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md hover:bg-white/10 hover:text-white flex items-center justify-between cursor-pointer ${
                    currentAlign === 'left' ? 'bg-white/15 text-white font-medium' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlignLeft className="w-3.5 h-3.5" />
                    <span>{tb.alignLeft}</span>
                  </div>
                  {currentAlign === 'left' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor?.chain().focus().setTextAlign('center').run();
                    setActiveMenu(null);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md hover:bg-white/10 hover:text-white flex items-center justify-between cursor-pointer ${
                    currentAlign === 'center' ? 'bg-white/15 text-white font-medium' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlignCenter className="w-3.5 h-3.5" />
                    <span>{tb.alignCenter}</span>
                  </div>
                  {currentAlign === 'center' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor?.chain().focus().setTextAlign('right').run();
                    setActiveMenu(null);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md hover:bg-white/10 hover:text-white flex items-center justify-between cursor-pointer ${
                    currentAlign === 'right' ? 'bg-white/15 text-white font-medium' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlignRight className="w-3.5 h-3.5" />
                    <span>{tb.alignRight}</span>
                  </div>
                  {currentAlign === 'right' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-[1px] h-4 bg-[#2b2b30] shrink-0 mx-0.5" />

        {/* Link popover */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggleMenu('link')}
            title={tb.linkTooltip}
            className={`w-7.5 h-7.5 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
              activeMenu === 'link' || editor?.isActive('link')
                ? 'bg-white/20 text-white'
                : 'hover:bg-white/10 hover:text-white'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>

          <AnimatePresence>
            {activeMenu === 'link' && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full left-0 mt-1.5 w-72 rounded-xl bg-[#1c1c20] border border-[#2e2e34] shadow-2xl p-3 flex flex-col gap-2 z-50 text-neutral-300 text-xs"
              >
                <div className="text-xs font-medium text-white">{tb.insertLink}</div>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setLink();
                    }
                  }}
                  placeholder="https://..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#121214] border border-[#33333a] text-white text-xs outline-none focus:border-neutral-400 placeholder:text-neutral-500"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-1.5 pt-1">
                  {editor?.isActive('link') && (
                    <button
                      type="button"
                      onClick={() => {
                        editor?.chain().focus().unsetLink().run();
                        setActiveMenu(null);
                      }}
                      className="px-2 py-1 rounded text-red-400 hover:bg-red-500/10 cursor-pointer"
                    >
                      {tb.deleteLink}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveMenu(null)}
                    className="px-2.5 py-1 rounded hover:bg-white/10 text-neutral-400 cursor-pointer"
                  >
                    {tb.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={setLink}
                    className="px-3 py-1 rounded bg-white text-black font-medium hover:bg-neutral-200 cursor-pointer"
                  >
                    {tb.apply}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Image insertion */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const url = prompt(tb.imagePrompt);
            if (url && editor) {
              editor.chain().focus().insertContent(`\n\n![${tb.insertImage}](${url})\n\n`).run();
            }
          }}
          title={tb.insertImage}
          className="w-7.5 h-7.5 flex items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>

        {/* Media / Video */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (editor) {
              editor.chain().focus().insertContent(`\n\n${tb.mediaSnippet}\n\n`).run();
            }
          }}
          title={tb.insertMediaNote}
          className="w-7.5 h-7.5 flex items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <Film className="w-3.5 h-3.5" />
        </button>

        {/* Blockquote */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (editor) {
              editor.chain().focus().toggleBlockquote().run();
            } else {
              handleAction('quote');
            }
          }}
          title={tb.quote}
          className={`w-7.5 h-7.5 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
            isQuote ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'
          }`}
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        {/* Table */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (editor) {
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
            }
          }}
          title={tb.insertTable}
          className={`w-7.5 h-7.5 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
            isTable ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
        </button>

        {/* More Elements Dropdown */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggleMenu('more-elements')}
            title={tb.extraElements}
            className={`w-5.5 h-7.5 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
              activeMenu === 'more-elements' ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'
            }`}
          >
            <MoreVertical className="w-3 h-3" />
          </button>

          <AnimatePresence>
            {activeMenu === 'more-elements' && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full left-0 mt-1.5 w-44 rounded-xl bg-[#1c1c20] border border-[#2e2e34] shadow-2xl p-1.5 flex flex-col gap-0.5 z-50 text-neutral-300 text-xs"
              >
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor?.chain().focus().setHorizontalRule().run();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-white/10 hover:text-white flex items-center gap-2 cursor-pointer"
                >
                  <span className="font-mono text-neutral-400">—</span>
                  <span>{tb.divider}</span>
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor?.chain().focus().toggleCodeBlock().run();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-white/10 hover:text-white flex items-center gap-2 cursor-pointer"
                >
                  <CodeIcon className="w-3.5 h-3.5" />
                  <span>{tb.codeBlock}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      </div>

      {/* Right Action Cluster with Full-Height Separator Line & Full-Edge Preview/Edit Button */}
      <div className="flex items-center h-full shrink-0">
        <div className="hidden sm:flex items-center gap-0.5 px-2">
          {/* Undo */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={!canUndo}
            title={tb.undo}
            className={`w-7.5 h-7.5 flex items-center justify-center rounded-md transition-colors ${
              canUndo
                ? 'hover:bg-white/10 hover:text-white cursor-pointer'
                : 'opacity-30 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          {/* Redo */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={!canRedo}
            title={tb.redo}
            className={`w-7.5 h-7.5 flex items-center justify-center rounded-md transition-colors ${
              canRedo
                ? 'hover:bg-white/10 hover:text-white cursor-pointer'
                : 'opacity-30 cursor-not-allowed'
            }`}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          {/* Code / Raw Markdown toggle */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onToggleRawMode}
            title={isRawMode ? tb.rawModeWysiwyg : tb.rawModeMarkdown}
            className={`w-7.5 h-7.5 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
              isRawMode ? 'bg-white/20 text-white font-mono' : 'hover:bg-white/10 hover:text-white'
            }`}
          >
            <Brackets className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* FULL HEIGHT VERTICAL DIVIDER LINE FROM TOP TO BOTTOM OF TOOLBAR */}
        <div className="w-[1px] h-full bg-[#222225] shrink-0" />

        {/* FULL BUTTON FILLING THE ENTIRE RIGHT CORNER OF THE CARD WITHOUT PILL BACKGROUND */}
        <button
          type="button"
          onClick={onTogglePreview}
          title={isPreviewMode ? t.editTooltip : t.previewTooltip}
          className={`h-full px-3.5 sm:px-6 flex items-center gap-2 text-xs font-normal transition-colors cursor-pointer select-none rounded-tr-[20px] ${
            isPreviewMode
              ? 'text-neutral-300 hover:text-white hover:bg-white/[0.04]'
              : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/[0.08]'
          }`}
        >
          {isPreviewMode ? (
            <>
              <Edit3 className="w-3.5 h-3.5 text-neutral-300" />
              <span className="hidden xs:inline sm:inline">{t.editBtn}</span>
            </>
          ) : (
            <>
              <FileSearch className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xs:inline sm:inline">{t.previewBtn}</span>
            </>
          )}
        </button>
      </div>
    </div>

    {/* Row 2: Mobile Secondary Formatting & History Toolbar */}
    <AnimatePresence>
      {isMobileMoreOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="sm:hidden border-t border-[#222225] bg-[#151518] px-2.5 py-1.5 flex items-center flex-wrap gap-1 w-full z-20 text-neutral-400"
        >
          {/* Strikethrough */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            title={tb.strike}
            className={`w-7.5 h-7.5 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
              isStrike ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'
            }`}
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          {/* Underline */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            title={tb.underline}
            className={`w-7.5 h-7.5 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
              isUnderline ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'
            }`}
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>

          {/* Code */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleCode().run()}
            title={tb.inlineCode}
            className={`w-7.5 h-7.5 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
              isCode ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'
            }`}
          >
            <CodeIcon className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-[#2b2b30] shrink-0 mx-0.5" />

          {/* Bullet List */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            title={tb.bulletList}
            className={`w-7.5 h-7.5 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
              isBulletList ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>

          {/* Ordered List */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            title={tb.orderedList}
            className={`w-7.5 h-7.5 flex items-center justify-center rounded-md transition-colors cursor-pointer font-mono text-xs ${
              isOrderedList ? 'bg-white/20 text-white font-bold' : 'hover:bg-white/10 hover:text-white'
            }`}
          >
            1.
          </button>

          {/* Align Left */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor?.chain().focus().setTextAlign('left').run()}
            title={tb.alignLeft}
            className={`w-7.5 h-7.5 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
              currentAlign === 'left' ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>

          {/* Align Center */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor?.chain().focus().setTextAlign('center').run()}
            title={tb.alignCenter}
            className={`w-7.5 h-7.5 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
              currentAlign === 'center' ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'
            }`}
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-[#2b2b30] shrink-0 mx-0.5" />

          {/* Link */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const url = prompt(tb.insertLink, editor?.getAttributes('link').href || '');
              if (url !== null) {
                if (url.trim() === '') {
                  editor?.chain().focus().unsetLink().run();
                } else {
                  const href = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
                  editor?.chain().focus().setLink({ href }).run();
                }
              }
            }}
            title={tb.linkTooltip}
            className={`w-7.5 h-7.5 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
              editor?.isActive('link') ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>

          {/* Image */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const url = prompt(tb.imagePrompt);
              if (url && editor) {
                editor.chain().focus().insertContent(`\n\n![${tb.insertImage}](${url})\n\n`).run();
              }
            }}
            title={tb.insertImage}
            className="w-7.5 h-7.5 flex items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>

          {/* Video */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (editor) {
                editor.chain().focus().insertContent(`\n\n${tb.mediaSnippet}\n\n`).run();
              }
            }}
            title={tb.insertMediaNote}
            className="w-7.5 h-7.5 flex items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <Film className="w-3.5 h-3.5" />
          </button>

          {/* Quote */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (editor) {
                editor.chain().focus().toggleBlockquote().run();
              } else {
                handleAction('quote');
              }
            }}
            title={tb.quote}
            className={`w-7.5 h-7.5 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
              isQuote ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'
            }`}
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          {/* Table */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (editor) {
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
              }
            }}
            title={tb.insertTable}
            className={`w-7.5 h-7.5 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
              isTable ? 'bg-white/20 text-white' : 'hover:bg-white/10 hover:text-white'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-[#2b2b30] shrink-0 mx-0.5" />

          {/* Undo */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={!canUndo}
            title={tb.undo}
            className={`w-7.5 h-7.5 flex items-center justify-center rounded-md transition-colors ${
              canUndo ? 'hover:bg-white/10 hover:text-white cursor-pointer' : 'opacity-30 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          {/* Redo */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={!canRedo}
            title={tb.redo}
            className={`w-7.5 h-7.5 flex items-center justify-center rounded-md transition-colors ${
              canRedo ? 'hover:bg-white/10 hover:text-white cursor-pointer' : 'opacity-30 cursor-not-allowed'
            }`}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          {/* Raw markdown toggle */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onToggleRawMode}
            title={isRawMode ? tb.rawModeWysiwyg : tb.rawModeMarkdown}
            className={`w-7.5 h-7.5 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
              isRawMode ? 'bg-white/20 text-white font-mono' : 'hover:bg-white/10 hover:text-white'
            }`}
          >
            <Brackets className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
}
