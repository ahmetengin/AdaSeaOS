import React, { useState, useEffect, useRef } from 'react';
import { NMEAData, AgentStatus, Message, VHFStatus, ShipData, LogEntry } from './types';
import { INITIAL_NMEA_DATA, INITIAL_SHIP_DATA } from './constants';
import { AdaService } from './services/geminiService';
import { SignalKService } from './services/signalKService';
import { SpyglassMap } from './components/SpyglassMap';
import { VHFRadio } from './components/VHFRadio';
import { ShipManagement } from './components/ShipManagement';
import { TacticalCompass } from './components/TacticalCompass';
import { Gauge } from './components/Gauge';
import { ControlPanel } from './components/ControlPanel';
import { SystemStatus } from './components/SystemStatus';

export default function App() {
  const [apiKey, setApiKey] = useState<string>('');
  const [hasKey, setHasKey] = useState(false);
  
  const [nmeaData, setNmeaData] = useState<NMEAData>(INITIAL_NMEA_DATA);
  const [shipData, setShipData] = useState<ShipData>(INITIAL_SHIP_DATA);
  
  const [agentStatus, setAgentStatus] = useState<AgentStatus>(AgentStatus.IDLE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showSpyglass, setShowSpyglass] = useState(false);
  
  const [vhfStatus, setVhfStatus] = useState<VHFStatus>({
      channel: 16,
      isReceiving: false,
      isTransmitting: false,
      lastMessage: "",
      alertLevel: 'NONE'
  });
  
  const adaServiceRef = useRef<AdaService | null>(null);
  const signalKRef = useRef<SignalKService | null>(null);

  // --- Helper: Simulate Marina Voice ---
  const speakAsMarina = (text: string) => {
      if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          const voices = window.speechSynthesis.getVoices();
          const radioVoice = voices.find(v => v.lang.includes('tr')) || voices.find(v => v.name.includes('Male')) || null;
          if (radioVoice) { utterance.voice = radioVoice; }
          utterance.rate = 1.0; utterance.pitch = 0.9; utterance.volume = 1.0;
          window.speechSynthesis.speak(utterance);
      }
  };

  const generateMarinaResponse = (channel: number, message: string, to: string) => {
      const msgLower = message.toLowerCase();
      const stationName = to || "İstasyon";
      let response = `${stationName}, Burası Phisedelia. Anlaşılmadı. Tamam.`;
      if (stationName.toLowerCase().includes('marina')) {
          if (msgLower.includes('çıkış') || msgLower.includes('departure')) {
              response = `Phisedelia, Burası ${stationName}. Çıkış izni onaylandı. Rüzgar Kuzey 12 knot. Trafik temiz. İyi seyirler. Tamam.`;
          } else if (msgLower.includes('giriş')) {
              response = `Phisedelia, Burası ${stationName}. Giriş izni verildi. F pontonu numara 4. Palamar botu sizi karşılıyor. Kanal 72. Tamam.`;
          } else if (msgLower.includes('radio check') || msgLower.includes('kontrol')) {
               response = `Phisedelia, Burası ${stationName}. Sinyal 5/5. Gayet net. Tamam.`;
          }
      }
      return response;
  };

  // --- Initialize Sensor Bus ---
  useEffect(() => {
    const skService = new SignalKService();
    signalKRef.current = skService;
    skService.connect();

    skService.onData((update) => {
        if (update.nmea) {
             setNmeaData(prev => {
                 const next = { ...prev, ...update.nmea };
                 if (adaServiceRef.current) adaServiceRef.current.updateNMEA(next);
                 return next;
             });
        }
        if (update.tanks) {
            setShipData(prev => {
                const newData = { ...prev, tanks: { ...prev.tanks, ...update.tanks } };
                if (adaServiceRef.current) adaServiceRef.current.updateShipData(newData);
                return newData;
            });
        }
    });

    return () => skService.disconnect();
  }, []); 

  // --- CONTROL HANDLER (Manual & Ada) ---
  const handleControlAction = (action: string, payload: any) => {
      if (!signalKRef.current) return;
      if (action === 'CONTROL_ENGINE') signalKRef.current.setEngineTarget(payload.action, payload.rpm);
      else if (action === 'CONTROL_MODE') signalKRef.current.setDriveMode(payload);
      else if (action === 'CONTROL_SWITCH') signalKRef.current.toggleLight(payload.device, payload.state);
      else if (action === 'CONTROL_AUTOPILOT') signalKRef.current.setAutopilot(payload.enabled, payload.heading);
  };

  // --- VHF Chatter Simulation ---
  useEffect(() => {
      const msgs = ["Securite Securite, Navigasyon uyarısı...", "Marina kontrol, burası Poyraz 3, giriş izni tamam.", "Sahil Güvenlik, bölge taraması devam ediyor.", "Mavi Yunus, iskele tarafınızdan geçiyorum.", "Kanal 16 dinlemede."];
      const chatterInterval = setInterval(() => {
          if (Math.random() > 0.85 && vhfStatus.alertLevel === 'NONE' && !vhfStatus.isTransmitting && !vhfStatus.isReceiving) { 
              const msg = msgs[Math.floor(Math.random() * msgs.length)];
              setVhfStatus(prev => ({ ...prev, isReceiving: true, lastMessage: msg }));
              setTimeout(() => setVhfStatus(prev => ({ ...prev, isReceiving: false })), 3000);
          }
      }, 10000);
      return () => clearInterval(chatterInterval);
  }, [vhfStatus.alertLevel, vhfStatus.isTransmitting, vhfStatus.isReceiving]);

  // --- Initialization ---
  useEffect(() => {
    const envKey = process.env.API_KEY;
    if (envKey) { setApiKey(envKey); setHasKey(true); }
  }, []);

  const handleConnect = async () => {
    if (!apiKey) return;
    try {
        const service = new AdaService(apiKey, nmeaData, shipData, 
            (statusStr) => {
                const s = statusStr as AgentStatus;
                if (vhfStatus.alertLevel !== 'NONE') setAgentStatus(AgentStatus.ALERT);
                else setAgentStatus(s);
            },
            (action, payload) => {
                if (action.startsWith('CONTROL_')) { handleControlAction(action, payload); return; }
                if (action === 'TOGGLE_SPYGLASS') setShowSpyglass(payload);
                else if (action === 'SET_EMERGENCY') {
                    setVhfStatus(prev => ({ ...prev, alertLevel: payload.level, lastMessage: payload.details }));
                    setAgentStatus(AgentStatus.ALERT);
                } else if (action === 'ADD_LOG_ENTRY') {
                    const newLog: LogEntry = {
                        id: Date.now().toString(), timestamp: new Date().toISOString(), location: `${nmeaData.latitude.toFixed(3)}N, ${nmeaData.longitude.toFixed(3)}E`,
                        event: payload.event, category: payload.category || 'ROUTINE', author: 'ADA'
                    };
                    setShipData(prev => ({ ...prev, logbook: [...prev.logbook, newLog] }));
                } else if (action === 'UPDATE_SHIP_DATA') {
                    if (payload.type === 'MENU') setShipData(prev => ({ ...prev, menuPlan: payload.value }));
                    else if (payload.type === 'FUEL') setShipData(prev => ({ ...prev, tanks: { ...prev.tanks, fuel: parseInt(payload.value) }}));
                } else if (action === 'MAKE_RADIO_CALL') {
                    const { channel, message, to } = payload;
                    setVhfStatus(prev => ({ ...prev, channel: channel, isTransmitting: true, lastMessage: `TX: ${message}`, alertLevel: 'NONE' }));
                    setTimeout(() => {
                        const responseText = generateMarinaResponse(channel, message, to);
                        setVhfStatus(prev => ({ ...prev, isTransmitting: false, isReceiving: true, lastMessage: `RX: ${responseText}` }));
                        speakAsMarina(responseText);
                        if (adaServiceRef.current) adaServiceRef.current.feedIncomingVHF(responseText);
                        setTimeout(() => { setVhfStatus(prev => ({ ...prev, isReceiving: false, lastMessage: 'Scanning...' })); }, Math.max(4000, responseText.length * 80)); 
                    }, 3000); 
                }
            }
        );
        await service.connectLive();
        adaServiceRef.current = service;
        setIsConnected(true);
    } catch (e) { console.error(e); }
  };

  const toggleVoiceInterface = async () => {
      if (isConnected) {
          await handleDisconnect();
      } else {
          await handleConnect();
      }
  };

  const handleDisconnect = async () => {
    if (adaServiceRef.current) {
        await adaServiceRef.current.disconnect();
        setIsConnected(false);
        setAgentStatus(AgentStatus.IDLE);
        adaServiceRef.current = null;
    }
  };

  if (!hasKey && !process.env.API_KEY) return <div className="min-h-screen flex items-center justify-center bg-black text-white font-mono">API KEY MISSING</div>;

  return (
    <div className="w-full text-slate-200 flex flex-col relative font-sans selection:bg-cyan-500/30 selection:text-cyan-100 bg-[#000000] h-[100dvh] overflow-hidden">
        
        {/* --- HEADER --- */}
        <div className="h-12 flex items-center justify-between px-4 z-50 shrink-0 bg-black border-b border-white/5">
            <div className="flex items-center gap-4">
                 <h1 className="text-lg font-bold tracking-[0.2em] text-white font-display">ADA<span className="text-cyan-500 font-light">OS</span></h1>
            </div>
            <div className="flex items-center gap-2">
                 <div className="text-[10px] font-mono text-slate-500 hidden md:block">{nmeaData.latitude.toFixed(4)}N / {nmeaData.longitude.toFixed(4)}E</div>
                 <button 
                    onClick={() => setShowSpyglass(true)} 
                    className="p-2 bg-cyan-900/20 text-cyan-400 rounded-full hover:bg-cyan-900/50"
                 >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                 </button>
            </div>
        </div>

        {/* Spyglass Overlay */}
        {showSpyglass && 
            <SpyglassMap 
                data={nmeaData} 
                onClose={() => setShowSpyglass(false)} 
                onControl={handleControlAction} 
            />
        }

        {/* --- MAIN COCKPIT GRID --- */}
        <main className="flex-1 p-2 grid grid-cols-1 lg:grid-cols-12 gap-2 overflow-y-auto lg:overflow-hidden relative pb-20">
            
            {/* 1. TACTICAL DISPLAY (Left - 7 Cols) */}
            <div className="col-span-1 lg:col-span-7 flex flex-col gap-2 min-h-[450px]">
                 <div className="flex-1 glass-panel rounded-xl relative overflow-hidden border-cyan-500/10 shadow-2xl bg-black">
                     <TacticalCompass 
                        data={nmeaData} 
                        status={agentStatus}
                        onTalk={toggleVoiceInterface} 
                     />
                 </div>
            </div>

            {/* 2. SYSTEMS MONITOR & CONTROLS (Right - 5 Cols) */}
            <div className="col-span-1 lg:col-span-5 flex flex-col gap-2 h-full overflow-y-auto custom-scrollbar pr-1">
                
                {/* A. Engines */}
                <div className="glass-panel p-3 flex flex-col gap-2 shrink-0">
                     <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-1">MOTOR DEVİRLERİ</div>
                     <div className="grid grid-cols-2 gap-2">
                        <Gauge value={nmeaData.engines.port.rpm} min={0} max={4000} label="İSKELE" unit="RPM" color="#f59e0b" />
                        <Gauge value={nmeaData.engines.stbd.rpm} min={0} max={4000} label="SANCAK" unit="RPM" color="#f59e0b" />
                     </div>
                </div>

                {/* B. Power & Environment (New) */}
                <div className="shrink-0">
                    <SystemStatus data={nmeaData} />
                </div>

                {/* C. Manual Controls (New) */}
                <div className="shrink-0">
                    <ControlPanel data={nmeaData} onControl={handleControlAction} />
                </div>

                {/* D. Ship Admin (Tanks/Logs/Raw Data) */}
                <div className="flex-1 glass-panel overflow-hidden rounded-xl relative p-0 border-slate-700/50 min-h-[200px]">
                     <ShipManagement data={shipData} nmea={nmeaData} />
                </div>

                {/* E. VHF Radio */}
                <div className="h-24 shrink-0">
                    <VHFRadio status={vhfStatus} />
                </div>
            </div>
        </main>
        
        {/* --- PTT BUTTON REMOVED --- */}

    </div>
  );
}