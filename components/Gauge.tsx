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
  // Config
  const radius = 42;
  const stroke = 3;
  const normalizedValue = Math.min(Math.max(value, min), max);
  const percentage = (normalizedValue - min) / (max - min);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - percentage * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center p-2 glass-panel rounded-none border border-slate-700 bg-slate-900">
       
       {/* Label Header */}
       <div className="w-full flex justify-between items-center px-1 mb-1 border-b border-slate-800 pb-1">
           <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{label}</span>
           <div className={`w-1.5 h-1.5 rounded-sm ${percentage > 0.9 ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`}></div>
       </div>

       <div className="relative w-full aspect-square max-w-[120px] flex items-center justify-center">
           {/* SVG Gauge */}
           <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
             {/* Track */}
             <circle
               cx="50"
               cy="50"
               r={radius}
               stroke="#1e293b"
               strokeWidth={stroke}
               fill="transparent"
             />
             {/* Progress */}
             <circle
               cx="50"
               cy="50"
               r={radius}
               stroke={color}
               strokeWidth={stroke}
               fill="transparent"
               strokeDasharray={circumference}
               strokeDashoffset={strokeDashoffset}
               strokeLinecap="butt"
               className="transition-all duration-500 ease-out"
             />
             
             {/* Tick Marks (Inner) */}
             {Array.from({ length: 12 }).map((_, i) => (
                <line
                    key={i}
                    x1="50" y1="12"
                    x2="50" y2="16"
                    stroke="#334155"
                    strokeWidth="1"
                    transform={`rotate(${i * 30} 50 50)`}
                />
             ))}
           </svg>

           {/* Digital Readout Center */}
           <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-mono font-bold leading-none ${percentage > 0.9 ? 'text-red-500' : 'text-white'}`}>
                    {value.toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">{unit}</span>
           </div>
       </div>
    </div>
  );
};