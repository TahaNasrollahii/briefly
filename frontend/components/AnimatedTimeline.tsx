"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Clock, 
  Scissors, 
  Mic, 
  Combine, 
  Sparkles, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AnimatedTimelineProps {
  currentStatus: string;
}

export const AnimatedTimeline: React.FC<AnimatedTimelineProps> = ({ currentStatus }) => {
  const { t, lang } = useLanguage();
  const isRTL = lang === 'fa';

  const statuses = [
    { id: "uploaded", label: t('uploaded_label'), desc: t('uploaded_desc'), icon: Upload },
    { id: "queued", label: t('queued_label'), desc: t('queued_desc'), icon: Clock },
    { id: "chunking", label: t('chunking_label'), desc: t('chunking_desc'), icon: Scissors },
    { id: "transcribing", label: t('transcribing_label'), desc: t('transcribing_desc'), icon: Mic },
    { id: "merging", label: t('merging_label'), desc: t('merging_desc'), icon: Combine },
    { id: "summarizing", label: t('summarizing_label'), desc: t('summarizing_desc'), icon: Sparkles },
    { id: "completed", label: t('completed_label'), desc: t('completed_desc'), icon: CheckCircle }
  ];

  const isFailed = currentStatus === "failed";
  const currentIndex = statuses.findIndex(s => s.id === currentStatus);
  const activeIndex = currentIndex === -1 ? (isFailed ? statuses.length : 0) : currentIndex;

  return (
    <div className="w-full max-w-md mx-auto py-2">
      <div className="relative space-y-6">
        {/* Vertical Line Background */}
        <div className={`absolute top-6 bottom-6 w-[2px] bg-white/5 rounded-full ${isRTL ? 'right-6' : 'left-6'}`} />
        
        {/* Animated Active Line */}
        {!isFailed && (
          <motion.div 
            className={`absolute top-6 w-[2px] bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400 rounded-full origin-top ${isRTL ? 'right-6' : 'left-6'}`}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: activeIndex / (statuses.length - 1) }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{ height: 'calc(100% - 3rem)' }}
          />
        )}

        {statuses.map((status, index) => {
          const isActive = index === activeIndex && !isFailed;
          const isPast = index < activeIndex;
          const Icon = status.icon;

          return (
            <div key={status.id} className="relative z-10 flex gap-6 items-start group">
              {/* Icon Container */}
              <div className="relative flex-shrink-0">
                <motion.div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 bg-black/40 backdrop-blur-sm transition-colors duration-500 ${
                    isActive ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 
                    isPast ? 'border-blue-500/50' : 'border-white/5'
                  }`}
                  animate={isActive ? {
                    boxShadow: ['0px 0px 0px 0px rgba(168,85,247,0)', '0px 0px 0px 8px rgba(168,85,247,0.15)', '0px 0px 0px 0px rgba(168,85,247,0)']
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {isActive ? (
                    <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                  ) : isPast ? (
                    <Icon className="w-5 h-5 text-blue-400" />
                  ) : (
                    <Icon className="w-5 h-5 text-gray-600" />
                  )}
                </motion.div>
              </div>

              {/* Text Container */}
              <div className={`flex flex-col pt-1.5 transition-all duration-500 ${
                isActive ? `opacity-100 ${isRTL ? '-translate-x-1' : 'translate-x-1'}` : 
                isPast ? 'opacity-80' : 'opacity-30'
              }`}>
                <h3 className={`text-lg font-semibold tracking-tight ${
                  isActive ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400' : 
                  'text-white'
                }`}>
                  {status.label}
                </h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  {status.desc}
                </p>
              </div>
            </div>
          );
        })}
        
        {/* Failed State Indicator */}
        <AnimatePresence>
          {isFailed && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10 flex gap-6 items-start mt-6"
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-red-500 bg-black/40 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
              </div>
              <div className="flex flex-col pt-1.5 opacity-100">
                <h3 className="text-lg font-semibold tracking-tight text-red-500">
                  {t('processing_failed')}
                </h3>
                <p className="text-sm text-red-400/80 mt-0.5">
                  {t('error_occurred')}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
