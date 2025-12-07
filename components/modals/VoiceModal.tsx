import React from 'react';
import { Orb } from '../Orb';
import { AgentStatus } from '../../types';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: AgentStatus;
  lastText: string;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({ isOpen, onClose, status, lastText }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop with Blur */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      ></div>

      {/* Holographic Container */}
      <div className="relative w-full max-w-lg bg-black/40 border border-cyan-500/30 rounded-3xl p-8 flex flex-col items-center justify-center shadow-[0_0_100px_rgba(6,182,212,0.15)] overflow-hidden">
        
        {/* Top Decor */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
        <div className="absolute top-4 right-4 cursor-pointer text-slate-500 hover:text-white transition-colors" onClick={onClose}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </div>

        {/* The Brain (Orb) */}
        <div className="scale-125 mb-8 mt-4">
            <Orb status={status} />
        </div>

        {/* Status Text / Live Transcription */}
        <div className="text-center space-y-2 max-w-md z-10">
            <div className="text-xs font-bold text-cyan-500 tracking-[0.3em] uppercase animate-pulse">
                {status === 'IDLE' ? 'BEKLEMEDE' : 
                 status === 'LISTENING' ? 'DİNLİYOR...' : 
                 status === 'THINKING' ? 'ANALİZ EDİLİYOR...' : 
                 status === 'SPEAKING' ? 'SES LİNKİ AKTİF' : status}
            </div>
            
            {/* Transcription Display (Only if there is content) */}
            {lastText && (
                <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 text-cyan-50 text-lg font-light leading-relaxed font-sans shadow-inner min-h-[60px] flex items-center justify-center">
                    "{lastText}"
                </div>
            )}
        </div>

        {/* Footer Hint */}
        <div className="mt-8 text-[10px] text-slate-600 font-mono">
            TAP OUTSIDE TO CLOSE LINK
        </div>

      </div>
    </div>
  );
};
