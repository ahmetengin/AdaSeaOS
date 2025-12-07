import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type, Schema, Tool } from "@google/genai";
import { SYSTEM_INSTRUCTION_ADA, MOCK_WEATHER_DATA } from '../constants';
import { NMEAData, ShipData } from '../types';
import { createPCMBlob, decodeAudio, decodeAudioData } from './audioUtils';

// --- Function Declarations for Ada ---

const getBoatStatusDecl: FunctionDeclaration = {
  name: 'getBoatStatus',
  description: 'Mevcut tekne sensör verilerini (NMEA2000) okur: Hız, Rüzgar, Derinlik, Konum.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const getWeatherDecl: FunctionDeclaration = {
  name: 'getWeather',
  description: 'Belirli bir konum için hava durumu raporunu çeker.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: { type: Type.STRING, description: 'Şehir veya bölge adı (örn: İstanbul, Bodrum)' }
    },
    required: ['location']
  }
};

const planRouteDecl: FunctionDeclaration = {
  name: 'planRoute',
  description: 'İki nokta arasında detaylı deniz rotası planlar.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      from: { type: Type.STRING, description: 'Kalkış noktası' },
      to: { type: Type.STRING, description: 'Varış noktası' }
    },
    required: ['from', 'to']
  }
};

const updateRouteDecl: FunctionDeclaration = {
  name: 'updateRoute',
  description: 'Mevcut rotayı hava durumu veya tekne hızına göre günceller. ETA ve hava durumu özetini yeniler.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      destination: { type: Type.STRING, description: 'Varış noktası' },
      eta: { type: Type.STRING, description: 'Tahmini varış süresi (örn: 19 saat)' },
      weatherSummary: { type: Type.STRING, description: 'Rota üzerindeki hava durumu özeti' },
      waypoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Güncel waypoint listesi' }
    },
    required: ['destination', 'eta', 'weatherSummary']
  }
};

const toggleSpyglassDecl: FunctionDeclaration = {
  name: 'toggleSpyglass',
  description: 'Spyglass (Dürbün/Harita) modunu açar veya kapatır. "Haritayı göster", "Dürbünü aç", "Haritayı getir" gibi komutlarda kullanılır.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      active: { type: Type.BOOLEAN, description: 'True açmak için, False kapatmak için.' }
    },
    required: ['active']
  }
};

const setEmergencyStateDecl: FunctionDeclaration = {
    name: 'setEmergencyState',
    description: 'VHF radyodan acil durum (Mayday, Pan-Pan) veya güvenlik uyarısı (Securite) duyulduğunda alarm durumunu ayarlar.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            level: { type: Type.STRING, enum: ['MAYDAY', 'PAN-PAN', 'SECURITE', 'NONE'], description: 'Acil durum seviyesi.' },
            details: { type: Type.STRING, description: 'Duyulan mesajın detayı veya sebebi.' }
        },
        required: ['level']
    }
};

// --- New Ship Management Tools ---

const addToLogbookDecl: FunctionDeclaration = {
    name: 'addToLogbook',
    description: 'Seyir defterine yeni bir kayıt ekler. 24 saatlik, haftalık zorunlu kayıtlar için.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            event: { type: Type.STRING, description: 'Olayın açıklaması.' },
            category: { type: Type.STRING, enum: ['ROUTINE', 'MAINTENANCE', 'NAV', 'HOSPITALITY', 'COMMS'], description: 'Kayıt türü.' }
        },
        required: ['event', 'category']
    }
};

const updateShipStatusDecl: FunctionDeclaration = {
    name: 'updateShipStatus',
    description: 'Tank seviyelerini, bakım durumunu veya menüyü günceller.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, enum: ['MENU', 'FUEL', 'WATER'], description: 'Güncellenecek öğe.' },
            value: { type: Type.STRING, description: 'Yeni değer (örn: "Balık Izgara" veya "80")' }
        },
        required: ['type', 'value']
    }
};

