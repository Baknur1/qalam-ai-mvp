'use client';

import React, { useState } from 'react';
import { Volume2, AlertCircle, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { FlagDecision } from '@/lib/types';

interface FactCheckCardData {
  id: string;
  time: string;
  speaker: string;
  textBefore: string;
  underlinedPhrase?: string;
  textMid: string;
  highlightedFact: string;
  textAfter: string;
  factCheckInfo: {
    type: 'discrepancy' | 'unverified' | 'verified';
    title: string;
    claimed: string;
    verified: string;
    source: string;
  };
  defaultDeclineRed?: boolean;
  defaultApproveGreen?: boolean;
}

interface FactCheckingSectionProps {
  isLoading?: boolean;
  visibleCardsCount?: number;
  onDecision?: (flagId: string, decision: FlagDecision) => void;
}

export function FactCheckingSection({
  onDecision,
  isLoading = false,
  visibleCardsCount = 3
}: FactCheckingSectionProps) {
  // Interactive decision state for each card
  const [decisions, setDecisions] = useState<Record<string, FlagDecision>>({
    'fc-1': 'approved',
    'fc-2': 'pending',
    'fc-3': 'pending'
  });
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const handleBtnClick = (id: string, btn: 'decline' | 'approve') => {
    const targetDecision: FlagDecision = btn === 'decline' ? 'declined' : 'approved';
    const nextDecision: FlagDecision =
      decisions[id] === targetDecision ? 'pending' : targetDecision;

    setDecisions((prev) => ({
      ...prev,
      [id]: nextDecision
    }));

    if (onDecision) {
      onDecision(id, nextDecision);
    }
  };

  // 3 distinct, realistic journalistic mock scenarios
  const CARDS: FactCheckCardData[] = [
    {
      id: 'fc-1',
      time: '0:42',
      speaker: 'Kanat Yskakov',
      textBefore: 'This year, as part of a ',
      underlinedPhrase: 'special initiative',
      textMid: ', we allocated ',
      highlightedFact: '500 million tenge',
      textAfter: ' in direct grant support for regional media and independent digital editorial offices.',
      factCheckInfo: {
        type: 'discrepancy',
        title: 'Расхождение в сумме бюджета',
        claimed: '500 млн тенге на прямые гранты',
        verified: 'По бюджетной росписи №412 выделено 480 млн ₸. Разница 20 млн ₸ удержана в резерве.',
        source: 'Министерство культуры и информации РК (Бюджет 2026)'
      },
      defaultDeclineRed: true,
      defaultApproveGreen: true
    },
    {
      id: 'fc-2',
      time: '1:18',
      speaker: 'Arman B.',
      textBefore: 'According to our data, over ',
      highlightedFact: '80% of regional newsrooms',
      textMid: ' face severe ',
      underlinedPhrase: 'operational deficits',
      textAfter: ' and applied for urgent digital modernization assistance.',
      factCheckInfo: {
        type: 'unverified',
        title: 'Статистика требует верификации',
        claimed: 'Более 80% региональных редакций',
        verified: 'Независимый аудит Медиа-Альянса подтверждает дефицит у 58% редакций, а не 80%.',
        source: 'Отчет мониторинга региональных медиа Q3'
      },
      defaultDeclineRed: false,
      defaultApproveGreen: false
    },
    {
      id: 'fc-3',
      time: '2:05',
      speaker: 'Aigul Nurpeisova',
      textBefore: 'The grant application window closes on ',
      highlightedFact: 'November 15, 2026',
      textMid: ', after which an ',
      underlinedPhrase: 'independent jury',
      textAfter: ' will finalize the recipient list within 10 calendar days.',
      factCheckInfo: {
        type: 'verified',
        title: 'Срок подтвержден, регламент уточнен',
        claimed: 'Прием до 15 ноября 2026, итоги за 10 дней',
        verified: 'Дедлайн 15.11 в 18:00 AST верен. Однако регламент выделяет 30 дней на подведение итогов.',
        source: 'Официальный регламент конкурса грантов №14-П'
      },
      defaultDeclineRed: false,
      defaultApproveGreen: false
    }
  ];

  return (
    <div className="flex flex-col w-full h-full select-none">
      {/* Title */}
      <h2 className="text-[28px] font-normal text-white mb-5 tracking-tight h-8 flex items-center">
        Fact checking
      </h2>

      {/* 3 Cards or Skeleton */}
      <div className="flex flex-col gap-4 flex-1 justify-between">
        {isLoading ? (
          /* 3 Skeleton Cards */
          [1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="flex-1 rounded-[20px] bg-[#121214] border border-[#2a2a2a] flex flex-col justify-between overflow-hidden animate-pulse"
            >
              <div className="p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-6 w-16 rounded-[8px] bg-white/[0.08]" />
                  <div className="h-4 w-20 rounded bg-white/[0.05]" />
                </div>
                <div className="space-y-2 pt-1">
                  <div className="h-4 w-full rounded bg-white/[0.04]" />
                  <div className="h-4 w-11/12 rounded bg-white/[0.04]" />
                  <div className="h-4 w-4/6 rounded bg-white/[0.04]" />
                </div>
              </div>
              <div className="w-full border-t border-[#222225] px-5 py-3.5 flex items-center justify-end gap-3 bg-[#121214]">
                <div className="h-9 w-24 rounded-[9px] bg-white/[0.05]" />
                <div className="h-9 w-24 rounded-[9px] bg-white/[0.05]" />
              </div>
            </div>
          ))
        ) : (
          CARDS.slice(0, visibleCardsCount).map((card) => {
            const currentDecision = decisions[card.id];
            const isDeclineActive =
              currentDecision === 'declined' ||
              (card.defaultDeclineRed && currentDecision === 'approved');
            const isApproveActive = currentDecision === 'approved';

            return (
              <div
                key={card.id}
                className="flex-1 rounded-[20px] bg-[#121214] border border-[#2a2a2a] flex flex-col justify-between relative hover:z-30 focus-within:z-30 transition-all"
              >
                {/* Top content area matching Figma Image 4 */}
                <div className="p-5 sm:p-6 flex flex-col gap-3.5">
                  {/* Speaker timecode badge + speaker name */}
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-transparent border border-[#3e3e3e] text-xs sm:text-[13px] text-white">
                      <Volume2 className="w-4 h-4 text-white" />
                      <span>{card.time}</span>
                    </div>
                    <span className="text-[15px] sm:text-base font-normal text-white">
                      {card.speaker}
                    </span>
                  </div>

                  {/* Excerpt with combined outline pill and interactive verification tooltip on hover */}
                  <p className="text-sm sm:text-[15px] text-neutral-200 leading-[1.75] font-normal">
                    {card.textBefore}
                    {card.underlinedPhrase && (
                      <span className="underline decoration-1 underline-offset-4 decoration-neutral-300 text-white">
                        {card.underlinedPhrase}
                      </span>
                    )}
                    {card.textMid}
                    {/* Combined fact check pill with hover tooltip and click toggle */}
                    <span className="relative group inline-block align-baseline">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTooltip((prev) => (prev === card.id ? null : card.id));
                        }}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-white/90 text-white font-normal mx-1 text-xs sm:text-[14px] hover:bg-white/10 hover:border-emerald-400 transition-colors cursor-pointer"
                      >
                        {card.highlightedFact}
                      </button>

                      {/* Tooltip on hover or click */}
                      <div
                        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 p-3.5 rounded-xl bg-[#1c1c20] border border-[#38383e] shadow-2xl transition-all duration-200 z-50 text-left ${
                          activeTooltip === card.id
                            ? 'opacity-100 pointer-events-auto'
                            : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
                        }`}
                      >
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2b2b32]">
                          <span className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
                            {card.factCheckInfo.type === 'discrepancy' && (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            )}
                            {card.factCheckInfo.type === 'unverified' && (
                              <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
                            )}
                            {card.factCheckInfo.type === 'verified' && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                            {card.factCheckInfo.title}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-mono">
                            Фактчекинг
                          </span>
                        </div>
                        <div className="space-y-1.5 text-xs text-neutral-300 leading-snug">
                          <div>
                            <span className="text-neutral-400">Заявлено: </span>
                            <span className="text-white font-medium">
                              {card.factCheckInfo.claimed}
                            </span>
                          </div>
                          <div>
                            <span className="text-neutral-400">Проверка: </span>
                            <span className="text-emerald-400 font-medium">
                              {card.factCheckInfo.verified}
                            </span>
                          </div>
                          <div className="pt-1 text-[11px] text-neutral-400 italic">
                            Источник: {card.factCheckInfo.source}
                          </div>
                        </div>
                        {/* Tooltip triangle arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-[#38383e]" />
                      </div>
                    </span>
                    {card.textAfter}
                  </p>
                </div>

                {/* Horizontal divider separating content from buttons */}
                <div className="w-full border-t border-[#222225] px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-end gap-3 bg-[#121214] rounded-b-[20px]">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleBtnClick(card.id, 'decline')}
                    className={`px-6 py-2 rounded-[9px] text-sm sm:text-[15px] font-normal transition-all cursor-pointer ${
                      isDeclineActive
                        ? 'bg-[#c93b3b] hover:bg-[#b53232] text-white border border-[#c93b3b]'
                        : 'border border-[#444444] text-white hover:border-neutral-300 bg-transparent'
                    }`}
                  >
                    Decline
                  </motion.button>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleBtnClick(card.id, 'approve')}
                    className={`px-6 py-2 rounded-[9px] text-sm sm:text-[15px] font-normal transition-all cursor-pointer ${
                      isApproveActive
                        ? 'bg-[#2e7d32] hover:bg-[#256c28] text-white border border-[#2e7d32]'
                        : 'border border-[#444444] text-white hover:border-neutral-300 bg-transparent'
                    }`}
                  >
                    Approve
                  </motion.button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
