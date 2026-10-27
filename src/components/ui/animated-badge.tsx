'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertTriangle, UserCheck, Hash, Quote, Info, X } from 'lucide-react';
import { VerificationFlag } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AnimatedBadgeProps {
  flag: VerificationFlag;
  onToggleVerify: (id: string) => void;
  className?: string;
  showDetails?: boolean;
}

export function AnimatedBadge({
  flag,
  onToggleVerify,
  className
}: AnimatedBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const typeConfig = {
    claim: {
      label: 'Фактчек утверждения',
      icon: AlertTriangle,
      unverifiedClass: 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25',
      indicatorClass: 'bg-amber-400'
    },
    entity: {
      label: 'Персона / Ведомство',
      icon: UserCheck,
      unverifiedClass: 'bg-sky-500/15 border-sky-500/30 text-sky-300 hover:bg-sky-500/25',
      indicatorClass: 'bg-sky-400'
    },
    number: {
      label: 'Сумма ₸ / Цифры / Даты',
      icon: Hash,
      unverifiedClass: 'bg-purple-500/15 border-purple-500/30 text-purple-300 hover:bg-purple-500/25',
      indicatorClass: 'bg-purple-400'
    },
    quote: {
      label: 'Точность цитаты',
      icon: Quote,
      unverifiedClass: 'bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/25',
      indicatorClass: 'bg-rose-400'
    }
  };

  const currentType = typeConfig[flag.type] || typeConfig.claim;
  const IconComponent = flag.verified ? Check : currentType.icon;

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <motion.button
        type="button"
        layout
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors select-none shadow-sm cursor-pointer',
          flag.verified
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
            : currentType.unverifiedClass
        )}
      >
        <motion.span
          key={flag.verified ? 'verified' : 'unverified'}
          initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center"
        >
          <IconComponent className="w-3.5 h-3.5" />
        </motion.span>

        <span className="truncate max-w-[150px] font-semibold">{flag.text}</span>

        {flag.verified ? (
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-950/60 px-1 rounded">
            Verified
          </span>
        ) : (
          <span className="relative flex h-2 w-2">
            <span
              className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                currentType.indicatorClass
              )}
            />
            <span
              className={cn(
                'relative inline-flex rounded-full h-2 w-2',
                currentType.indicatorClass
              )}
            />
          </span>
        )}
      </motion.button>

      {/* Popover Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="absolute left-0 top-full mt-2 z-50 w-80 p-3.5 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl backdrop-blur-md text-slate-200"
          >
            <div className="flex items-start justify-between gap-2 pb-2 mb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                <span>{currentType.label}</span>
                <span className="text-[10px] text-slate-500 font-mono">[{flag.timestamp}]</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="text-slate-400 hover:text-white p-0.5 rounded-md hover:bg-slate-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Фрагмент: </span>
                <span className="text-amber-200 font-medium">«{flag.text}»</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
                <div className="text-[11px] text-slate-400 font-medium mb-1">Причина проверки:</div>
                <div className="text-slate-300 leading-relaxed">{flag.reason}</div>
              </div>

              {flag.suggestedCorrection && (
                <div className="p-2 rounded-lg bg-blue-950/30 border border-blue-800/40 text-[11px]">
                  <span className="text-blue-300 font-semibold">Справка / Рекомендация: </span>
                  <span className="text-blue-200/90">{flag.suggestedCorrection}</span>
                </div>
              )}

              {flag.verified && flag.verifiedBy && (
                <div className="text-[11px] text-emerald-400 flex items-center gap-1 pt-1">
                  <Check className="w-3 h-3" />
                  <span>Подтверждено: {flag.verifiedBy}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onToggleVerify(flag.id);
                  }}
                  className={cn(
                    'w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95',
                    flag.verified
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  )}
                >
                  {flag.verified ? (
                    <>
                      <X className="w-3.5 h-3.5 text-slate-400" />
                      <span>Отменить верификацию</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>✓ Подтвердить факт (Editor Verified)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
