import React, { useState, useEffect, useRef } from 'react';
import { ShipData, NMEAData } from '../types';
import { Gauge } from './Gauge';

interface ShipManagementProps {
    data: ShipData;
    nmea?: NMEAData; // Optional NMEA data for RAW stream
}

export const ShipManagement: React.FC<ShipManagementProps> = ({ data, nmea }) => {
    const [activeTab, setActiveTab] = useState<'TANKS' | 'LOGS' | 'CREW' | 'DATA'>('TANKS');
    const [telemetryLog, setTelemetryLog] = useState<string[]>([]);
    const logEndRef = useRef<HTMLDivElement>(null);

    // Simulate High-Frequency NMEA Stream
    useEffect(() => {
        if (activeTab !== 'DATA') return;

        const pgnGenerators = [
            () => `PGN 127250 [Heading] ${(Math.random() * 360).toFixed(1)}° Magnetic`,
            () => `PGN 128267 [Depth] ${(Math.random() * 10 + 5).toFixed(2)}m Offset+0.0`,
            () => `PGN 129026 [COG/SOG] COG:${(Math.random() * 360).toFixed(1)} SOG:${(Math.random() * 15).toFixed(1)}kn`,
            () => `PGN 127488 [Engine Rapid] RPM:${Math.floor(Math.random() * 2500)} Boost:${(Math.random()).toFixed(2)}bar`,
            () => `PGN 127508 [Battery Status] 13.8V ${(Math.random() * 20).toFixed(1)}A`,
            () => `PGN 130306 [Wind Data] ${(Math.random() * 20).toFixed(1)}kn ${(Math.random() * 360).toFixed(0)}°`,
            () => `SIGK [vessels.self] ${new Date().toISOString()}`
        ];

        const interval = setInterval(() => {
            const gen = pgnGenerators[Math.floor(Math.random() * pgnGenerators.length)];
            setTelemetryLog(prev => {
                const next = [...prev, `[${new Date().toLocaleTimeString().split(' ')[0]}] ${gen()}`];
                if (next.length > 50) return next.slice(next.length - 50);
                return next;
            });
        }, 150); // Fast stream

        return () => clearInterval(interval);
    }, [activeTab]);

    // Auto scroll telemetry
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [telemetryLog]);

    return (
        <div className="w-full h-full flex flex-col p-0 text-slate-200 font-sans relative">
            
            {/* TABS HEADER */}
            <div className="flex items-center border-b border-white/5 bg-black/20 backdrop-blur-md">
                {['TANKS', 'LOGS', 'CREW', 'DATA'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`flex-1 py-3 text-[10px] font-bold tracking-widest transition-all duration-300 relative ${
                            activeTab === tab 
                            ? 'text-cyan-400 bg-white/5' 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                        }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>
                        )}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gradient-to-b from-transparent to-black/40">
                
                {/* 1. TANKS TAB */}
                {activeTab === 'TANKS' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/30 rounded-xl border border-white/5 p-2 shadow-inner">
                                <Gauge value={data.tanks.fuel} min={0} max={100} label="YAKIT" unit="%" color="#ef4444" />
                            </div>
                            <div className="bg-black/30 rounded-xl border border-white/5 p-2 shadow-inner">
                                <Gauge value={data.tanks.freshWater} min={0} max={100} label="TEMİZ SU" unit="%" color="#0ea5e9" />
                            </div>
                        </div>
                        
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-white/5">
                            <div className="text-[9px] font-bold text-slate-500 mb-2 uppercase tracking-wider">ATIK YÖNETİMİ</div>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                        <span>PİS SU (BLACK)</span>
                                        <span>{data.tanks.blackWater}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full bg-amber-700`} style={{ width: `${data.tanks.blackWater}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                        <span>GRİ SU (GREY)</span>
                                        <span>{data.tanks.greyWater}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full bg-slate-500`} style={{ width: `${data.tanks.greyWater}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 pt-2 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[9px] text-slate-600">BLUE CARD ID</span>
                                <span className="text-[10px] font-mono text-cyan-500">{data.tanks.blueCardId}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. LOGS TAB */}
                {activeTab === 'LOGS' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {data.logbook.slice().reverse().map((log) => (
                            <div key={log.id} className="group relative pl-4 border-l border-slate-700 py-1">
                                <div className={`absolute left-[-2.5px] top-2 w-1.5 h-1.5 rounded-full ${log.author === 'ADA' ? 'bg-cyan-500' : 'bg-amber-500'}`}></div>
                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] font-mono text-slate-500">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-slate-400">{log.category}</span>
                                </div>
                                <div className="text-xs text-slate-300 mt-0.5">{log.event}</div>
                                <div className="text-[9px] text-slate-600 mt-1 truncate">{log.location}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 3. CREW TAB */}
                {activeTab === 'CREW' && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {data.manifest.map(person => (
                            <div key={person.id} className="flex flex-col p-3 rounded-lg bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${person.healthStatus === 'İyi' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                        <span className="text-sm font-bold text-white">{person.name}</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded tracking-wider">{person.role}</span>
                                </div>
                                <div className="text-[10px] text-slate-400">
                                    <span className="text-slate-600 uppercase">DURUM:</span> {person.healthStatus}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                    <span className="text-slate-600 uppercase">TERCİH:</span> {person.preferences}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 4. RAW DATA TAB (Telemetry Stream) */}
                {activeTab === 'DATA' && (
                    <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <span className="text-[9px] font-bold text-emerald-500 animate-pulse">● LIVE STREAM</span>
                            <span className="text-[9px] font-mono text-slate-600">NMEA 2000 / 0183</span>
                        </div>
                        <div className="flex-1 bg-black/60 rounded border border-emerald-500/20 p-2 font-mono text-[10px] overflow-hidden relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:100%_4px]"></div>
                            <div className="h-full overflow-y-auto custom-scrollbar space-y-1 pb-4">
                                {telemetryLog.map((log, i) => (
                                    <div key={i} className="text-emerald-500/80 whitespace-nowrap border-b border-emerald-500/5 pb-0.5">
                                        <span className="text-emerald-700 mr-2 opacity-50">&gt;</span>{log}
                                    </div>
                                ))}
                                <div ref={logEndRef} />
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
