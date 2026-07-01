"use client";

import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../../../components/GlassCard';
import { FileText, ListChecks, MessageSquare, Tag, ArrowLeft, ArrowRight, Lightbulb, Workflow, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '../../../../context/LanguageContext';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { id } = React.use(params);
  const { t, lang } = useLanguage();
  const isRTL = lang === 'fa';

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/audio/${id}/result`);
        if (res.ok) {
          const resultData = await res.json();
          setData(resultData);
        }
      } catch (e) {
        console.error("Failed to fetch result", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResult();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="flex flex-col items-center gap-4 z-10">
          <Sparkles className="w-8 h-8 text-blue-400 animate-spin-slow" />
          <p className="text-xl text-slate-300 font-light tracking-widest uppercase">{t('decrypting')}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.structured_data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
          <FileText className="w-10 h-10 text-red-400" />
        </div>
        <p className="text-2xl font-light text-slate-200">{t('report_unavailable')}</p>
        <Link href="/" className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-white">
          {t('return_home')}
        </Link>
      </div>
    );
  }

  const aiData = data.structured_data[lang] || data.structured_data;
  const { summary, bullet_points, action_items, decisions, topics } = aiData;

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-8 pt-24 min-h-screen relative">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none" />

      <motion.div 
        className="flex flex-col gap-12 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 border border-white/10 transition-colors group">
              {isRTL ? <ArrowRight className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" /> : <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />}
            </Link>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs font-medium text-blue-300 uppercase tracking-wider">{t('processed_report')}</span>
              </div>
              <h1 className={`text-4xl sm:text-5xl font-extrabold tracking-tight text-white ${isRTL ? 'flex flex-row-reverse gap-3 justify-end' : ''}`}>
                <span>{t('intel')}</span>
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{t('brief')}</span>
              </h1>
            </div>
          </div>
          <div className="text-sm text-slate-500 font-mono bg-black/40 px-4 py-2 rounded-xl border border-white/5 backdrop-blur-sm" dir="ltr">
            ID: {id.slice(0,12)}...
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            <motion.div variants={itemVariants}>
              <GlassCard className="p-8 sm:p-10 space-y-6">
                <div className="flex items-center gap-4 text-blue-400">
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <FileText className="w-7 h-7" />
                  </div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">{t('exec_summary')}</h2>
                </div>
                <p className="text-slate-300 leading-relaxed text-lg font-light">{summary}</p>
              </GlassCard>
            </motion.div>

            <motion.div variants={itemVariants}>
              <GlassCard className="p-8 sm:p-10 space-y-6">
                <div className="flex items-center gap-4 text-purple-400">
                  <div className="p-3 bg-purple-500/10 rounded-xl">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">{t('key_highlights')}</h2>
                </div>
                <ul className="space-y-4 mt-6">
                  {bullet_points?.map((bp: string, i: number) => (
                    <li key={i} className="flex gap-5 text-slate-300 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group">
                      <span className="text-purple-400 mt-1 flex-shrink-0 group-hover:scale-125 transition-transform"><Sparkles className="w-5 h-5"/></span>
                      <span className="leading-relaxed">{bp}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <GlassCard className="p-8 sm:p-10 space-y-6 bg-black/20">
                <div className="flex items-center gap-4 text-teal-400">
                  <div className="p-3 bg-teal-500/10 rounded-xl">
                    <Workflow className="w-7 h-7" />
                  </div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">{t('full_transcript')}</h2>
                </div>
                <div className="max-h-[500px] overflow-y-auto pr-6 text-sm text-slate-400 leading-loose space-y-4 custom-scrollbar font-fa" dir="rtl">
                  {data.transcript.split('\n').map((para: string, i: number) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            
            <motion.div variants={itemVariants}>
              <GlassCard className="p-6 sm:p-8 space-y-6 border-orange-500/20">
                <div className="flex items-center gap-4 text-orange-400">
                  <div className="p-2.5 bg-orange-500/10 rounded-lg">
                    <ListChecks className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">{t('action_items')}</h2>
                </div>
                <ul className="space-y-3 mt-6">
                  {action_items?.map((item: string, i: number) => (
                    <li key={i} className="flex gap-4 text-slate-200 bg-black/40 p-4 rounded-xl border border-white/5 hover:border-orange-500/30 transition-colors group">
                      <div className="w-5 h-5 rounded-full border-2 border-orange-400/50 mt-0.5 shrink-0 group-hover:bg-orange-500/20 transition-colors" />
                      <span className="text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>

            <motion.div variants={itemVariants}>
              <GlassCard className="p-6 sm:p-8 space-y-6 border-red-500/20">
                <div className="flex items-center gap-4 text-red-400">
                  <div className="p-2.5 bg-red-500/10 rounded-lg">
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">{t('decisions_made')}</h2>
                </div>
                <ul className="space-y-3">
                  {decisions?.map((dec: string, i: number) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-3 items-start p-3 hover:bg-white/5 rounded-lg transition-colors">
                      <span className="text-red-400 shrink-0 mt-0.5">{isRTL ? '←' : '→'}</span> 
                      <span className="leading-relaxed">{dec}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>

            <motion.div variants={itemVariants}>
              <GlassCard className="p-6 sm:p-8 space-y-6 border-blue-500/20">
                <div className="flex items-center gap-4 text-blue-400">
                  <div className="p-2.5 bg-blue-500/10 rounded-lg">
                    <Tag className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">{t('topics')}</h2>
                </div>
                <div className="flex flex-wrap gap-2.5 mt-6">
                  {topics?.map((topic: string, i: number) => (
                    <span key={i} className="text-sm px-4 py-1.5 bg-blue-500/10 text-blue-200 border border-blue-500/20 rounded-full hover:bg-blue-500/20 hover:border-blue-500/40 transition-colors cursor-default">
                      {topic}
                    </span>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

          </div>
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </main>
  );
}
