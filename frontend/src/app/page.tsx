"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '../../components/GlassCard';
import { UploadCloud, FileAudio, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const router = useRouter();

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

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

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
      }
    } catch (e) {
      console.error(e);
      alert("Network error during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed': return <AlertCircle className="w-5 h-5 text-red-400" />;
      default: return <Clock className="w-5 h-5 text-blue-400 animate-pulse" />;
    }
  };

  return (
    <main className="max-w-5xl mx-auto p-8 pt-24 min-h-screen flex flex-col gap-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Briefly AI
        </h1>
        <p className="text-lg text-slate-400 font-light max-w-xl mx-auto">
          Upload your meetings or voice notes and let AI structure them into actionable intelligence.
        </p>
      </div>

      <GlassCard className="p-12 text-center border-dashed border-2 border-slate-600/50 hover:border-blue-500/50 transition-colors">
        <div className="max-w-md mx-auto space-y-6">
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
            <UploadCloud className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-2xl font-semibold">Upload Audio</h2>
          <p className="text-slate-400 text-sm">MP3, WAV, M4A, OGG up to 50MB</p>
          
          <input
            type="file"
            accept=".mp3,.wav,.m4a,.ogg,.opus,audio/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
            id="audio-upload"
          />
          <label 
            htmlFor="audio-upload" 
            className="block w-full py-4 px-6 rounded-xl bg-slate-800/50 border border-slate-700 cursor-pointer hover:bg-slate-700/50 transition-colors"
          >
            {file ? file.name : "Select an audio file..."}
          </label>
          
          {file && (
            <button 
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 font-semibold text-white shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Process with AI"}
            </button>
          )}
        </div>
      </GlassCard>

      {jobs.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold">Recent Jobs</h3>
          <div className="grid gap-4">
            {jobs.map((job) => (
              <GlassCard 
                key={job.job_id} 
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/10"
                onClick={() => router.push(job.status === 'completed' ? `/result/${job.job_id}` : `/job/${job.job_id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <FileAudio className="w-6 h-6 text-slate-300" />
                  </div>
                  <div>
                    <p className="font-semibold">{job.job_id.slice(0, 8)}...</p>
                    <p className="text-sm text-slate-400">{new Date(job.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="capitalize text-sm font-medium">{job.status}</span>
                  <StatusIcon status={job.status} />
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
