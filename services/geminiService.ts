

import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type, Schema, Tool } from "@google/genai";
import { SYSTEM_INSTRUCTION_ADA, MOCK_WEATHER_DATA } from '../constants';
import { NMEAData, ShipData } from '../types';
import { createPCMBlob, decodeAudio, decodeAudioData } from './audioUtils';

// --- Function Declarations for Ada ---

const getBoatStatusDecl: FunctionDeclaration = {
  name: 'getBoatStatus',
  description: 'Mevcut tekne sensör verilerini (NMEA2000) okur: Hız, Rüzgar, Derinlik, Konum, Tank Seviyeleri, Gyro.',
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

// --- NEW TRANSFER TOOL ---
const transferFluidsDecl: FunctionDeclaration = {
    name: 'transferFluids',
    description: 'Tanklar arası yakıt veya su transferi işlemini başlatır veya durdurur.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, enum: ['FUEL', 'WATER'], description: 'Sıvı tipi.' },
            source: { type: Type.STRING, description: 'Kaynak tank (örn: 1, 2, MAIN, PORT).' },
            target: { type: Type.STRING, description: 'Hedef tank.' },
            active: { type: Type.BOOLEAN, description: 'İşlemi başlat (true) veya durdur (false).' }
        },
        required: ['type', 'active']
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
      setAutopilotDecl,
      transferFluidsDecl
  ]
}];

// --- Service Class ---

export class AdaService {
  private ai: GoogleGenAI;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null; 
  private currentNMEA: NMEAData;
  private currentShipData: ShipData;
  private onAgentStateChange: (state: string) => void;
  private onAction: (action: string, payload?: any) => void;
  private session: any = null;
  private textChat: any = null; // Persistent Chat for Text mode
  
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
    
    if (this.outputAudioContext.state === 'suspended') {
        await this.outputAudioContext.resume();
    }

    let nextStartTime = 0;
    const outputNode = this.outputAudioContext.createGain();
    outputNode.connect(this.outputAudioContext.destination);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = this.inputAudioContext.createMediaStreamSource(stream);
    
    this.scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    
    this.scriptProcessor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createPCMBlob(inputData);
      
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
        systemInstruction: SYSTEM_INSTRUCTION_ADA, // Use the JSON-aware system instruction
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
          const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audioData) {
            this.onAgentStateChange('SPEAKING');
            if (this.outputAudioContext) {
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
                   setTimeout(() => this.onAgentStateChange('IDLE'), 100);
                };
            }
          }

          if (msg.toolCall) {
            this.onAgentStateChange('EXECUTING');
            for (const fc of msg.toolCall.functionCalls) {
                let result: any = { error: "Unknown function" };
                const args = fc.args as any;

                if (fc.name === 'getBoatStatus') {
                    result = this.currentNMEA;
                } else if (fc.name === 'getWeather') {
                    const loc = args.location?.toLowerCase() || 'istanbul';
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
                    this.onAction('UPDATE_ROUTE', { 
                        destination: args.destination, 
                        eta: args.eta, 
                        weatherSummary: args.weatherSummary, 
                        waypoints: args.waypoints 
                    });
                    result = { status: "Route Updated", newEta: args.eta };
                } else if (fc.name === 'toggleSpyglass') {
                    const active = args.active ?? true;
                    this.onAction('TOGGLE_SPYGLASS', active);
                    result = { status: active ? "Spyglass opened" : "Spyglass closed" };
                } else if (fc.name === 'setEmergencyState') {
                    this.onAction('SET_EMERGENCY', { level: args.level, details: args.details || '' });
                    result = { status: "ALARM TRIGGERED", level: args.level };
                } else if (fc.name === 'getShipInfo') {
                    result = this.currentShipData;
                } else if (fc.name === 'addToLogbook') {
                    this.onAction('ADD_LOG_ENTRY', { event: args.event, category: args.category });
                    result = { status: "Logged", timestamp: new Date().toISOString() };
                } else if (fc.name === 'updateShipStatus') {
                    this.onAction('UPDATE_SHIP_DATA', { type: args.type, value: args.value });
                    result = { status: "Updated", type: args.type, value: args.value };
                } else if (fc.name === 'makeRadioCall') {
                    this.onAction('MAKE_RADIO_CALL', { channel: args.channel, message: args.message, to: args.to });
                    result = { status: "Transmission Sent", channel: args.channel };
                } else if (fc.name === 'setEngineControls') {
                    this.onAction('CONTROL_ENGINE', { action: args.action, rpm: args.rpm });
                    result = { status: "Engine command executed", action: args.action, rpm: args.rpm };
                } else if (fc.name === 'setDriveMode') {
                    this.onAction('CONTROL_MODE', args.mode);
                    result = { status: "Drive Mode Set", mode: args.mode };
                } else if (fc.name === 'controlSwitch') {
                    this.onAction('CONTROL_SWITCH', { device: args.device, state: args.state });
                    result = { status: "Switch Toggled", device: args.device, state: args.state };
                } else if (fc.name === 'setAutopilot') {
                    this.onAction('CONTROL_AUTOPILOT', { enabled: args.enabled, heading: args.heading });
                    result = { status: "Autopilot Set", enabled: args.enabled };
                } else if (fc.name === 'transferFluids') {
                    this.onAction('CONTROL_PUMP', { type: args.type, active: args.active, source: args.source, target: args.target });
                    result = { status: "Pump Command Sent", active: args.active };
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

  // --- Unified Text/Voice Interface ---

  public feedIncomingVHF(text: string) {
      // Live API currently does not support arbitrary text injection easily for this use case.
      // We just log it for now.
      console.log(`[VHF] ${text}`);
  }

  public async sendUserText(text: string) {
      // Route all text interactions to the standard Text Chat model.
      // The Live API is reserved for voice.
      return await this.askAdaText(text);
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

  // --- Text/Reasoning API (Thinking/Flash Mode) ---
  
  private async askAdaText(prompt: string): Promise<string> {
    if (!this.textChat) {
        this.textChat = this.ai.chats.create({
            model: 'gemini-2.5-flash', 
            config: {
                systemInstruction: SYSTEM_INSTRUCTION_ADA, // Use the JSON-aware system instruction
                tools: tools
            }
        });
    }

    const augmentedPrompt = `[Current Boat Status: Speed ${this.currentNMEA.speedOverGround.toFixed(1)}kn, Wind ${this.currentNMEA.windSpeed.toFixed(1)}kn, Position: ${this.currentNMEA.latitude.toFixed(4)}/${this.currentNMEA.longitude.toFixed(4)}]\nUser: ${prompt}`;

    const result = await this.textChat.sendMessage({ message: augmentedPrompt });
    
    let parsedResult: { answer?: string };
    try {
        parsedResult = JSON.parse(result.text);
        if (parsedResult.answer === undefined) {
            console.error("AI response JSON missing 'answer' key:", result.text);
            return "Ada: Sistem yanıtı eksik. (Hata kodu: JSON_KEY_MISSING)";
        }
    } catch (e) {
        console.error("Failed to parse AI response as JSON:", e, "Raw response:", result.text);
        return "Ada: Sistem yanıtını işleyemedim. Lütfen tekrar deneyin. (Hata kodu: JSON_PARSE_FAIL)";
    }
    
    return parsedResult.answer;
  }
}