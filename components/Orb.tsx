import React from 'react';
import { AgentStatus } from '../types';

interface OrbProps {
  status: AgentStatus;
}

export const Orb: React.FC<OrbProps> = ({ status }) => {
  let outerColor = "border-cyan-500/30";
  let innerColor = "bg-cyan-500";
  let glow = "shadow-[0_0_50px_rgba(6,182,212,0.5)]";
  let animation = "animate-pulse";

  if (status === AgentStatus.SPEAKING) {
    innerColor = "bg-purple-500";
    glow = "shadow-[0_0_80px_rgba(168,85,247,0.8)]";
    animation = "animate-ping"; // More aggressive pulse
  } else if (status === AgentStatus.THINKING || status === AgentStatus.EXECUTING) {
    innerColor = "bg-amber-400";
    glow = "shadow-[0_0_50px_rgba(251,191,36,0.5)]";
    animation = "animate-bounce"; // Or a slow spin
  } else if (status === AgentStatus.LISTENING) {
     innerColor = "bg-emerald-400";
     glow = "shadow-[0_0_50px_rgba(52,211,153,0.5)]";
     animation = "animate-pulse";
  }

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
        {/* Outer Rings */}
        <div className={`absolute inset-0 border-2 rounded-full ${outerColor} animate-[spin_10s_linear_infinite]`}></div>
        <div className={`absolute inset-4 border border-dashed rounded-full border-slate-600 animate-[spin_15s_linear_infinite_reverse]`}></div>
        
        {/* Core Orb */}
        <div className={`relative w-24 h-24 rounded-full ${innerColor} ${glow} ${status === AgentStatus.SPEAKING ? 'scale-110' : 'scale-100'} transition-all duration-300 blur-sm`}></div>
        <div className={`absolute w-20 h-20 rounded-full ${innerColor} mix-blend-overlay opacity-80`}></div>
        
        {/* Status Text */}
        <div className="absolute -bottom-12 text-center">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">Status</div>
            <div className="text-xl font-bold font-display text-white">{status}</div>
        </div>
    </div>
  );
};