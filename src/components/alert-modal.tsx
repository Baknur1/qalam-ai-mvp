'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  hint?: string;
  hintPrefix?: string;
  type?: 'warning' | 'error' | 'info';
  confirmText?: string;
}

export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  hint,
  hintPrefix,
  type = 'warning',
  confirmText = 'Понятно'
}: AlertModalProps) {
  if (!isOpen) return null;

  const iconConfig = {
    warning: {
      icon: AlertTriangle,
      badgeClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
    },
    error: {
      icon: AlertCircle,
      badgeClass: 'bg-red-500/15 text-red-400 border border-red-500/30'
    },
    info: {
      icon: Info,
      badgeClass: 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
    }
  }[type];

  const IconComponent = iconConfig.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-md rounded-[24px] bg-[#141417] border border-[#2c2c30] p-6 sm:p-7 shadow-2xl flex flex-col text-left z-10"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconConfig.badgeClass}`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-white tracking-tight">
                {title}
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Message Body */}
          <div className="mt-4 text-sm text-neutral-300 leading-relaxed font-normal">
            {message}
          </div>

          {/* Optional Helpful Hint */}
          {hint && (
            <div className="mt-4 p-3 rounded-xl bg-white/[0.04] border border-white/[0.07] text-xs text-neutral-400 leading-relaxed">
              <span className="text-neutral-200 font-medium">{hintPrefix || 'Подсказка:'} </span>
              {hint}
            </div>
          )}

          {/* Action button */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white text-black font-medium text-xs sm:text-sm px-6 py-2.5 hover:bg-neutral-200 transition-colors cursor-pointer shadow-lg shadow-white/10"
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

