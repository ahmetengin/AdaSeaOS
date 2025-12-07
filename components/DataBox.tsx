import React from 'react';

interface DataBoxProps {
    label: string;
    value: string | number;
    unit?: string;
    color?: string; // Text color for value
    size?: 'sm' | 'md' | 'lg';
    labelColor?: string;
    className?: string;
}

export const DataBox: React.FC<DataBoxProps> = ({ 
    label, 
    value, 
    unit, 
    color = "text-white", 
    size = 'md',
    labelColor = "text-slate-400",
    className = ""
}) => {
    // B&G Aesthetic: Sharp corners (or slightly rounded), Black bg, thin borders
    return (
        <div className={`relative flex flex-col justify-between bg-black border border-slate-800 p-2 overflow-hidden group hover:border-slate-600 transition-colors ${className}`}>
            {/* Label - Top Left or Top Center */}
            <div className={`text-[10px] uppercase font-bold tracking-widest ${labelColor} truncate`}>
                {label}
            </div>

            {/* Value - Center/Bottom */}
            <div className="flex items-baseline justify-center gap-1 mt-auto">
                <span className={`font-display font-bold leading-none ${color} ${
                    size === 'lg' ? 'text-6xl md:text-7xl' : 
                    size === 'md' ? 'text-4xl md:text-5xl' : 
                    'text-2xl'
                }`}>
                    {value}
                </span>
            </div>

            {/* Unit - Bottom Right or Inline */}
            {unit && (
                <div className="absolute bottom-1 right-2 text-[10px] font-bold text-slate-500">
                    {unit}
                </div>
            )}
            
            {/* Corner Accents (Glass Bridge feel) */}
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/10"></div>
        </div>
    );
};