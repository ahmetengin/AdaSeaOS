import React, { useEffect, useState } from 'react';
import { VHFStatus } from '../types';

interface VHFRadioProps {
  status: VHFStatus;
}

export const VHFRadio: React.FC<VHFRadioProps> = ({ status }) => {
  const [spectrum, setSpectrum] = useState<number[]>(Array(12).fill(10));

  useEffect(() => {
    let interval: any;
    if (status.isReceiving || status.isTransmitting) {
        interval = setInterval(() => {
            setSpectrum(prev => prev.map(() => Math.floor(Math.random() * 80) + 10));
        }, 80);
    } else {
        interval = setInterval(() => {
            setSpectrum(prev => prev.map(() => Math.floor(Math.random() * 10) + 5));
        }, 200);
    }
    return () => clearInterval(interval);
  }, [status.isReceiving, status.isTransmitting]);

  return (
    <div className="w-full h-full bg-black border-4 border-slate-900 rounded-xl p-0 flex relative overflow-hidden">
      {/* STATUS STRIP LEFT */}
      <div className={`w-4 h-full ${status.isTransmitting ? 'bg-red-600 animate-pulse' : status.isReceiving ? 'bg-emerald-500 animate-pulse' : 'bg-slate-800'}`}></div>

      <div className="flex-1 flex flex-col p-3 justify-between">
          <div className="flex justify-between items-start">
             <div>
                <div className="text-[9px] font-bold text-slate-500 tracking-widest">VHF RADIO</div>
                <div className="text-5xl font-display font-bold text-white leading-none mt-1">{status.channel}</div>
             </div>
             <div className="text-right">
                <div className={`text-xs font-bold px-2 py-0.5 rounded ${status.isTransmitting ? 'bg-red-600 text-white' : status.isReceiving ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                    {status.isTransmitting ? 'TX' : status.isReceiving ? 'RX' : 'STBY'}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-1">156.800</div>
             </div>
          </div>
          
          <div className="flex items-end justify-between gap-1">
             <div className="text-xs font-mono text-cyan-400 truncate max-w-[150px] uppercase">
                {status.lastMessage || "MONITORING..."}
             </div>
             <div className="flex items-end gap-[2px] h-6">
                 {spectrum.map((h, i) => (
                      <div 
                        key={i} 
                        className={`w-1.5 ${status.isTransmitting ? 'bg-red-500' : 'bg-emerald-500'} opacity-80`}
                        style={{ height: `${h}%` }}
                      ></div>
                 ))}
             </div>
          </div>
      </div>
    </div>
  );
};
