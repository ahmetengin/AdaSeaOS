
import React from 'react';

interface DataBoxProps {
    label: string;
    value: string | number;
    unit?: string;
    color?: string; // Text color for value
    size?: 'sm' | 'md' | 'lg' | 'xl'; 
    labelColor?: string; // Kept for backward compatibility, though overruled by category styles now
    category?: string; // NEW: To determine background color
    className?: string;
}

const CATEGORY_STYLES: Record<string, string> = {
    'NAV': 'bg-blue-700',      // Navigation (SOG, COG, Heading)
    'ENGINE': 'bg-red-700',    // Engines (RPM, Oil, Temp)
    'ENV': 'bg-teal-700',      // Environment (Wind, Temp)
    'ELEC': 'bg-amber-600',    // Electrical (Battery, Solar)
    'TANK': 'bg-purple-700',   // Tanks
    'TRIP': 'bg-lime-700',     // Trip Computer
    'SENSOR': 'bg-slate-600',  // Sensors (Pitch, Roll)
};

export const DataBox: React.FC<DataBoxProps> = ({ 
    label, 
    value, 
    unit, 
    color = "text-white", 
    size = 'md',
    category = 'NAV',
    className = ""
}) => {
    // Determine background color based on category, default to slate if unknown
    const labelBgColor = CATEGORY_STYLES[category] || 'bg-slate-700';

    return (
        <div className={`relative flex flex-col items-center justify-center bg-black border-[0.5px] border-slate-800/50 overflow-hidden h-full w-full group ${className}`}>
            
            {/* 
                Label - Absolute Top Left - With Colored Band 
                Design: A solid tag in the corner
            */}
            <div className={`absolute top-0 left-0 px-3 py-1 text-[9px] md:text-[10px] uppercase font-bold tracking-[0.15em] text-white z-20 shadow-md ${labelBgColor}`}>
                {label}
            </div>

            {/* Value - Absolute Center & Massive - Filling the Box */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none pt-4">
                 {/* 
                    Using specific massive font sizes to ensure the data DOMINATES the box. 
                    'tabular-nums' ensures numbers don't jitter as they change rapidly from NMEA stream.
                 */}
                <span className={`font-display font-bold leading-none tracking-tighter tabular-nums text-center select-none ${color} ${
                    size === 'xl' ? 'text-[7rem] md:text-[10rem] xl:text-[12rem]' : 
                    size === 'lg' ? 'text-[4rem] md:text-[6rem] xl:text-[7rem]' : 
                    size === 'md' ? 'text-[3rem] md:text-[4.5rem] xl:text-[5.5rem]' : 
                    'text-[1.8rem] md:text-[2.5rem]' 
                }`}>
                    {value}
                </span>
            </div>

            {/* Unit - Absolute Bottom Right - Pushed to edge */}
            {unit && (
                <div className="absolute bottom-1 right-2 text-[9px] md:text-[10px] font-bold text-slate-600 z-20 tracking-wider">
                    {unit}
                </div>
            )}
            
            {/* Micro Tech Accents - Corners */}
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-800 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-slate-800 opacity-50"></div>
            
            {/* Active Data Flow Indicator (Subtle Pulse) */}
            <div className="absolute top-2 right-2 w-1 h-1 rounded-full bg-emerald-500/20 animate-pulse"></div>
        </div>
    );
};
