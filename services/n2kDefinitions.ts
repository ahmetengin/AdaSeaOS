
import { NMEAData } from '../types';

interface PGNDefinition {
    pgn: number;
    label: string;
    description: string;
    generate: (data: NMEAData) => string;
}

const toJson = (pgn: number, description: string, fields: Record<string, any>) => {
    return JSON.stringify({
        pgn,
        description,
        src: 1, // Simulated Source Address (0-252)
        fields
    });
};

export const N2K_DEFINITIONS: Record<number, PGNDefinition> = {
    127250: {
        pgn: 127250,
        label: "Vessel Heading",
        description: "Heading Sensor",
        generate: (d) => toJson(127250, "Vessel Heading", {
            "SID": 1,
            "Heading": Number(d.headingMagnetic.toFixed(2)),
            "Deviation": 0.0,
            "Variation": 3.2,
            "Reference": "Magnetic"
        })
    },
    127257: {
        pgn: 127257,
        label: "Attitude",
        description: "Gyro / Compass",
        generate: (d) => toJson(127257, "Attitude", {
            "SID": 5,
            "Yaw": Number(d.attitude.yaw.toFixed(4)),
            "Pitch": Number(d.attitude.pitch.toFixed(4)),
            "Roll": Number(d.attitude.roll.toFixed(4))
        })
    },
    129026: {
        pgn: 129026,
        label: "COG & SOG, Rapid Update",
        description: "GNSS",
        generate: (d) => toJson(129026, "COG & SOG, Rapid Update", {
            "SID": 2,
            "COG Reference": "True",
            "COG": Number(d.courseOverGround.toFixed(2)),
            "SOG": Number(d.speedOverGround.toFixed(2))
        })
    },
    129029: {
        pgn: 129029,
        label: "GNSS Position Data",
        description: "GPS/GLONASS",
        generate: (d) => toJson(129029, "GNSS Position Data", {
            "SID": 2,
            "Date": new Date().toISOString().split('T')[0],
            "Time": new Date().toISOString().split('T')[1].replace('Z', ''),
            "Latitude": Number(d.latitude.toFixed(6)),
            "Longitude": Number(d.longitude.toFixed(6)),
            "GNSS type": "GPS",
            "Method": "GNSS fix",
            "Integrity": "No integrity checking",
            "Number of SVs": 8,
            "HDOP": 0.8,
            "Geoidal Separation": -0.5
        })
    },
    130306: {
        pgn: 130306,
        label: "Wind Data",
        description: "Wind Sensor",
        generate: (d) => toJson(130306, "Wind Data", {
            "SID": 10,
            "Wind Speed": Number(d.windSpeed.toFixed(2)),
            "Wind Angle": Number(d.windAngle.toFixed(1)),
            "Reference": "Apparent"
        })
    },
    127488: {
        pgn: 127488,
        label: "Engine Parameters, Rapid",
        description: "Volvo Penta Gateway",
        // Simulating two separate PGNs for Port/Stbd would require calling this twice, 
        // but for this sim we'll return an array of JSONs or just pick one randomly to simulate bus traffic
        generate: (d) => {
            const instance = Math.random() > 0.5 ? 0 : 1; // 0=Port, 1=Stbd
            const eng = instance === 0 ? d.engines.port : d.engines.stbd;
            return toJson(127488, "Engine Parameters, Rapid Update", {
                "Engine Instance": instance === 0 ? "Single Engine or Dual Engine Port" : "Dual Engine Starboard",
                "Engine Speed": Number(eng.rpm.toFixed(0)),
                "Engine Boost Pressure": 120000, // Pascals
                "Engine Tilt/Trim": 0
            });
        }
    },
    127489: {
        pgn: 127489,
        label: "Engine Parameters, Dynamic",
        description: "Volvo Penta Gateway",
        generate: (d) => {
            const instance = Math.random() > 0.5 ? 0 : 1;
            const eng = instance === 0 ? d.engines.port : d.engines.stbd;
            return toJson(127489, "Engine Parameters, Dynamic", {
                "Engine Instance": instance === 0 ? "Single Engine or Dual Engine Port" : "Dual Engine Starboard",
                "Engine Oil Pressure": Number((eng.oilPressure * 100000).toFixed(0)), // Bar to Pascals approx
                "Engine Oil Temperature": 350.15, // Kelvin
                "Engine Temperature": Number((eng.coolantTemp + 273.15).toFixed(2)), // Kelvin
                "Alternator Potential": 28.5,
                "Fuel Rate": Number(eng.fuelRate.toFixed(1)),
                "Total Engine Hours": Number(eng.hours.toFixed(1)) * 3600 // Seconds
            });
        }
    },
    127508: {
        pgn: 127508,
        label: "Battery Status",
        description: "Victron Lynx BMS",
        generate: (d) => toJson(127508, "Battery Status", {
            "Battery Instance": 1,
            "Battery Voltage": Number(d.electrics.battery.voltage.toFixed(2)),
            "Battery Current": Number(d.electrics.battery.current.toFixed(1)),
            "Battery Case Temperature": 298.15, // Kelvin (25C)
            "SID": 1
        })
    },
    127505: {
        pgn: 127505,
        label: "Fluid Level",
        description: "Tank Senders",
        generate: (d) => {
            // Randomly cycle through fluid types to simulate bus traffic
            const type = Math.floor(Math.random() * 3);
            let fluidType = "Fuel";
            let level = 0;
            let capacity = 0;
            
            if (type === 0) {
                 fluidType = "Fuel";
                 level = d.tanks.fuel.totalLevel;
                 capacity = d.tanks.fuel.totalLiters;
            } else if (type === 1) {
                 fluidType = "Fresh Water";
                 level = d.tanks.freshWater.totalLevel;
                 capacity = 700;
            } else {
                 fluidType = "Black Water";
                 level = d.tanks.blackWater.totalLevel;
                 capacity = 160;
            }

            return toJson(127505, "Fluid Level", {
                "Fluid Instance": 0,
                "Fluid Type": fluidType,
                "Fluid Level": Number(level.toFixed(1)),
                "Tank Capacity": capacity
            });
        }
    }
};

export const getRandomPGN = (data: NMEAData): string => {
    const keys = Object.keys(N2K_DEFINITIONS);
    const randomKey = keys[Math.floor(Math.random() * keys.length)] as unknown as number;
    const def = N2K_DEFINITIONS[randomKey];
    return def.generate(data);
};
