'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Eraser,
  Bold,
  Italic,
  Type,
  Palette,
  MoreVertical,
  List,
  AlignLeft,
  Pilcrow,
  Link2,
  Image,
  Smile,
  Film,
  Quote,
  Table,
  Undo2,
  Redo2,
  Brackets,
  Save,
  FileSearch,
  Edit3,
  ChevronDown
} from 'lucide-react';

interface EditorToolbarProps {
  onFormat?: (command: string) => void;
  isPreviewMode?: boolean;
  onTogglePreview?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

export function EditorToolbar({
  onFormat,
  isPreviewMode = false,
  onTogglePreview,
  onSave,
  isSaved = false
}: EditorToolbarProps) {
  const handleAction = (cmd: string) => {
    if (onFormat) onFormat(cmd);
  };

  return (
    <div className="h-12 px-2.5 sm:px-3 border-b border-[#222225] bg-[#121214] flex items-center justify-between text-neutral-400 select-none overflow-x-auto no-scrollbar gap-1.5 sm:gap-2">
      {/* Left Formatting Cluster */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={() => handleAction('clear')}
          title="Очистить форматирование"
          className="w-7.5 h-7.5 flex items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <Eraser className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => handleAction('bold')}
          title="Жирный (Bold)"
          className="w-7.5 h-7.5 flex items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer font-bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => handleAction('italic')}
          title="Курсив (Italic)"
          className="w-7.5 h-7.5 flex items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => handleAction('heading')}
          title="Заголовок"
          className="h-7.5 px-1 flex items-center gap-0.5 rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <div className="flex items-baseline font-bold leading-none text-[13px] tracking-tighter">
            <span>T</span><span className="text-[9px]">T</span>
          </div>
          <ChevronDown className="w-2 h-2 opacity-70 ml-0.5" />
        </button>

        <button
          type="button"
          onClick={() => handleAction('color')}
          title="Цвет текста / палитра"
          className="w-7.5 h-7.5 flex items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <Palette className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => handleAction('more-styles')}
          title="Дополнительные стили"
          className="w-5.5 h-7.5 flex items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <MoreVertical className="w-3 h-3" />
        </button>

        <div className="w-[1px] h-4 bg-[#2b2b30] shrink-0 mx-0.5" />

        {/* Structure & Media Cluster */}
        <button
          type="button"
          onClick={() => handleAction('bullet-list')}
          title="Маркированный список"
          className="h-7.5 px-1 flex items-center gap-0.5 rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <List className="w-3.5 h-3.5" />
          <ChevronDown className="w-2 h-2 opacity-70 ml-0.5" />
        </button>

        <button
          type="button"
          onClick={() => handleAction('align')}
          title="Выравнивание текста"
          className="h-7.5 px-1 flex items-center gap-0.5 rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <AlignLeft className="w-3.5 h-3.5" />
          <ChevronDown className="w-2 h-2 opacity-70 ml-0.5" />
        </button>

        <button
          type="button"
          onClick={() => handleAction('paragraph')}
          title="Параграф"
          className="h-7.5 px-1 flex items-center gap-0.5 rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <Pilcrow className="w-3.5 h-3.5" />
          <ChevronDown className="w-2 h-2 opacity-70 ml-0.5" />
        </button>

        <div className="w-[1px] h-4 bg-[#2b2b30] shrink-0 mx-0.5" />

        <button
          type="button"
          onClick={() => handleAction('link')}
          title="Вставить ссылку"
          className="w-7.5 h-7.5 flex items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => handleAction('image')}
          title="Вставить изображение"
          className="w-7.5 h-7.5 flex items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <Image className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => handleAction('emoji')}
          title="Символы / иконки"
          className="w-7.5 h-7.5 flex items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <Smile className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => handleAction('media')}
          title="Медиа / видео"
          className="w-7.5 h-7.5 flex items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <Film className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => handleAction('quote')}
          title="Цитата"
          className="w-7.5 h-7.5 flex items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => handleAction('table')}
          title="Таблица"
          className="w-7.5 h-7.5 flex items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <Table className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => handleAction('more-elements')}
          title="Дополнительные элементы"
          className="w-5.5 h-7.5 flex items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <MoreVertical className="w-3 h-3" />
        </button>
      </div>

      {/* Right Action Cluster */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={() => handleAction('undo')}
          title="Отменить (Undo)"
          className="w-7.5 h-7.5 flex items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => handleAction('redo')}
          title="Повторить (Redo)"
          className="w-7.5 h-7.5 flex items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => handleAction('code')}
          title="Режим разметки / код"
          className="w-7.5 h-7.5 flex items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <Brackets className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onSave}
          title={isSaved ? 'Сохранено' : 'Сохранить'}
          className={`h-7.5 px-1.5 flex items-center gap-0.5 rounded-md transition-colors cursor-pointer ${
            isSaved ? 'text-emerald-400 bg-emerald-500/10' : 'hover:bg-white/10 hover:text-white'
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          <ChevronDown className="w-2 h-2 opacity-70" />
        </button>

        {/* Vertical divider line separating Preview/Edit button from toolbar */}
        <div className="w-[1px] h-4.5 bg-[#2b2b30] shrink-0 mx-1.5" />

        {/* Preview / Edit Button without border, separated by line */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          whileHover={{ scale: 1.02 }}
          onClick={onTogglePreview}
          className={`h-7.5 flex items-center gap-1.5 px-2 rounded-md transition-colors cursor-pointer text-xs font-normal select-none ${
            isPreviewMode
              ? 'bg-white/15 text-white'
              : 'text-neutral-300 hover:text-white hover:bg-white/10'
          }`}
        >
          {isPreviewMode ? (
            <>
              <Edit3 className="w-3.5 h-3.5 text-neutral-300" />
              <span>Редактировать</span>
            </>
          ) : (
            <>
              <FileSearch className="w-3.5 h-3.5 text-neutral-300" />
              <span>Предпросмотр</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
