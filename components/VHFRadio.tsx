import React, { useEffect, useState } from 'react';
import { VHFStatus } from '../types';

interface VHFRadioProps {
  status: VHFStatus;
}

export const VHFRadio: React.FC<VHFRadioProps> = ({ status }) => {
  const [spectrum, setSpectrum] = useState<number[]>(Array(24).fill(10));

  useEffect(() => {
    let interval: any;
    if (status.isReceiving || status.isTransmitting) {
        interval = setInterval(() => {
            setSpectrum(prev => prev.map(() => Math.floor(Math.random() * 80) + 10));
        }, 100);
    } else {
        interval = setInterval(() => {
            setSpectrum(prev => prev.map(() => Math.floor(Math.random() * 20) + 5));
        }, 200);
    }
    return () => clearInterval(interval);
  }, [status.isReceiving, status.isTransmitting]);

  let lcdColor = "text-emerald-400";
  let bgClass = "bg-[#111]"; // Dark radio body
  
  if (status.alertLevel === 'MAYDAY') lcdColor = "text-red-500 animate-pulse";
  else if (status.isTransmitting) lcdColor = "text-red-400";

  return (
    <div className={`w-full rounded bg-[#1a1a1a] border border-slate-700 p-1 shadow-lg relative`}>
      {/* Rack Mount Screws */}
      <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-zinc-600 shadow-inner"></div>
      <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-zinc-600 shadow-inner"></div>
      <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-zinc-600 shadow-inner"></div>
      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-zinc-600 shadow-inner"></div>

      {/* Main LCD Display Area */}
      <div className="bg-[#050505] border-2 border-slate-600 rounded-sm p-2 relative overflow-hidden">
          {/* LCD Grid Background */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>
          
          <div className="flex justify-between items-end relative z-10">
              <div>
                  <div className="flex items-baseline gap-1">
                      <span className="text-[10px] text-slate-500 font-mono">CH</span>
                      <span className={`text-3xl font-mono font-bold leading-none ${lcdColor} drop-shadow-[0_0_5px_currentColor]`}>
                          {status.channel.toString().padStart(2, '0')}
                      </span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">156.800 MHz</div>
              </div>
              
              <div className="flex flex-col items-end">
                  <div className={`text-[9px] font-bold font-mono px-1 ${status.isTransmitting ? 'bg-red-900 text-red-500' : 'bg-slate-800 text-slate-500'}`}>
                      {status.isTransmitting ? 'TX' : status.isReceiving ? 'RX' : 'STBY'}
                  </div>
              </div>
          </div>

          {/* Spectrum Bar Graph */}
          <div className="h-8 flex items-end justify-between gap-[1px] mt-1 opacity-80">
              {spectrum.map((h, i) => (
                  <div 
                    key={i} 
                    className={`w-full rounded-sm transition-all duration-75 ${status.isTransmitting ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ height: `${h}%`, opacity: h/100 }}
                  ></div>
              ))}
          </div>

          {/* Text Line */}
          <div className="mt-1 border-t border-slate-800 pt-1">
               <div className="text-[9px] font-mono text-emerald-600 truncate uppercase">
                  {status.lastMessage || "MONITORING..."}
               </div>
          </div>
      </div>
    </div>
  );
};