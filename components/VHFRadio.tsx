import React, { useEffect, useState } from 'react';
import { VHFStatus } from '../types';

interface VHFRadioProps {
  status: VHFStatus;
}

export const VHFRadio: React.FC<VHFRadioProps> = ({ status }) => {
  const [spectrum, setSpectrum] = useState<number[]>(Array(20).fill(10));

  useEffect(() => {
    let interval: any;
    if (status.isReceiving || status.isTransmitting) {
        interval = setInterval(() => {
            setSpectrum(prev => prev.map(() => Math.floor(Math.random() * 80) + 10));
        }, 100);
    } else {
        interval = setInterval(() => {
            setSpectrum(prev => prev.map(() => Math.floor(Math.random() * 15) + 5));
        }, 200);
    }
    return () => clearInterval(interval);
  }, [status.isReceiving, status.isTransmitting]);

  return (
    <div className={`w-full rounded-3xl glass-panel p-5 relative overflow-hidden flex flex-col justify-between h-32`}>
      {/* Active Glow Background */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${status.isTransmitting ? 'bg-red-900/10' : status.isReceiving ? 'bg-emerald-900/10' : 'opacity-0'}`}></div>

      <div className="flex justify-between items-start z-10">
          <div>
              <div className="text-[9px] font-bold text-slate-500 tracking-widest uppercase mb-1">Active Channel</div>
              <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-display font-medium leading-none ${status.isTransmitting ? 'text-red-400' : 'text-white'}`}>
                      {status.channel}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">156.8 MHz</span>
              </div>
          </div>
          
          <div className={`px-2 py-1 rounded-lg text-[9px] font-bold tracking-wider ${status.isTransmitting ? 'bg-red-500/20 text-red-400' : status.isReceiving ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-500'}`}>
              {status.isTransmitting ? 'TX' : status.isReceiving ? 'RX' : 'STBY'}
          </div>
      </div>

      <div className="z-10 mt-auto">
          {/* Audio Visualization */}
          <div className="flex items-end justify-between gap-[3px] h-8 opacity-60">
              {spectrum.map((h, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-full transition-all duration-100 ease-out ${status.isTransmitting ? 'bg-red-500' : 'bg-emerald-400'}`}
                    style={{ height: `${h}%` }}
                  ></div>
              ))}
          </div>
          <div className="mt-2 text-[10px] font-mono text-slate-400 truncate uppercase tracking-wider">
             {status.lastMessage || "Scanning..."}
          </div>
      </div>
    </div>
  );
};