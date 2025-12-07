import React from 'react';

interface GaugeProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  color?: string;
}

export const Gauge: React.FC<GaugeProps> = ({ value, min, max, label, unit, color = "#06b6d4" }) => {
  const radius = 36;
  const stroke = 4;
  const normalizedValue = Math.min(Math.max(value, min), max);
  const percentage = (normalizedValue - min) / (max - min);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - percentage * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center p-3">
       {/* Floating Label */}
       <div className="absolute -top-1 w-full text-center">
           <span className="text-[10px] font-bold text-slate-500 tracking-widest">{label}</span>
       </div>

       <div className="relative w-full aspect-square max-w-[100px] flex items-center justify-center mt-3">
           {/* SVG Gauge */}
           <svg className="w-full h-full -rotate-90 transform drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]" viewBox="0 0 100 100">
             {/* Track */}
             <circle
               cx="50"
               cy="50"
               r={radius}
               stroke="rgba(255,255,255,0.05)"
               strokeWidth={stroke}
               fill="transparent"
             />
             {/* Active Arc with glow */}
             <circle
               cx="50"
               cy="50"
               r={radius}
               stroke={color}
               strokeWidth={stroke}
               fill="transparent"
               strokeDasharray={circumference}
               strokeDashoffset={strokeDashoffset}
               strokeLinecap="round"
               className="transition-all duration-700 ease-out"
               style={{ filter: `drop-shadow(0 0 4px ${color})` }}
             />
           </svg>

           {/* Value */}
           <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-display font-medium text-white tracking-wide">
                    {value.toFixed(1)}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">{unit}</span>
           </div>
       </div>
    </div>
  );
};