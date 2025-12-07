import { NMEAData, SignalKDelta, TankStatus, LightingData } from '../types';
import { CONVERSIONS, PATHS, normalizeAngle } from './signalKUtils';

// Extended callback to support both Nav and Ship data updates
type DataCallback = (data: { nmea?: Partial<NMEAData>, tanks?: Partial<TankStatus> }) => void;

/**
 * AdaOS Sensor Service
 * 
 * This service acts as the HAL (Hardware Abstraction Layer).
 * It aggregates data streams from:
 * - NMEA 2000 (Engines, Battery, Nav)
 * - NMEA 0183 (Legacy GPS, AIS)
 * - SeaTalk 1/ng (Raymarine Instruments)
 * 
 * In this web-based simulation, it generates realistic physics-based data
 * to mimic the actual behavior of the yacht.
 */
export class SignalKService {
    private ws: WebSocket | null = null;
    private isConnected: boolean = false;
    private listeners: DataCallback[] = [];
    private simulationIntervalId: any = null;
    private reconnectTimeoutId: any = null;

    // Internal mock state representing the physical state of the vessel
    private mockState = {
        sog: 0, // m/s
        heading: Math.PI, // rad (180 deg)
        windSpeed: 6, // m/s
        windAngle: 0.78, // rad (~45 deg)
        depth: 8.4, // meters
        lat: 40.9626,
        lon: 28.6080,
        tanks: {
            fuel: 0.75, // ratio
            water: 0.90,
            black: 0.10,
            grey: 0.05
        },
        // Expanded State
        engines: {
            // Independent targets for realistic sequential operation
            portTargetRpm: 0,
            stbdTargetRpm: 0,
            portRpm: 0,
            stbdRpm: 0,
            temp: 45
        },
        electrics: {
            solarWatts: 1200,
            batteryPct: 0.88,
            loadWatts: 450,
            isShorePower: false
        },
        lighting: {
            saloon: true,
            galley: true,
            masterCabin: false,
            guestCabin: false,
            aftDeck: true,
            flybridge: false,
            underwater: false,
            navLights: false,
            anchorLight: true
        } as LightingData,
        hybridMode: 'ELECTRIC' as 'ELECTRIC' | 'DIESEL' | 'HYBRID',
        autopilot: {
            enabled: false,
            targetHeading: 180,
            mode: 'STANDBY' as 'AUTO' | 'WIND' | 'NAV' | 'STANDBY'
        }
    };

    public connect() {
        // In a real implementation, this would connect to the AdaOS MCP Server or direct Serial/CAN stream
        this.startSimulation(); 
        // We simulate a socket connection for "Live" status, but currently relying on internal physics
        // this.connectWS(); 
    }

