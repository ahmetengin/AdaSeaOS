import React from 'react';
import { NMEAData } from '../types';

interface SailSteerProps {
    data: NMEAData;
    size?: number;
}

export const SailSteer: React.FC<SailSteerProps> = ({ data, size = 300 }) => {
    // HEADING UP DISPLAY LOGIC
    // Boat is fixed UP (0 degrees visually)
    // Compass Ring rotates by -Heading
    
    const heading = data.headingMagnetic;
    const cog = data.courseOverGround;
    const awa = data.windAngle; // Relative to bow
    // Calculate True Wind Direction relative to North, then map to display
    // Display Angle = TrueAngle - Heading
    const twd = (heading + data.windAngle) % 360; // Simplified TWD calc
    const twaDisplay = twd - heading; 
    
    const cogDisplay = cog - heading;

    // Radius constants
    const cx = 50;
    const cy = 50;
    const rRing = 42;
    const rInner = 32;

    const getCoord = (deg: number, r: number) => {
        const rad = (deg - 90) * (Math.PI / 180);
        return {
            x: cx + r * Math.cos(rad),
            y: cy + r * Math.sin(rad)
        };
    };

    return (
        <div className="relative flex items-center justify-center aspect-square w-full max-w-[400px] select-none">
            
            {/* 1. ROTATING COMPASS RING */}
            <svg 
                viewBox="0 0 100 100" 
                className="w-full h-full absolute inset-0 transition-transform duration-700 ease-out"
                style={{ transform: `rotate(${-heading}deg)` }}
            >
                {/* Ring Background */}
                <circle cx="50" cy="50" r={rRing} fill="none" stroke="#1e293b" strokeWidth="12" />
                
                {/* Ticks & Numbers */}
                {Array.from({ length: 12 }).map((_, i) => {
                    const deg = i * 30;
                    const isMajor = i % 3 === 0; // 0, 90, 180, 270
                    const pos = getCoord(deg, rRing);
                    const textPos = getCoord(deg, rRing); // Centered in stroke
                    
                    return (
                        <g key={i}>
                            {/* Tick Marks */}
                            <line 
                                x1={getCoord(deg, rRing - 5).x} y1={getCoord(deg, rRing - 5).y}
                                x2={getCoord(deg, rRing + 5).x} y2={getCoord(deg, rRing + 5).y}
                                stroke={isMajor ? "white" : "#64748b"} 
                                strokeWidth={isMajor ? 0.8 : 0.4}
                            />
                            {/* Numbers (Counter-rotated to stay upright) */}
                            <text 
                                x={textPos.x} 
                                y={textPos.y} 
                                fill={isMajor ? "white" : "#94a3b8"}
                                fontSize={isMajor ? "5" : "3"}
                                fontWeight="bold"
                                textAnchor="middle"
                                alignmentBaseline="middle"
                                transform={`rotate(${heading}, ${textPos.x}, ${textPos.y})`}
                            >
                                {deg === 0 ? 'N' : deg}
                            </text>
                        </g>
                    );
                })}

                {/* TWD (True Wind Direction) Marker - Fixed on map, rotates with ring */}
                <g transform={`rotate(${twd}, 50, 50)`}>
                    <polygon points="50,6 47,2 53,2" fill="#10b981" /> {/* Green T marker */}
                    <text x="50" y="10" fill="#10b981" fontSize="3" fontWeight="bold" textAnchor="middle" transform={`rotate(${heading}, 50, 10)`}>T</text>
                </g>

                {/* COG (Course Over Ground) Marker */}
                <g transform={`rotate(${cog}, 50, 50)`}>
                    <polygon points="50,12 48,15 52,15" fill="#f59e0b" /> {/* Orange Triangle */}
                </g>
            </svg>

            {/* 2. FIXED LAYERS (Boat centric) */}
            <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0">
                {/* Boat Icon (Fixed UP) */}
                <path d="M50 25 C 60 40, 60 70, 50 85 C 40 70, 40 40, 50 25" fill="#0f172a" stroke="white" strokeWidth="0.5" />
                <line x1="50" y1="25" x2="50" y2="85" stroke="#334155" strokeWidth="0.2" />

                {/* Heading Line (Fixed UP) */}
                <line x1="50" y1="25" x2="50" y2="5" stroke="white" strokeWidth="1" />
                <polygon points="50,2 48,6 52,6" fill="white" />

                {/* Apparent Wind Angle (Relative to Boat) */}
                <g transform={`rotate(${awa}, 50, 50)`}>
                    <line x1="50" y1="50" x2="50" y2="18" stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,1" />
                    <circle cx="50" cy="18" r="2" fill="#3b82f6" />
                    <text x="50" y="15" fill="#3b82f6" fontSize="3" fontWeight="bold" textAnchor="middle">A</text>
                </g>
                
                {/* Port/Stbd Colors on Boat */}
                <path d="M50 25 C 40 40, 40 70, 50 85" fill="none" stroke="#ef4444" strokeWidth="0.5" opacity="0.5" /> {/* Port Red */}
                <path d="M50 25 C 60 40, 60 70, 50 85" fill="none" stroke="#10b981" strokeWidth="0.5" opacity="0.5" /> {/* Stbd Green */}
            </svg>
            
            {/* Center Data Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <div className="mt-8 bg-black/50 backdrop-blur-sm px-2 py-1 rounded border border-white/10 flex flex-col items-center">
                     <span className="text-[8px] text-slate-400 uppercase tracking-widest">HEADING</span>
                     <span className="text-2xl font-display font-bold text-white leading-none">{heading.toFixed(0)}°</span>
                 </div>
            </div>

        </div>
    );
};