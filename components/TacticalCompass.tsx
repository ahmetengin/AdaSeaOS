import React from 'react';
import { NMEAData, AgentStatus } from '../types';

interface TacticalCompassProps {
  data: NMEAData;
  status?: AgentStatus;
  onTalk?: () => void;
}

export const TacticalCompass: React.FC<TacticalCompassProps> = ({ data, status = AgentStatus.IDLE, onTalk }) => {
  
  // Status Logic for UI Feedback
  const isActive = status !== AgentStatus.IDLE;
  let borderColor = "border-slate-800";
  let statusText = "STANDBY";
  let bgClass = "bg-black";

  if (status === AgentStatus.LISTENING) {
      borderColor = "border-emerald-500";
      statusText = "DİNLİYOR";
      bgClass = "bg-emerald-950/30";
  } else if (status === AgentStatus.SPEAKING) {
      borderColor = "border-indigo-500";
      statusText = "KONUŞUYOR";
      bgClass = "bg-indigo-950/30";
  } else if (status === AgentStatus.THINKING || status === AgentStatus.EXECUTING) {
      borderColor = "border-amber-500";
      statusText = "İŞLENİYOR";
      bgClass = "bg-amber-950/30";
  }

  const getCardinal = (deg: number) => {
      const val = Math.floor((deg / 22.5) + 0.5);
      const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
      return arr[val % 16];
  };

  const isShallow = data.depth < 3.0;

  return (
    <div className="w-full h-full bg-black flex flex-col font-sans select-none border-4 border-slate-900 rounded-xl overflow-hidden">
        
        {/* TOP ROW: HEADING (Voice Trigger) */}
        <div 
            onClick={onTalk}
            className={`h-[45%] relative border-b-4 ${borderColor} ${bgClass} flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 group`}
        >
            <div className="absolute top-2 left-4 text-slate-500 text-sm font-bold tracking-widest">HEADING</div>
            <div className={`absolute top-2 right-4 text-xs font-bold tracking-widest px-2 py-1 rounded ${isActive ? 'bg-white text-black' : 'bg-slate-800 text-slate-500'}`}>
                {isActive ? statusText : 'PTT'}
            </div>
            
            <div className="flex items-baseline gap-4 mt-2">
                <span className={`text-[9rem] leading-none font-display font-bold tracking-tighter ${isActive ? 'text-white' : 'text-slate-100'}`}>
                    {data.headingMagnetic.toFixed(0).padStart(3, '0')}
                </span>
                <span className="text-4xl font-bold text-slate-600">°</span>
            </div>
            <div className="text-3xl font-bold text-cyan-500 tracking-[0.2em] -mt-4">
                {getCardinal(data.headingMagnetic)}
            </div>
        </div>

        {/* MIDDLE ROW: SOG & DEPTH */}
        <div className="h-[35%] grid grid-cols-2 border-b-4 border-slate-900">
            {/* SOG */}
            <div className="border-r-4 border-slate-900 bg-slate-950 flex flex-col items-center justify-center relative">
                <div className="absolute top-2 left-3 text-slate-500 text-xs font-bold tracking-widest">SOG (SPEED)</div>
                <div className="flex items-baseline">
                    <span className="text-[5rem] leading-none font-display font-bold text-emerald-400 tracking-tight">
                        {data.speedOverGround.toFixed(1)}
                    </span>
                </div>
                <div className="text-sm font-bold text-emerald-700/50 mt-1">KNOTS</div>
            </div>

            {/* DEPTH */}
            <div className={`flex flex-col items-center justify-center relative ${isShallow ? 'bg-red-950 animate-pulse' : 'bg-slate-950'}`}>
                <div className="absolute top-2 left-3 text-slate-500 text-xs font-bold tracking-widest">DEPTH</div>
                <div className="flex items-baseline">
                    <span className={`text-[5rem] leading-none font-display font-bold tracking-tight ${isShallow ? 'text-red-500' : 'text-white'}`}>
                        {data.depth.toFixed(1)}
                    </span>
                </div>
                <div className={`text-sm font-bold mt-1 ${isShallow ? 'text-red-700' : 'text-slate-600'}`}>METERS</div>
            </div>
        </div>

        {/* BOTTOM ROW: WIND & ENV */}
        <div className="h-[20%] grid grid-cols-3 bg-slate-900">
            {/* TWS */}
            <div className="flex flex-col items-center justify-center border-r-4 border-black bg-slate-950">
                <div className="text-[10px] font-bold text-slate-500">TWS (WIND)</div>
                <div className="text-3xl font-bold text-amber-400 font-display">{data.windSpeed.toFixed(1)} <span className="text-sm text-slate-600">kn</span></div>
            </div>

            {/* TWD */}
            <div className="flex flex-col items-center justify-center border-r-4 border-black bg-slate-950">
                <div className="text-[10px] font-bold text-slate-500">WIND ANGLE</div>
                <div className="flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-amber-500" style={{ transform: `rotate(${data.windAngle}deg)` }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                    <div className="text-3xl font-bold text-white font-display">{data.windAngle.toFixed(0)}°</div>
                </div>
            </div>

            {/* TEMP */}
            <div className="flex flex-col items-center justify-center bg-slate-950">
                <div className="text-[10px] font-bold text-slate-500">SEA TEMP</div>
                <div className="text-3xl font-bold text-cyan-200 font-display">{data.waterTemp.toFixed(1)} <span className="text-sm text-slate-600">°C</span></div>
            </div>
        </div>
    </div>
  );
};
