'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { TranscriptItem, VerificationFlag } from '@/lib/types';
import { AnimatedBadge } from './animated-badge';
import { cn } from '@/lib/utils';

interface TranscriptRowProps {
  item: TranscriptItem;
  flags: VerificationFlag[];
  onToggleVerify: (id: string) => void;
  className?: string;
}

export function TranscriptRow({
  item,
  flags,
  onToggleVerify,
  className
}: TranscriptRowProps) {
  const itemFlags = flags.filter(f => item.flagIds?.includes(f.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 transition-all shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-blue-400 bg-blue-950/40 border border-blue-900/50 px-2 py-0.5 rounded-md">
            <Volume2 className="w-3 h-3 text-blue-400" />
            {item.timestamp}
          </span>
          <span className="text-xs font-semibold text-slate-300">
            {item.speaker}
          </span>
        </div>

        {itemFlags.length > 0 && (
          <span className="text-[10px] text-slate-400">
            {itemFlags.length} {itemFlags.length === 1 ? 'маркер' : 'маркера'}
          </span>
        )}
      </div>

      <p className="text-sm text-slate-200 leading-relaxed font-normal">
        {item.text}
      </p>

      {itemFlags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2 border-t border-slate-800/60">
          {itemFlags.map((flag) => (
            <AnimatedBadge
              key={flag.id}
              flag={flag}
              onToggleVerify={onToggleVerify}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
