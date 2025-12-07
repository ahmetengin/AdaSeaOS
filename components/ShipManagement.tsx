import React from 'react';
import { ShipData } from '../types';
import { Gauge } from './Gauge';

interface ShipManagementProps {
    data: ShipData;
}

export const ShipManagement: React.FC<ShipManagementProps> = ({ data }) => {
    
    return (
        <div className="w-full h-full flex flex-col p-4 text-slate-200 font-sans">
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                
                {/* TANKS - Converted to Gauges */}
                <section>
                    <h4 className="text-[10px] font-bold text-slate-500 tracking-widest mb-2 uppercase border-b border-white/5 pb-1">TANKLAR</h4>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="bg-black/20 rounded-xl">
                            <Gauge value={data.tanks.fuel} min={0} max={100} label="YAKIT" unit="%" color="#ef4444" />
                         </div>
                         <div className="bg-black/20 rounded-xl">
                            <Gauge value={data.tanks.freshWater} min={0} max={100} label="TEMİZ SU" unit="%" color="#0ea5e9" />
                         </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="flex justify-between px-2 text-[10px] text-slate-500">
                             <span>PİS SU: {data.tanks.blackWater}%</span>
                             <span>GRİ SU: {data.tanks.greyWater}%</span>
                        </div>
                    </div>
                </section>

                {/* LOGBOOK */}
                <section>
                     <h4 className="text-[10px] font-bold text-slate-500 tracking-widest mb-2 uppercase border-b border-white/5 pb-1">SEYİR DEFTERİ</h4>
                     <div className="space-y-2">
                        {data.logbook.slice().reverse().map((log) => (
                            <div key={log.id} className="group flex gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/5">
                                <div className="text-[10px] font-mono text-slate-500 pt-0.5 whitespace-nowrap">
                                    {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-cyan-100">{log.event}</div>
                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{log.category}</div>
                                </div>
                            </div>
                        ))}
                     </div>
                </section>

                 {/* MANIFEST */}
                 <section>
                    <h4 className="text-[10px] font-bold text-slate-500 tracking-widest mb-2 uppercase border-b border-white/5 pb-1">PERSONEL</h4>
                    <div className="grid grid-cols-1 gap-2">
                        {data.manifest.map(person => (
                            <div key={person.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${person.healthStatus === 'İyi' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                    <span className="text-xs font-medium">{person.name}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{person.role}</span>
                            </div>
                        ))}
                    </div>
                 </section>

            </div>
        </div>
    );
};
