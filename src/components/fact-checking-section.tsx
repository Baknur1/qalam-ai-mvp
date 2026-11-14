'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Volume2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FactCheckItem, FactStatus, QuickFixType, OutputLanguage } from '@/lib/types';
import { FACT_CHECK_ITEMS } from '@/lib/fact-checking-data';
import { TRANSLATIONS } from '@/lib/translations';

function isGenericOrDummyUrl(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    const path = u.pathname.toLowerCase().replace(/\/+$/, '');
    const genericPaths = [
      '',
      '/calendar',
      '/calendar/upcoming',
      '/calendar/russia',
      '/releases',
      '/releases/russia',
      '/index',
      '/index.html',
      '/wiki',
      '/wiki/main_page',
      '/search',
      '/home'
    ];
    if (genericPaths.includes(path)) return true;
    if (u.hostname.includes('imdb.com')) {
      const isDeep = path.includes('/title/') || path.includes('/name/') || u.search.includes('q=');
      if (!isDeep) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function getSourceUrl(source: string, customUrl?: string, contextText?: string): string {
  // 1. If AI provided a genuine deep link (not a dummy calendar or root page), use it directly
  if (customUrl && (customUrl.startsWith('http://') || customUrl.startsWith('https://'))) {
    if (!isGenericOrDummyUrl(customUrl)) {
      return customUrl;
    }
  }

  const combined = `${source || ''} ${contextText || ''}`.toLowerCase();

  // 2. Exact deep reference mapping for specific topics:
  // Barbara Sher:
  if (combined.includes('barbara sher') || combined.includes('барбара шер') || combined.includes('barbarasher')) {
    return 'https://barbarasher.com';
  }

  // Paul Graham essays:
  if (combined.includes('identity small') || combined.includes('keep your identity small') || combined.includes('пол грэм') || combined.includes('paul graham')) {
    return 'https://paulgraham.com/identity.html';
  }
  if (combined.includes('makersschedule') || combined.includes("maker's schedule") || combined.includes('расписание творца')) {
    return 'https://paulgraham.com/makersschedule.html';
  }
  if (combined.includes('how to do great work') || combined.includes('greatwork')) {
    return 'https://paulgraham.com/greatwork.html';
  }
  if (combined.includes('do things that don') || combined.includes('не масштабируются')) {
    return 'https://paulgraham.com/ds.html';
  }

  // Otto Scharmer / MIT / Presencing Institute (Theory U):
  if (combined.includes('theory u') || combined.includes('теория ю') || combined.includes('теории ю') || combined.includes('otto scharmer') || combined.includes('отто шармер') || combined.includes('presencing')) {
    return 'https://www.presencing.org/theoryu';
  }

  // High Agency / George Mack:
  if (combined.includes('high agency') || combined.includes('агентност') || combined.includes('george mack')) {
    return 'https://twitter.com/george_mack';
  }

  // Yandex HR / Olympiads / Infrastructure:
  if (combined.includes('яндекс') || combined.includes('yandex')) {
    return 'https://yandex.ru/jobs';
  }

  // Favignana / Sicily:
  if (combined.includes('favignana') || combined.includes('фавиньян')) {
    return 'https://ru.wikipedia.org/wiki/Фавиньяна';
  }
  if (combined.includes('visit sicily') || combined.includes('сицили')) {
    return 'https://www.visitsicily.info/en/';
  }

  // Cambridge Historical Society:
  if (combined.includes('cambridge') || combined.includes('croissant du jour')) {
    return 'https://historycambridge.org/';
  }

  // Kazakhstan Ministry of Culture & Information / Budget allocation #412:
  if (combined.includes('культуры и информации') || combined.includes('мәдениет және ақпарат') || combined.includes('№412') || combined.includes('412')) {
    return 'https://www.gov.kz/memleket/entities/mam?lang=ru';
  }
  if (combined.includes('stat.gov.kz') || combined.includes('статистик')) {
    return 'https://stat.gov.kz/';
  }

  // 3. If source contains an explicit domain name (e.g. "BarbaraSher.com", "PaulGraham.com", "MIT.edu")
  const domainMatch = source?.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:com|org|kz|edu|gov|net|io|ru|info|me|ai)(?:\/[^\s)\]]*)?)/i);
  if (domainMatch && domainMatch[1]) {
    const rawDomain = domainMatch[1].replace(/^[./]+|[./]+$/g, '');
    const cleanDomain = rawDomain.toLowerCase();
    if (cleanDomain.includes('imdb.com')) {
      const quoteMatch = contextText?.match(/[«"]([^»"]+)[»"]/);
      const target = quoteMatch ? quoteMatch[1] : '';
      if (target) {
        return `https://www.imdb.com/find/?q=${encodeURIComponent(target.trim())}`;
      }
      return 'https://www.imdb.com';
    }
    return `https://${rawDomain}`;
  }

  // 4. Source by name:
  const lowerSource = (source || '').toLowerCase();
  const quoteMatch = contextText?.match(/[«"]([^»"]+)[»"]/);
  const target = quoteMatch ? quoteMatch[1] : '';

  if (lowerSource.includes('imdb')) {
    return target ? `https://www.imdb.com/find/?q=${encodeURIComponent(target)}` : 'https://www.imdb.com';
  }
  if (lowerSource.includes('кинопоиск')) {
    return target ? `https://www.kinopoisk.ru/index.php?kp_query=${encodeURIComponent(target)}` : 'https://www.kinopoisk.ru';
  }
  if (lowerSource.includes('wiki')) {
    return target ? `https://ru.wikipedia.org/w/index.php?search=${encodeURIComponent(target)}` : 'https://ru.wikipedia.org';
  }

  // 5. Clean query fallback
  const cleanSource = (source || '')
    .replace(/^(официальный сайт|официальный портал|архивы|реестр|сайт|официальные данные)\s+/i, '')
    .trim();

  return `https://www.google.com/search?q=${encodeURIComponent(`${cleanSource} ${target}`.trim())}`;
}

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
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activeQuickFixCardId, setActiveQuickFixCardId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const activeQuickFixCard = facts.find((c) => c.id === activeQuickFixCardId);

  // Dynamic layout for floating portal tooltips with fixed viewport coordinates
  const [tooltipLayouts, setTooltipLayouts] = useState<
    Record<string, { left: number; arrowLeft: number; isTop: boolean; top: number }>
  >({});
  const pillRefs = useRef<Record<string, HTMLElement | null>>({});

  const computeTooltipLayout = useCallback(
    (cardId: string) => {
      const pillEl = pillRefs.current[cardId];
      if (!pillEl) return null;

      const pillRect = pillEl.getBoundingClientRect();

      // Compact fixed width of 310px
      const tooltipWidth = 310;
      const pillCenter = pillRect.left + pillRect.width / 2;

      // Center tooltip relative to the highlighted pill, clamped within viewport edges
      let left = Math.round(pillCenter - tooltipWidth / 2);
      left = Math.max(12, Math.min(window.innerWidth - tooltipWidth - 12, left));

      // Arrow position relative to the tooltip box
      const arrowLeft = Math.round(Math.max(16, Math.min(tooltipWidth - 16, pillCenter - left)));

      // Estimated height of the tooltip ~230px
      const estimatedHeight = 230;
      const roomBelow = window.innerHeight - pillRect.bottom;
      const roomAbove = pillRect.top;

      // Flip upwards if there's not enough room below (less than ~220px) AND more room above
      const isTop = roomBelow < estimatedHeight && roomAbove > roomBelow;

      // Calculate fixed top position
      const top = isTop
        ? Math.round(pillRect.top - 8)
        : Math.round(pillRect.bottom + 8);

      return { left, arrowLeft, isTop, top };
    },
    []
  );

  const updateLayout = useCallback(
    (cardId: string) => {
      const layout = computeTooltipLayout(cardId);
      if (!layout) return;
      setTooltipLayouts((prev) => {
        const p = prev[cardId];
        if (
          p &&
          p.left === layout.left &&
          p.arrowLeft === layout.arrowLeft &&
          p.isTop === layout.isTop &&
          p.top === layout.top
        ) {
          return prev;
        }
        return { ...prev, [cardId]: layout };
      });
    },
    [computeTooltipLayout]
  );

  useEffect(() => {
    const currentId = activeTooltip || hoveredTooltip;
    if (!currentId) return;

    const handleScrollOrResize = () => {
      const layout = computeTooltipLayout(currentId);
      if (layout) {
        setTooltipLayouts((prev) => ({ ...prev, [currentId]: layout }));
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [activeTooltip, hoveredTooltip, computeTooltipLayout]);

  const handleTooltipOpen = useCallback(
    (cardId: string) => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = null;
      }
      const layout = computeTooltipLayout(cardId);
      if (layout) {
        setTooltipLayouts((prev) => ({ ...prev, [cardId]: layout }));
      }
      setHoveredTooltip(cardId);
    },
    [computeTooltipLayout]
  );

  const handleTooltipClose = useCallback(() => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    tooltipTimeoutRef.current = setTimeout(() => {
      setHoveredTooltip(null);
    }, 280);
  }, []);

  const updateAllLayouts = useCallback(() => {
    const newLayouts: Record<
      string,
      { left: number; arrowLeft: number; isTop: boolean; top: number }
    > = {};
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
        return (
          p &&
          p.left === n.left &&
          p.arrowLeft === n.arrowLeft &&
          p.isTop === n.isTop &&
          p.top === n.top
        );
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
          {isLoading ? (
            <div className="h-5 w-14 rounded-full bg-white/[0.06] animate-pulse" />
          ) : (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                verifiedCount === activeCards.length && activeCards.length > 0
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {t.verifiedOf(verifiedCount, activeCards.length)}
            </span>
          )}
        </div>
      </div>

      {/* Cards list container: natural overflow-visible for up to 3 cards, scrollable only for 4+ cards */}
      <div
        className={`flex flex-col gap-4 p-1 pb-1 transition-all ${
          activeCards.length > 3 || isLoading
            ? 'max-h-[820px] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800'
            : 'overflow-visible'
        }`}
      >
        {isLoading ? (
          /* High-Fidelity Fact Checking Skeletons matching real cards */
          [1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="shrink-0 rounded-[20px] bg-[#121214] border border-[#2a2a2a] flex flex-col justify-between overflow-hidden animate-pulse min-h-[172px]"
            >
              <div className="p-4 sm:p-5 flex flex-col gap-3">
                {/* Header: Timestamp badge + speaker */}
                <div className="flex items-center gap-2.5">
                  <div className="h-6 w-18 rounded-[8px] bg-white/[0.07] border border-white/[0.08]" />
                  <div className="h-4.5 w-28 rounded bg-white/[0.06]" />
                </div>
                {/* Body lines with amber fact check highlight block */}
                <div className="space-y-2 pt-0.5">
                  <div className="h-3.5 w-full rounded bg-white/[0.05]" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="h-3.5 w-20 rounded bg-white/[0.05]" />
                    <div className="h-4.5 w-44 rounded bg-amber-400/15 border border-amber-400/25" />
                    <div className="h-3.5 w-24 rounded bg-white/[0.05]" />
                  </div>
                  <div className="h-3.5 w-3/5 rounded bg-white/[0.04]" />
                </div>
              </div>
              {/* Footer: Bottom action bar with authentic button frames */}
              <div className="w-full border-t border-[#222225] px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-end gap-2.5 bg-[#121214]">
                <div className="h-[29px] w-[88px] rounded-[8px] bg-white/[0.03] border border-white/[0.08]" />
                <div className="h-[29px] w-[82px] rounded-[8px] bg-white/[0.03] border border-white/[0.08]" />
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
                  activeTooltip === card.id || hoveredTooltip === card.id || activeQuickFixCardId === card.id
                    ? 'z-50'
                    : 'hover:z-40'
                }`}
              >
                {/* Top content area with higher z-index so tooltip floats above card footer */}
                <div className="p-4 sm:p-5 flex flex-col gap-2.5 relative z-20">
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
                    {underlinedPhrase && card.id.startsWith('fc-') && !card.id.includes('custom') && (
                      <>
                        {' '}
                        <span className="underline decoration-1 underline-offset-4 decoration-neutral-300 text-white">
                          {underlinedPhrase}
                        </span>
                        {' '}
                      </>
                    )}
                    {textMid ? (textMid.startsWith(' ') ? textMid : ` ${textMid}`) : ''}
                    {/* Combined fact check inline highlight with click and hover handlers */}
                    <span
                      ref={(el) => {
                        pillRefs.current[card.id] = el;
                      }}
                      data-fact-tooltip={card.id}
                      className="inline"
                      onMouseEnter={() => handleTooltipOpen(card.id)}
                      onMouseLeave={handleTooltipClose}
                    >
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateLayout(card.id);
                          setActiveTooltip((prev) => (prev === card.id ? null : card.id));
                          if (onSelectFact) onSelectFact(card.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            updateLayout(card.id);
                            setActiveTooltip((prev) => (prev === card.id ? null : card.id));
                            if (onSelectFact) onSelectFact(card.id);
                          }
                        }}
                        className={`inline px-1 py-0.5 rounded-sm text-sm sm:text-[14px] font-normal transition-all cursor-pointer [box-decoration-break:clone] [-webkit-box-decoration-break:clone] ${
                          isApproved || isFixed
                            ? 'bg-emerald-500/15 text-emerald-200 underline decoration-2 underline-offset-[3px] decoration-emerald-400 hover:bg-emerald-500/25'
                            : isDeclined
                            ? 'bg-red-500/15 text-red-300 line-through decoration-2 decoration-red-400 opacity-70'
                            : 'bg-amber-400/15 text-amber-100 underline decoration-2 underline-offset-[3px] decoration-amber-400 hover:bg-amber-400/25 hover:decoration-amber-300'
                        }`}
                      >
                        {highlightedFact}
                      </span>
                    </span>
                    {textAfter ? textAfter.replace(/^\s+([.,!?;:])/, '$1') : ''}
                  </div>
                </div>

                {/* Footer buttons row */}
                <div className="w-full border-t border-[#222225] px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-end gap-2.5 bg-[#121214] rounded-b-[20px] relative z-10">
                  {/* Decline Button */}
                  <button
                    type="button"
                    onClick={() => handleDeclineClick(card.id)}
                    className={`px-4.5 py-1.5 rounded-[8px] text-xs sm:text-[13.5px] font-normal transition-colors cursor-pointer flex items-center justify-center ${
                      isDeclined
                        ? 'bg-[#c93b3b] hover:bg-[#b53232] text-white border border-[#c93b3b]'
                        : 'border border-[#444444] text-white hover:border-red-400 hover:text-red-300 bg-transparent'
                    }`}
                  >
                    <span>{t.declineBtn}</span>
                  </button>

                  {/* Approve Button */}
                  <button
                    type="button"
                    onClick={() => handleApprove(card.id)}
                    className={`px-5 py-1.5 rounded-[8px] text-xs sm:text-[13.5px] font-normal transition-colors cursor-pointer flex items-center justify-center ${
                      isApproved
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-600'
                        : isFixed
                        ? 'bg-sky-600 hover:bg-sky-500 text-white border border-sky-600'
                        : 'border border-[#444444] text-white hover:border-emerald-400 hover:text-emerald-300 bg-transparent'
                    }`}
                  >
                    <span>{isFixed ? t.fixedBtn : t.approveBtn}</span>
                  </button>
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

      {/* Floating Tooltip via Portal: crosses all container bounds without clipping or forcing scroll */}
      {mounted && typeof document !== 'undefined' && (() => {
        const openCardId = activeTooltip || hoveredTooltip;
        if (!openCardId) return null;
        const card = activeCards.find((c) => c.id === openCardId);
        if (!card) return null;

        const currentDecision = decisions[card.id] || 'pending';
        const isApproved = currentDecision === 'approved';
        const isFixed = currentDecision === 'fixed';
        const isDeclined = currentDecision === 'declined';

        const tCard = card.translations?.[currentLang];
        const highlightedFact = tCard?.highlightedFact ?? card.highlightedFact;
        const factCheckInfo = tCard?.factCheckInfo ?? card.factCheckInfo;

        const layout = tooltipLayouts[card.id] || computeTooltipLayout(card.id) || {
          left: 10,
          arrowLeft: 50,
          isTop: false,
          top: 80
        };
        const isTop = layout.isTop;
        const sourceLink = getSourceUrl(
          factCheckInfo.source,
          (factCheckInfo as any).sourceUrl,
          `${card.speaker || ''} ${highlightedFact || ''} ${factCheckInfo.claimed || ''} ${factCheckInfo.title || ''}`
        );
        const leftBorderColor = isApproved || isFixed
          ? 'border-l-emerald-400'
          : isDeclined
          ? 'border-l-red-400'
          : 'border-l-amber-400';
        const titleColor = isApproved || isFixed
          ? 'text-emerald-300'
          : isDeclined
          ? 'text-red-300'
          : 'text-amber-300';

        const cleanSourceName = factCheckInfo.source
          ? factCheckInfo.source.replace(/^(официальный сайт|официальный портал|сайт)\s+/i, '').trim() || factCheckInfo.source
          : '';

        return createPortal(
          <div
            data-fact-tooltip={card.id}
            style={{
              position: 'fixed',
              left: `${layout.left}px`,
              width: '310px',
              zIndex: 9999,
              ...(isTop
                ? { bottom: `${window.innerHeight - layout.top}px` }
                : { top: `${layout.top}px` })
            }}
            onMouseEnter={() => {
              if (tooltipTimeoutRef.current) {
                clearTimeout(tooltipTimeoutRef.current);
                tooltipTimeoutRef.current = null;
              }
            }}
            onMouseLeave={handleTooltipClose}
            className={`fixed ${
              isTop
                ? 'before:top-full before:h-3 before:inset-x-0'
                : 'before:-top-2.5 before:h-3 before:inset-x-0'
            } before:absolute before:content-[''] py-3.5 pr-3.5 pl-4 sm:pl-4.5 rounded-xl bg-[#16171b] border border-[#3e424c] border-l-[3px] ${leftBorderColor} shadow-[0_20px_50px_rgba(0,0,0,0.95)] text-left transition-opacity duration-150 opacity-100 pointer-events-auto visible scale-100`}
          >
            {/* Title */}
            <div className="pb-2.5 mb-2.5 border-b border-[#282b34]">
              <span className={`text-[13.5px] font-semibold ${titleColor}`}>
                {factCheckInfo.title}
              </span>
            </div>

            {/* Clean unified text block */}
            <div className="space-y-2 text-[13px] leading-relaxed">
              <div>
                <span className="text-neutral-400 font-normal">{t.claimedLabel} </span>
                <span className="text-white font-medium">
                  {factCheckInfo.claimed}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 font-normal">{t.verifiedAuditLabel} </span>
                <span className="text-emerald-400 font-normal">
                  {factCheckInfo.verified}
                </span>
              </div>

              {/* Source with active external link */}
              <div className="pt-2 flex items-center justify-between gap-2 text-xs border-t border-[#262830]">
                <span className="text-neutral-400 shrink-0 font-normal">{t.sourceLabel}</span>
                <a
                  href={sourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-medium underline underline-offset-2 transition-colors truncate max-w-[240px]"
                  title={cleanSourceName}
                >
                  <span className="truncate">{cleanSourceName}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-80" />
                </a>
              </div>
            </div>

            {/* Arrow pointer */}
            <div
              style={{
                left: `${layout.arrowLeft}px`,
                transform: 'translateX(-50%)'
              }}
              className={`absolute ${
                isTop
                  ? 'top-full border-4 border-transparent border-t-[#3e424c]'
                  : 'bottom-full border-4 border-transparent border-b-[#3e424c]'
              }`}
            />
          </div>,
          document.body
        );
      })()}
    </div>
  );
}
