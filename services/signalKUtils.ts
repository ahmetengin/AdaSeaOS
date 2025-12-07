// Signal K uses SI units. We need to convert them for display.

export const CONVERSIONS = {
    msToKnots: (ms: number) => ms * 1.94384,
    radToDeg: (rad: number) => rad * (180 / Math.PI),
    kelvinToCelsius: (k: number) => k - 273.15,
    kelvinToFahrenheit: (k: number) => (k - 273.15) * 9/5 + 32,
    ratioToPercent: (ratio: number) => Math.round(ratio * 100)
};

export const PATHS = {
    // Navigation
    SOG: 'navigation.speedOverGround',
    COG: 'navigation.courseOverGroundTrue',
    HEADING_MAG: 'navigation.headingMagnetic',
    WIND_SPEED_APP: 'environment.wind.speedApparent',
    WIND_ANGLE_APP: 'environment.wind.angleApparent',
    DEPTH: 'environment.depth.belowTransducer',
    LATITUDE: 'navigation.position.latitude',
    LONGITUDE: 'navigation.position.longitude',
    TEMP_WATER: 'environment.water.temperature',
    
    // Tanks (Standard Signal K often uses index .0, .1 etc)
    TANK_FUEL_0: 'tanks.fuel.0.currentLevel',
    TANK_FRESH_WATER_0: 'tanks.freshWater.0.currentLevel',
    TANK_BLACK_WATER_0: 'tanks.wasteWater.0.currentLevel', // Often mapped to black water
    TANK_GREY_WATER_0: 'tanks.greyWater.0.currentLevel', // Less common in base spec, but used in extended
};

export function normalizeAngle(degrees: number): number {
    let d = degrees % 360;
    if (d < 0) d += 360;
    return d;
}