import React from 'react';
import { ShipData, LogEntry, Person, MaintenanceTask } from '../types';

interface ShipManagementProps {
    data: ShipData;
}

export const ShipManagement: React.FC<ShipManagementProps> = ({ data }) => {
    
    const getStatusColor = (val: number, type: 'high-good' | 'low-good') => {
        if (type === 'high-good') return val > 50 ? 'bg-cyan-500' : val > 20 ? 'bg-amber-500' : 'bg-red-500';
        return val < 50 ? 'bg-green-500' : val < 80 ? 'bg-amber-500' : 'bg-red-500';
    };

    return (
        <div className="w-full h-full relative overflow-hidden flex flex-col p-4 text-slate-300 font-mono bg-black/80">
            <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
                
                {/* TANKS SECTION */}
                <section>
                    <div className="text-[9px] font-bold text-slate-500 tracking-widest mb-2 border-b border-slate-800 pb-1">FLUID LEVELS</div>
                    <div className="space-y-2">
                        <TankRow label="FUEL" value={data.tanks.fuel} color={getStatusColor(data.tanks.fuel, 'high-good')} />
                        <TankRow label="WATER" value={data.tanks.freshWater} color={getStatusColor(data.tanks.freshWater, 'high-good')} />
                        <TankRow label="GREY" value={data.tanks.greyWater} color={getStatusColor(data.tanks.greyWater, 'low-good')} />
                        <TankRow label="BLACK" value={data.tanks.blackWater} color={getStatusColor(data.tanks.blackWater, 'low-good')} />
                    </div>
                </section>

                {/* LOGBOOK SECTION */}
                <section>
                     <div className="text-[9px] font-bold text-slate-500 tracking-widest mb-2 border-b border-slate-800 pb-1 mt-4">LOGBOOK_24H</div>
                     <div className="text-[10px] font-mono space-y-1">
                        {data.logbook.slice().reverse().map((log) => (
                            <div key={log.id} className="flex gap-2 border-b border-slate-800/50 pb-1">
                                <span className="text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                <span className="text-cyan-400">[{log.category.substring(0,3)}]</span>
                                <span className="text-slate-300 truncate">{log.event}</span>
                            </div>
                        ))}
                     </div>
                </section>

                 {/* MANIFEST */}
                 <section>
                    <div className="text-[9px] font-bold text-slate-500 tracking-widest mb-2 border-b border-slate-800 pb-1 mt-4">SOULS ON BOARD</div>
                    <table className="w-full text-[10px] text-left">
                        <thead>
                            <tr className="text-slate-600">
                                <th>NAME</th>
                                <th>ROLE</th>
                                <th>STS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.manifest.map(person => (
                                <tr key={person.id} className="border-b border-slate-800/50">
                                    <td className="py-1 text-slate-300">{person.name}</td>
                                    <td className="py-1 text-slate-500">{person.role}</td>
                                    <td className="py-1"><div className={`w-1.5 h-1.5 rounded-full ${person.healthStatus === 'İyi' ? 'bg-green-500' : 'bg-red-500'}`}></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </section>

                 {/* MAINTENANCE */}
                 <section>
                    <div className="text-[9px] font-bold text-slate-500 tracking-widest mb-2 border-b border-slate-800 pb-1 mt-4">MAINTENANCE QUEUE</div>
                    {data.maintenance.map(task => (
                        <div key={task.id} className="flex justify-between items-center text-[10px] py-1 border-b border-slate-800/30">
                            <span className="text-slate-400">{task.item}</span>
                            <span className={`${task.status === 'OK' ? 'text-emerald-500' : 'text-red-500 font-bold'}`}>{task.status}</span>
                        </div>
                    ))}
                 </section>

            </div>
        </div>
    );
};

const TankRow = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="flex items-center gap-2">
        <div className="w-12 text-[9px] text-slate-500">{label}</div>
        <div className="flex-1 h-2 bg-slate-800 rounded-sm relative overflow-hidden">
             {/* Tick marks */}
             <div className="absolute inset-0 w-full h-full flex justify-between px-1 z-10 pointer-events-none">
                 <div className="w-[1px] h-full bg-black/20"></div>
                 <div className="w-[1px] h-full bg-black/20"></div>
                 <div className="w-[1px] h-full bg-black/20"></div>
             </div>
             <div className={`h-full ${color}`} style={{ width: `${value}%` }}></div>
        </div>
        <div className="w-8 text-[10px] text-right font-bold text-white">{value}%</div>
    </div>
);