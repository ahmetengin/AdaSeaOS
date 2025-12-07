import React, { useState, useEffect, useRef } from 'react';
import { NMEAData, AgentStatus, Message, VHFStatus, ShipData, LogEntry, RoutePlan } from './types';
import { INITIAL_NMEA_DATA, INITIAL_SHIP_DATA } from './constants';
import { AdaService } from './services/geminiService';
import { SignalKService } from './services/signalKService';
import { Gauge } from './components/Gauge';
import { Orb } from './components/Orb';
import { RouteMap } from './components/RouteMap';
import { SpyglassMap } from './components/SpyglassMap';
import { VHFRadio } from './components/VHFRadio';
import { ShipManagement } from './components/ShipManagement';

export default function App() {
  const [apiKey, setApiKey] = useState<string>('');
  const [hasKey, setHasKey] = useState(false);
  
  const [nmeaData, setNmeaData] = useState<NMEAData>(INITIAL_NMEA_DATA);
  const [shipData, setShipData] = useState<ShipData>(INITIAL_SHIP_DATA);
  const [routePlan, setRoutePlan] = useState<RoutePlan>({
      origin: 'Kalamış',
      destination: 'Bodrum Marina',
      waypoints: ['Marmara Adası', 'Çanakkale', 'Bozcaada', 'Ayvalık'],
      estimatedTime: '18s 24dk',
      fuelConsumption: '350L',
      weatherSummary: 'Poyraz 15-20kn',
      autoUpdate: true
  });

  const [agentStatus, setAgentStatus] = useState<AgentStatus>(AgentStatus.IDLE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showSpyglass, setShowSpyglass] = useState(false);
  const [sensorBusActive, setSensorBusActive] = useState(false);
  
  // Right Panel Tab State
  const [rightPanelTab, setRightPanelTab] = useState<'MAP' | 'SHIP'>('SHIP'); 

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
          // Prefer a male voice or specific system voice if available to contrast with Ada
          // Ensure voices[0] fallback is safe
          const radioVoice = voices.find(v => v.name.includes('Male') || v.name.includes('David') || v.name.includes('Daniel')) || (voices.length > 0 ? voices[0] : null);
          
          if (radioVoice) {
            utterance.voice = radioVoice;
          }
          utterance.rate = 1.05; 
          utterance.pitch = 0.9;
          utterance.volume = 0.9;
          window.speechSynthesis.speak(utterance);
      }
  };

  // --- Helper: Generate Marina Response Logic ---
  const generateMarinaResponse = (channel: number, message: string, to: string) => {
      const msgLower = message.toLowerCase();
      const stationName = to || "İstasyon";
      
      let response = `${stationName}, Burası Phisedelia. Anlaşılmadı, tekrar edin. Tamam.`;

      if (stationName.toLowerCase().includes('marina')) {
          if (msgLower.includes('çıkış') || msgLower.includes('departure') || msgLower.includes('izin')) {
              response = `Phisedelia, Burası ${stationName}. Çıkış izni onaylandı. Rüzgar Kuzey 12 knot. Trafik temiz. Motor çalıştırabilir, halat çözebilirsiniz. İyi seyirler. Tamam.`;
          } else if (msgLower.includes('giriş') || msgLower.includes('requesting entrance')) {
              response = `Phisedelia, Burası ${stationName}. Giriş izni verildi. F pontonu numara 4. Palamar botu sizi karşılıyor. Kanal 72 dinlemede kalın. Tamam.`;
          } else if (msgLower.includes('radio check') || msgLower.includes('kontrol')) {
               response = `Phisedelia, Burası ${stationName}. Sinyaliniz 5 üzerinden 5. Tamam.`;
          }
      } else if (stationName.toLowerCase().includes('tender') || msgLower.includes('bot')) {
          response = `Phisedelia, Tender botu anlaşıldı. 3 dakika içinde iskele tarafınıza yanaşıyorum. Lütfen usturmaçaları hazırlayın. Tamam.`;
      }

      return response;
  };

  // --- Initialize Sensor Bus ---
  useEffect(() => {
    // Create service once
    const skService = new SignalKService();
    signalKRef.current = skService;

    // Connect to stream
    skService.connect();
    setSensorBusActive(true);

    // Setup listener
    skService.onData((update) => {
        // Update Navigation Data
        if (update.nmea) {
             setNmeaData(prev => {
                 const next = { ...prev, ...update.nmea };
                 if (adaServiceRef.current) {
                     adaServiceRef.current.updateNMEA(next);
                 }
                 return next;
             });
        }

        // Update Tank/Ship Data
        if (update.tanks) {
            setShipData(prev => {
                const newData = {
                    ...prev,
                    tanks: { ...prev.tanks, ...update.tanks }
                };
                if (adaServiceRef.current) {
                    adaServiceRef.current.updateShipData(newData);
                }
                return newData;
            });
        }
    });

    return () => skService.disconnect();
  }, []); 

  // --- CONTROL HANDLER (Manual & Ada) ---
  const handleControlAction = (action: string, payload: any) => {
      if (!signalKRef.current) return;

      if (action === 'CONTROL_ENGINE') {
          signalKRef.current.setEngineTarget(payload.action, payload.rpm);
      } else if (action === 'CONTROL_MODE') {
          signalKRef.current.setDriveMode(payload);
      } else if (action === 'CONTROL_SWITCH') {
          signalKRef.current.toggleLight(payload.device, payload.state);
      } else if (action === 'CONTROL_AUTOPILOT') {
          signalKRef.current.setAutopilot(payload.enabled, payload.heading);
      }
  };

  // --- VHF Chatter Simulation ---
  useEffect(() => {
      const msgs = [
          "Securite Securite, Navigasyon uyarısı, boğaz girişi...",
          "Marina kontrol, burası Poyraz 3, giriş izni tamam.",
          "Sahil Güvenlik, bölge taraması devam ediyor.",
          "Mavi Yunus, iskele tarafınızdan geçiyorum.",
          "Kanal 16 dinlemede.",
          "Hava raporu: Poyraz kuvvetli."
      ];

      const chatterInterval = setInterval(() => {
          if (Math.random() > 0.8 && vhfStatus.alertLevel === 'NONE' && !vhfStatus.isTransmitting && !vhfStatus.isReceiving) { 
              const msg = msgs[Math.floor(Math.random() * msgs.length)];
              setVhfStatus(prev => ({ ...prev, isReceiving: true, lastMessage: msg }));
              setTimeout(() => {
                  setVhfStatus(prev => ({ ...prev, isReceiving: false }));
              }, 3000);
          }
      }, 8000);
      return () => clearInterval(chatterInterval);
  }, [vhfStatus.alertLevel, vhfStatus.isTransmitting, vhfStatus.isReceiving]);

  // --- Initialization ---
  useEffect(() => {
    const envKey = process.env.API_KEY;
    if (envKey) {
        setApiKey(envKey);
        setHasKey(true);
    }
  }, []);

  const handleConnect = async () => {
    if (!apiKey) return;
    
    try {
        const service = new AdaService(
            apiKey, 
            nmeaData,
            shipData,
            (statusStr) => {
                const s = statusStr as AgentStatus;
                if (vhfStatus.alertLevel !== 'NONE') {
                    setAgentStatus(AgentStatus.ALERT);
                } else {
                    setAgentStatus(s);
                }
            },
            (action, payload) => {
                // Handle Control Actions
                if (action.startsWith('CONTROL_')) {
                    handleControlAction(action, payload);
                    return;
                }

                if (action === 'TOGGLE_SPYGLASS') {
                    setShowSpyglass(payload);
                } else if (action === 'SET_EMERGENCY') {
                    const { level, details } = payload;
                    setVhfStatus(prev => ({ ...prev, alertLevel: level, lastMessage: details }));
                    setAgentStatus(AgentStatus.ALERT);
                } else if (action === 'ADD_LOG_ENTRY') {
                    const newLog: LogEntry = {
                        id: Date.now().toString(),
                        timestamp: new Date().toISOString(),
                        location: `${nmeaData.latitude.toFixed(3)}N, ${nmeaData.longitude.toFixed(3)}E`,
                        event: payload.event,
                        category: payload.category || 'ROUTINE',
                        author: 'ADA'
                    };
                    setShipData(prev => ({ ...prev, logbook: [...prev.logbook, newLog] }));
                    setRightPanelTab('SHIP'); 
                } else if (action === 'UPDATE_SHIP_DATA') {
                    if (payload.type === 'MENU') {
                        setShipData(prev => ({ ...prev, menuPlan: payload.value }));
                    } else if (payload.type === 'FUEL') {
                         setShipData(prev => ({ ...prev, tanks: { ...prev.tanks, fuel: parseInt(payload.value) }}));
                    }
                    setRightPanelTab('SHIP');
                } else if (action === 'UPDATE_ROUTE') {
                     setRoutePlan(prev => ({
                         ...prev,
                         destination: payload.destination || prev.destination,
                         estimatedTime: payload.eta || prev.estimatedTime,
                         weatherSummary: payload.weatherSummary || prev.weatherSummary,
                         waypoints: payload.waypoints || prev.waypoints
                     }));
                     setRightPanelTab('MAP');
                } else if (action === 'MAKE_RADIO_CALL') {
                    const { channel, message, to } = payload;
                    
                    // 1. Set Status to TRANSMITTING (TX)
                    setVhfStatus(prev => ({ 
                        ...prev, 
                        channel: channel, 
                        isTransmitting: true, 
                        lastMessage: `TX: ${message}`,
                        alertLevel: 'NONE' // Clear alerts if making a normal call
                    }));

                    // 2. Log Ada's Outgoing Message
                    const txLog: LogEntry = {
                        id: `tx-${Date.now()}`,
                        timestamp: new Date().toISOString(),
                        location: `${nmeaData.latitude.toFixed(3)}N, ${nmeaData.longitude.toFixed(3)}E`,
                        event: `VHF TX (Ch ${channel}) to ${to}: ${message}`,
                        category: 'COMMS',
                        author: 'ADA'
                    };
                    setShipData(prev => ({ ...prev, logbook: [...prev.logbook, txLog] }));

                    // 3. Dynamic Delay Calculation to prevent Audio Overlap
                    // Calculate estimated speech duration: ~100ms per character for slow/clear radio voice
                    // Add a 2000ms "Radio Gap" buffer for realistic turn-taking
                    const estimatedSpeakingTime = Math.max(2500, message.length * 90);
                    const radioGap = 2000;
                    const totalDelay = estimatedSpeakingTime + radioGap;

                    setTimeout(() => {
                        const responseText = generateMarinaResponse(channel, message, to);
                        
                        // 4. Switch to RECEIVING (RX)
                        setVhfStatus(prev => ({ 
                            ...prev, 
                            isTransmitting: false,
                            isReceiving: true, 
                            lastMessage: `RX: ${responseText}` 
                        }));
                        
                        // 5. Speak the response (Browser TTS)
                        speakAsMarina(responseText);

                        // 6. Log The Response
                         const rxLog: LogEntry = {
                            id: `rx-${Date.now()}`,
                            timestamp: new Date().toISOString(),
                            location: `${nmeaData.latitude.toFixed(3)}N, ${nmeaData.longitude.toFixed(3)}E`,
                            event: `VHF RX (Ch ${channel}) from ${to}: ${responseText}`,
                            category: 'COMMS',
                            author: 'CAPTAIN' // Marking external comms
                        };
                        setShipData(prev => ({ ...prev, logbook: [...prev.logbook, rxLog] }));
                        setRightPanelTab('SHIP'); // Focus on logbook

                        // 7. Inject Audio/Text back to Ada so she knows what happened
                        if (adaServiceRef.current) {
                            adaServiceRef.current.feedIncomingVHF(responseText);
                        }

                        // 8. Reset to Standby after speech
                        // Also dynamic for RX text
                        const rxDuration = Math.max(4000, responseText.length * 80);
                        setTimeout(() => {
                            setVhfStatus(prev => ({ ...prev, isReceiving: false, lastMessage: 'Scanning...' }));
                        }, rxDuration); 

                    }, totalDelay); 

                } else if (action === 'TRANSCRIPTION') {
                    // Update Messages UI
                    const newMsg: Message = {
                        id: Date.now().toString(),
                        role: payload.role,
                        content: payload.text,
                        timestamp: new Date()
                    };
                    setMessages(prev => [...prev, newMsg]);

                    if (payload.role === 'user') {
                        const logEntry: LogEntry = {
                            id: `log-${Date.now()}`,
                            timestamp: new Date().toISOString(),
                            location: `${nmeaData.latitude.toFixed(3)}N, ${nmeaData.longitude.toFixed(3)}E`,
                            event: `KAPTAN: ${payload.text}`,
                            category: 'COMMS',
                            author: 'CAPTAIN'
                        };
                        setShipData(prev => ({ ...prev, logbook: [...prev.logbook, logEntry] }));
                    }
                }
            }
        );
        
        await service.connectLive();
        adaServiceRef.current = service;
        setIsConnected(true);
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'system',
            content: 'AdaOS Çekirdek Aktif. Sensör verisi işleniyor.',
            timestamp: new Date()
        }]);
    } catch (e) {
        console.error(e);
        alert("Bağlantı hatası. Mikrofon iznini kontrol edin.");
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const fileName = e.target.files[0].name;
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'system',
            content: `[INGEST] ${fileName} Qdrant Vektör DB'ye işlendi.`,
            timestamp: new Date()
        }]);
        setTimeout(() => {
             setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                content: `Bilgi havuzum güncellendi: ${fileName}. Artık bu veriyi kararlarımda kullanabilirim.`,
                timestamp: new Date()
            }]);
        }, 2000);
    }
  };

  if (!hasKey && !process.env.API_KEY) {
      return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-mono">API KEY Not Found in Environment</div>;
  }

  const isAlert = agentStatus === AgentStatus.ALERT;
  
  // Cockpit-style Alert Border
  const cockpitBorder = isAlert 
    ? "border-[4px] border-red-600 animate-pulse shadow-[inset_0_0_50px_rgba(220,38,38,0.5)]" 
    : "border border-slate-800";

  return (
    <div className={`h-screen w-screen bg-[#020617] text-cyan-50 flex flex-col overflow-hidden relative font-sans selection:bg-cyan-500 selection:text-black`}>
        
        <div className="scanlines"></div>

        {/* --- GLARE SHIELD (Top Cockpit Visor) --- */}
        <div className="h-16 bg-[#0f172a] border-b-4 border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50 flex items-center justify-between px-6 shrink-0 relative">
            
            {/* Left: Branding & Status */}
            <div className="flex items-center gap-4">
                 <div className="flex flex-col">
                    <h1 className="text-2xl font-bold tracking-[0.2em] text-slate-200 font-display leading-none">ADA<span className="text-cyan-500">OS</span></h1>
                    <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">Autonomous Marine Node v2.1</span>
                 </div>
                 <div className="h-8 w-[1px] bg-slate-700 mx-2"></div>
                 <div className="flex items-center gap-2">
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider ${sensorBusActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400'}`}>
                        SENSORS: {sensorBusActive ? 'ONLINE' : 'OFFLINE'}
                    </div>
                    {isAlert && <div className="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-red-600 text-white animate-pulse">
                        MASTER CAUTION
                    </div>}
                 </div>
            </div>

            {/* Right: GPS Coordinates & Controls */}
            <div className="flex items-center gap-6">
                 <div className="text-right hidden md:block">
                    <div className="text-[9px] text-slate-500 font-bold tracking-widest">CURRENT POSITION</div>
                    <div className="font-mono text-cyan-400 text-lg leading-none shadow-cyan-500/20 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">
                        {nmeaData.latitude.toFixed(4)}N <span className="text-slate-600">|</span> {nmeaData.longitude.toFixed(4)}E
                    </div>
                 </div>
                 
                 <button 
                    onClick={() => setShowSpyglass(true)} 
                    className="group relative p-2 bg-slate-800 border border-slate-600 rounded hover:bg-cyan-900/30 hover:border-cyan-500 transition-all active:scale-95"
                 >
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
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

        {/* --- MAIN INSTRUMENT PANEL --- */}
        <main className={`flex-1 p-4 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-hidden relative z-10 ${cockpitBorder}`}>
            
            {/* LEFT COLUMN: FLIGHT/NAV DATA (PFD Style) */}
            <div className="col-span-12 md:col-span-3 flex flex-col gap-3 h-full overflow-hidden">
                
                {/* Communications Module */}
                <div className="shrink-0">
                    <div className="text-[10px] text-slate-500 font-mono mb-1 ml-1">COMMS STACK</div>
                    <VHFRadio status={vhfStatus} />
                </div>

                {/* Primary Flight Display (PFD) Gauges */}
                <div className="flex-1 glass-panel p-2 flex flex-col gap-2 rounded-none border-t-2 border-cyan-500/50">
                    <div className="absolute top-1 right-1 text-[9px] font-mono text-cyan-600">FLIGHT INST</div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <Gauge value={nmeaData.speedOverGround} min={0} max={40} label="SOG" unit="KT" color="#06b6d4" />
                        <Gauge value={nmeaData.headingMagnetic} min={0} max={360} label="HDG" unit="MAG" color="#f59e0b" />
                        <Gauge value={nmeaData.windSpeed} min={0} max={60} label="WIND" unit="KT" color="#10b981" />
                        <Gauge value={nmeaData.depth} min={0} max={100} label="DPT" unit="M" color="#6366f1" />
                    </div>
                </div>
            </div>

            {/* CENTER COLUMN: AI CORE & HUD */}
            <div className="col-span-12 md:col-span-6 flex flex-col relative h-full">
                
                {/* AI Hologram Projector */}
                <div className="flex-1 flex flex-col items-center justify-center relative">
                     {/* Background Grid */}
                     <div className="absolute inset-0 border border-slate-800/50 opacity-30" 
                          style={{ backgroundImage: 'linear-gradient(rgba(16,185,129,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px'}}>
                     </div>

                     <div className="z-20">
                         <Orb status={agentStatus} />
                     </div>
                     
                     {/* Status Text under Orb */}
                     <div className="mt-8 flex flex-col items-center z-20">
                        {isAlert ? (
                            <div className="bg-red-950/80 border border-red-500 text-red-500 px-6 py-2 rounded text-xl font-bold font-mono animate-pulse tracking-widest">
                                WARNING: {vhfStatus.alertLevel}
                            </div>
                        ) : (
                            <div className="text-cyan-500/50 font-mono text-sm tracking-[0.3em]">SYSTEM NOMINAL</div>
                        )}
                     </div>

                    {/* Main Interaction Button */}
                    <div className="absolute top-4 z-30">
                        {!isConnected ? (
                            <button 
                                onClick={handleConnect}
                                className="group relative px-8 py-3 bg-cyan-950 border border-cyan-500 text-cyan-400 font-mono font-bold tracking-wider hover:bg-cyan-900 transition-all clip-path-polygon"
                                style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}
                            >
                                <span className="absolute inset-0 w-full h-full bg-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                INITIALIZE ADA
                            </button>
                        ) : (
                            <button 
                                onClick={handleDisconnect}
                                className="px-6 py-2 bg-red-950/30 border border-red-800 text-red-500 font-mono text-xs hover:bg-red-900/50 transition-all"
                            >
                                TERMINATE LINK
                            </button>
                        )}
                    </div>
                </div>

                {/* Lower Console: Live Transcription Log */}
                <div className="h-40 glass-panel border-t-4 border-slate-700 mt-4 flex flex-col">
                    <div className="bg-slate-900/90 p-1 border-b border-slate-800 flex justify-between items-center px-2">
                        <span className="text-[10px] text-slate-500 font-mono">MISSION LOG / TRANSCRIPT</span>
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs custom-scrollbar bg-black/40">
                        {messages.slice(-5).map((msg) => (
                            <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'text-amber-400' : msg.role === 'model' ? 'text-cyan-300' : 'text-slate-400'}`}>
                                <span className="opacity-50 min-w-[50px] uppercase">[{msg.role}]</span>
                                <span>{msg.content}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: MULTI-FUNCTION DISPLAY (MFD) */}
            <div className="col-span-12 md:col-span-3 flex flex-col h-full gap-3 overflow-hidden">
                
                {/* MFD Selector Switches */}
                <div className="flex bg-slate-900 border border-slate-700 p-1">
                    <button 
                        onClick={() => setRightPanelTab('MAP')}
                        className={`flex-1 py-1 text-[10px] font-bold font-mono tracking-widest transition-colors ${rightPanelTab === 'MAP' ? 'bg-slate-700 text-white border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        NAV DISP
                    </button>
                    <div className="w-[1px] bg-slate-800 mx-1"></div>
                    <button 
                         onClick={() => setRightPanelTab('SHIP')}
                         className={`flex-1 py-1 text-[10px] font-bold font-mono tracking-widest transition-colors ${rightPanelTab === 'SHIP' ? 'bg-slate-700 text-white border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        SYS DISP
                    </button>
                </div>

                {/* MFD Screen Content */}
                <div className="flex-1 glass-panel overflow-hidden relative bg-black">
                     {/* Screen Glare Reflection */}
                     <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent pointer-events-none z-20"></div>

                     {rightPanelTab === 'MAP' ? (
                         <RouteMap data={nmeaData} routePlan={routePlan} />
                     ) : (
                         <ShipManagement data={shipData} />
                     )}
                </div>

                {/* Data Ingest Slot */}
                <div className="h-16 glass-panel border border-dashed border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-800/50 transition group">
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                        <div className="flex items-center gap-2 text-slate-500 group-hover:text-cyan-400">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                             <span className="text-[10px] font-mono font-bold tracking-widest">INSERT DATA CARTRIDGE</span>
                        </div>
                        <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>
            </div>
        </main>
    </div>
  );
}