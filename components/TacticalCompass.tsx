
import React from 'react';
import { NMEAData, AgentStatus, DashboardWidget } from '../types';
import { DataBox } from './DataBox';
import { getMetricDefinition } from '../utils/dashboardUtils';

interface TacticalCompassProps {
  data: NMEAData;
  status?: AgentStatus;
  widgets: DashboardWidget[]; // Now accepts a dynamic list
  onTalk?: () => void;
  onEdit?: () => void; // Trigger setup mode
}

export const TacticalCompass: React.FC<TacticalCompassProps> = ({ data, status = AgentStatus.IDLE, widgets, onTalk, onEdit }) => {
  
  // Status Logic for the Header Stripe
  let statusColor = "bg-slate-800";
  let statusText = "STANDBY";
  if (status === AgentStatus.LISTENING) { statusColor = "bg-emerald-500"; statusText = "LISTENING"; }
  else if (status === AgentStatus.SPEAKING) { statusColor = "bg-indigo-500"; statusText = "SPEAKING"; }
  else if (status === AgentStatus.THINKING) { statusColor = "bg-amber-500"; statusText = "PROCESSING"; }
  else if (status === AgentStatus.EXECUTING) { statusColor = "bg-cyan-500"; statusText = "EXECUTING"; }
  else if (status === AgentStatus.ALERT) { statusColor = "bg-red-500"; statusText = "ALERT"; } 

  // --- Helper to calculate grid spans ---
  const getGridClasses = (size: string) => {
      switch(size) {
          case 'xl': return 'col-span-2 row-span-2 lg:col-span-2 lg:row-span-2'; // Massive
          case 'lg': return 'col-span-2 lg:col-span-1 row-span-1'; // Wide
          case 'md': return 'col-span-1'; // Standard square
          case 'sm': return 'col-span-1'; // Standard square (internal font size handles difference)
          default: return 'col-span-1';
      }
  };

  return (
    <div className="w-full h-full bg-black flex flex-col overflow-hidden relative border-none group/compass">
        
        {/* TOP STATUS BAR (Voice Trigger Area) */}
        <div className="h-8 shrink-0 flex items-center justify-between px-3 bg-slate-950 border-b border-slate-900 z-30 relative">
             <div onClick={onTalk} className={`flex items-center gap-2 cursor-pointer ${status === AgentStatus.ALERT ? 'animate-pulse' : ''}`}>
                 <div className={`w-1.5 h-1.5 rounded-full ${statusColor} shadow-[0_0_8px_currentColor]`}></div>
                 <span className={`text-[10px] font-bold tracking-[0.2em] ${status === AgentStatus.ALERT ? 'text-red-400' : 'text-slate-500'}`}>ADA <span className="text-slate-300">NAV</span> NODE</span>
             </div>
             
             <div className="flex items-center gap-4">
                 <div className={`text-[9px] font-mono ${status === AgentStatus.ALERT ? 'text-red-400' : 'text-slate-600'}`}>{statusText}</div>
                 
                 {/* EDIT BUTTON (Visible on Hover or Touch) */}
                 <button 
                    onClick={onEdit} 
                    className="opacity-0 group-hover/compass:opacity-100 transition-opacity bg-slate-800 hover:bg-cyan-700 text-slate-400 hover:text-white px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border border-slate-700"
                 >
                    EDIT LAYOUT
                 </button>
             </div>
        </div>

        {/* DYNAMIC DATA GRID */}
        {/* We use auto-flow-dense so smaller items fill gaps left by larger ones */}
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 grid-flow-row-dense auto-rows-fr gap-0 bg-black content-start">
            {widgets.map((widget) => {
                const metricDef = getMetricDefinition(widget.metricKey);
                // Safe fallback if metric key doesn't exist
                const value = metricDef ? metricDef.getValue(data) : '---';
                const unit = metricDef ? metricDef.unit : '';
                const displayLabel = widget.label || (metricDef ? metricDef.label : 'N/A');
                // EXTRACT CATEGORY for coloring
                const category = metricDef ? metricDef.category : 'NAV';

                return (
                    <DataBox 
                        key={widget.id}
                        label={displayLabel} 
                        value={value} 
                        unit={unit} 
                        size={widget.size} 
                        color={widget.color} 
                        category={category} // Pass category prop
                        className={getGridClasses(widget.size)}
                    />
                );
            })}

            {/* Empty State Helper if no widgets */}
            {widgets.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center text-slate-600 h-64">
                    <p className="text-xs mb-2">NO DATA DISPLAYED</p>
                    <button onClick={onEdit} className="text-cyan-500 underline text-xs">SETUP DASHBOARD</button>
                </div>
            )}
        </div>

    </div>
  );
};
