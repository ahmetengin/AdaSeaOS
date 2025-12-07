
import React, { useState } from 'react';
import { DashboardWidget, WidgetSize } from '../types';
import { METRIC_REGISTRY, getMetricDefinition } from '../utils/dashboardUtils';

interface DashboardSetupProps {
    widgets: DashboardWidget[];
    onSave: (newWidgets: DashboardWidget[]) => void;
    onClose: () => void;
}

export const DashboardSetup: React.FC<DashboardSetupProps> = ({ widgets, onSave, onClose }) => {
    const [localWidgets, setLocalWidgets] = useState<DashboardWidget[]>([...widgets]);

    const addWidget = () => {
        const newWidget: DashboardWidget = {
            id: Date.now().toString(),
            metricKey: 'sog',
            label: 'SOG',
            size: 'md',
            color: 'text-white'
        };
        setLocalWidgets([...localWidgets, newWidget]);
    };

    const removeWidget = (id: string) => {
        setLocalWidgets(localWidgets.filter(w => w.id !== id));
    };

    const updateWidget = (id: string, updates: Partial<DashboardWidget>) => {
        setLocalWidgets(localWidgets.map(w => {
            if (w.id === id) {
                // If metric changes, auto-update label to default if it wasn't custom, 
                // but here we just reset label to default for simplicity on metric change
                if (updates.metricKey) {
                    const def = getMetricDefinition(updates.metricKey);
                    return { ...w, ...updates, label: def?.label || 'DATA' };
                }
                return { ...w, ...updates };
            }
            return w;
        }));
    };

    const moveWidget = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === localWidgets.length - 1) return;
        
        const newWidgets = [...localWidgets];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newWidgets[index], newWidgets[swapIndex]] = [newWidgets[swapIndex], newWidgets[index]];
        setLocalWidgets(newWidgets);
    };

    const colors = [
        { name: 'White', value: 'text-white' },
        { name: 'Red', value: 'text-red-500' },
        { name: 'Amber', value: 'text-amber-400' },
        { name: 'Emerald', value: 'text-emerald-400' },
        { name: 'Cyan', value: 'text-cyan-400' },
        { name: 'Blue', value: 'text-blue-400' },
        { name: 'Purple', value: 'text-indigo-400' },
    ];

    return (
        <div className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-md flex flex-col p-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                <div>
                    <h2 className="text-2xl font-display font-bold text-white tracking-widest">DASHBOARD <span className="text-cyan-500">SETUP</span></h2>
                    <p className="text-sm text-slate-400 font-mono">Paneli özelleştir. Sürükle, bırak, ekle, sil.</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={addWidget} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded font-bold border border-slate-600 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        YENİ KUTU
                    </button>
                    <button onClick={() => onSave(localWidgets)} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold shadow-[0_0_15px_rgba(8,145,178,0.5)]">
                        KAYDET & ÇIK
                    </button>
                    <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">İPTAL</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                {localWidgets.map((widget, index) => (
                    <div key={widget.id} className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex flex-col gap-3 relative group hover:border-cyan-500/50 transition-colors">
                        
                        {/* Remove Button */}
                        <button 
                            onClick={() => removeWidget(widget.id)}
                            className="absolute top-2 right-2 text-slate-600 hover:text-red-500 p-1"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        {/* Order Controls */}
                        <div className="absolute top-2 left-2 flex gap-1">
                             <button onClick={() => moveWidget(index, 'up')} className="p-1 bg-slate-800 rounded hover:bg-cyan-900 text-slate-400"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></button>
                             <button onClick={() => moveWidget(index, 'down')} className="p-1 bg-slate-800 rounded hover:bg-cyan-900 text-slate-400"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>
                        </div>

                        <div className="mt-6 space-y-3">
                            {/* Metric Selector */}
                            <div>
                                <label className="text-[10px] uppercase text-slate-500 font-bold">VERİ TÜRÜ</label>
                                <select 
                                    value={widget.metricKey} 
                                    onChange={(e) => updateWidget(widget.id, { metricKey: e.target.value })}
                                    className="w-full bg-black border border-slate-700 text-white text-sm rounded px-2 py-2 mt-1 focus:border-cyan-500 outline-none font-mono"
                                >
                                    {METRIC_REGISTRY.map(m => (
                                        <option key={m.key} value={m.key}>[{m.category}] {m.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Size Selector */}
                            <div>
                                <label className="text-[10px] uppercase text-slate-500 font-bold">KUTU BOYUTU</label>
                                <div className="flex gap-2 mt-1">
                                    {(['sm', 'md', 'lg', 'xl'] as WidgetSize[]).map(size => (
                                        <button
                                            key={size}
                                            onClick={() => updateWidget(widget.id, { size })}
                                            className={`flex-1 py-1 text-xs border rounded ${widget.size === size ? 'bg-cyan-900/50 border-cyan-500 text-cyan-400' : 'border-slate-700 text-slate-500 hover:bg-slate-800'}`}
                                        >
                                            {size.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                             {/* Color Selector */}
                             <div>
                                <label className="text-[10px] uppercase text-slate-500 font-bold">RENK</label>
                                <div className="flex gap-2 mt-1 overflow-x-auto pb-1">
                                    {colors.map(c => (
                                        <button
                                            key={c.name}
                                            onClick={() => updateWidget(widget.id, { color: c.value })}
                                            className={`w-6 h-6 rounded-full border ${widget.color === c.value ? 'border-white scale-110' : 'border-transparent opacity-50'}`}
                                            style={{ backgroundColor: c.name.toLowerCase() === 'white' ? '#fff' : c.name.toLowerCase() }}
                                        ></button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="mt-2 pt-2 border-t border-slate-800">
                            <div className="text-[9px] text-center text-slate-600 mb-1">PREVIEW</div>
                            <div className="h-16 bg-black border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden rounded">
                                <span className="absolute top-1 left-2 text-[8px] text-slate-500">{getMetricDefinition(widget.metricKey)?.label}</span>
                                <span className={`text-xl font-bold font-display ${widget.color}`}>12.4</span>
                                <span className="absolute bottom-1 right-2 text-[8px] text-slate-600">{getMetricDefinition(widget.metricKey)?.unit}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
