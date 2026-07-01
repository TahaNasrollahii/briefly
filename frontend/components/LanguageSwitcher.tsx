"use client";

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

export const LanguageSwitcher = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex bg-white/5 border border-white/10 rounded-full p-1 backdrop-blur-md shadow-lg">
      <button
        onClick={() => setLang('en')}
        className={`relative px-4 py-1.5 text-sm font-medium rounded-full transition-colors z-10 ${
          lang === 'en' ? 'text-white' : 'text-slate-400 hover:text-white'
        }`}
      >
        {lang === 'en' && (
          <motion.div
            layoutId="lang-active"
            className="absolute inset-0 bg-gradient-to-r from-blue-500/50 to-purple-500/50 rounded-full -z-10"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        EN
      </button>
      <button
        onClick={() => setLang('fa')}
        className={`relative px-4 py-1.5 text-sm font-medium rounded-full transition-colors z-10 font-fa ${
          lang === 'fa' ? 'text-white' : 'text-slate-400 hover:text-white'
        }`}
      >
        {lang === 'fa' && (
          <motion.div
            layoutId="lang-active"
            className="absolute inset-0 bg-gradient-to-r from-purple-500/50 to-pink-500/50 rounded-full -z-10"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        فا
      </button>
    </div>
  );
};
