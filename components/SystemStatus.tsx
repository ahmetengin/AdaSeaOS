
import React from 'react';
import { NMEAData } from '../types';

interface SystemStatusProps {
    data: NMEAData;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ data }) => {
    const isCharging = data.electrics.battery.state === 'CHARGING';

    // Determine weather trend based on barometric pressure change
    // For simulation, we assume a simple trend based on the current value.
    // In a real system, this would compare current to historical data.
    const getPressureTrend = (pressure: number) => {
        if (pressure > 1015) return "BASINÇ YÜKSEK";
        if (pressure < 1005) return "BASINÇ DÜŞÜK";
        return "BASINÇ SABİT";
    };

    const pressureTrend = data.barometricPressure ? getPressureTrend(data.barometricPressure) : 'VERİ YOK';

    return (
        <div className="glass-panel p-3 grid grid-cols-2 gap-3">
            
            {/* POWER MONITOR */}
            <div className="col-span-1 flex flex-col gap-2">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-1">GÜÇ YÖNETİMİ</div>
                
                {/* Battery Bar */}
                <div>
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] text-slate-400">SERVİS AKÜSÜ</span>
                        <span className={`text-xs font-mono font-bold ${data.electrics.battery.soc < 30 ? 'text-red-500' : 'text-emerald-400'}`}>
                            {data.electrics.battery.soc}%
                        </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full ${isCharging ? 'bg-emerald-500' : 'bg-cyan-500'}`} 
                            style={{ width: `${data.electrics.battery.soc}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                        <span>{data.electrics.battery.voltage.toFixed(1)}V</span>
                        <span>{data.electrics.battery.current.toFixed(1)}A</span>
                    </div>
                </div>

                {/* Solar & Shore */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="bg-black/30 rounded p-1.5 border border-white/5">
                        <div className="text-[8px] text-slate-500 uppercase">SOLAR</div>
                        <div className="text-xs font-mono text-amber-400">{data.electrics.solar.powerW}W</div>
                    </div>
                    <div className="bg-black/30 rounded p-1.5 border border-white/5">
                        <div className="text-[8px] text-slate-500 uppercase">SAHİL</div>
                        <div className={`text-xs font-mono ${data.electrics.shorePower.connected ? 'text-green-400' : 'text-slate-600'}`}>
                            {data.electrics.shorePower.connected ? 'ON' : 'OFF'}
                        </div>
                    </div>
                </div>
            </div>

            {/* ENVIRONMENT MONITOR */}
            <div className="col-span-1 flex flex-col gap-2">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-1">ATMOSFER</div>
                
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">HAVA</span>
                    <span className="text-sm font-display font-bold text-white">{data.airTemp.toFixed(1)}°C</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">DENİZ</span>
                    <span className="text-sm font-display font-bold text-cyan-300">{data.waterTemp.toFixed(1)}°C</span>
                </div>
                {/* New: Barometric Pressure */}
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">BASINÇ</span>
                    <span className="text-sm font-display font-bold text-purple-300">{data.barometricPressure?.toFixed(1) || '---'}hPa</span>
                </div>
                {/* New: Relative Humidity */}
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">NEM</span>
                    <span className="text-sm font-display font-bold text-indigo-300">{data.relativeHumidity?.toFixed(0) || '---'}%</span>
                </div>
                
                <div className="mt-auto bg-slate-800/50 rounded p-2 border border-slate-700/50">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <div className="text-[8px] text-slate-500 uppercase">HAVA DURUMU TRENDİ</div>
                            <div className="text-[10px] font-bold text-slate-300">{pressureTrend}</div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
