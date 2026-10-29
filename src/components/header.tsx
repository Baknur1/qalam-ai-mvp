'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { OutputLanguage } from '@/lib/types';
import { TRANSLATIONS } from '@/lib/translations';

interface HeaderProps {
  onTriggerDemo?: () => void;
  isDemoActive?: boolean;
  onExitDemo?: () => void;
  currentLang?: OutputLanguage;
  onLangChange?: (lang: OutputLanguage) => void;
}

export function Header({
  onTriggerDemo,
  isDemoActive = false,
  onExitDemo,
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
    if (isDemoActive) {
      if (onExitDemo) onExitDemo();
    } else {
      if (onTriggerDemo) onTriggerDemo();
    }
  };

  return (
    <header className="w-full bg-[#0b0b0b] pt-8 sm:pt-10 pb-4 relative select-none">
      <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between relative min-h-[48px]">
        {/* Left spacer to keep center logo strictly centered */}
        <div className="w-24 sm:w-64 hidden sm:block" />

        {/* Center: Brand with Pencil Logo (gap-2 for tighter spacing and absolute centering) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Qalam AI logo"
            width={86}
            height={38}
            className="h-[36px] sm:h-[40px] w-auto object-contain"
            priority
          />
          <span className="text-[23px] sm:text-[25px] font-normal text-white tracking-wide">
            Qalam AI
          </span>
        </div>

        {/* Right: Language Dropdown and Demo mode button */}
        <div className="flex items-center gap-6 sm:gap-8">
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
                    {currentLang === lang.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={handleDemoButtonClick}
            className={`h-[42px] px-6 sm:px-7 rounded-[15px] transition-all flex items-center justify-center text-[15px] sm:text-[16px] font-normal cursor-pointer select-none ${
              isDemoActive
                ? 'border border-white/70 bg-white/10 text-white hover:bg-white/15'
                : 'border border-[#9E9E9E] bg-transparent hover:bg-white/5 text-white'
            }`}
          >
            {isDemoActive
              ? TRANSLATIONS[currentLang]?.header.exitDemo || 'Exit demo'
              : TRANSLATIONS[currentLang]?.header.demoMode || 'Demo mode'}
          </motion.button>
        </div>
      </div>
    </header>
  );
}
