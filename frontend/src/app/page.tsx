"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '../../components/GlassCard';
import { UploadCloud, FileAudio, Clock, CheckCircle, AlertCircle, Sparkles, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const { t, lang } = useLanguage();

  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/audio/list');
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (e) {
      console.error("Failed to fetch jobs");
    }
  };

  const handleUpload = async (fileToUpload: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      const res = await fetch('http://localhost:8000/api/audio/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/job/${data.job_id}`);
      } else {
        alert("Upload failed. File might be too large or invalid type.");
        setIsUploading(false);
      }
    } catch (e) {
      console.error(e);
      alert("Network error during upload.");
      setIsUploading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    if (!confirm(lang === 'fa' ? "آیا از حذف این مورد اطمینان دارید؟" : "Are you sure you want to delete this job?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/audio/${jobId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setJobs(prev => prev.filter(j => j.job_id !== jobId));
      }
    } catch (e) {
      console.error("Delete failed");
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed': return <AlertCircle className="w-5 h-5 text-red-400" />;
      default: return <Clock className="w-5 h-5 text-blue-400 animate-pulse" />;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(jobs.length / ITEMS_PER_PAGE);
  const currentJobs = jobs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const isRTL = lang === 'fa';

  return (
    <main className="max-w-5xl mx-auto p-8 pt-24 min-h-screen flex flex-col gap-16 relative">
      
      {/* Floating Background Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

      <motion.div 
        className="text-center space-y-6 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-4">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-slate-300">{t('next_gen')}</span>
        </div>
        <h1 className="text-6xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          {t('briefly_ai')}
        </h1>
        <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
          {t('subtitle')}
        </p>
      </motion.div>

      <motion.div 
        className="w-full relative z-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <GlassCard 
          className={`p-12 text-center transition-all duration-300 border-2 border-dashed ${
            isDragOver ? 'border-purple-500 bg-purple-500/10 scale-[1.02]' : 'border-white/20 hover:border-blue-500/50 hover:bg-white/10'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="max-w-md mx-auto space-y-8">
            <motion.div 
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10"
              animate={isDragOver ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
            >
              <UploadCloud className={`w-10 h-10 ${isDragOver ? 'text-purple-400' : 'text-blue-400'}`} />
            </motion.div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold text-white">{t('upload_audio')}</h2>
              <p className="text-slate-400">{t('drag_drop')}</p>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold pt-2">{t('formats')}</p>
            </div>
            
            <input
              type="file"
              accept=".mp3,.wav,.m4a,.ogg,.opus,audio/*"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) setFile(selected);
              }}
              className="hidden"
              id="audio-upload"
            />
            
            {!file ? (
              <label 
                htmlFor="audio-upload" 
                className="block w-full py-4 px-6 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors text-white font-medium shadow-lg"
              >
                {t('select_file')}
              </label>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileAudio className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <span className="truncate text-sm font-medium text-slate-200" dir="ltr">{file.name}</span>
                  </div>
                  <button onClick={() => setFile(null)} className="text-xs text-slate-400 hover:text-white px-2">{t('clear')}</button>
                </div>
                <button 
                  onClick={() => handleUpload(file)}
                  disabled={isUploading}
                  className="relative w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all disabled:opacity-50 overflow-hidden group"
                >
                  <div className={`absolute inset-0 bg-white/20 transition-transform duration-700 ease-in-out ${isRTL ? 'group-hover:-translate-x-full translate-x-full' : 'group-hover:translate-x-full -translate-x-full'}`} />
                  <span className="relative flex items-center justify-center gap-2">
                    {isUploading ? <><Clock className="w-5 h-5 animate-spin" /> {t('processing')}</> : <><Sparkles className="w-5 h-5" /> {t('process_ai')}</>}
                  </span>
                </button>
              </motion.div>
            )}
          </div>
        </GlassCard>
      </motion.div>

      <AnimatePresence>
        {jobs.length > 0 && (
          <motion.div 
            className="space-y-6 relative z-10"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <h3 className="text-2xl font-bold flex items-center gap-3 text-white">
              <Clock className="w-6 h-6 text-blue-400" />
              {t('recent_intel')}
            </h3>
            
            <div className="grid gap-4 min-h-[400px]">
              {currentJobs.map((job) => (
                <motion.div key={job.job_id} variants={itemVariants} layout>
                  <GlassCard 
                    className="p-6 flex flex-col gap-4 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all group"
                    onClick={() => router.push(job.status === 'completed' ? `/result/${job.job_id}` : `/job/${job.job_id}`)}
                  >
                    {/* Row 1: Icon + Title */}
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-colors shrink-0">
                        <FileAudio className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <p className="font-semibold text-white text-lg tracking-tight truncate">
                        {job.structured_data?.[lang]?.title || `${t('job')} ${job.job_id.slice(0, 8)}`}
                      </p>
                    </div>

                    {/* Row 2: Date (left) + Status + Trash (right) — always same horizontal line */}
                    <div className="flex items-center justify-between gap-4 pl-1">
                      <p className="text-sm text-slate-400" dir="ltr">
                        {new Date(job.created_at).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                          <span className="capitalize text-sm font-medium text-slate-200">{t(job.status) || job.status}</span>
                          <StatusIcon status={job.status} />
                        </div>
                        <button 
                          onClick={(e) => handleDelete(e, job.job_id)}
                          className="p-2 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 transition-colors"
                >
                  {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
                <span className="text-sm text-slate-400">
                  {t('page')} {currentPage} {t('of')} {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 transition-colors"
                >
                  {isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
