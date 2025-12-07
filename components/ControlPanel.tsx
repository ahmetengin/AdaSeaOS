import React from 'react';
import { LightingData, NMEAData } from '../types';

interface ControlPanelProps {
    data: NMEAData;
    onControl: (action: string, payload: any) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ data, onControl }) => {
    
    const toggleLight = (key: string, currentState: boolean) => {
        onControl('CONTROL_SWITCH', { device: key, state: !currentState });
    };

    const setMode = (mode: string) => {
        onControl('CONTROL_MODE', mode);
    };

    const lights = [
        { key: 'navLights', label: 'SEYİR FENERİ' },
        { key: 'anchorLight', label: 'DEMİR FENERİ' },
        { key: 'aftDeck', label: 'HAVUZLUK' },
        { key: 'underwater', label: 'SU ALTI' },
        { key: 'saloon', label: 'SALON' },
        { key: 'flybridge', label: 'FLYBRIDGE' },
    ];

    return (
        <div className="glass-panel p-3 flex flex-col gap-3">
            {/* DRIVE MODE SELECTOR */}
            <div>
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">TAHRİK SİSTEMİ</div>
                <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                    {['ELECTRIC', 'HYBRID', 'DIESEL'].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setMode(mode)}
                            className={`flex-1 py-2 text-[10px] font-bold tracking-wider rounded transition-all duration-300 ${
                                data.hybrid.mode === mode 
                                ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)]' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            {/* LIGHTING GRID */}
            <div>
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">AYDINLATMA & DOMOTİK</div>
                <div className="grid grid-cols-3 gap-2">
                    {lights.map((l) => {
                        const isActive = data.lighting[l.key as keyof LightingData];
                        return (
                            <button
                                key={l.key}
                                onClick={() => toggleLight(l.key, isActive)}
                                className={`flex flex-col items-center justify-center p-2 rounded border transition-all duration-200 ${
                                    isActive 
                                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                                    : 'bg-white/5 border-transparent text-slate-500 hover:bg-white/10'
                                }`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full mb-1 ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></div>
                                <span className="text-[9px] font-mono font-bold leading-tight">{l.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
