import React from 'react';
import { NMEAData } from '../types';

interface TacticalCompassProps {
  data: NMEAData;
}

export const TacticalCompass: React.FC<TacticalCompassProps> = ({ data }) => {
  const size = 400; 
  const center = size / 2;
  const radius = 140; // Slightly smaller to make room for Wind Arrow

  // Alert Logic
  const isShallow = data.depth < 3.0; 

  // Wind Logic
  // windAngle is usually Relative 0-360. 
  // 0 = Bow, 90 = Starboard Beam, 180 = Stern, 270 = Port Beam.
  // We want the arrow to point FROM the wind direction TOWARDS the center.
  // If wind is 45 (Stbd Bow), arrow should be AT 45 degrees, pointing IN.
  // Rotation of the arrow group should be `data.windAngle`.
  // Arrow Graphic should point DOWN (towards center).
  const windIsStarboard = data.windAngle > 0 && data.windAngle < 180;
  const windColor = windIsStarboard ? '#10b981' : '#ef4444'; // Green (Stbd) / Red (Port) for Wind

  // Generate Compass Ticks
  const renderCompassRing = () => {
    const ticks = [];
    for (let i = 0; i < 360; i += 2) {
      const isCardinal = i % 90 === 0;
      const isMajor = i % 10 === 0;
      
      const length = isCardinal ? 15 : isMajor ? 10 : 5;
      const weight = isCardinal ? 3 : isMajor ? 2 : 1;
      const color = isCardinal ? '#06b6d4' : isMajor ? '#475569' : '#1e293b';
      
      ticks.push(
        <line
          key={`tick-${i}`}
          x1={center} y1={center - radius}
          x2={center} y2={center - radius + length}
          stroke={color}
          strokeWidth={weight}
          transform={`rotate(${i} ${center} ${center})`}
        />
      );

      if (i % 30 === 0) {
        let label = i.toString();
        let labelColor = "#64748b";
        let fontSize = "12";
        let fontWeight = "normal";

        if (i === 0) { label = "N"; labelColor = "#ef4444"; fontSize = "20"; fontWeight = "bold"; }
        else if (i === 90) { label = "E"; labelColor = "#cbd5e1"; fontSize = "20"; fontWeight = "bold"; }
        else if (i === 180) { label = "S"; labelColor = "#cbd5e1"; fontSize = "20"; fontWeight = "bold"; }
        else if (i === 270) { label = "W"; labelColor = "#cbd5e1"; fontSize = "20"; fontWeight = "bold"; }
        else { label = (i / 10).toString(); }

        ticks.push(
          <text
            key={`text-${i}`}
            x={center} y={center - radius + 30}
            fill={labelColor}
            fontSize={fontSize}
            fontWeight={fontWeight}
            textAnchor="middle"
            transform={`rotate(${i} ${center} ${center})`}
            style={{ fontFamily: 'Rajdhani' }}
          >
            {label}
          </text>
        );
      }
    }
    return ticks;
  };

  return (
    <div className={`w-full h-full flex items-center justify-center bg-[#09090b] relative overflow-hidden transition-colors duration-500 ${isShallow ? 'animate-pulse bg-red-950/40' : ''}`}>
        
        {/* Shallow Alarm */}
        {isShallow && (
            <div className="absolute top-10 left-0 right-0 z-50 flex justify-center">
                <div className="bg-red-600 text-white font-bold text-xl px-4 py-1 rounded animate-bounce shadow-lg">SIĞ SU!</div>
            </div>
        )}

        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full max-w-[600px] max-h-[600px]">
            
            {/* 1. HORIZON BACKGROUND */}
            <defs>
                <clipPath id="innerCircleClip">
                    <circle cx={center} cy={center} r={radius - 10} />
                </clipPath>
                <linearGradient id="skySea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="49%" stopColor="#0f172a" />
                    <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.5" />
                    <stop offset="51%" stopColor="#083344" />
                </linearGradient>
            </defs>
            <circle cx={center} cy={center} r={radius - 10} fill="url(#skySea)" opacity="0.4" />

            {/* 2. ROTATING COMPASS RING (Heading Up) */}
            <g transform={`rotate(${-data.headingMagnetic} ${center} ${center})`} className="transition-transform duration-700 ease-out">
                {renderCompassRing()}
            </g>

            {/* 3. WIND INDICATOR (The User's Request) */}
            {/* This arrow stays relative to the boat. It rotates based on Apparent Wind Angle */}
            <g transform={`rotate(${data.windAngle} ${center} ${center})`}>
                {/* Arrow Head pointing IN towards center (Wind Origin) */}
                <path 
                    d={`M${center} ${center - radius - 15} L${center - 12} ${center - radius - 35} L${center + 12} ${center - radius - 35} Z`} 
                    fill={windColor} 
                    stroke="black" 
                    strokeWidth="2"
                    className="drop-shadow-lg"
                />
                {/* Shaft */}
                <rect x={center - 2} y={center - radius - 55} width="4" height="20" fill={windColor} />
                {/* Label */}
                <text 
                    x={center} 
                    y={center - radius - 60} 
                    fill={windColor} 
                    fontSize="14" 
                    fontWeight="bold" 
                    textAnchor="middle"
                    transform={`rotate(${-data.windAngle} ${center} ${center - radius - 60})`} // Keep text upright
                >
                    {data.windSpeed.toFixed(1)} kn
                </text>
            </g>

            {/* 4. BOAT ICON (Fixed Center) */}
            <g transform={`translate(${center}, ${center})`}>
                <path d="M0 -30 Q15 0 12 40 L0 45 L-12 40 Q-15 0 0 -30" fill="#1e293b" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="0" y1="-30" x2="0" y2="45" stroke="#cbd5e1" strokeWidth="1" strokeOpacity="0.5" />
            </g>

            {/* 5. HEADING (Top Big) */}
            <g transform={`translate(${center}, ${center - 50})`}>
                 <text textAnchor="middle" className="font-display font-bold fill-white text-5xl tracking-tighter filter drop-shadow-md">
                     {data.headingMagnetic.toFixed(0).padStart(3, '0')}
                     <tspan fontSize="24" fill="#64748b" dy="-15">°</tspan>
                 </text>
            </g>

            {/* 6. DATA WINGS (Bottom) */}
            
            {/* SPEED */}
            <g transform={`translate(${center - 60}, ${center + 120})`}>
                <text textAnchor="middle" className="font-display font-bold fill-white text-4xl">{data.speedOverGround.toFixed(1)}</text>
                <text y="15" textAnchor="middle" className="font-mono text-[10px] fill-slate-400">KNOT</text>
            </g>

            {/* DEPTH */}
            <g transform={`translate(${center + 60}, ${center + 120})`}>
                <text textAnchor="middle" className={`font-display font-bold text-4xl ${isShallow ? 'fill-red-500' : 'fill-white'}`}>{data.depth.toFixed(1)}</text>
                <text y="15" textAnchor="middle" className="font-mono text-[10px] fill-slate-400">METRE</text>
            </g>

        </svg>
    </div>
  );
};
