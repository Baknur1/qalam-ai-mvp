'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  textToCopy: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function CopyButton({
  textToCopy,
  label = 'Копировать',
  copiedLabel = 'Скопировано!',
  className,
  size = 'md'
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const isSmall = size === 'sm';

  return (
    <motion.button
      type="button"
      onClick={handleCopy}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={cn(
        'relative inline-flex items-center gap-2 rounded-xl font-medium transition-colors shadow-sm select-none border',
        isSmall ? 'text-xs py-1.5 px-3' : 'text-sm py-2 px-3.5',
        copied
          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
          : 'bg-slate-800/90 hover:bg-slate-700/90 border-slate-700 text-slate-200 hover:text-white',
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.div
            key="copied"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="flex items-center gap-1.5"
          >
            <Check className={cn('text-emerald-400', isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
            <span className="font-semibold text-emerald-300">{copiedLabel}</span>
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="flex items-center gap-1.5"
          >
            <Copy className={cn('text-slate-400 group-hover:text-white', isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
            <span>{label}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
