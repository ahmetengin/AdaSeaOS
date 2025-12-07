
import React, { useState, useEffect, useRef } from 'react';
import { ShipData, NMEAData } from '../types';
import { Gauge } from './Gauge';
import { N2K_DEFINITIONS, getRandomPGN } from '../services/n2kDefinitions';

interface ShipManagementProps {
    data: ShipData;
    nmea?: NMEAData; // Optional NMEA data for RAW stream
}

export const ShipManagement: React.FC<ShipManagementProps> = ({ data, nmea }) => {
    const [activeTab, setActiveTab] = useState<'TANKS' | 'LOGS' | 'CREW' | 'DATA' | 'HISTORY'>('TANKS');
    const [telemetryLog, setTelemetryLog] = useState<{timestamp: string, msg: string}[]>([]);
    const logEndRef = useRef<HTMLDivElement>(null);

    // Simulate High-Frequency NMEA Stream using Real Data + Canboat Definitions
    useEffect(() => {
        if (activeTab !== 'DATA' || !nmea) return;

        const interval = setInterval(() => {
            // Select a random PGN to emit based on the current NMEA state
            // In a real app, this would be event-driven, but we are sampling for the UI stream
            const logMsg = getRandomPGN(nmea);
            
            setTelemetryLog(prev => {
                const next = [...prev, { timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit', fractionalSecondDigits: 3 } as any), msg: logMsg }];
                if (next.length > 50) return next.slice(next.length - 50);
                return next;
            });
        }, 120); // Fast NMEA 2000 bus simulation

        return () => clearInterval(interval);
    }, [activeTab, nmea]);

    // Auto scroll telemetry
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [telemetryLog]);

    // Helper to render horizontal tank bar
    const TankBar = ({ label, level, color, liter }: { label: string, level: number, color: string, liter?: number }) => (
        <div className="mb-2">
            <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
                <span>{label}</span>
                <div className="flex gap-2">
                    {liter !== undefined && <span className="text-slate-500">{liter.toFixed(0)} L</span>}
                    <span className={`font-mono font-bold text-${color === 'red-500' ? 'red-500' : color === 'emerald-500' ? 'emerald-400' : color === 'amber-700' ? 'amber-600' : 'slate-400'}`}>
                        {level.toFixed(0)}%
                    </span>
                </div>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${color === 'red-500' ? 'bg-red-500' : color === 'emerald-500' ? 'bg-emerald-500' : color === 'amber-700' ? 'bg-amber-700' : 'bg-slate-500'}`} 
                    style={{ width: `${level}%` }}
                ></div>
            </div>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col p-0 text-slate-200 font-sans relative">
            
            {/* TABS HEADER */}
            <div className="flex items-center border-b border-white/5 bg-black/20 backdrop-blur-md">
                {['TANKS', 'LOGS', 'CREW', 'DATA', 'HISTORY'].map((tab) => (
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
                
                {/* 1. TANKS TAB - DETAILED */}
                {activeTab === 'TANKS' && nmea?.tanks && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* FUEL SECTION */}
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-white/5 relative">
                            {/* ACTIVE PUMP ANIMATION - Shows Autonomous Action */}
                            {nmea.tanks.fuel.transferPump.active && (
                                <div className="absolute top-0 right-0 left-0 bottom-0 bg-cyan-900/10 z-0 animate-pulse rounded-lg border border-cyan-500/30"></div>
                            )}
                            
                            <div className="flex justify-between items-center mb-2 relative z-10">
                                <div className="text-[9px] font-bold text-red-500 uppercase tracking-wider">FUEL SYSTEM</div>
                                {nmea.tanks.fuel.transferPump.active && (
                                    <div className="flex items-center gap-2 px-2 py-0.5 bg-cyan-950 rounded border border-cyan-500/50 shadow-[0_0_10px_#06b6d4]">
                                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span>
                                        <span className="text-[8px] font-bold text-cyan-300 uppercase tracking-wide">
                                            ACTIVE BALANCING: {nmea.tanks.fuel.transferPump.sourceTankId} &rarr; {nmea.tanks.fuel.transferPump.targetTankId}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="relative z-10">
                                <TankBar label="MAIN DAY TANK (1)" level={nmea.tanks.fuel.tank1.level} liter={nmea.tanks.fuel.tank1.currentLiters} color="red-500" />
                                <TankBar label="PORT STORAGE (2)" level={nmea.tanks.fuel.tank2.level} liter={nmea.tanks.fuel.tank2.currentLiters} color="red-500" />
                                <TankBar label="STBD STORAGE (3)" level={nmea.tanks.fuel.tank3.level} liter={nmea.tanks.fuel.tank3.currentLiters} color="red-500" />
                            </div>
                            
                            {/* Heeling Info */}
                            <div className="mt-3 pt-2 border-t border-white/5 flex justify-between items-center relative z-10">
                                <span className="text-[9px] text-slate-500 uppercase">HEEL ANGLE</span>
                                <span className={`text-xs font-mono font-bold ${Math.abs(nmea.attitude.roll) > 2 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                                    {nmea.attitude.roll > 0 ? `STBD ${nmea.attitude.roll.toFixed(1)}°` : `PORT ${Math.abs(nmea.attitude.roll).toFixed(1)}°`}
                                </span>
                            </div>
                        </div>

                        {/* FRESH WATER SECTION */}
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-white/5 relative">
                            {nmea.tanks.freshWater.transferPump.active && (
                                <div className="absolute top-2 right-2 flex items-center gap-2 px-2 py-0.5 bg-cyan-900/50 rounded border border-cyan-500/50 animate-pulse">
                                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                                    <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-wide">PUMP ON</span>
                                </div>
                            )}
                            <div className="text-[9px] font-bold text-emerald-500 mb-2 uppercase tracking-wider">FRESH WATER</div>
                            <TankBar label="FWD TANK (1)" level={nmea.tanks.freshWater.tank1.level} liter={nmea.tanks.freshWater.tank1.currentLiters} color="emerald-500" />
                            <TankBar label="AFT TANK (2)" level={nmea.tanks.freshWater.tank2.level} liter={nmea.tanks.freshWater.tank2.currentLiters} color="emerald-500" />
                        </div>

                        {/* WASTE SECTION */}
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-white/5">
                            <div className="text-[9px] font-bold text-slate-500 mb-2 uppercase tracking-wider">ATIK YÖNETİMİ</div>
                            <TankBar label="BLACK (MASTER)" level={nmea.tanks.blackWater.tank1.level} liter={nmea.tanks.blackWater.tank1.currentLiters} color="amber-700" />
                            <TankBar label="BLACK (GUEST)" level={nmea.tanks.blackWater.tank2.level} liter={nmea.tanks.blackWater.tank2.currentLiters} color="amber-700" />
                            <TankBar label="GREY WATER" level={nmea.tanks.greyWater.tank1.level} liter={nmea.tanks.greyWater.tank1.currentLiters} color="slate-400" />
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
                            <span className="text-[9px] font-bold text-emerald-500 animate-pulse">● LIVE BUS</span>
                            <div className="flex gap-2">
                                <span className="text-[9px] font-mono text-slate-600">NMEA 2000 (CAN1)</span>
                                <span className="text-[9px] font-mono text-cyan-600">CANBOAT.JS FORMAT</span>
                            </div>
                        </div>
                        <div className="flex-1 bg-black/60 rounded border border-emerald-500/20 p-2 font-mono text-[10px] overflow-hidden relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:100%_4px]"></div>
                            <div className="h-full overflow-y-auto custom-scrollbar space-y-1 pb-4">
                                {telemetryLog.map((log, i) => (
                                    <div key={i} className="flex gap-2 whitespace-nowrap border-b border-emerald-500/5 pb-0.5 group hover:bg-white/5">
                                        <span className="text-slate-600 opacity-50 select-none">[{log.timestamp}]</span>
                                        <span className="text-emerald-500/80 group-hover:text-emerald-400">{log.msg}</span>
                                    </div>
                                ))}
                                <div ref={logEndRef} />
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. HISTORY TAB */}
                {activeTab === 'HISTORY' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h3 className="text-lg font-display font-semibold text-cyan-400 mb-4 border-b border-white/5 pb-2">
                            VOLVO OCEAN 65 RACE HISTORY
                        </h3>
                        {data.volvoOcean65?.yacht.palmaresHistory.length ? (
                            <ul className="list-disc list-inside space-y-2 pl-4">
                                {data.volvoOcean65.yacht.palmaresHistory.map((item, index) => (
                                    <li key={index} className="flex items-start text-sm text-slate-300">
                                        <span className="text-cyan-500 mr-2 flex-shrink-0">•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-500 text-center py-8">
                                Yarış geçmişi bilgisi bulunamadı.
                            </p>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};