const getShipInfoDecl: FunctionDeclaration = {
    name: 'getShipInfo',
    description: 'Geminin manifestosu (kişiler), tank durumları, son loglar veya bakım durumu hakkında bilgi verir.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            query: { type: Type.STRING, description: 'Ne öğrenilmek isteniyor? (manifesto, tanklar, loglar)' }
        }
    }
};

const makeRadioCallDecl: FunctionDeclaration = {
    name: 'makeRadioCall',
    description: 'VHF telsiz üzerinden belirli bir kanaldan çağrı yapar.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            channel: { type: Type.NUMBER, description: 'VHF Kanalı (örn: 16, 72)' },
            message: { type: Type.STRING, description: 'İletilecek mesaj' },
            to: { type: Type.STRING, description: 'Kime çağrı yapıldığı (örn: West Istanbul Marina)' }
        },
        required: ['channel', 'message', 'to']
    }
};

// --- CONTROL TOOLS ---

const setEngineControlsDecl: FunctionDeclaration = {
    name: 'setEngineControls',
    description: 'Ana motorları çalıştırır, durdurur veya devrini ayarlar.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            action: { type: Type.STRING, enum: ['START', 'STOP', 'SET_RPM'], description: 'İşlem türü.' },
            rpm: { type: Type.NUMBER, description: 'İstenen devir (sadece SET_RPM için).' }
        },
        required: ['action']
    }
};

const setDriveModeDecl: FunctionDeclaration = {
    name: 'setDriveMode',
    description: 'Sürüş modunu değiştirir (Diesel, Electric, Hybrid).',
    parameters: {
        type: Type.OBJECT,
        properties: {
            mode: { type: Type.STRING, enum: ['DIESEL', 'ELECTRIC', 'HYBRID'], description: 'Seçilecek mod.' }
        },
        required: ['mode']
    }
};

const controlSwitchDecl: FunctionDeclaration = {
    name: 'controlSwitch',
    description: 'Işıkları veya belirli cihazları açıp kapatır.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            device: { type: Type.STRING, description: 'Cihaz ID (örn: saloon, navLights, anchorLight).' },
            state: { type: Type.BOOLEAN, description: 'Açık (true) veya Kapalı (false).' }
        },
        required: ['device', 'state']
    }
};

const setAutopilotDecl: FunctionDeclaration = {
    name: 'setAutopilot',
    description: 'Otopilot sistemini devreye alır veya çıkarır.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            enabled: { type: Type.BOOLEAN, description: 'Aktif/Pasif durumu.' },
            heading: { type: Type.NUMBER, description: 'Hedef rota (derece).' }
        },
        required: ['enabled']
    }
};

const tools: Tool[] = [{
  functionDeclarations: [
      getBoatStatusDecl, 
      getWeatherDecl, 
      planRouteDecl, 
      updateRouteDecl,
      toggleSpyglassDecl, 
      setEmergencyStateDecl,
      addToLogbookDecl,
      updateShipStatusDecl,
      getShipInfoDecl,
      makeRadioCallDecl,
      setEngineControlsDecl,
      setDriveModeDecl,
      controlSwitchDecl,
      setAutopilotDecl
  ]
}];

// --- Service Class ---

export class AdaService {
  private ai: GoogleGenAI;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null; // Keep reference to prevent GC
  private currentNMEA: NMEAData;
  private currentShipData: ShipData;
  private onAgentStateChange: (state: string) => void;
  private onAction: (action: string, payload?: any) => void;
  private session: any = null;
  
  constructor(
      apiKey: string, 
      currentNMEA: NMEAData,
      currentShipData: ShipData,
      onStateChange: (s: string) => void,
      onAction: (a: string, p?: any) => void
    ) {
    this.ai = new GoogleGenAI({ apiKey });
    this.currentNMEA = currentNMEA;
    this.currentShipData = currentShipData;
    this.onAgentStateChange = onStateChange;
    this.onAction = onAction;
  }

