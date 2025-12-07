// Data types for NMEA2000 Simulation
export interface HybridData {
    mode: 'DIESEL' | 'ELECTRIC' | 'HYBRID';
    rangeElectric: number; // NM
    electricMotorPower: number; // kW usage
}

// Volvo Penta Engine Data
export interface VolvoEngineData {
    id: 'PORT' | 'STBD';
    rpm: number;
    coolantTemp: number; // Celsius
    oilPressure: number; // Bar
    hours: number;
    fuelRate: number; // L/h
    status: 'RUNNING' | 'STANDBY' | 'OFF' | 'ALARM';
}

// Victron Energy Data
export interface VictronData {
    shorePower: {
        connected: boolean;
        voltage: number; // V
        current: number; // A
        powerW: number;
    };
    solar: {
        powerW: number;
        voltage: number; // V
        current: number; // A
        mpptState: 'BULK' | 'ABSORPTION' | 'FLOAT' | 'OFF';
    };
    battery: {
        voltage: number;
        current: number; // + charging, - discharging
        soc: number; // %
        ttg: string; // Time to go
        state: 'IDLE' | 'CHARGING' | 'DISCHARGING';
    };
    acLoads: {
        powerW: number;
    };
    dcLoads: {
        powerW: number;
    };
}

// Lighting / Domotics
export interface LightingData {
    saloon: boolean;
    galley: boolean;
    masterCabin: boolean;
    guestCabin: boolean;
    aftDeck: boolean;
    flybridge: boolean;
    underwater: boolean;
    navLights: boolean;
    anchorLight: boolean;
}

export interface AutopilotData {
    enabled: boolean;
    targetHeading: number;
    mode: 'AUTO' | 'WIND' | 'NAV' | 'STANDBY';
}

export interface NMEAData {
  speedOverGround: number; // Knots
  courseOverGround: number; // Degrees
  headingMagnetic: number; // Degrees
  windSpeed: number; // Knots
  windAngle: number; // Degrees (Relative)
  depth: number; // Meters
  waterTemp: number; // Celsius
  latitude: number;
  longitude: number;
  hybrid: HybridData; 
  engines: {
      port: VolvoEngineData;
      stbd: VolvoEngineData;
  };
  electrics: VictronData;
  lighting: LightingData;
  autopilot: AutopilotData;
}

// Signal K Types
export interface SignalKValue {
    path: string;
    value: any;
}

export interface SignalKUpdate {
    source?: {
        label: string;
        type: string;
    };
    timestamp: string;
    values: SignalKValue[];
}

export interface SignalKDelta {
    context?: string; // e.g., "vessels.self"
    updates: SignalKUpdate[];
}

// H3 Spatial Types
export interface HexCell {
    h3Index: string;
    center: [number, number]; // lat, lng
    boundary: [number, number][]; // array of lat, lng for polygon
    score: {
        total: number; // 0-100 (100 is best, 0 is no-go)
        depthFactor: number;
        windFactor: number;
        trafficFactor: number;
    };
    status: 'OPTIMAL' | 'CAUTION' | 'DANGER' | 'RESTRICTED';
}

// AIS Target
export interface AISTarget {
    mmsi: string;
    name: string;
    type: string;
    lat: number;
    lng: number;
    sog: number;
    cog: number;
    distance?: number;
}

// Chat types
export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: Date;
  type?: 'text' | 'audio' | 'function';
}

// Agent State
export enum AgentStatus {
  IDLE = 'IDLE',
  BOOTING = 'BOOTING', // New state
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
  EXECUTING = 'EXECUTING',
  ALERT = 'ALERT' // New state for emergencies
}

// Route Planning
export interface Waypoint {
  name: string;
  lat: number;
  lng: number;
  notes?: string;
}

export interface RoutePlan {
  origin: string;
  destination: string;
  waypoints: string[]; // Simplified for LLM interaction
  estimatedTime: string;
  fuelConsumption: string;
  weatherSummary: string;
  autoUpdate: boolean; // New feature flag
}

// VHF Radio
export interface VHFStatus {
    channel: number;
    isReceiving: boolean;
    isTransmitting: boolean; // Added TX state
    lastMessage: string;
    alertLevel: 'NONE' | 'SECURITE' | 'PAN-PAN' | 'MAYDAY';
}

// --- SHIP MANAGEMENT TYPES ---

export interface LogEntry {
    id: string;
    timestamp: string;
    location: string;
    event: string;
    category: 'ROUTINE' | 'MAINTENANCE' | 'NAV' | 'HOSPITALITY' | 'COMMS'; // Added COMMS
    author: 'ADA' | 'CAPTAIN';
}

export interface TankStatus {
    fuel: number; // percentage
    freshWater: number; // percentage
    blackWater: number; // percentage
    greyWater: number; // percentage
    blueCardId: string; // Waste tracking ID
    lastPumpOut: string;
}

export interface Person {
    id: string;
    name: string;
    role: 'CAPTAIN' | 'CREW' | 'GUEST';
    healthStatus: string;
    preferences: string; // Allergies, food likes etc.
}

export interface MaintenanceTask {
    id: string;
    item: string; // e.g., "Main Engine Oil", "Generator", "Winches"
    dueDate: string;
    status: 'OK' | 'DUE' | 'OVERDUE';
}

export interface ShipData {
    logbook: LogEntry[];
    tanks: TankStatus;
    manifest: Person[];
    maintenance: MaintenanceTask[];
    menuPlan: string;
}