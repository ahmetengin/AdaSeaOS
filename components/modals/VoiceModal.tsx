import React from 'react';
import { AgentStatus } from '../../types';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: AgentStatus;
  lastText: string;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({ isOpen, onClose, status, lastText }) => {
  if (!isOpen) return null;

  const isActive = status === 'LISTENING' || status === 'SPEAKING' || status === 'THINKING';

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Dimmed Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* VHF Radio Interface Card */}
      <div className="relative w-full max-w-md bg-[#09090b] border border-[#27272a] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header Section */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a] bg-[#18181b]">
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="font-mono text-sm font-bold text-slate-200 tracking-widest">ADA VHF</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                <span className="text-[10px] font-bold text-red-500 tracking-wider">REC</span>
                <span className="text-[10px] font-bold text-green-600 tracking-wider ml-2">CONNECTED</span>
            </div>
        </div>

        {/* Main Display Area */}
        <div className="flex-1 p-8 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#18181b] to-[#09090b]">
            
            <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-2 font-mono">PRIORITY CHANNEL</div>
            
            {/* GPS Coords */}
            <div className="font-mono text-xs text-slate-400 mb-8 tracking-wider">
                40°57'46'' N / 28°39'49'' E
            </div>

            {/* Channel Big Number */}
            <div className="relative mb-8">
                <h1 className="text-8xl font-display font-bold text-indigo-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">72</h1>
                <span className="absolute -right-12 top-2 text-xs font-bold text-[#3f3f46] rotate-90 origin-left tracking-widest">MARINA</span>
            </div>

            {/* Microphone Visualizer / Button */}
            <div className="relative group cursor-pointer mb-6">
                {/* Ping Rings */}
                {isActive && (
                    <>
                    <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-[ping_2s_linear_infinite]"></div>
                    <div className="absolute -inset-4 rounded-full border border-indigo-500/10 animate-[ping_3s_linear_infinite]"></div>
                    </>
                )}
                
                {/* Main Mic Circle */}
                <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-indigo-600 shadow-[0_0_30px_rgba(79,70,229,0.4)]' : 'bg-[#27272a] hover:bg-[#3f3f46]'}`}>
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                </div>
            </div>

            {/* Live Text / Status */}
            <div className="h-12 flex items-center justify-center text-center">
                {lastText ? (
                    <p className="font-mono text-xs text-emerald-400 max-w-[250px] leading-relaxed">
                        &gt; {lastText}
                    </p>
                ) : (
                    <p className="font-mono text-[10px] text-slate-600 uppercase tracking-widest animate-pulse">
                        MONITORING (VOX ACTIVE)...
                    </p>
                )}
            </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#27272a] bg-[#09090b] flex justify-center">
            <button 
                onClick={onClose}
                className="group flex items-center gap-2 px-6 py-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-300"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span className="font-mono text-xs font-bold uppercase tracking-widest">End Transmission</span>
            </button>
        </div>

      </div>
    </div>
  );
};