  public updateNMEA(data: NMEAData) {
    this.currentNMEA = data;
  }
  
  public updateShipData(data: ShipData) {
      this.currentShipData = data;
  }

  // --- Live API (Voice) ---

  public async connectLive() {
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    // Ensure AudioContext is running
    if (this.outputAudioContext.state === 'suspended') {
        await this.outputAudioContext.resume();
    }

    let nextStartTime = 0;
    const outputNode = this.outputAudioContext.createGain();
    outputNode.connect(this.outputAudioContext.destination);

    // Setup Microphone Stream
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = this.inputAudioContext.createMediaStreamSource(stream);
    
    // Assign to class property to prevent garbage collection
    this.scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    
    this.scriptProcessor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createPCMBlob(inputData);
      
      // Send data only if session is ready
      if (this.session) {
        this.session.sendRealtimeInput({ media: pcmBlob });
      }
    };

    source.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.inputAudioContext.destination);

    const sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: SYSTEM_INSTRUCTION_ADA,
        tools: tools,
        speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' }}
        },
      },
      callbacks: {
        onopen: () => {
            this.onAgentStateChange('LISTENING');
            console.log("Ada Live Session Opened");
        },
        onmessage: async (msg: LiveServerMessage) => {
          
          // Handle Audio Output
          const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audioData) {
            this.onAgentStateChange('SPEAKING');
            if (this.outputAudioContext) {
                // Check state again before playing
                if (this.outputAudioContext.state === 'suspended') {
                    await this.outputAudioContext.resume();
                }

                nextStartTime = Math.max(nextStartTime, this.outputAudioContext.currentTime);
                const audioBuffer = await decodeAudioData(
                    decodeAudio(audioData),
                    this.outputAudioContext,
                    24000,
                    1
                );
                const source = this.outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNode);
                source.start(nextStartTime);
                nextStartTime += audioBuffer.duration;
                
                source.onended = () => {
                   // Simple heuristic to revert state
                   setTimeout(() => this.onAgentStateChange('IDLE'), 100);
                };
            }
          }

          // Handle Tool Calls
          if (msg.toolCall) {
            this.onAgentStateChange('EXECUTING');
            for (const fc of msg.toolCall.functionCalls) {
                let result: any = { error: "Unknown function" };
                
                if (fc.name === 'getBoatStatus') {
                    result = this.currentNMEA;
                } else if (fc.name === 'getWeather') {
                    const loc = (fc.args as any).location?.toLowerCase() || 'istanbul';
                    const weather = Object.entries(MOCK_WEATHER_DATA).find(([k]) => loc.includes(k))?.[1];
                    result = weather || { temp: 20, wind: 10, condition: 'Bilinmiyor' };
                } else if (fc.name === 'planRoute') {
                    result = {
                        status: "Route calculated",
                        distance: "280 NM",
                        eta: "18 hours",
                        waypoints: ["Kalamış", "Marmara Adası", "Çanakkale Boğazı", "Baba Burun", "Sakız Boğazı", "Bodrum"]
                    };
                } else if (fc.name === 'updateRoute') {
                    const { destination, eta, weatherSummary, waypoints } = fc.args as any;
                    this.onAction('UPDATE_ROUTE', { destination, eta, weatherSummary, waypoints });
                    result = { status: "Route Updated", newEta: eta };
                } else if (fc.name === 'toggleSpyglass') {
                    const active = (fc.args as any).active ?? true;
                    this.onAction('TOGGLE_SPYGLASS', active);
                    result = { status: active ? "Spyglass opened" : "Spyglass closed" };
                } else if (fc.name === 'setEmergencyState') {
                    const level = (fc.args as any).level;
                    const details = (fc.args as any).details || '';
                    this.onAction('SET_EMERGENCY', { level, details });
                    result = { status: "ALARM TRIGGERED", level: level };
                } else if (fc.name === 'getShipInfo') {
                    result = this.currentShipData;
                } else if (fc.name === 'addToLogbook') {
                    const { event, category } = fc.args as any;
                    this.onAction('ADD_LOG_ENTRY', { event, category });
                    result = { status: "Logged", timestamp: new Date().toISOString() };
                } else if (fc.name === 'updateShipStatus') {
                    const { type, value } = fc.args as any;
                    this.onAction('UPDATE_SHIP_DATA', { type, value });
                    result = { status: "Updated", type, value };
                } else if (fc.name === 'makeRadioCall') {
                    const { channel, message, to } = fc.args as any;
                    this.onAction('MAKE_RADIO_CALL', { channel, message, to });
                    result = { status: "Transmission Sent", channel };
                } else if (fc.name === 'setEngineControls') {
                    const { action, rpm } = fc.args as any;
                    this.onAction('CONTROL_ENGINE', { action, rpm });
                    result = { status: "Engine command executed", action, rpm };
                } else if (fc.name === 'setDriveMode') {
                    const { mode } = fc.args as any;
                    this.onAction('CONTROL_MODE', mode);
                    result = { status: "Drive Mode Set", mode };
                } else if (fc.name === 'controlSwitch') {
                    const { device, state } = fc.args as any;
                    this.onAction('CONTROL_SWITCH', { device, state });
                    result = { status: "Switch Toggled", device, state };
                } else if (fc.name === 'setAutopilot') {
                    const { enabled, heading } = fc.args as any;
                    this.onAction('CONTROL_AUTOPILOT', { enabled, heading });
                    result = { status: "Autopilot Set", enabled };
                }

                sessionPromise.then(session => {
                    session.sendToolResponse({
                        functionResponses: {
                            id: fc.id,
                            name: fc.name,
                            response: { result }
                        }
                    });
                });
            }
          }
        },
        onclose: () => {
            this.onAgentStateChange('IDLE');
            console.log("Ada Live Session Closed");
        },
        onerror: (e) => {
            console.error("Live API Error", e);
            this.onAgentStateChange('ERROR');
        }
      }
    });
    
    this.session = await sessionPromise;
  }

  // Allow injecting text (e.g. from Radio) back into the conversation so Ada can react
  public feedIncomingVHF(text: string) {
      if (this.session) {
          try {
              // Send as a user message to prompt Ada to respond
              this.session.send({
                  clientContent: {
                      turns: [{
                          role: 'user',
                          parts: [{ text: `[SİSTEM BİLGİSİ - VHF TELSİZ DUYULDU]: "${text}". Lütfen bu mesajı Kaptana raporla.` }]
                      }],
                      turnComplete: true
                  }
              });
          } catch (e) {
              console.error("Failed to feed VHF to session", e);
          }
      }
  }

  public async disconnect() {
    if (this.session) {
        this.session = null; 
    }
    if (this.inputAudioContext) {
        this.inputAudioContext.close();
        this.inputAudioContext = null;
    }
    if (this.outputAudioContext) {
        this.outputAudioContext.close();
        this.outputAudioContext = null;
    }
    if (this.scriptProcessor) {
        this.scriptProcessor.disconnect();
        this.scriptProcessor = null;
    }
    this.onAgentStateChange('IDLE');
  }

  // --- Text/Reasoning API (Thinking Mode) ---
  
  public async askAdaThinking(prompt: string, history: any[] = []): Promise<string> {
    const model = this.ai.models.getGenerativeModel({
        model: 'gemini-2.5-flash-thinking', 
        systemInstruction: SYSTEM_INSTRUCTION_ADA,
        tools: tools
    });

    const chat = model.startChat({
        history: history
    });
    
    const augmentedPrompt = `[Current Boat Status: Speed ${this.currentNMEA.speedOverGround}kn, Wind ${this.currentNMEA.windSpeed}kn]\nUser: ${prompt}`;

    const result = await chat.sendMessage(augmentedPrompt);
    return result.response.text();
  }
}