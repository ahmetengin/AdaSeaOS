

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

// --- NEW TANK & FLUID MANAGEMENT ---

export interface TankLevel {
    id: string;
    level: number; // % 0-100
    capacity: number; // Liters
    currentLiters: number;
}

export interface PumpStatus {
    active: boolean;
    sourceTankId: string; // e.g., 'tank1'
    targetTankId: string; // e.g., 'tank2'
    rateLpm: number; // Liters per minute
}

export interface DetailedTanks {
    fuel: {
        tank1: TankLevel; // Main Day Tank
        tank2: TankLevel; // Port Storage
        tank3: TankLevel; // Stbd Storage
        totalLevel: number; // %
        totalLiters: number;
        transferPump: PumpStatus;
    };
    freshWater: {
        tank1: TankLevel; // Fwd
        tank2: TankLevel; // Aft
        totalLevel: number; // %
        transferPump: PumpStatus;
    };
    blackWater: {
        tank1: TankLevel; // Master
        tank2: TankLevel; // Guest
        totalLevel: number; // %
        pumpOutActive: boolean;
    };
    greyWater: {
        tank1: TankLevel;
        totalLevel: number; // %
    };
}

// --- SENSORS & ATTITUDE ---
export interface AttitudeData {
    roll: number; // Degrees (+ Stbd, - Port)
    pitch: number; // Degrees (+ Bow Up, - Bow Down)
    yaw: number; // Rate of turn
}

export interface TripComputer {
    range: number; // NM
    timeToEmpty: string; // HH:MM
    fuelEconomy: number; // L/NM
    instantFuelRate: number; // L/h (Total)
    averageFuelRate: number; // L/h
    fuelUsedTrip: number; // Liters
}

export interface NMEAData {
  speedOverGround: number; // Knots
  courseOverGround: number; // Degrees
  headingMagnetic: number; // Degrees
  windSpeed: number; // Knots
  windAngle: number; // Degrees (Relative)
  depth: number; // Meters
  waterTemp: number; // Celsius
  airTemp: number; // Celsius - Added for comprehensive environmental data
  barometricPressure: number; // Hectopascals (hPa) - Added for comprehensive environmental data
  relativeHumidity: number; // Percentage (%) - Added for comprehensive environmental data
  latitude: number;
  longitude: number;
  
  // New Sensor Group
  attitude: AttitudeData;

  hybrid: HybridData; 
  engines: {
      port: VolvoEngineData;
      stbd: VolvoEngineData;
  };
  tanks: DetailedTanks; // Replaces simple tank data
  trip: TripComputer; // New Trip Data
  electrics: VictronData;
  lighting: LightingData;
  autopilot: AutopilotData;
}

// --- DASHBOARD CUSTOMIZATION TYPES ---

export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl';

export interface DashboardWidget {
    id: string; // Unique ID for the widget instance
    metricKey: string; // Path to data (e.g., 'engines.port.rpm')
    label: string; // Custom label override
    size: WidgetSize;
    color: string; // Tailwind text color class
}

export interface MetricDefinition {
    key: string;
    label: string;
    unit: string;
    category: 'NAV' | 'ENGINE' | 'ENV' | 'ELEC' | 'TANK' | 'TRIP' | 'SENSOR';
    getValue: (data: NMEAData) => string | number;
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

// Define the structure of volvo_ocean_65.json
export interface VolvoOcean65Data {
    yacht: {
        name: string;
        price: {
            amount: number;
            currency: string;
            vatExcluded: boolean;
        };
        referenceId: string;
        displacementKg: number;
        builderDesigner: string;
        model: string;
        designer: string;
        year: number;
        material: string;
        location: string;
        engine: string;
        beamMtr: number;
        draftMtr: number;
        description: string;
        sections: Array<{
            title: string;
            items: string[];
        }>;
        readyToRace: string;
        palmaresHistory: string[]; // This is the key we need!
        refitRenewals2021_2022: string[];
        generalSpecs: string[];
        riggingDetails: string[];
        halyard: string[];
        furler: string[];
        newSets: string[];
        newSetsHalyard: string[];
        newSetsFurler: string[];
        leashing: string;
        completeNewSetOfHalyardsAndSpareOnes: boolean;
        sailsDetails: string[];
        accommodations: string[];
        deckAndCockpitComponents: string[];
        winchesInventory: Array<{
            type: string;
            brandModel: string;
            quantity: number;
        }>;
        hydraulicsInventory: string[];
        electricsInventory: string[];
        safetyInventory: string[];
        electronicsAndNavigationalGearInventory: string[];
        additionalItems: {
            waterBallast: string[];
        };
        extraItems: string[];
    };
}


export interface ShipData {
    logbook: LogEntry[];
    tanks: TankStatus; // Legacy summary for admin logic, NMEA has detailed
    manifest: Person[];
    maintenance: MaintenanceTask[];
    menuPlan: string;
    volvoOcean65: VolvoOcean65Data | null; // Add this new property
}