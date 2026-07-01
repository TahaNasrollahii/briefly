"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'fa';

interface Translations {
  [key: string]: {
    en: string;
    fa: string;
  };
}

const translations: Translations = {
  // Dashboard
  "next_gen": { en: "Next-Gen Audio Intelligence", fa: "هوش مصنوعی صوتی نسل جدید" },
  "briefly_ai": { en: "Briefly AI", fa: "هوش مصنوعی Briefly" },
  "subtitle": { 
    en: "Upload your meetings or voice notes and let our AI agents structure them into actionable intelligence.", 
    fa: "جلسات یا یادداشت‌های صوتی خود را آپلود کنید تا عوامل هوش مصنوعی ما آن‌ها را به اطلاعات کاربردی تبدیل کنند." 
  },
  "upload_audio": { en: "Upload Audio", fa: "آپلود فایل صوتی" },
  "drag_drop": { en: "Drag & drop or click to browse", fa: "بکشید و رها کنید یا برای انتخاب کلیک کنید" },
  "formats": { en: "MP3, WAV, M4A, OGG up to 50MB", fa: "MP3, WAV, M4A, OGG تا 50 مگابایت" },
  "select_file": { en: "Select an audio file...", fa: "یک فایل صوتی انتخاب کنید..." },
  "clear": { en: "Clear", fa: "پاک کردن" },
  "processing": { en: "Processing...", fa: "در حال پردازش..." },
  "process_ai": { en: "Process with AI", fa: "پردازش با هوش مصنوعی" },
  "recent_intel": { en: "Recent Intelligence", fa: "گزارش‌های اخیر" },
  "job": { en: "Job", fa: "پردازش" },
  "prev": { en: "Previous", fa: "قبلی" },
  "next": { en: "Next", fa: "بعدی" },
  "page": { en: "Page", fa: "صفحه" },
  "of": { en: "of", fa: "از" },

  // Statuses
  "queued": { en: "Queued", fa: "در صف" },
  "completed": { en: "Completed", fa: "تکمیل شده" },
  "failed": { en: "Failed", fa: "ناموفق" },
  
  // Timeline
  "uploaded_label": { en: "Uploaded", fa: "آپلود شد" },
  "uploaded_desc": { en: "File securely transferred to our servers", fa: "فایل به طور امن به سرورهای ما منتقل شد" },
  "queued_label": { en: "Queued", fa: "در صف انتظار" },
  "queued_desc": { en: "Waiting for an available AI agent", fa: "در انتظار نماینده هوش مصنوعی در دسترس" },
  "chunking_label": { en: "Chunking", fa: "قطعه‌بندی" },
  "chunking_desc": { en: "Slicing audio for parallel processing", fa: "برش صدا برای پردازش موازی" },
  "transcribing_label": { en: "Transcribing", fa: "تبدیل به متن" },
  "transcribing_desc": { en: "Extracting speech using Whisper AI", fa: "استخراج گفتار با استفاده از هوش مصنوعی Whisper" },
  "merging_label": { en: "Merging", fa: "ادغام" },
  "merging_desc": { en: "Reassembling the transcribed chunks", fa: "مونتاژ مجدد قطعات تبدیل شده به متن" },
  "summarizing_label": { en: "Summarizing", fa: "خلاصه‌سازی" },
  "summarizing_desc": { en: "Generating insights with Llama 3.3", fa: "تولید بینش با Llama 3.3" },
  "completed_label": { en: "Completed", fa: "تکمیل شد" },
  "completed_desc": { en: "Your results are ready!", fa: "نتایج شما آماده است!" },
  "processing_failed": { en: "Processing Failed", fa: "پردازش ناموفق بود" },
  "error_occurred": { en: "An error occurred during execution. Please try again.", fa: "هنگام اجرا خطایی رخ داد. لطفا دوباره تلاش کنید." },

  // Result Page
  "decrypting": { en: "Decrypting Intelligence...", fa: "در حال استخراج اطلاعات..." },
  "report_unavailable": { en: "Report unavailable or still processing.", fa: "گزارش در دسترس نیست یا در حال پردازش است." },
  "return_home": { en: "Return Home", fa: "بازگشت به خانه" },
  "processed_report": { en: "Processed Report", fa: "گزارش پردازش شده" },
  "intel": { en: "Intelligence", fa: "گزارش" },
  "brief": { en: "Brief", fa: "خلاصه" },
  "exec_summary": { en: "Executive Summary", fa: "خلاصه مدیریتی" },
  "key_highlights": { en: "Key Highlights", fa: "نکات کلیدی" },
  "full_transcript": { en: "Full Transcript", fa: "متن کامل" },
  "action_items": { en: "Action Items", fa: "اقدامات لازم" },
  "decisions_made": { en: "Decisions Made", fa: "تصمیمات اتخاذ شده" },
  "topics": { en: "Topics", fa: "موضوعات" },
  "processing_audio": { en: "Processing Your Audio", fa: "در حال پردازش فایل صوتی شما" },
  "agents_working": { en: "Our AI agents are currently working on your file.", fa: "عوامل هوش مصنوعی ما در حال حاضر روی فایل شما کار می‌کنند." },
  "dashboard": { en: "Dashboard", fa: "داشبورد" }
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check local storage for language preference
    const savedLang = localStorage.getItem('briefly_lang') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'fa')) {
      setLang(savedLang);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('briefly_lang', lang);
      document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  }, [lang, mounted]);

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][lang];
    }
    return key;
  };

  // Prevent hydration mismatch
  if (!mounted) return <div className="min-h-screen bg-[#09090b]" />;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      <div className={lang === 'fa' ? 'font-fa' : 'font-sans'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
