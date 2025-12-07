import React, { useState, useEffect, useRef } from 'react';
import { NMEAData, VolvoEngineData, LightingData } from '../types';

// Declare Leaflet globally since we are loading it via script tag
declare const L: any;

interface SpyglassMapProps {
    data: NMEAData;
    onClose: () => void;
    onControl: (action: string, payload: any) => void;
}

export const SpyglassMap: React.FC<SpyglassMapProps> = ({ data, onClose, onControl }) => {
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(true);
    const [compassRotation, setCompassRotation] = useState(0);
    const [activeTab, setActiveTab] = useState<'VOLVO' | 'VICTRON' | 'NAV' | 'DOMOTIC' | 'WX'>('VOLVO');
    const mapRef = useRef<any>(null);
    const boatMarkerRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: true,
            center: [data.latitude, data.longitude],
            zoom: 14
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CARTO',
            maxZoom: 20
        }).addTo(map);

        L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenSeaMap',
            maxZoom: 18
        }).addTo(map);

        const boatIcon = L.divIcon({
            className: 'boat-marker',
            html: `<svg width="44" height="44" viewBox="0 0 44 44" style="transform-origin: center;">
                    <path d="M22 2 L32 36 L22 30 L12 36 Z" fill="#10b981" stroke="white" stroke-width="2" />
                   </svg>`,
            iconSize: [44, 44],
            iconAnchor: [22, 22]
        });

        const marker = L.marker([data.latitude, data.longitude], { icon: boatIcon }).addTo(map);
        boatMarkerRef.current = marker;
        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Update Map Position
    useEffect(() => {
        if (mapRef.current && boatMarkerRef.current) {
            const newLatLng = [data.latitude, data.longitude];
            boatMarkerRef.current.setLatLng(newLatLng);
            mapRef.current.panTo(newLatLng, { animate: true, duration: 1 });

            const iconEl = boatMarkerRef.current.getElement();
            if (iconEl) {
                const svg = iconEl.querySelector('svg');
                if (svg) {
                    svg.style.transform = `rotate(${data.headingMagnetic}deg)`;
                }
            }
        }
    }, [data.latitude, data.longitude, data.headingMagnetic]);

    useEffect(() => {
        setCompassRotation(-data.headingMagnetic);
    }, [data.headingMagnetic]);

    const handleModeCycle = () => {
        const modes: ('DIESEL' | 'ELECTRIC' | 'HYBRID')[] = ['DIESEL', 'ELECTRIC', 'HYBRID'];
        const currentIdx = modes.indexOf(data.hybrid.mode);
        const nextMode = modes[(currentIdx + 1) % modes.length];
        onControl('CONTROL_MODE', nextMode);
    };

    const renderCompassTicks = () => {
        const ticks = [];
        for (let i = 0; i < 360; i += 5) {
            const isCardinal = i % 90 === 0;
            const isMajor = i % 10 === 0;
            const length = isCardinal ? 15 : isMajor ? 10 : 5;
            const width = isCardinal ? 3 : isMajor ? 2 : 1;
            const color = isCardinal ? '#10b981' : isMajor ? '#cbd5e1' : '#475569';
            
            ticks.push(
                <line
                    key={i}
                    x1="150" y1="10"
                    x2="150" y2={10 + length}
                    stroke={color}
                    strokeWidth={width}
                    transform={`rotate(${i} 150 150)`}
                />
            );

            if (isMajor) {
                let label = i.toString();
                if (i === 0) label = "N";
                if (i === 90) label = "E";
                if (i === 180) label = "S";
                if (i === 270) label = "W";
                
                ticks.push(
                    <text
                        key={`t-${i}`}
                        x="150" y="35"
                        fill={isCardinal ? '#10b981' : '#94a3b8'}
                        fontSize={isCardinal ? "24" : "12"}
                        fontWeight={isCardinal ? "bold" : "normal"}
                        textAnchor="middle"
                        transform={`rotate(${i} 150 150)`}
                        style={{ fontFamily: 'Rajdhani' }}
                    >
                        {label}
                    </text>
                );
            }
        }
        return ticks;
    };

    const isElectric = data.hybrid?.mode === 'ELECTRIC';
    const primaryColor = isElectric ? 'text-emerald-400' : 'text-amber-400';
    const primaryBorder = isElectric ? 'border-emerald-500' : 'border-amber-500';

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 font-sans overflow-hidden flex flex-col">
            
            {/* Background Layer */}
            <div className="absolute inset-0 z-0 bg-[#0f172a]">
                 <div ref={mapContainerRef} className="w-full h-full opacity-80" />
                 <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at center, transparent 40%, #020617 100%)' }}></div>
                 <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ 
                    backgroundImage: `linear-gradient(${isElectric ? '#10b981' : '#f59e0b'} 1px, transparent 1px), linear-gradient(90deg, ${isElectric ? '#10b981' : '#f59e0b'} 1px, transparent 1px)`, 
                    backgroundSize: '100px 100px',
                    perspective: '1000px',
                    transform: 'rotateX(20deg) scale(1.5)'
                }}></div>
            </div>

            {/* Top Bar */}
            <div className="relative z-20 h-16 flex justify-between items-center px-6 border-b border-slate-800/50 bg-slate-950/30 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${isElectric ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    <div className="flex flex-col">
                        <span className={`font-display font-bold tracking-widest text-lg ${primaryColor}`}>GREENLINE 48 <span className="text-white opacity-50 text-sm">HYBRID</span></span>
                    </div>
                </div>
                
                <button 
                    onClick={handleModeCycle}
                    className={`px-4 py-1 rounded border flex items-center gap-3 shadow-[0_0_15px_rgba(0,0,0,0.5)] bg-slate-900/80 ${primaryBorder} hover:bg-slate-800 transition active:scale-95`}
                >
                    <span className="text-xs text-slate-400 font-bold tracking-wider">DRIVE MODE</span>
                    <span className={`text-xl font-mono font-bold ${primaryColor}`}>{data.hybrid?.mode || 'UNKNOWN'}</span>
                </button>

                <div className="flex items-center gap-4">
                     <div className="bg-slate-900/80 border border-slate-700 px-4 py-1 rounded flex items-baseline gap-2">
                        <span className="text-xs text-slate-500 font-bold">HDG</span>
                        <span className="text-2xl font-mono text-white font-bold">{data.headingMagnetic.toFixed(0).padStart(3, '0')}°</span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-red-500/20 rounded-full group transition-colors">
                        <svg className="w-6 h-6 text-slate-400 group-hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            </div>

            <div className="relative flex-1 flex overflow-hidden">
                
                {/* --- LEFT WING (Navigation) --- */}
                <div className={`absolute left-4 top-4 bottom-4 w-72 z-20 transition-transform duration-500 ease-in-out flex flex-col gap-3 ${leftOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
                     {/* SOG WIDGET */}
                     <div className={`glass-panel p-3 rounded-xl flex items-center justify-between border-l-4 bg-slate-900/90 shadow-lg backdrop-blur-md ${primaryBorder}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg bg-slate-800/40 border border-white/10 flex items-center justify-center ${primaryColor}`}>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">SOG</div>
                                <div className="text-4xl font-display font-bold text-white leading-none">
                                   {data.speedOverGround.toFixed(1)} <span className="text-sm font-mono text-slate-500 font-normal">kn</span>
                                </div>
                            </div>
                        </div>
                     </div>

                     {/* DEPTH WIDGET */}
                     <div className="glass-panel p-3 rounded-xl flex items-center justify-between border-l-4 border-indigo-500 bg-slate-900/90 shadow-lg backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-indigo-900/40 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">DEPTH</div>
                                <div className="text-4xl font-display font-bold text-white leading-none">
                                   {data.depth.toFixed(1)} <span className="text-sm font-mono text-slate-500 font-normal">m</span>
                                </div>
                            </div>
                        </div>
                     </div>

                     {/* Location */}
                     <div className="glass-panel p-4 rounded-xl border-l-4 border-slate-600 bg-slate-900/80 backdrop-blur-md mt-2">
                          <div className="flex items-center gap-2 mb-2">
                             <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                             <h3 className="text-xs font-bold text-slate-400 tracking-wider">POSITION</h3>
                          </div>
                          <div className={`font-mono text-lg tracking-wider ${primaryColor}`}>{data.latitude.toFixed(5)} N</div>
                          <div className={`font-mono text-lg tracking-wider ${primaryColor}`}>{data.longitude.toFixed(5)} E</div>
                     </div>
                </div>
                
                <button onClick={() => setLeftOpen(!leftOpen)} className={`absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-slate-900 border border-slate-700 p-1 rounded-r-md text-slate-400 hover:text-white transition-all duration-500 ${leftOpen ? 'translate-x-[288px]' : 'translate-x-0'}`}>
                    {leftOpen ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}
                </button>

                {/* --- CENTER COMPASS --- */}
                <div className="relative flex-1 flex items-center justify-center pointer-events-none z-10">
                    <div className="relative w-[340px] h-[340px] md:w-[500px] md:h-[500px]">
                        <div className="absolute inset-0 transition-transform duration-700 ease-out will-change-transform" style={{ transform: `rotate(${compassRotation}deg)` }}>
                            <svg viewBox="0 0 300 300" className="w-full h-full">
                                <circle cx="150" cy="150" r="148" fill="rgba(15, 23, 42, 0.6)" stroke="#334155" strokeWidth="2" />
                                <circle cx="150" cy="150" r="100" fill="transparent" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 2" />
                                <g>{renderCompassTicks()}</g>
                            </svg>
                        </div>
                        <div className="absolute inset-0">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <div className={`w-4 h-4 border rounded-full flex items-center justify-center ${primaryBorder} shadow-[0_0_10px_currentColor] text-${isElectric ? 'emerald-500' : 'amber-500'}`}>
                                    <div className={`w-1 h-1 rounded-full ${isElectric ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                </div>
                                <div className={`absolute top-1/2 left-6 w-12 h-[1px] ${isElectric ? 'bg-emerald-500/50' : 'bg-amber-500/50'}`}></div>
                                <div className={`absolute top-1/2 right-6 w-12 h-[1px] ${isElectric ? 'bg-emerald-500/50' : 'bg-amber-500/50'}`}></div>
                            </div>
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
                                <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-red-500 drop-shadow-lg"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT WING (SYSTEM MONITOR) --- */}
                <div className={`absolute right-4 top-4 bottom-4 w-[400px] z-20 transition-transform duration-500 ease-in-out flex flex-col gap-3 ${rightOpen ? 'translate-x-0' : 'translate-x-[120%]'}`}>
                    
                    {/* Panel Switcher */}
                    <div className="flex bg-slate-900/90 rounded-xl p-1 border border-slate-700 shadow-lg backdrop-blur overflow-x-auto custom-scrollbar">
                        {(['VOLVO', 'VICTRON', 'NAV', 'DOMOTIC', 'WX'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 min-w-[60px] py-2 rounded-lg text-[10px] font-bold tracking-wider transition-all ${activeTab === tab ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 glass-panel rounded-xl p-0 bg-slate-900/95 backdrop-blur-md overflow-y-auto custom-scrollbar border-l-4 border-slate-600 relative">
                        
                        {/* VOLVO PENTA GLASS COCKPIT */}
                        {activeTab === 'VOLVO' && (
                            <div className="h-full flex flex-col p-4 bg-gradient-to-br from-slate-900 to-slate-800">
                                <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                                    <h3 className="text-sm font-bold text-white tracking-widest">VOLVO PENTA</h3>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => onControl('CONTROL_ENGINE', { action: 'START' })}
                                            className="px-2 py-1 bg-green-700 hover:bg-green-600 text-[10px] text-white rounded font-bold"
                                        >
                                            START
                                        </button>
                                        <button 
                                            onClick={() => onControl('CONTROL_ENGINE', { action: 'STOP' })}
                                            className="px-2 py-1 bg-red-700 hover:bg-red-600 text-[10px] text-white rounded font-bold"
                                        >
                                            STOP
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 flex-1">
                                    <VolvoGauge engine={data.engines?.port} label="PORT" />
                                    <VolvoGauge engine={data.engines?.stbd} label="STBD" />
                                </div>

                                <div className="mt-2 flex justify-center gap-2 items-center">
                                    <button onClick={() => onControl('CONTROL_ENGINE', { action: 'SET_RPM', rpm: Math.max(0, data.engines.port.rpm - 100) })} className="w-8 h-8 rounded bg-slate-700 text-white font-bold">-</button>
                                    <span className="text-xs text-slate-400 font-mono w-16 text-center">RPM SET</span>
                                    <button onClick={() => onControl('CONTROL_ENGINE', { action: 'SET_RPM', rpm: Math.min(4000, data.engines.port.rpm + 100) })} className="w-8 h-8 rounded bg-slate-700 text-white font-bold">+</button>
                                </div>

                                <div className="mt-4 p-3 bg-slate-900 rounded border border-slate-700 grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <div className="text-[9px] text-slate-500">TOTAL FUEL RATE</div>
                                        <div className="text-lg font-mono text-white">{(data.engines?.port.fuelRate + data.engines?.stbd.fuelRate).toFixed(1)} <span className="text-xs text-slate-500">L/H</span></div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[9px] text-slate-500">COMBINED HOURS</div>
                                        <div className="text-lg font-mono text-white">{(data.engines?.port.hours + data.engines?.stbd.hours).toFixed(0)} <span className="text-xs text-slate-500">H</span></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* VICTRON ENERGY (Cerbo GX Style) */}
                        {activeTab === 'VICTRON' && (
                            <div className="h-full flex flex-col p-4 bg-[#0f172a] text-white">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="text-blue-500 font-bold tracking-wider">VICTRON ENERGY</div>
                                    <div className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-1 rounded">ESS: OPTIMIZED</div>
                                </div>
                                
                                {/* Flow Diagram Layout */}
                                <div className="flex flex-col gap-4 flex-1 relative">
                                    {/* Top Row: Sources */}
                                    <div className="flex justify-between">
                                        <VictronBlock 
                                            icon="⚡" 
                                            label="GRID" 
                                            value={`${data.electrics?.shorePower.powerW}W`} 
                                            sub={data.electrics?.shorePower.connected ? 'Active' : 'Disconnected'} 
                                            active={data.electrics?.shorePower.connected}
                                            color="bg-red-500"
                                        />
                                        <VictronBlock 
                                            icon="☀️" 
                                            label="PV CHARGER" 
                                            value={`${data.electrics?.solar.powerW}W`} 
                                            sub={data.electrics?.solar.mpptState} 
                                            active={true}
                                            color="bg-orange-500"
                                        />
                                    </div>

                                    {/* Center: Battery */}
                                    <div className="flex justify-center my-4">
                                        <div className="w-full bg-slate-800 rounded-xl p-4 border border-slate-700 relative overflow-hidden">
                                            <div className="flex justify-between items-end relative z-10">
                                                <div>
                                                    <div className="text-xs text-slate-400">LiFePO4 BANK</div>
                                                    <div className="text-3xl font-bold">{data.electrics?.battery.soc}%</div>
                                                    <div className="text-xs text-slate-500">{data.electrics?.battery.voltage.toFixed(1)}V • {data.electrics?.battery.current.toFixed(1)}A</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] text-slate-500">STATE</div>
                                                    <div className="text-blue-400 font-bold">{data.electrics?.battery.state}</div>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-1000" style={{ width: `${data.electrics?.battery.soc}%`}}></div>
                                        </div>
                                    </div>

                                    {/* Bottom: Loads */}
                                    <div className="flex justify-between">
                                        <VictronBlock 
                                            icon="AC" 
                                            label="AC LOADS" 
                                            value={`${data.electrics?.acLoads.powerW}W`} 
                                            sub="Inverter" 
                                            active={true}
                                            color="bg-green-600"
                                        />
                                        <VictronBlock 
                                            icon="DC" 
                                            label="DC LOADS" 
                                            value={`${data.electrics?.dcLoads.powerW}W`} 
                                            sub="Direct" 
                                            active={true}
                                            color="bg-green-600"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DOMOTICS (Lighting) */}
                        {activeTab === 'DOMOTIC' && (
                            <div className="h-full p-4">
                                <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-4">LIGHTING CONTROL</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    <LightSwitch label="SALOON MAIN" active={data.lighting?.saloon} onClick={() => onControl('CONTROL_SWITCH', { device: 'saloon', state: !data.lighting?.saloon })}/>
                                    <LightSwitch label="GALLEY" active={data.lighting?.galley} onClick={() => onControl('CONTROL_SWITCH', { device: 'galley', state: !data.lighting?.galley })}/>
                                    <LightSwitch label="MASTER CABIN" active={data.lighting?.masterCabin} onClick={() => onControl('CONTROL_SWITCH', { device: 'masterCabin', state: !data.lighting?.masterCabin })}/>
                                    <LightSwitch label="GUEST CABIN" active={data.lighting?.guestCabin} onClick={() => onControl('CONTROL_SWITCH', { device: 'guestCabin', state: !data.lighting?.guestCabin })}/>
                                    <LightSwitch label="AFT DECK" active={data.lighting?.aftDeck} onClick={() => onControl('CONTROL_SWITCH', { device: 'aftDeck', state: !data.lighting?.aftDeck })}/>
                                    <LightSwitch label="FLYBRIDGE" active={data.lighting?.flybridge} onClick={() => onControl('CONTROL_SWITCH', { device: 'flybridge', state: !data.lighting?.flybridge })}/>
                                    <LightSwitch label="UNDERWATER" active={data.lighting?.underwater} color="text-blue-400" onClick={() => onControl('CONTROL_SWITCH', { device: 'underwater', state: !data.lighting?.underwater })}/>
                                    <div className="h-[1px] bg-slate-700 my-2"></div>
                                    <LightSwitch label="NAV LIGHTS" active={data.lighting?.navLights} color="text-red-400" onClick={() => onControl('CONTROL_SWITCH', { device: 'navLights', state: !data.lighting?.navLights })}/>
                                    <LightSwitch label="ANCHOR LIGHT" active={data.lighting?.anchorLight} onClick={() => onControl('CONTROL_SWITCH', { device: 'anchorLight', state: !data.lighting?.anchorLight })}/>
                                </div>
                            </div>
                        )}

                        {/* NAV & SIGNALS */}
                        {activeTab === 'NAV' && (
                             <div className="h-full p-4 flex flex-col gap-4">
                                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                    <div className="text-[10px] text-slate-400 mb-1">AUTOPILOT</div>
                                    <div className="flex justify-between items-center">
                                        <button 
                                            onClick={() => onControl('CONTROL_AUTOPILOT', { enabled: !data.autopilot?.enabled })}
                                            className={`px-3 py-1 rounded font-bold text-xs ${data.autopilot?.enabled ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                                        >
                                            {data.autopilot?.enabled ? 'ENGAGED' : 'STANDBY'}
                                        </button>
                                        <div className="text-right">
                                            <div className="text-[9px] text-slate-500">TARGET HDG</div>
                                            <div className="font-mono text-cyan-300 font-bold">{data.autopilot?.targetHeading?.toFixed(0) || '---'}°</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                    <div className="text-[10px] text-slate-400 mb-1">GPS STATUS</div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-green-400 font-bold">3D FIX</span>
                                        <span className="text-xs text-slate-500">12 SATS</span>
                                    </div>
                                    <div className="font-mono text-white text-lg mt-1">{data.latitude.toFixed(5)} N <br/> {data.longitude.toFixed(5)} E</div>
                                </div>

                                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                    <div className="text-[10px] text-slate-400 mb-1">DEPTH / SONAR</div>
                                    <div className="text-4xl font-display font-bold text-white">{data.depth.toFixed(1)}m</div>
                                    <div className="w-full h-16 bg-slate-900 mt-2 rounded overflow-hidden relative">
                                        {/* Fake sonar graph */}
                                        <svg className="w-full h-full" preserveAspectRatio="none">
                                            <path d="M0,50 Q20,40 40,50 T80,50 T120,45 T160,55 T200,50 L200,100 L0,100 Z" fill="rgba(6,182,212,0.2)" />
                                            <path d="M0,50 Q20,40 40,50 T80,50 T120,45 T160,55 T200,50" fill="none" stroke="#06b6d4" strokeWidth="2" />
                                        </svg>
                                    </div>
                                </div>
                             </div>
                        )}

                        {/* WEATHER STATION */}
                        {activeTab === 'WX' && (
                            <div className="h-full p-4 flex flex-col gap-4">
                                <div className="bg-gradient-to-br from-blue-900 to-slate-900 p-4 rounded-xl border border-blue-800">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-4xl font-bold text-white">24°C</div>
                                            <div className="text-xs text-blue-200">AIR TEMP</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-white">1012</div>
                                            <div className="text-xs text-blue-200">hPa</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                     <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                                         <div className="text-xs text-slate-500">WIND</div>
                                         <div className="text-xl font-bold text-white">{data.windSpeed.toFixed(1)} <span className="text-xs">kn</span></div>
                                         <div className="text-xs text-orange-400">{data.windAngle.toFixed(0)}°</div>
                                     </div>
                                     <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                                         <div className="text-xs text-slate-500">HUMIDITY</div>
                                         <div className="text-xl font-bold text-white">65%</div>
                                     </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                <button onClick={() => setRightOpen(!rightOpen)} className={`absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-slate-900 border border-slate-700 p-1 rounded-l-md text-slate-400 hover:text-white transition-all duration-500 ${rightOpen ? '-translate-x-[400px]' : 'translate-x-0'}`}>
                    {rightOpen ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg> : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>}
                </button>

            </div>
            
            {/* Footer */}
            <div className="h-8 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center px-4 text-[10px] text-slate-500 uppercase tracking-widest z-20">
                 <div>System: ONLINE</div>
                 <div>Mode: {activeTab} CONTROL</div>
                 <div>Greenline 48 Hybrid</div>
            </div>
        </div>
    );
};

// --- Sub Components ---

const VolvoGauge = ({ engine, label }: { engine: VolvoEngineData, label: string }) => {
    const color = engine.status === 'RUNNING' ? 'text-orange-500' : 'text-slate-600';
    const border = engine.status === 'RUNNING' ? 'border-orange-500' : 'border-slate-700';

    return (
        <div className="flex flex-col items-center">
            <div className="text-xs font-bold text-slate-400 mb-2">{label}</div>
            <div className={`w-32 h-32 rounded-full border-4 ${border} bg-slate-800 flex items-center justify-center relative shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
                <div className="flex flex-col items-center">
                    <span className={`text-3xl font-display font-bold ${color}`}>{engine.rpm}</span>
                    <span className="text-[10px] text-slate-500">RPM</span>
                </div>
                {/* Simulated Needle */}
                <div className="absolute inset-0 rounded-full" style={{ transform: `rotate(${-135 + (engine.rpm / 4000) * 270}deg)`, transition: 'transform 0.5s ease-out' }}>
                     <div className="w-1 h-3 bg-orange-500 mx-auto mt-1 rounded"></div>
                </div>
            </div>
            <div className="w-full mt-3 grid grid-cols-2 gap-2">
                <div className="bg-slate-800 p-1 rounded text-center">
                    <div className="text-[8px] text-slate-500">TEMP</div>
                    <div className="text-xs font-bold text-white">{engine.coolantTemp}°C</div>
                </div>
                <div className="bg-slate-800 p-1 rounded text-center">
                    <div className="text-[8px] text-slate-500">OIL</div>
                    <div className="text-xs font-bold text-white">{engine.oilPressure.toFixed(1)} bar</div>
                </div>
            </div>
        </div>
    );
}

const VictronBlock = ({ icon, label, value, sub, active, color }: any) => (
    <div className={`w-28 p-3 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center ${active ? 'bg-slate-800' : 'bg-slate-900 opacity-50'}`}>
        <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white font-bold mb-2`}>{icon}</div>
        <div className="text-[10px] text-slate-400 font-bold">{label}</div>
        <div className="text-sm font-bold text-white">{value}</div>
        <div className="text-[9px] text-slate-500">{sub}</div>
    </div>
);

const LightSwitch = ({ label, active, color = "text-yellow-400", onClick }: any) => (
    <div 
        onClick={onClick}
        className={`flex justify-between items-center p-3 rounded border transition-all cursor-pointer hover:bg-slate-800 ${active ? 'bg-slate-800 border-slate-600' : 'bg-slate-900 border-slate-800 opacity-60'}`}
    >
        <span className="text-xs font-bold text-slate-300">{label}</span>
        <div className="flex items-center gap-2">
            <span className="text-[9px] text-slate-500">{active ? 'ON' : 'OFF'}</span>
            <div className={`w-3 h-3 rounded-full ${active ? `${color} shadow-[0_0_5px_currentColor]` : 'bg-slate-700'}`}></div>
        </div>
    </div>
);