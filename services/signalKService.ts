
import { NMEAData, SignalKDelta, TankStatus, LightingData } from '../types';
import { CONVERSIONS, PATHS, normalizeAngle } from './signalKUtils';

// Extended callback to support both Nav and Ship data updates
type DataCallback = (data: { nmea?: Partial<NMEAData>, tanks?: Partial<TankStatus> }) => void;

/**
 * AdaOS Sensor Service
 * 
 * This service acts as the HAL (Hardware Abstraction Layer).
 * In this web-based simulation, it generates realistic physics-based data
 * where Tank Levels DIRECTLY affect the Vessel Attitude (Gyro).
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
        // Environmental
        airTemp: 24.5, // Celsius, added for comprehensive environmental data
        waterTemp: 21.5, // Celsius
        barometricPressure: 1012.5, // Hectopascals (hPa)
        relativeHumidity: 65, // Percentage (%)
        // Attitude
        roll: 0.0, // Radians
        pitch: 0.0, // Radians
        yaw: 0.0, // Radians per second, added dynamic yaw
        // Detailed Tank State (Liters)
        tanks: {
            fuel: { t1: 750, t2: 200, t3: 450, c1: 1000, c2: 500, c3: 500 }, // t2(Port)=200, t3(Stbd)=450 -> Heavy Stbd List
            water: { t1: 360, t2: 255, c1: 400, c2: 300 },
            black: { t1: 8, t2: 4, c1: 80, c2: 80 },
            grey: { t1: 5, c1: 100 }
        },
        // Pumps State
        pumps: {
            fuel: { active: false, source: '', target: '', rate: 100 }, // High speed pumps (100 LPM)
            water: { active: false, source: '', target: '', rate: 20 }
        },
        fuelUsedSession: 0,
        // Expanded State
        engines: {
            portTargetRpm: 0,
            stbdTargetRpm: 0,
            portRpm: 0,
            stbdRpm: 0,
            portHours: 1250.5, // Added engine hours
            stbdHours: 1248.2, // Added engine hours
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
        this.startSimulation(); 
    }

    private connectWS() {
        // Disabled for pure simulation fidelity
    }

    public disconnect() {
        this.stopSimulation();
    }

    public onData(callback: DataCallback) {
        this.listeners.push(callback);
    }

    private emit(data: { nmea?: Partial<NMEAData>, tanks?: Partial<TankStatus> }) {
        this.listeners.forEach(cb => cb(data));
    }

    // --- CONTROL METHODS ---

    public setEngineTarget(action: 'START' | 'STOP' | 'SET_RPM', rpm?: number) {
        if (action === 'START') {
            this.mockState.engines.portTargetRpm = 650;
            setTimeout(() => { this.mockState.engines.stbdTargetRpm = 650; }, 2500);
        } else if (action === 'STOP') {
            this.mockState.engines.portTargetRpm = 0;
            setTimeout(() => { this.mockState.engines.stbdTargetRpm = 0; }, 800);
        } else if (action === 'SET_RPM' && rpm !== undefined) {
            const safeRpm = Math.max(0, Math.min(4000, rpm));
            this.mockState.engines.portTargetRpm = safeRpm;
            setTimeout(() => { this.mockState.engines.stbdTargetRpm = safeRpm; }, 150);
        }
    }

    public setDriveMode(mode: 'DIESEL' | 'ELECTRIC' | 'HYBRID') {
        this.mockState.hybridMode = mode;
        if (mode === 'ELECTRIC') {
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
            this.mockState.autopilot.targetHeading = this.mockState.heading * (180 / Math.PI);
        }
    }

    public setTransferPump(type: 'FUEL' | 'WATER', active: boolean, source?: string, target?: string) {
        if (type === 'FUEL') {
            this.mockState.pumps.fuel.active = active;
            if (source) this.mockState.pumps.fuel.source = source;
            if (target) this.mockState.pumps.fuel.target = target;
        } else {
            this.mockState.pumps.water.active = active;
            if (source) this.mockState.pumps.water.source = source;
            if (target) this.mockState.pumps.water.target = target;
        }
    }

    // --- PHYSICS ENGINE ---

    private startSimulation() {
        if (this.simulationIntervalId) return;
        console.log("[AdaOS] Physics Engine Initialized. Closed Loop Control Active.");
        
        this.simulationIntervalId = setInterval(() => {
            this.updateMockPhysics();

            const sogKnots = this.mockState.sog * 1.94384;
            const portFuelRate = this.mockState.engines.portRpm * 0.015;
            const stbdFuelRate = this.mockState.engines.stbdRpm * 0.015;
            const totalFuelRate = portFuelRate + stbdFuelRate;
            
            const totalFuelLiters = this.mockState.tanks.fuel.t1 + this.mockState.tanks.fuel.t2 + this.mockState.tanks.fuel.t3;
            const fuelEconomy = sogKnots > 0.5 && totalFuelRate > 0 ? (totalFuelRate / sogKnots) : 0; 
            const range = fuelEconomy > 0 ? (totalFuelLiters / fuelEconomy) : 999;
            const tteHours = totalFuelRate > 0 ? totalFuelLiters / totalFuelRate : 99;
            
            this.mockState.fuelUsedSession += (totalFuelRate / 3600); 

            // Nav Data Construction
            const navUpdate: Partial<NMEAData> = {
                speedOverGround: sogKnots,
                headingMagnetic: normalizeAngle(this.mockState.heading * (180/Math.PI)),
                windSpeed: this.mockState.windSpeed * 1.94384,
                windAngle: normalizeAngle(this.mockState.windAngle * (180/Math.PI)),
                depth: this.mockState.depth,
                waterTemp: this.mockState.waterTemp,
                airTemp: this.mockState.airTemp, // Include airTemp in NMEAData
                barometricPressure: this.mockState.barometricPressure, // Include barometricPressure
                relativeHumidity: this.mockState.relativeHumidity, // Include relativeHumidity
                latitude: this.mockState.lat,
                longitude: this.mockState.lon,
                
                // GYRO: Converted radians to degrees for NMEA
                attitude: {
                    roll: this.mockState.roll * (180/Math.PI), 
                    pitch: this.mockState.pitch * (180/Math.PI),
                    yaw: this.mockState.yaw * (180/Math.PI) // Convert yaw to degrees/sec
                },
                
                hybrid: {
                    mode: this.mockState.hybridMode,
                    rangeElectric: Math.round(this.mockState.electrics.batteryPct * 20),
                    electricMotorPower: this.mockState.hybridMode === 'ELECTRIC' && this.mockState.sog > 0.5 ? (this.mockState.sog * 1.5) + 0.5 : 0
                },
                engines: {
                    port: {
                        id: 'PORT',
                        rpm: Math.round(this.mockState.engines.portRpm),
                        coolantTemp: this.mockState.engines.temp,
                        oilPressure: this.mockState.engines.portRpm > 0 ? 4.2 + (Math.random()*0.1) : 0,
                        hours: this.mockState.engines.portHours, // Dynamic engine hours
                        fuelRate: portFuelRate,
                        status: this.mockState.engines.portRpm > 100 ? 'RUNNING' : 'OFF'
                    },
                    stbd: {
                        id: 'STBD',
                        rpm: Math.round(this.mockState.engines.stbdRpm),
                        coolantTemp: this.mockState.engines.temp - 1, 
                        oilPressure: this.mockState.engines.stbdRpm > 0 ? 4.1 + (Math.random()*0.1) : 0,
                        hours: this.mockState.engines.stbdHours, // Dynamic engine hours
                        fuelRate: stbdFuelRate,
                        status: this.mockState.engines.stbdRpm > 100 ? 'RUNNING' : 'OFF'
                    }
                },
                tanks: {
                    fuel: {
                        tank1: { id: 'MAIN', level: (this.mockState.tanks.fuel.t1 / this.mockState.tanks.fuel.c1)*100, capacity: this.mockState.tanks.fuel.c1, currentLiters: this.mockState.tanks.fuel.t1 },
                        tank2: { id: 'PORT', level: (this.mockState.tanks.fuel.t2 / this.mockState.tanks.fuel.c2)*100, capacity: this.mockState.tanks.fuel.c2, currentLiters: this.mockState.tanks.fuel.t2 },
                        tank3: { id: 'STBD', level: (this.mockState.tanks.fuel.t3 / this.mockState.tanks.fuel.c3)*100, capacity: this.mockState.tanks.fuel.c3, currentLiters: this.mockState.tanks.fuel.t3 },
                        totalLevel: (totalFuelLiters / (this.mockState.tanks.fuel.c1 + this.mockState.tanks.fuel.c2 + this.mockState.tanks.fuel.c3)) * 100,
                        totalLiters: totalFuelLiters,
                        transferPump: { 
                            active: this.mockState.pumps.fuel.active, 
                            sourceTankId: this.mockState.pumps.fuel.source, 
                            targetTankId: this.mockState.pumps.fuel.target, 
                            rateLpm: this.mockState.pumps.fuel.rate 
                        }
                    },
                    freshWater: {
                        tank1: { id: 'FWD', level: (this.mockState.tanks.water.t1 / this.mockState.tanks.water.c1)*100, capacity: this.mockState.tanks.water.c1, currentLiters: this.mockState.tanks.water.t1 },
                        tank2: { id: 'AFT', level: (this.mockState.tanks.water.t2 / this.mockState.tanks.water.c2)*100, capacity: this.mockState.tanks.water.c2, currentLiters: this.mockState.tanks.water.t2 },
                        totalLevel: ((this.mockState.tanks.water.t1 + this.mockState.tanks.water.t2) / (this.mockState.tanks.water.c1 + this.mockState.tanks.water.c2)) * 100,
                        transferPump: {
                            active: this.mockState.pumps.water.active,
                            sourceTankId: this.mockState.pumps.water.source,
                            targetTankId: this.mockState.pumps.water.target,
                            rateLpm: this.mockState.pumps.water.rate
                        }
                    },
                    blackWater: {
                        tank1: { id: 'MST', level: (this.mockState.tanks.black.t1 / this.mockState.tanks.black.c1)*100, capacity: this.mockState.tanks.black.c1, currentLiters: this.mockState.tanks.black.t1 },
                        tank2: { id: 'GST', level: (this.mockState.tanks.black.t2 / this.mockState.tanks.black.c2)*100, capacity: this.mockState.tanks.black.c2, currentLiters: this.mockState.tanks.black.t2 },
                        totalLevel: ((this.mockState.tanks.black.t1 + this.mockState.tanks.black.t2) / (this.mockState.tanks.black.c1 + this.mockState.tanks.black.c2)) * 100,
                        pumpOutActive: false
                    },
                    greyWater: {
                         tank1: { id: 'MN', level: (this.mockState.tanks.grey.t1 / this.mockState.tanks.grey.c1)*100, capacity: this.mockState.tanks.grey.c1, currentLiters: this.mockState.tanks.grey.t1 },
                         totalLevel: (this.mockState.tanks.grey.t1 / this.mockState.tanks.grey.c1) * 100
                    }
                },
                trip: {
                    range: range,
                    timeToEmpty: tteHours > 24 ? '>24h' : `${Math.floor(tteHours)}h ${(tteHours%1*60).toFixed(0)}m`,
                    fuelEconomy: fuelEconomy,
                    instantFuelRate: totalFuelRate,
                    averageFuelRate: totalFuelRate, 
                    fuelUsedTrip: this.mockState.fuelUsedSession
                },
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
                        ttg: '4h 20m', // Mock TTG for now
                        state: this.mockState.electrics.solarWatts > this.mockState.electrics.loadWatts ? 'CHARGING' : 'DISCHARGING'
                    },
                    acLoads: { powerW: this.mockState.electrics.loadWatts },
                    dcLoads: { powerW: 120 }
                },
                lighting: this.mockState.lighting,
                autopilot: this.mockState.autopilot
            };

            const tankUpdate = {
                fuel: Math.round((totalFuelLiters / 2000) * 100),
                freshWater: Math.round(((this.mockState.tanks.water.t1 + this.mockState.tanks.water.t2) / 700) * 100),
                blackWater: Math.round(((this.mockState.tanks.black.t1 + this.mockState.tanks.black.t2) / 160) * 100),
                greyWater: Math.round(this.mockState.tanks.grey.t1)
            };

            this.emit({ nmea: navUpdate, tanks: tankUpdate });

            // Increment engine hours (every hour for real systems, simulating faster)
            this.mockState.engines.portHours += (this.mockState.engines.portRpm > 0 ? 0.001 : 0); 
            this.mockState.engines.stbdHours += (this.mockState.engines.stbdRpm > 0 ? 0.001 : 0);

        }, 500); // 2Hz Update rate for smoother physics
    }

    private stopSimulation() {
        if (this.simulationIntervalId) {
            clearInterval(this.simulationIntervalId);
            this.simulationIntervalId = null;
        }
    }

    private updateMockPhysics() {
        // --- FLUID TRANSFER LOGIC (ACTUAL) ---
        // When Ada activates a pump, we move litres between tanks.
        if (this.mockState.pumps.fuel.active) {
            const ratePerTick = (this.mockState.pumps.fuel.rate / 60) / 2; // LPM -> Liters per 0.5s tick
            let s = this.mockState.pumps.fuel.source;
            let t = this.mockState.pumps.fuel.target;
            
            // Map Simplified IDs to State Keys
            const map: any = { '1': 't1', '2': 't2', '3': 't3', 'MAIN': 't1', 'PORT': 't2', 'STBD': 't3' };
            const sKey = map[s];
            const tKey = map[t];
            
            if (sKey && tKey && (this.mockState.tanks.fuel as any)[sKey] > 0) {
                 (this.mockState.tanks.fuel as any)[sKey] -= ratePerTick;
                 (this.mockState.tanks.fuel as any)[tKey] += ratePerTick;
            } else {
                this.mockState.pumps.fuel.active = false; // Auto-stop if empty
            }
        }

        // --- ATTITUDE SIMULATION (PHYSICS MODEL) ---
        // Calculate Heeling Moment based on Fuel Distribution
        // Tank 2 (Port) is at -2.0m beam, Tank 3 (Stbd) is at +2.0m beam.
        // Weight difference creates torque.
        const fuelPortKg = this.mockState.tanks.fuel.t2 * 0.85; // Diesel approx 0.85 kg/l
        const fuelStbdKg = this.mockState.tanks.fuel.t3 * 0.85;
        
        const weightDiff = fuelStbdKg - fuelPortKg; // Positive if Stbd heavy
        const listFactor = 0.02; // Degrees per Kg diff (simplified constant)
        const staticHeel = weightDiff * listFactor; 

        // Dynamic Forces (Wind)
        // Wind from Stbd (90 deg) pushes boat to Port (Negative Roll)
        const windForce = Math.sin(this.mockState.windAngle) * this.mockState.windSpeed * 0.15;
        
        // Target Roll combines Static (Fuel) and Dynamic (Wind) forces
        const targetRollDeg = staticHeel + windForce + (Math.random() * 0.2); // + Noise
        
        // Smooth transition (Damping)
        const currentRollDeg = this.mockState.roll * (180/Math.PI);
        const newRollDeg = currentRollDeg + (targetRollDeg - currentRollDeg) * 0.1;
        
        this.mockState.roll = newRollDeg * (Math.PI/180);
        
        // Pitch logic (Speed induced)
        this.mockState.pitch = (this.mockState.sog * 0.05) + (Math.random() * 0.5) - 0.25;

        // Yaw logic (small random variations + subtle response to heading changes)
        this.mockState.yaw = (Math.random() * 0.05 - 0.025); // Small random turn rate
        if (this.mockState.autopilot.enabled && this.mockState.autopilot.mode === 'AUTO') {
            const targetHeadingRad = this.mockState.autopilot.targetHeading * (Math.PI/180);
            let headingDiff = targetHeadingRad - this.mockState.heading;
            // Normalize angle difference to -PI to PI
            if (headingDiff > Math.PI) headingDiff -= 2 * Math.PI;
            if (headingDiff < -Math.PI) headingDiff += 2 * Math.PI;
            this.mockState.yaw += headingDiff * 0.1; // Simple proportional control
        }

        // Environmental Data Simulation
        this.mockState.airTemp += (Math.random() - 0.5) * 0.1; // +/- 0.05 deg C per tick
        this.mockState.barometricPressure += (Math.random() - 0.5) * 0.2; // +/- 0.1 hPa per tick
        this.mockState.relativeHumidity += (Math.random() - 0.5) * 0.5; // +/- 0.25% per tick
        // Clamp humidity between 0 and 100
        this.mockState.relativeHumidity = Math.max(0, Math.min(100, this.mockState.relativeHumidity));


        // --- ENGINE PHYSICS ---
        // (Standard ramp up/down logic preserved)
        this.updateEnginePhysics();
    }

    private updateEnginePhysics() {
        const portTarget = this.mockState.engines.portTargetRpm;
        const stbdTarget = this.mockState.engines.stbdTargetRpm;
        
        // Port
        if (this.mockState.engines.portRpm < portTarget) this.mockState.engines.portRpm += 50;
        else if (this.mockState.engines.portRpm > portTarget) this.mockState.engines.portRpm -= 50;
        
        // Stbd
        if (this.mockState.engines.stbdRpm < stbdTarget) this.mockState.engines.stbdRpm += 50;
        else if (this.mockState.engines.stbdRpm > stbdTarget) this.mockState.engines.stbdRpm -= 50;

        // Speed Calc
        const avgRpm = (this.mockState.engines.portRpm + this.mockState.engines.stbdRpm) / 2;
        const targetSog = (avgRpm / 3500) * 24;
        this.mockState.sog += (targetSog - this.mockState.sog) * 0.05;
    }
}