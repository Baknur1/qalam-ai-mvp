'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileAudio, FileText, Zap, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputPanelProps {
  onProcess: (options: { text?: string; audioFile?: File; useMock?: boolean }) => void;
  isProcessing: boolean;
  className?: string;
}

export function InputPanel({
  onProcess,
  isProcessing,
  className
}: InputPanelProps) {
  const [activeMode, setActiveMode] = useState<'audio' | 'text'>('audio');
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setErrorMsg(null);
    const validExtensions = ['.mp3', '.wav', '.m4a'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setErrorMsg('Поддерживаются только аудиоформаты: .mp3, .wav, .m4a');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('Размер файла превышает лимит 25 МБ');
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeMode === 'audio' && selectedFile) {
      onProcess({ audioFile: selectedFile });
    } else if (activeMode === 'text' && textInput.trim()) {
      onProcess({ text: textInput.trim() });
    }
  };

  return (
    <div className={cn('p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-sm', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>Входящий материал редакции</span>
          </h2>
          <p className="text-xs text-slate-400">
            Загрузите аудиозапись интервью, вставьте текст брифинга или запустите готовый казахстанский кейс
          </p>
        </div>

        {/* Demo button */}
        <button
          type="button"
          onClick={() => onProcess({ useMock: true })}
          disabled={isProcessing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] select-none"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Запустить демо-кейс (Казахстан)</span>
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-2 mb-4 p-1 rounded-xl bg-slate-950/60 border border-slate-800/80 w-fit">
        <button
          type="button"
          onClick={() => setActiveMode('audio')}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            activeMode === 'audio'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <FileAudio className="w-3.5 h-3.5" />
          <span>Аудиофайл (.mp3, .wav, .m4a)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('text')}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            activeMode === 'text'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Текст / Пресс-релиз</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {activeMode === 'audio' ? (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".mp3,.wav,.m4a,audio/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            {!selectedFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all',
                  isDragging
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/70'
                )}
              >
                <div className="p-3 rounded-full bg-slate-800/80 text-blue-400 mb-3 shadow-inner">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-200 mb-1">
                  Перетащите аудиозапись сюда или нажмите для выбора
                </div>
                <div className="text-xs text-slate-400">
                  Поддерживаются MP3, WAV, M4A до 25 МБ (Казахский / Русский языки)
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <FileAudio className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-200 truncate max-w-[280px] sm:max-w-[400px]">
                      {selectedFile.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} МБ • Готов к распознаванию Groq Whisper
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <textarea
              rows={4}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Вставьте сюда сырой текст интервью, расшифровку диктофона или пресс-релиз государственного органа..."
              className="w-full p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm text-slate-200 placeholder-slate-500 leading-relaxed resize-y font-normal"
            />
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="submit"
            disabled={isProcessing || (activeMode === 'audio' ? !selectedFile : !textInput.trim())}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-600/30 transition-all select-none"
          >
            <span>Запустить анализ агентами</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
