import React from 'react';
import { NMEAData, AgentStatus } from '../types';
import { SailSteer } from './SailSteer';
import { DataBox } from './DataBox';

interface TacticalCompassProps {
  data: NMEAData;
  status?: AgentStatus;
  onTalk?: () => void;
}

export const TacticalCompass: React.FC<TacticalCompassProps> = ({ data, status = AgentStatus.IDLE, onTalk }) => {
  
  // Status Logic for the Header Stripe
  let statusColor = "bg-slate-800";
  let statusText = "STANDBY";
  if (status === AgentStatus.LISTENING) { statusColor = "bg-emerald-500"; statusText = "LISTENING"; }
  else if (status === AgentStatus.SPEAKING) { statusColor = "bg-indigo-500"; statusText = "SPEAKING"; }
  else if (status === AgentStatus.THINKING) { statusColor = "bg-amber-500"; statusText = "PROCESSING"; }
  else if (status === AgentStatus.EXECUTING) { statusColor = "bg-cyan-500"; statusText = "EXECUTING"; }

  return (
    <div className="w-full h-full bg-black flex flex-col overflow-hidden relative">
        
        {/* TOP STATUS BAR (Voice Trigger Area) */}
        <div 
            onClick={onTalk}
            className="h-8 shrink-0 flex items-center justify-between px-3 bg-slate-900 border-b border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors"
        >
             <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${statusColor} animate-pulse`}></div>
                 <span className="text-[10px] font-bold tracking-widest text-slate-400">ADA <span className="text-white">NAV</span> NODE</span>
             </div>
             <div className="text-[9px] font-mono text-slate-500">{statusText}</div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row">
            
            {/* LEFT: SAILSTEER INSTRUMENT */}
            <div className="flex-[3] relative flex items-center justify-center bg-black p-4 border-b md:border-b-0 md:border-r border-slate-800">
                <SailSteer data={data} />
                
                {/* Corner Data Overlays for SailSteer Context */}
                <div className="absolute top-2 left-2">
                    <div className="text-[9px] text-slate-500 font-bold">TWD</div>
                    <div className="text-xl font-display font-bold text-emerald-500">{( (data.headingMagnetic + data.windAngle) % 360 ).toFixed(0)}°</div>
                </div>
                <div className="absolute top-2 right-2 text-right">
                    <div className="text-[9px] text-slate-500 font-bold">COG</div>
                    <div className="text-xl font-display font-bold text-amber-500">{data.courseOverGround.toFixed(0)}°</div>
                </div>
            </div>

            {/* RIGHT: DATA BOX GRID (B&G Style) */}
            <div className="flex-[2] grid grid-cols-2 grid-rows-3 bg-slate-900 gap-[1px] border-t md:border-t-0 border-slate-800">
                {/* Row 1 */}
                <DataBox label="SOG" value={data.speedOverGround.toFixed(1)} unit="KN" size="md" />
                <DataBox label="DEPTH" value={data.depth.toFixed(1)} unit="M" color={data.depth < 3 ? "text-red-500" : "text-white"} size="md" />
                
                {/* Row 2 */}
                <DataBox label="AWS" value={(data.windSpeed * 1.94).toFixed(1)} unit="KN" color="text-slate-200" />
                <DataBox label="AWA" value={data.windAngle.toFixed(0)} unit="°" color="text-blue-400" />

                {/* Row 3 */}
                <DataBox label="TWS" value={(data.windSpeed * 1.94).toFixed(1)} unit="KN" color="text-emerald-400" />
                <DataBox label="TWA" value={data.windAngle.toFixed(0)} unit="°" color="text-emerald-400" />
            </div>

        </div>
    </div>
  );
};