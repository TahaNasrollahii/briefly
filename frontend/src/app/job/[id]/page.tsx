"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '../../../../components/GlassCard';
import { AnimatedTimeline } from '../../../../components/AnimatedTimeline';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../../../../context/LanguageContext';

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [status, setStatus] = useState('queued');
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const { id } = React.use(params);
  const { t, lang } = useLanguage();
  const isRTL = lang === 'fa';

  useEffect(() => {
    const fetchStatus = async () => {
      const res = await fetch(`http://localhost:8000/api/audio/${id}/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
        setProgress(data.progress);
        
        if (data.status === 'completed') {
          router.push(`/result/${id}`);
        }
      }
    };
    
    fetchStatus();

    const ws = new WebSocket(`ws://localhost:8000/api/audio/${id}/live`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status) {
        setStatus(data.status);
      }
      if (data.progress !== undefined) {
        setProgress(data.progress);
      }
      if (data.status === 'completed') {
        setTimeout(() => router.push(`/result/${id}`), 1500);
      }
    };

    return () => {
      ws.close();
    };
  }, [id, router]);

  return (
    <main className="max-w-4xl mx-auto p-8 pt-24 min-h-screen flex flex-col justify-center items-center gap-12 relative">
      <div className={`absolute top-8 ${isRTL ? 'right-8 sm:right-12' : 'left-8 sm:left-12'}`}>
        <Link href="/" className="flex items-center gap-2 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
          {isRTL ? <ArrowRight className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
          <span className="px-2 font-medium">{t('dashboard')}</span>
        </Link>
      </div>

      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">{t('processing_audio')}</h1>
        <p className="text-slate-400">{t('agents_working')}</p>
      </div>
      
      <GlassCard className="w-full max-w-5xl p-8 sm:p-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-8">
          
          <div className="w-full md:w-1/2">
            <AnimatedTimeline currentStatus={status} />
          </div>
          
          <div className="w-full md:w-1/2 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center w-64 h-64">
              <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-3xl" />
              
              <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  className="text-white/5"
                />
                <motion.circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="url(#gradient)" 
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 1000" }}
                  animate={{ strokeDasharray: `${progress * 2.83} 1000` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#60A5FA" />
                    <stop offset="50%" stopColor="#C084FC" />
                    <stop offset="100%" stopColor="#F472B6" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="relative text-center">
                <motion.div 
                  className="text-6xl font-light tabular-nums bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                  key={progress}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {Math.round(progress)}%
                </motion.div>
                <p className="text-slate-400 mt-2 uppercase tracking-widest text-sm font-semibold">
                  {t(`${status}_label`) || status}
                </p>
              </div>
            </div>
          </div>
          
        </div>
      </GlassCard>
    </main>
  );
}
