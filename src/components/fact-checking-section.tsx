'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FactCheckItem, FactStatus, QuickFixType, OutputLanguage } from '@/lib/types';
import { FACT_CHECK_ITEMS } from '@/lib/fact-checking-data';
import { TRANSLATIONS } from '@/lib/translations';

interface FactCheckingSectionProps {
  facts?: FactCheckItem[];
  decisions?: Record<string, FactStatus>;
  onDecision?: (flagId: string, decision: FactStatus) => void;
  onQuickFix?: (flagId: string, fixType: QuickFixType) => void;
  hoveredFactId?: string | null;
  onHoverFact?: (flagId: string | null) => void;
  selectedFactId?: string | null;
  onSelectFact?: (flagId: string | null) => void;
  isLoading?: boolean;
  visibleCardsCount?: number;
  currentLang?: OutputLanguage;
}

export function FactCheckingSection({
  facts = FACT_CHECK_ITEMS,
  decisions: externalDecisions,
  onDecision,
  onQuickFix,
  hoveredFactId,
  onHoverFact,
  selectedFactId,
  onSelectFact,
  isLoading = false,
  visibleCardsCount = 4,
  currentLang = 'ru'
}: FactCheckingSectionProps) {
  const t = TRANSLATIONS[currentLang]?.factChecking || TRANSLATIONS.ru.factChecking;

  // Internal state fallback if not controlled from page
  const [internalDecisions, setInternalDecisions] = useState<Record<string, FactStatus>>({
    'fc-1': 'approved',
    'fc-2': 'pending',
    'fc-3': 'pending',
    'fc-4': 'pending'
  });

  const decisions = externalDecisions || internalDecisions;
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [activeQuickFixCardId, setActiveQuickFixCardId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Auto-scroll to selected card when clicked from Lead Draft
  useEffect(() => {
    if (selectedFactId && cardRefs.current[selectedFactId]) {
      cardRefs.current[selectedFactId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedFactId]);

  // Close tooltip on outside click
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-fact-tooltip]')) {
        setActiveTooltip(null);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  // Keyboard shortcut: Escape closes modal or tooltip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveTooltip(null);
        setActiveQuickFixCardId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleApprove = (id: string) => {
    if (onDecision) {
      const current = decisions[id] || 'pending';
      const nextDecision: FactStatus = current === 'approved' ? 'pending' : 'approved';
      onDecision(id, nextDecision);
    } else {
      setInternalDecisions((prev) => ({
        ...prev,
        [id]: prev[id] === 'approved' ? 'pending' : 'approved'
      }));
    }
    // Close modal if open for this card
    if (activeQuickFixCardId === id) {
      setActiveQuickFixCardId(null);
    }
  };

  const handleDeclineClick = (id: string) => {
    // Open the action selection modal
    setActiveQuickFixCardId(id);
  };

  const handleExecuteQuickFix = (id: string, fixType: QuickFixType | 'decline_only') => {
    if (fixType === 'decline_only') {
      if (onDecision) {
        onDecision(id, 'declined');
      } else {
        setInternalDecisions((prev) => ({ ...prev, [id]: 'declined' }));
      }
    } else {
      if (onQuickFix) {
        onQuickFix(id, fixType);
      } else {
        setInternalDecisions((prev) => ({
          ...prev,
          [id]: fixType === 'remove' ? 'declined' : 'fixed'
        }));
      }
    }
    setActiveQuickFixCardId(null);
  };

  // Sliced cards based on visible count (memoized to prevent new array reference on each render)
  const activeCards = useMemo(() => facts.slice(0, visibleCardsCount), [facts, visibleCardsCount]);

  // Counter of approved / fixed cards
  const verifiedCount = activeCards.filter(
    (c) => decisions[c.id] === 'approved' || decisions[c.id] === 'fixed'
  ).length;

  const activeQuickFixCard = facts.find((c) => c.id === activeQuickFixCardId);

  // Dynamic layout for tooltips so they are always within card bounds and never clipped
  const [tooltipLayouts, setTooltipLayouts] = useState<
    Record<string, { left: number; width: number; arrowLeft: number }>
  >({});
  const pillRefs = useRef<Record<string, HTMLElement | null>>({});

  const computeTooltipLayout = useCallback((cardId: string) => {
    const cardEl = cardRefs.current[cardId];
    const pillEl = pillRefs.current[cardId];
    if (!cardEl || !pillEl) return null;

    const cardRect = cardEl.getBoundingClientRect();
    const pillRect = pillEl.getBoundingClientRect();

    const safePadding = 12; // safe margin from card edges
    const maxAvailableWidth = Math.max(200, cardRect.width - safePadding * 2);
    const tooltipWidth = Math.min(310, maxAvailableWidth);

    const minLeft = cardRect.left - pillRect.left + safePadding;
    const maxRight = cardRect.right - pillRect.left - safePadding;

    // Desired: start at left of pill (0)
    // If it exceeds maxRight, shift left
    let left = Math.min(0, maxRight - tooltipWidth);
    // Don't shift past minLeft
    left = Math.max(minLeft, left);

    // Arrow points directly to center of pill
    const pillCenter = pillRect.width / 2;
    const arrowLeft = Math.max(16, Math.min(tooltipWidth - 16, pillCenter - left));

    return { left, width: tooltipWidth, arrowLeft };
  }, []);

  const updateLayout = useCallback((cardId: string) => {
    const layout = computeTooltipLayout(cardId);
    if (!layout) return;
    setTooltipLayouts((prev) => {
      const p = prev[cardId];
      if (
        p &&
        p.left === layout.left &&
        p.width === layout.width &&
        p.arrowLeft === layout.arrowLeft
      ) {
        return prev;
      }
      return { ...prev, [cardId]: layout };
    });
  }, [computeTooltipLayout]);

  const updateAllLayouts = useCallback(() => {
    const newLayouts: Record<string, { left: number; width: number; arrowLeft: number }> = {};
    activeCards.forEach((card) => {
      const layout = computeTooltipLayout(card.id);
      if (layout) {
        newLayouts[card.id] = layout;
      }
    });

    setTooltipLayouts((prev) => {
      const keys = Object.keys(newLayouts);
      if (keys.length === 0) return prev;
      const prevKeys = Object.keys(prev);
      if (keys.length !== prevKeys.length) return newLayouts;
      const isSame = keys.every((k) => {
        const p = prev[k];
        const n = newLayouts[k];
        return p && p.left === n.left && p.width === n.width && p.arrowLeft === n.arrowLeft;
      });
      return isSame ? prev : newLayouts;
    });
  }, [activeCards, computeTooltipLayout]);

  useEffect(() => {
    const rAF = requestAnimationFrame(() => {
      updateAllLayouts();
    });
    const timer = setTimeout(updateAllLayouts, 80);
    const timer2 = setTimeout(updateAllLayouts, 300);
    window.addEventListener('resize', updateAllLayouts);
    return () => {
      cancelAnimationFrame(rAF);
      clearTimeout(timer);
      clearTimeout(timer2);
      window.removeEventListener('resize', updateAllLayouts);
    };
  }, [updateAllLayouts]);

  return (
    <div className="flex flex-col w-full select-none">
      {/* Title & Verified Counter */}
      <div className="flex items-center justify-between mb-5 h-8">
        <h2 className="text-[28px] font-normal text-white tracking-tight flex items-center gap-2">
          <span>{t.title}</span>
        </h2>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-neutral-400">{t.verifiedLabel}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              verifiedCount === activeCards.length
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            {t.verifiedOf(verifiedCount, activeCards.length)}
          </span>
        </div>
      </div>

      {/* Cards list with scroll container */}
      <div className="flex flex-col gap-4 max-h-[820px] overflow-y-auto overflow-x-hidden pr-1 sm:pr-1.5 pb-8 scrollbar-thin scrollbar-thumb-neutral-800">
        {isLoading ? (
          /* Skeletons */
          [1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="shrink-0 rounded-[20px] bg-[#121214] border border-[#2a2a2a] flex flex-col justify-between overflow-hidden animate-pulse h-40 sm:h-44"
            >
              <div className="p-4 sm:p-5 flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="h-5 w-16 rounded-[7px] bg-white/[0.08]" />
                  <div className="h-4 w-20 rounded bg-white/[0.05]" />
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="h-3.5 w-full rounded bg-white/[0.04]" />
                  <div className="h-3.5 w-11/12 rounded bg-white/[0.04]" />
                  <div className="h-3.5 w-4/6 rounded bg-white/[0.04]" />
                </div>
              </div>
              <div className="w-full border-t border-[#222225] px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-end gap-2.5 bg-[#121214]">
                <div className="h-8 w-20 rounded-[8px] bg-white/[0.05]" />
                <div className="h-8 w-20 rounded-[8px] bg-white/[0.05]" />
              </div>
            </div>
          ))
        ) : (
          activeCards.map((card) => {
            const currentDecision = decisions[card.id] || 'pending';
            const isApproved = currentDecision === 'approved';
            const isFixed = currentDecision === 'fixed';
            const isDeclined = currentDecision === 'declined';

            const tCard = card.translations?.[currentLang];
            const speaker = tCard?.speaker || card.speaker;
            const textBefore = tCard?.textBefore ?? card.textBefore;
            const underlinedPhrase = tCard?.underlinedPhrase ?? card.underlinedPhrase;
            const textMid = tCard?.textMid ?? card.textMid;
            const highlightedFact = tCard?.highlightedFact ?? card.highlightedFact;
            const textAfter = tCard?.textAfter ?? card.textAfter;
            const factCheckInfo = tCard?.factCheckInfo ?? card.factCheckInfo;

            return (
              <div
                key={card.id}
                ref={(el) => {
                  cardRefs.current[card.id] = el;
                }}
                onMouseEnter={() => {
                  if (onHoverFact && hoveredFactId !== card.id) {
                    onHoverFact(card.id);
                  }
                }}
                onMouseLeave={() => {
                  if (onHoverFact && hoveredFactId === card.id) {
                    onHoverFact(null);
                  }
                }}
                className={`shrink-0 rounded-[20px] bg-[#121214] border flex flex-col relative transition-all duration-200 ${
                  isApproved
                    ? 'border-emerald-600/40 bg-gradient-to-b from-[#121214] to-[#111813]'
                    : isFixed
                    ? 'border-sky-500/40 bg-gradient-to-b from-[#121214] to-[#0f172a]'
                    : isDeclined
                    ? 'border-red-600/30 bg-gradient-to-b from-[#121214] to-[#181112]'
                    : 'border-[#2a2a2a]'
                } ${
                  activeTooltip === card.id || activeQuickFixCardId === card.id
                    ? 'z-40'
                    : 'hover:z-30'
                }`}
              >
                {/* Top content area */}
                <div className="p-4 sm:p-5 flex flex-col gap-2.5">
                  {/* Speaker timecode badge + speaker name */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {/* Static timecode badge with speaker icon */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[7px] border border-[#3e3e3e] text-xs sm:text-[12.5px] text-white bg-transparent select-none">
                        <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{card.time}</span>
                      </div>

                      <span className="text-sm sm:text-[15px] font-normal text-white">
                        {speaker}
                      </span>
                    </div>
                  </div>

                  {/* Excerpt with interactive highlighted fact pill */}
                  <div className="text-sm sm:text-[14px] text-neutral-200 leading-[1.6] font-normal">
                    {textBefore}
                    {underlinedPhrase && (
                      <span className="underline decoration-1 underline-offset-4 decoration-neutral-300 text-white">
                        {underlinedPhrase}
                      </span>
                    )}
                    {textMid}
                    {/* Combined fact check pill with hover tooltip and click toggle */}
                    <span
                      ref={(el) => {
                        pillRefs.current[card.id] = el;
                      }}
                      data-fact-tooltip={card.id}
                      className="relative group inline-block align-baseline"
                      onMouseEnter={() => {
                        updateLayout(card.id);
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateLayout(card.id);
                          setActiveTooltip((prev) => (prev === card.id ? null : card.id));
                          if (onSelectFact) onSelectFact(card.id);
                        }}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs sm:text-[13px] font-normal mx-0.5 transition-all cursor-pointer ${
                          isApproved || isFixed
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/60'
                            : isDeclined
                            ? 'bg-red-500/15 text-red-300 line-through border border-red-400/60'
                            : 'bg-amber-500/15 text-amber-200 border border-amber-500/40'
                        }`}
                      >
                        {highlightedFact}
                      </button>

                      {/* Tooltip on hover or click (Clean text, no icons, dynamic clamping) */}
                      {(() => {
                        const layout = tooltipLayouts[card.id] || {
                          left: 0,
                          width: 290,
                          arrowLeft: 24
                        };

                        return (
                          <div
                            style={{
                              left: `${layout.left}px`,
                              width: `${layout.width}px`
                            }}
                            className={`absolute top-full mt-2.5 p-3.5 rounded-xl bg-[#1c1c20] border border-[#38383e] shadow-2xl transition-opacity duration-200 z-50 text-left ${
                              activeTooltip === card.id
                                ? 'opacity-100 pointer-events-auto visible'
                                : 'opacity-0 pointer-events-none invisible group-hover:opacity-100 group-hover:pointer-events-auto group-hover:visible'
                            }`}
                          >
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2b2b32]">
                              <span className="text-xs font-medium text-amber-400">
                                {factCheckInfo.title}
                              </span>
                            </div>
                            <div className="space-y-1.5 text-xs text-neutral-300 leading-snug">
                              <div>
                                <span className="text-neutral-400">{t.claimedLabel} </span>
                                <span className="text-white font-medium">
                                  {factCheckInfo.claimed}
                                </span>
                              </div>
                              <div>
                                <span className="text-neutral-400">{t.verifiedAuditLabel} </span>
                                <span className="text-emerald-400 font-medium">
                                  {factCheckInfo.verified}
                                </span>
                              </div>
                              <div className="pt-1 text-[11px] text-neutral-400 italic">
                                {t.sourceLabel} {factCheckInfo.source}
                              </div>
                            </div>
                            <div
                              style={{
                                left: `${layout.arrowLeft}px`,
                                transform: 'translateX(-50%)'
                              }}
                              className="absolute bottom-full border-4 border-transparent border-b-[#38383e]"
                            />
                          </div>
                        );
                      })()}
                    </span>
                    {textAfter}
                  </div>
                </div>

                {/* Footer buttons row */}
                <div className="w-full border-t border-[#222225] px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-end gap-2.5 bg-[#121214] rounded-b-[20px]">
                  {/* Decline Button */}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleDeclineClick(card.id)}
                    className={`px-4.5 py-1.5 rounded-[8px] text-xs sm:text-[13.5px] font-normal transition-all cursor-pointer flex items-center justify-center ${
                      isDeclined
                        ? 'bg-[#c93b3b] hover:bg-[#b53232] text-white border border-[#c93b3b]'
                        : 'border border-[#444444] text-white hover:border-red-400 hover:text-red-300 bg-transparent'
                    }`}
                  >
                    <span>{t.declineBtn}</span>
                  </motion.button>

                  {/* Approve Button */}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleApprove(card.id)}
                    className={`px-5 py-1.5 rounded-[8px] text-xs sm:text-[13.5px] font-normal transition-all cursor-pointer flex items-center justify-center ${
                      isApproved
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-600'
                        : isFixed
                        ? 'bg-sky-600 hover:bg-sky-500 text-white border border-sky-600'
                        : 'border border-[#444444] text-white hover:border-emerald-400 hover:text-emerald-300 bg-transparent'
                    }`}
                  >
                    <span>{isFixed ? t.fixedBtn : t.approveBtn}</span>
                  </motion.button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Decline Selection Modal (Clean neutral styling, no colors, no icons, translated) */}
      <AnimatePresence>
        {activeQuickFixCard && (() => {
          const tActiveCard = activeQuickFixCard.translations?.[currentLang];
          const modalSpeaker = tActiveCard?.speaker || activeQuickFixCard.speaker;
          const modalFact = tActiveCard?.highlightedFact || activeQuickFixCard.highlightedFact;

          return (
            <div
              onClick={() => setActiveQuickFixCardId(null)}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-2xl bg-[#141417] border border-[#2c2c34] shadow-2xl p-6 text-neutral-200"
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between pb-3.5 mb-4 border-b border-[#25252b]">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">
                      {t.modalTitle}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      {modalSpeaker} •{' '}
                      <span className="text-neutral-200">{modalFact}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveQuickFixCardId(null)}
                    className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer text-sm"
                  >
                    ✕
                  </button>
                </div>

                {/* Options List (Neutral dark rows, no colors, no icons) */}
                <div className="space-y-2.5 my-4">
                  <button
                    type="button"
                    onClick={() => handleExecuteQuickFix(activeQuickFixCard.id, 'apply_ai')}
                    className="w-full text-left p-3.5 rounded-xl bg-[#1a1a20] hover:bg-[#22222a] border border-[#2a2a34] hover:border-neutral-500 transition-all cursor-pointer group"
                  >
                    <div className="text-sm font-medium text-white">
                      {t.modalOpt1Title}
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                      {t.modalOpt1Desc}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExecuteQuickFix(activeQuickFixCard.id, 'footnote')}
                    className="w-full text-left p-3.5 rounded-xl bg-[#1a1a20] hover:bg-[#22222a] border border-[#2a2a34] hover:border-neutral-500 transition-all cursor-pointer group"
                  >
                    <div className="text-sm font-medium text-white">
                      {t.modalOpt2Title}
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                      {t.modalOpt2Desc}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExecuteQuickFix(activeQuickFixCard.id, 'remove')}
                    className="w-full text-left p-3.5 rounded-xl bg-[#1a1a20] hover:bg-[#22222a] border border-[#2a2a34] hover:border-neutral-500 transition-all cursor-pointer group"
                  >
                    <div className="text-sm font-medium text-white">
                      {t.modalOpt3Title}
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                      {t.modalOpt3Desc}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExecuteQuickFix(activeQuickFixCard.id, 'decline_only')}
                    className="w-full text-left p-3.5 rounded-xl bg-[#1a1a20] hover:bg-[#22222a] border border-[#2a2a34] hover:border-neutral-500 transition-all cursor-pointer group"
                  >
                    <div className="text-sm font-medium text-neutral-300 group-hover:text-white">
                      {t.modalOpt4Title}
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                      {t.modalOpt4Desc}
                    </p>
                  </button>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end pt-3 mt-4 border-t border-[#25252b]">
                  <button
                    type="button"
                    onClick={() => setActiveQuickFixCardId(null)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                  >
                    {t.modalCancel}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
