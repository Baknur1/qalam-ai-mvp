'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { OutputLanguage } from '@/lib/types';
import { TRANSLATIONS } from '@/lib/translations';

interface HeaderProps {
  onTriggerDemo?: () => void;
  isDemoActive?: boolean;
  isRealResultsActive?: boolean;
  onExitDemo?: () => void;
  onNewMaterial?: () => void;
  currentLang?: OutputLanguage;
  onLangChange?: (lang: OutputLanguage) => void;
}

export function Header({
  onTriggerDemo,
  isDemoActive = false,
  isRealResultsActive = false,
  onExitDemo,
  onNewMaterial,
  currentLang = 'en',
  onLangChange
}: HeaderProps) {
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const languages: { id: OutputLanguage; label: string }[] = [
    { id: 'en', label: 'ENG' },
    { id: 'kz', label: 'KZ' },
    { id: 'ru', label: 'RU' }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLang = (id: OutputLanguage) => {
    if (onLangChange) {
      onLangChange(id);
    }
    setIsLangOpen(false);
  };

  const handleDemoButtonClick = () => {
    if (isRealResultsActive) {
      if (onNewMaterial) {
        onNewMaterial();
      } else if (onExitDemo) {
        onExitDemo();
      }
    } else if (isDemoActive) {
      if (onExitDemo) onExitDemo();
    } else {
      if (onTriggerDemo) onTriggerDemo();
    }
  };

  return (
    <header className="w-full bg-[#0b0b0b] pt-6 sm:pt-7 pb-3 relative select-none">
      <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between relative min-h-[48px]">
        {/* Left spacer to keep center logo strictly centered */}
        <div className="w-24 sm:w-64 hidden sm:block" />

        {/* Center: Brand with Pencil Logo shifted slightly to the left and optically aligned */}
        <div className="absolute left-1/2 -translate-x-1/2 -ml-5 sm:-ml-7 flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Qalam AI logo"
            width={86}
            height={38}
            className="h-[34px] sm:h-[38px] w-auto object-contain -translate-y-1 sm:-translate-y-1.5"
            priority
          />
          <span className="text-[23px] sm:text-[25px] font-normal text-white tracking-wide leading-none">
            Qalam AI
          </span>
        </div>

        {/* Right: Language Dropdown and Demo mode button */}
        <div className="flex items-center gap-3 sm:gap-6 ml-auto z-10">
          {/* Language Dropdown */}
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => setIsLangOpen((prev) => !prev)}
              className="text-[15px] sm:text-[16px] font-normal text-white hover:text-neutral-300 transition-colors cursor-pointer flex items-center gap-1.5 py-1 px-1"
            >
              <span>{languages.find(l => l.id === currentLang)?.label || 'ENG'}</span>
              <svg
                className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                  isLangOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isLangOpen && (
              <div className="absolute top-full mt-2.5 right-0 min-w-[110px] py-1.5 rounded-[12px] bg-[#121214] border border-[#2e2e33] shadow-2xl shadow-black/80 z-50 backdrop-blur-md">
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => handleSelectLang(lang.id)}
                    className={`w-full px-4 py-2 text-left text-[14px] transition-colors flex items-center justify-between cursor-pointer ${
                      currentLang === lang.id
                        ? 'text-white font-medium bg-white/10'
                        : 'text-neutral-300 hover:text-white hover:bg-white/5 font-normal'
                    }`}
                  >
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Demo mode button: ONLY shown on the hero screen, completely removed when viewing material/results */}
          {!isRealResultsActive && !isDemoActive && (
            <button
              type="button"
              onClick={handleDemoButtonClick}
              className="h-[38px] sm:h-[42px] px-4 sm:px-7 rounded-[15px] transition-colors flex items-center justify-center text-[13px] sm:text-[16px] font-normal cursor-pointer select-none border border-[#9E9E9E] bg-transparent hover:bg-white/5 text-white"
            >
              {TRANSLATIONS[currentLang]?.header.demoMode || 'Demo mode'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
