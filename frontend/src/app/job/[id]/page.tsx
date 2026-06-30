"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '../../../components/GlassCard';
import { AnimatedTimeline } from '../../../components/AnimatedTimeline';
import { motion } from 'framer-motion';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const [status, setStatus] = useState('queued');
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const { id } = params;

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

    // WebSocket connection for real-time updates
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
        setTimeout(() => router.push(`/result/${id}`), 1500); // short delay to show 100%
      }
    };

    return () => {
      ws.close();
    };
  }, [id, router]);

  return (
    <main className="max-w-4xl mx-auto p-8 pt-24 min-h-screen flex flex-col justify-center items-center gap-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Processing Your Audio</h1>
        <p className="text-slate-400">Our AI agents are currently working on your file.</p>
      </div>
      
      <GlassCard className="w-full p-12">
        <AnimatedTimeline currentStatus={status} />
        
        <div className="mt-16 text-center">
          <motion.div 
            className="text-6xl font-light tabular-nums bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
            key={progress}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {Math.round(progress)}%
          </motion.div>
          <p className="text-slate-400 mt-2 uppercase tracking-widest text-sm font-semibold">
            {status}
          </p>
        </div>
      </GlassCard>
    </main>
  );
}
