"use client";

import React from 'react';
import { motion } from 'framer-motion';

const statuses = [
  "uploaded",
  "queued",
  "chunking",
  "transcribing",
  "merging",
  "summarizing",
  "completed"
];

interface AnimatedTimelineProps {
  currentStatus: string;
}

export const AnimatedTimeline: React.FC<AnimatedTimelineProps> = ({ currentStatus }) => {
  const currentIndex = statuses.indexOf(currentStatus);
  const isFailed = currentStatus === "failed";
  
  return (
    <div className="w-full py-8">
      <div className="relative flex justify-between items-center w-full">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/10 rounded-full" />
        <motion.div 
          className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full ${isFailed ? 'bg-red-500' : 'bg-blue-400'}`}
          initial={{ width: '0%' }}
          animate={{ width: `${Math.max(0, currentIndex / (statuses.length - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
        
        {statuses.map((status, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <div key={status} className="relative z-10 flex flex-col items-center">
              <motion.div 
                className={`w-4 h-4 rounded-full border-2 ${
                  isFailed && isCurrent ? 'bg-red-500 border-red-500' : 
                  isActive ? 'bg-blue-500 border-blue-400' : 'bg-gray-800 border-white/20'
                }`}
                animate={isCurrent && !isFailed ? {
                  boxShadow: ['0px 0px 0px 0px rgba(96,165,250,0)', '0px 0px 0px 8px rgba(96,165,250,0.2)', '0px 0px 0px 0px rgba(96,165,250,0)']
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className={`absolute top-6 text-xs font-medium capitalize whitespace-nowrap ${
                isFailed && isCurrent ? 'text-red-400' : 
                isActive ? 'text-blue-300' : 'text-gray-500'
              }`}>
                {status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
