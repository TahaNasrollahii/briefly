"use client";

import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../../components/GlassCard';
import { FileText, ListChecks, MessageSquare, Tag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ResultPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { id } = params;

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
    return <div className="min-h-screen flex items-center justify-center">Loading results...</div>;
  }

  if (!data || !data.structured_data) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-xl">Results not found or still processing.</p>
        <Link href="/" className="text-blue-400 hover:underline">Return Home</Link>
      </div>
    );
  }

  const { summary, bullet_points, action_items, decisions, topics } = data.structured_data;

  return (
    <main className="max-w-6xl mx-auto p-8 pt-24 min-h-screen flex flex-col gap-8">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Intelligence Report
        </h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          
          <GlassCard className="p-8 space-y-4">
            <div className="flex items-center gap-3 text-blue-400 border-b border-white/10 pb-4">
              <FileText className="w-6 h-6" />
              <h2 className="text-2xl font-semibold text-white">Executive Summary</h2>
            </div>
            <p className="text-slate-300 leading-relaxed text-lg">{summary}</p>
          </GlassCard>

          <GlassCard className="p-8 space-y-4">
            <div className="flex items-center gap-3 text-purple-400 border-b border-white/10 pb-4">
              <MessageSquare className="w-6 h-6" />
              <h2 className="text-2xl font-semibold text-white">Key Highlights</h2>
            </div>
            <ul className="space-y-3 mt-4">
              {bullet_points?.map((bp: string, i: number) => (
                <li key={i} className="flex gap-4 text-slate-300">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>{bp}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
          
          <GlassCard className="p-8 space-y-4">
            <div className="flex items-center gap-3 text-teal-400 border-b border-white/10 pb-4">
              <FileText className="w-6 h-6" />
              <h2 className="text-2xl font-semibold text-white">Full Transcript</h2>
            </div>
            <div className="max-h-96 overflow-y-auto pr-4 text-sm text-slate-400 leading-relaxed space-y-4">
              {data.transcript.split('\n').map((para: string, i: number) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </GlassCard>

        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-orange-400 border-b border-white/10 pb-3">
              <ListChecks className="w-5 h-5" />
              <h2 className="text-xl font-semibold text-white">Action Items</h2>
            </div>
            <ul className="space-y-3">
              {action_items?.map((item: string, i: number) => (
                <li key={i} className="flex gap-3 text-slate-300 bg-white/5 p-3 rounded-lg border border-white/5">
                  <div className="w-4 h-4 rounded border border-orange-400/50 mt-1 shrink-0" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-400 border-b border-white/10 pb-3">
              <FileText className="w-5 h-5" />
              <h2 className="text-xl font-semibold text-white">Decisions Made</h2>
            </div>
            <ul className="space-y-2">
              {decisions?.map((dec: string, i: number) => (
                <li key={i} className="text-sm text-slate-300 flex gap-2">
                  <span className="text-red-400">→</span> {dec}
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-blue-400 border-b border-white/10 pb-3">
              <Tag className="w-5 h-5" />
              <h2 className="text-xl font-semibold text-white">Topics</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {topics?.map((topic: string, i: number) => (
                <span key={i} className="text-xs px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                  {topic}
                </span>
              ))}
            </div>
          </GlassCard>

        </div>
      </div>
    </main>
  );
}