    /* 
       Legacy SignalK WebSocket connection. 
       In AdaOS v2, we prefer direct NMEA parsing or MCP Server streams.
       Keeping this for compatibility with existing web-viz tools if needed.
    */
    private connectWS() {
        if (this.ws) return;

        console.log("[AdaOS] Connecting to Sensor Bus...");
        
        try {
            this.ws = new WebSocket('wss://demo.signalk.org/signalk/v1/stream?subscribe=self');
            
            this.ws.onopen = () => {
                console.log("[AdaOS] External Sensor Bus Connected.");
                this.isConnected = true;
                this.stopSimulation(); 
            };

            this.ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.name && msg.server) return; 
                    if (msg.updates && Array.isArray(msg.updates)) {
                        this.processDelta(msg);
                    }
                } catch (e) {
                    console.error("Error parsing Bus message", e);
                }
            };

            this.ws.onclose = () => {
                console.log("[AdaOS] Bus Connection Lost. Switching to Internal Simulation.");
                this.cleanupWS();
                this.startSimulation();
                this.scheduleReconnect();
            };

            this.ws.onerror = (err) => {
                console.warn("[AdaOS] Bus Warning:", err);
            };

        } catch (e) {
            console.error("Failed to create WebSocket", e);
            this.scheduleReconnect();
        }
    }

    private cleanupWS() {
        this.isConnected = false;
        if (this.ws) {
            this.ws.onclose = null; // Prevent loop
            this.ws.close();
            this.ws = null;
        }
    }

    private scheduleReconnect() {
        if (this.reconnectTimeoutId) clearTimeout(this.reconnectTimeoutId);
        this.reconnectTimeoutId = setTimeout(() => {
            console.log("[AdaOS] Attempting Bus Reconnect...");
            this.connectWS();
        }, 5000); 
    }

    public disconnect() {
        this.stopSimulation();
        if (this.reconnectTimeoutId) clearTimeout(this.reconnectTimeoutId);
        this.cleanupWS();
    }

    public onData(callback: DataCallback) {
        this.listeners.push(callback);
    }

    private emit(data: { nmea?: Partial<NMEAData>, tanks?: Partial<TankStatus> }) {
        this.listeners.forEach(cb => cb(data));
    }

    // --- MANUAL CONTROL METHODS (For Ada & UI) ---

    public setEngineTarget(action: 'START' | 'STOP' | 'SET_RPM', rpm?: number) {
        if (action === 'START') {
            // REALISTIC STARTUP SEQUENCE
            // Engines never start simultaneously to avoid voltage sag and hydraulic shock.
            // Sequence: Port -> Wait -> Stbd
            
            console.log("[AdaOS] Engine Start Sequence Initiated...");
            
            // 1. Crank Port Engine
            this.mockState.engines.portTargetRpm = 650; // Idle

            // 2. Wait for Port to stabilize (simulated delay 2.5s) before cranking Stbd
            setTimeout(() => {
                console.log("[AdaOS] Cranking Starboard Engine...");
                this.mockState.engines.stbdTargetRpm = 650;
            }, 2500);

        } else if (action === 'STOP') {
            // Shutdown can be faster, but still nice to stagger slightly
            this.mockState.engines.portTargetRpm = 0;
            setTimeout(() => {
                this.mockState.engines.stbdTargetRpm = 0;
            }, 800);
            
        } else if (action === 'SET_RPM' && rpm !== undefined) {
            const safeRpm = Math.max(0, Math.min(4000, rpm));
            
            // Throttle Sync Logic
            // Even with digital throttles, there's often micro-latency
            this.mockState.engines.portTargetRpm = safeRpm;
            
            // 150ms delay for second lever simulation
            setTimeout(() => {
                this.mockState.engines.stbdTargetRpm = safeRpm;
            }, 150);
        }
    }

    public setDriveMode(mode: 'DIESEL' | 'ELECTRIC' | 'HYBRID') {
        this.mockState.hybridMode = mode;
        // Adjust default behavior for mode switch
        if (mode === 'ELECTRIC') {
             // Engines off in pure electric
             this.mockState.engines.portTargetRpm = 0;
             this.mockState.engines.stbdTargetRpm = 0;
        }
    }

    public toggleLight(key: keyof LightingData, state: boolean) {
        if (this.mockState.lighting.hasOwnProperty(key)) {
            this.mockState.lighting[key] = state;
        }
    }

    public setAutopilot(enabled: boolean, heading?: number) {
        this.mockState.autopilot.enabled = enabled;
        this.mockState.autopilot.mode = enabled ? 'AUTO' : 'STANDBY';
        if (heading !== undefined) {
            this.mockState.autopilot.targetHeading = heading;
        } else if (enabled) {
            // Lock current heading
            this.mockState.autopilot.targetHeading = this.mockState.heading * (180 / Math.PI);
        }
    }

    // --- Simulation Logic (Volvo / Victron / Environment) ---

    private startSimulation() {
        if (this.simulationIntervalId) return;
        console.log("[AdaOS] Starting Internal Physics Engine (NMEA Simulation).");
        
        this.simulationIntervalId = setInterval(() => {
            this.updateMockPhysics();

            // Prepare NMEA Data Structure (Aggregating NMEA2000 PGNs)
            const navUpdate: Partial<NMEAData> = {
                speedOverGround: this.mockState.sog * 1.94384,
                headingMagnetic: normalizeAngle(this.mockState.heading * (180/Math.PI)),
                windSpeed: this.mockState.windSpeed * 1.94384,
                windAngle: normalizeAngle(this.mockState.windAngle * (180/Math.PI)),
                depth: this.mockState.depth,
                latitude: this.mockState.lat,
                longitude: this.mockState.lon,
                hybrid: {
                    mode: this.mockState.hybridMode,
                    rangeElectric: Math.round(this.mockState.electrics.batteryPct * 20),
                    // Electric motor power usage calc
                    electricMotorPower: this.mockState.hybridMode === 'ELECTRIC' && this.mockState.sog > 0.5 ? (this.mockState.sog * 1.5) + 0.5 : 0
                },
                // Volvo Penta Simulation (J1939 / NMEA2000)
                engines: {
                    port: {
                        id: 'PORT',
                        rpm: Math.round(this.mockState.engines.portRpm),
                        coolantTemp: this.mockState.engines.temp,
                        oilPressure: this.mockState.engines.portRpm > 0 ? 4.2 + (Math.random()*0.1) : 0,
                        hours: 1250.5,
                        fuelRate: this.mockState.engines.portRpm * 0.015,
                        status: this.mockState.engines.portRpm > 100 ? 'RUNNING' : 'OFF'
                    },
                    stbd: {
                        id: 'STBD',
                        rpm: Math.round(this.mockState.engines.stbdRpm),
                        coolantTemp: this.mockState.engines.temp - 1, // Slight variance
                        oilPressure: this.mockState.engines.stbdRpm > 0 ? 4.1 + (Math.random()*0.1) : 0,
                        hours: 1248.2,
                        fuelRate: this.mockState.engines.stbdRpm * 0.015,
                        status: this.mockState.engines.stbdRpm > 100 ? 'RUNNING' : 'OFF'
                    }
                },
                // Victron Simulation (NMEA2000 / VE.Bus)
                electrics: {
                    shorePower: {
                        connected: this.mockState.electrics.isShorePower,
                        voltage: this.mockState.electrics.isShorePower ? 230 : 0,
                        current: this.mockState.electrics.isShorePower ? 5 : 0,
                        powerW: this.mockState.electrics.isShorePower ? 1150 : 0
                    },
                    solar: {
                        powerW: Math.round(this.mockState.electrics.solarWatts),
                        voltage: 52,
                        current: this.mockState.electrics.solarWatts / 52,
                        mpptState: this.mockState.electrics.solarWatts > 100 ? 'BULK' : 'FLOAT'
                    },
                    battery: {
                        voltage: 51.2 - (this.mockState.electrics.loadWatts / 1000) + (this.mockState.electrics.solarWatts / 2000),
                        current: (this.mockState.electrics.solarWatts - this.mockState.electrics.loadWatts) / 51.2,
                        soc: Math.round(this.mockState.electrics.batteryPct * 100),
                        ttg: '4h 20m',
                        state: this.mockState.electrics.solarWatts > this.mockState.electrics.loadWatts ? 'CHARGING' : 'DISCHARGING'
                    },
                    acLoads: { powerW: this.mockState.electrics.loadWatts },
                    dcLoads: { powerW: 120 }
                },
                lighting: this.mockState.lighting,
                autopilot: this.mockState.autopilot
            };

            const tankUpdate = {
                fuel: Math.round(this.mockState.tanks.fuel * 100),
                freshWater: Math.round(this.mockState.tanks.water * 100),
                blackWater: Math.round(this.mockState.tanks.black * 100),
                greyWater: Math.round(this.mockState.tanks.grey * 100)
            };

            this.emit({ nmea: navUpdate, tanks: tankUpdate });

        }, 1000);
    }

    private stopSimulation() {
        if (this.simulationIntervalId) {
            clearInterval(this.simulationIntervalId);
            this.simulationIntervalId = null;
        }
    }

    private updateMockPhysics() {
        // Environment
        this.mockState.windSpeed = Math.max(0, this.mockState.windSpeed + (Math.random() - 0.5) * 0.5);
        this.mockState.depth = Math.max(2, this.mockState.depth + (Math.random() - 0.5) * 0.05);

        // --- ENGINES Logic (Physics Model) ---
        const portTarget = this.mockState.engines.portTargetRpm;
        const stbdTarget = this.mockState.engines.stbdTargetRpm;
        
        // Port Engine Physics (Crank simulation & Lag)
        // If RPM is 0 and target is > 0, we simulate a "crank" phase where it slowly builds pressure before firing
        if (this.mockState.engines.portRpm < portTarget) {
             // Ramp up
             const rampRate = this.mockState.engines.portRpm < 200 ? 50 : 200; // Slower at start (cranking)
             this.mockState.engines.portRpm += Math.min(portTarget - this.mockState.engines.portRpm, rampRate);
        } else if (this.mockState.engines.portRpm > portTarget) {
             // Spool down
             this.mockState.engines.portRpm -= (this.mockState.engines.portRpm - portTarget) * 0.1;
        }
        // Add jitter
        this.mockState.engines.portRpm += (Math.random() * 4) - 2;

        // Stbd Engine Physics
        if (this.mockState.engines.stbdRpm < stbdTarget) {
            const rampRate = this.mockState.engines.stbdRpm < 200 ? 50 : 200;
            this.mockState.engines.stbdRpm += Math.min(stbdTarget - this.mockState.engines.stbdRpm, rampRate);
        } else if (this.mockState.engines.stbdRpm > stbdTarget) {
            this.mockState.engines.stbdRpm -= (this.mockState.engines.stbdRpm - stbdTarget) * 0.1;
        }
        this.mockState.engines.stbdRpm += (Math.random() * 4) - 2;

        // Clean up negative noise
        if (this.mockState.engines.portRpm < 0) this.mockState.engines.portRpm = 0;
        if (this.mockState.engines.stbdRpm < 0) this.mockState.engines.stbdRpm = 0;


        // Speed Logic based on RPM & Mode
        let propSpeed = 0;
        if (this.mockState.hybridMode === 'ELECTRIC') {
             // Fake electric propulsion speed (max 6kts)
             // Using Port RPM target as "Throttle %" proxy for electric engine
             const throttle = Math.max(portTarget, stbdTarget) > 0 ? 1 : 0; 
             propSpeed = throttle * 5.5; // 5.5kts electric cruising
        } else {
             // Diesel Speed Curve
             // Average RPM of both
             const avgRpm = (this.mockState.engines.portRpm + this.mockState.engines.stbdRpm) / 2;
             propSpeed = (avgRpm / 3500) * 24; // Max ~24kts at 3500
        }
        
        this.mockState.sog += (propSpeed - this.mockState.sog) * 0.05;

        // Temp Logic
        if (this.mockState.engines.portRpm > 500) {
            if (this.mockState.engines.temp < 85) this.mockState.engines.temp += 0.5;
        } else {
            if (this.mockState.engines.temp > 25) this.mockState.engines.temp -= 0.2;
        }

        // --- AUTOPILOT Logic ---
        if (this.mockState.autopilot.enabled) {
            // Steering towards target
            const currentDeg = this.mockState.heading * (180 / Math.PI);
            let diff = this.mockState.autopilot.targetHeading - currentDeg;
            
            // Normalize -180 to 180
            while (diff < -180) diff += 360;
            while (diff > 180) diff -= 360;

            // Turn Rate
            const turnRate = 0.5; // deg per tick
            if (Math.abs(diff) > 1) {
                const step = Math.sign(diff) * Math.min(Math.abs(diff), turnRate);
                this.mockState.heading += step * (Math.PI / 180);
            }
        }

        // Victron Energy Logic
        // Fluctuate Solar
        const targetSolar = 1800 + (Math.random() * 400);
        this.mockState.electrics.solarWatts += (targetSolar - this.mockState.electrics.solarWatts) * 0.1;
        
        // Random Load Switching (Fridge cycling etc)
        if (Math.random() > 0.95) {
            this.mockState.electrics.loadWatts = 300 + (Math.random() * 500);
        }

        // Battery State
        const netPower = this.mockState.electrics.solarWatts - this.mockState.electrics.loadWatts;
        const capacityWh = 20000; // 20kWh bank
        this.mockState.electrics.batteryPct += (netPower / capacityWh) / 60; // per minute approx logic (scaled for 1s tick)
        this.mockState.electrics.batteryPct = Math.max(0, Math.min(1, this.mockState.electrics.batteryPct));
    }

    // --- Core Processing (Live WS) ---

    private processDelta(delta: SignalKDelta) {
        if (!delta || !delta.updates || !Array.isArray(delta.updates)) return;

        const nmeaUpdate: Partial<NMEAData> = {};
        let hasNmea = false;

        delta.updates.forEach(u => {
            if (!u.values || !Array.isArray(u.values)) return;
            u.values.forEach(v => {
                if (v.path === PATHS.SOG) {
                    nmeaUpdate.speedOverGround = CONVERSIONS.msToKnots(v.value);
                    hasNmea = true;
                }
                // ... other paths ...
            });
        });

        if (hasNmea) {
            this.emit({ nmea: nmeaUpdate });
        }
    }
}