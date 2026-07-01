"use client";

import React from 'react';
import { cn } from '../lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-3xl",
        "bg-white/5 backdrop-blur-2xl", 
        "border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]",
        "before:absolute before:inset-0 before:z-[-1] before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-50",
        "after:absolute after:inset-0 after:z-[-1] after:rounded-3xl after:ring-1 after:ring-inset after:ring-white/10",
        className
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
