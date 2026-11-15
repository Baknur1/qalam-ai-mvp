'use client';

import React, { useState } from 'react';
import { Check, Minus, Clock, Building2 } from 'lucide-react';
import { OutputLanguage } from '@/lib/types';
import { TRANSLATIONS } from '@/lib/translations';

interface PricingTableProps {
  currentLang?: OutputLanguage;
}

export function PricingTable({ currentLang = 'ru' }: PricingTableProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const t = TRANSLATIONS[currentLang]?.pricing || TRANSLATIONS.ru.pricing;

  return (
    <section className="w-full max-w-[1520px] mt-16 sm:mt-20 flex flex-col items-center select-none">
      {/* Title & Subtitle */}
      <div className="flex flex-col items-center text-center max-w-3xl mb-10">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight leading-snug">
          {t.title}
        </h2>
        <p className="text-sm sm:text-base text-neutral-400 mt-3 max-w-2xl leading-relaxed">
          {t.subtitle}
        </p>

        {/* Billing cycle toggle */}
        <div className="mt-8 inline-flex items-center p-1.5 rounded-full bg-[#151517] border border-[#2b2b2f]">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-7 sm:px-8 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white text-black shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {t.toggleMonthly}
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`px-7 sm:px-8 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
              billingCycle === 'yearly'
                ? 'bg-white text-black shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {t.toggleYearly}
          </button>
        </div>
      </div>

      {/* Fair Use Policy Banner */}
      <div className="w-full max-w-5xl mb-8 p-4 sm:p-5 rounded-2xl bg-[#151518] border border-[#26262a] flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 text-neutral-300">
          <Clock className="w-5 h-5 stroke-[1.8]" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-white">
            {t.fairUseTitle}
          </h4>
          <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
            {t.fairUseDesc}
          </p>
        </div>
      </div>

      {/* 2 Main Cards: Individual vs Team */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Card 1: Individual */}
        <div className="relative rounded-[24px] bg-[#151518] border border-[#26262a] hover:border-[#38383e] p-6 sm:p-8 flex flex-col justify-between transition-all duration-200">
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {t.individual.name}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 mt-2 min-h-[40px] leading-relaxed">
              {t.individual.desc}
            </p>

            {/* Price display with Strikethrough & 15% Discount */}
            <div className="mt-6 pt-6 border-t border-[#222226]">
              {billingCycle === 'yearly' ? (
                <div>
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <span className="text-xl sm:text-2xl text-neutral-500 line-through decoration-neutral-400 decoration-[1.5px]">
                      35 000 ₸
                    </span>
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      29 750 ₸
                    </span>
                    <span className="text-xs sm:text-sm text-neutral-400">
                      / {t.perMonth}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-2 flex items-center gap-1.5 flex-wrap">
                    <span>{t.billedAnnually}</span>
                    <span className="line-through text-neutral-500">420 000 ₸</span>
                    <span className="text-white font-medium">357 000 ₸ {t.perYear}</span>
                    <span className="text-[11px] text-neutral-300">({t.discountLabel})</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      35 000 ₸
                    </span>
                    <span className="text-xs sm:text-sm text-neutral-400">
                      / {t.perMonth}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">
                    {t.billedMonthly} • 420 000 ₸ {t.perYear}
                  </p>
                </div>
              )}
            </div>

            {/* Key mini-bullets */}
            <ul className="mt-6 space-y-2.5 text-xs sm:text-sm text-neutral-300">
              {t.individual.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-white shrink-0" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            className="mt-8 w-full h-[46px] rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.12] text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{t.individual.button}</span>
          </button>
        </div>

        {/* Card 2: Team */}
        <div className="relative rounded-[24px] bg-[#151518] border border-[#323238] hover:border-[#42424a] p-6 sm:p-8 flex flex-col justify-between transition-all duration-200">
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {t.team.name}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 mt-2 min-h-[40px] leading-relaxed">
              {t.team.desc}
            </p>

            {/* Price display with Strikethrough & 15% Discount */}
            <div className="mt-6 pt-6 border-t border-[#222226]">
              {billingCycle === 'yearly' ? (
                <div>
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <span className="text-xl sm:text-2xl text-neutral-500 line-through decoration-neutral-400 decoration-[1.5px]">
                      75 000 ₸
                    </span>
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      63 750 ₸
                    </span>
                    <span className="text-xs sm:text-sm text-neutral-400">
                      / {t.perTeamMonth}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-2 flex items-center gap-1.5 flex-wrap">
                    <span>{t.billedAnnually}</span>
                    <span className="line-through text-neutral-500">900 000 ₸</span>
                    <span className="text-white font-medium">765 000 ₸ {t.perYear}</span>
                    <span className="text-[11px] text-neutral-300">({t.discountLabel})</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      75 000 ₸
                    </span>
                    <span className="text-xs sm:text-sm text-neutral-400">
                      / {t.perTeamMonth}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">
                    {t.billedMonthly} • {t.team.annualNote}
                  </p>
                </div>
              )}
            </div>

            {/* Key mini-bullets */}
            <ul className="mt-6 space-y-2.5 text-xs sm:text-sm text-neutral-300">
              {t.team.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-white shrink-0" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            className="mt-8 w-full h-[46px] rounded-full bg-white text-black hover:bg-neutral-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-lg shadow-white/10 flex items-center justify-center gap-2"
          >
            <span>{t.team.button}</span>
          </button>
        </div>
      </div>

      {/* Comprehensive Feature Comparison Matrix Table */}
      <div className="w-full max-w-5xl mt-4">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
            {t.tableTitle}
          </h3>
          <span className="text-xs text-neutral-500">
            {t.currencyBadge}
          </span>
        </div>

        <div className="w-full rounded-[20px] bg-[#141417] border border-[#26262a] overflow-hidden shadow-xl">
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-[#19191d] border-b border-[#26262a] text-xs font-semibold text-neutral-300 py-4 px-4 sm:px-6">
            <div className="col-span-6 sm:col-span-6 text-neutral-400 uppercase tracking-wider text-[11px]">
              {t.colFeature}
            </div>
            <div className="col-span-3 sm:col-span-3 text-center uppercase tracking-wider text-[11px] text-white">
              Individual
            </div>
            <div className="col-span-3 sm:col-span-3 text-center uppercase tracking-wider text-[11px] text-white">
              Team
            </div>
          </div>

          {/* Table Body Categories */}
          <div className="divide-y divide-[#222226]">
            {t.categories.map((category, catIdx) => (
              <div key={catIdx} className="w-full">
                {/* Category Header */}
                <div className="bg-white/[0.02] px-4 sm:px-6 py-2.5 text-[11.5px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-[#1f2024]">
                  {category.name}
                </div>

                {/* Category Features */}
                <div className="divide-y divide-[#1c1d22]">
                  {category.features.map((feature, featIdx) => (
                    <div
                      key={featIdx}
                      className="grid grid-cols-12 items-center py-3.5 px-4 sm:px-6 text-xs sm:text-sm hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Feature Name */}
                      <div className="col-span-6 sm:col-span-6 pr-2 sm:pr-4 text-neutral-300 font-normal">
                        {feature.name}
                      </div>

                      {/* Individual Column */}
                      <div className="col-span-3 sm:col-span-3 flex items-center justify-center text-center">
                        {typeof feature.ind === 'boolean' ? (
                          feature.ind ? (
                            <div className="w-5 h-5 rounded-full bg-white/[0.08] text-white flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 stroke-[2.2]" />
                            </div>
                          ) : (
                            <Minus className="w-4 h-4 text-neutral-600" />
                          )
                        ) : (
                          <span className="text-neutral-300 font-medium text-xs sm:text-[13px]">
                            {feature.ind}
                          </span>
                        )}
                      </div>

                      {/* Team Column */}
                      <div className="col-span-3 sm:col-span-3 flex items-center justify-center text-center">
                        {typeof feature.team === 'boolean' ? (
                          feature.team ? (
                            <div className="w-5 h-5 rounded-full bg-white/[0.08] text-white flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 stroke-[2.2]" />
                            </div>
                          ) : (
                            <Minus className="w-4 h-4 text-neutral-600" />
                          )
                        ) : (
                          <span className="text-white font-medium text-xs sm:text-[13px]">
                            {feature.team}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Table Footer Bottom Bar */}
          <div className="bg-[#121214] px-4 sm:px-6 py-4 border-t border-[#26262a] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <Building2 className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>{t.corporateNote}</span>
            </div>
            <a
              href="mailto:contact@qalam.ai"
              className="text-white hover:text-neutral-300 font-medium underline underline-offset-4 transition-colors shrink-0"
            >
              {t.contactSales}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
