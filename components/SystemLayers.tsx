import React, { useEffect, useState } from 'react';

interface SystemLayersProps {
    isConnected: boolean;
}

export const SystemLayers: React.FC<SystemLayersProps> = ({ isConnected }) => {
    const [layerStatus, setLayerStatus] = useState({
        sensing: 'INIT',
        intelligence: 'OFFLINE',
        actuation: 'STBY'
    });

    useEffect(() => {
        // Simulate startup sequence
        setTimeout(() => setLayerStatus(p => ({ ...p, sensing: 'ACTIVE' })), 500);
        setTimeout(() => setLayerStatus(p => ({ ...p, intelligence: isConnected ? 'ONLINE' : 'STBY' })), 1500);
        setTimeout(() => setLayerStatus(p => ({ ...p, actuation: 'READY' })), 2500);
    }, [isConnected]);

    return (
        <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded px-2 py-1">
            <div className="flex flex-col items-center px-2 border-r border-white/10">
                <span className="text-[8px] text-slate-500 uppercase tracking-widest mb-0.5">SENSING</span>
                <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${layerStatus.sensing === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                    <span className={`text-[9px] font-mono font-bold ${layerStatus.sensing === 'ACTIVE' ? 'text-emerald-500' : 'text-slate-500'}`}>
                        {layerStatus.sensing}
                    </span>
                </div>
            </div>

            <div className="flex flex-col items-center px-2 border-r border-white/10">
                <span className="text-[8px] text-slate-500 uppercase tracking-widest mb-0.5">INTELLIGENCE</span>
                <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${layerStatus.intelligence === 'ONLINE' ? 'bg-cyan-500 shadow-[0_0_5px_#06b6d4]' : 'bg-slate-700'}`}></div>
                    <span className={`text-[9px] font-mono font-bold ${layerStatus.intelligence === 'ONLINE' ? 'text-cyan-500' : 'text-slate-500'}`}>
                        {layerStatus.intelligence}
                    </span>
                </div>
            </div>

            <div className="flex flex-col items-center px-2">
                <span className="text-[8px] text-slate-500 uppercase tracking-widest mb-0.5">ACTUATION</span>
                <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${layerStatus.actuation === 'READY' ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
                    <span className={`text-[9px] font-mono font-bold ${layerStatus.actuation === 'READY' ? 'text-indigo-400' : 'text-slate-500'}`}>
                        {layerStatus.actuation}
                    </span>
                </div>
            </div>
        </div>
    );
};