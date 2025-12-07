
import { NMEAData, MetricDefinition, DashboardWidget } from '../types';

export const METRIC_REGISTRY: MetricDefinition[] = [
    // NAVIGATION
    { key: 'sog', label: 'SOG', unit: 'KN', category: 'NAV', getValue: (d) => d.speedOverGround.toFixed(1) },
    { key: 'cog', label: 'COG', unit: '°T', category: 'NAV', getValue: (d) => d.courseOverGround.toFixed(0) },
    { key: 'hdg', label: 'HEADING', unit: '°M', category: 'NAV', getValue: (d) => d.headingMagnetic.toFixed(0) },
    { key: 'depth', label: 'DEPTH', unit: 'M', category: 'NAV', getValue: (d) => d.depth.toFixed(1) },
    
    // ENVIRONMENTAL
    { key: 'aws', label: 'APP WIND', unit: 'KN', category: 'ENV', getValue: (d) => d.windSpeed.toFixed(1) },
    { key: 'awa', label: 'APP ANGLE', unit: '°', category: 'ENV', getValue: (d) => d.windAngle.toFixed(0) },
    { key: 'watertemp', label: 'SEA TEMP', unit: '°C', category: 'ENV', getValue: (d) => d.waterTemp.toFixed(1) },
    { key: 'airtemp', label: 'AIR TEMP', unit: '°C', category: 'ENV', getValue: (d) => d.airTemp?.toFixed(1) || '---' },
    { key: 'baro', label: 'BARO', unit: 'hPa', category: 'ENV', getValue: (d) => d.barometricPressure?.toFixed(1) || '---' }, // Added Barometric Pressure
    { key: 'humidity', label: 'HUMIDITY', unit: '%', category: 'ENV', getValue: (d) => d.relativeHumidity?.toFixed(0) || '---' }, // Added Relative Humidity
    
    // SENSORS (ATTITUDE)
    { key: 'roll', label: 'ROLL', unit: '°', category: 'SENSOR', getValue: (d) => d.attitude.roll > 0 ? `+${d.attitude.roll.toFixed(1)}` : d.attitude.roll.toFixed(1) },
    { key: 'pitch', label: 'PITCH', unit: '°', category: 'SENSOR', getValue: (d) => d.attitude.pitch > 0 ? `+${d.attitude.pitch.toFixed(1)}` : d.attitude.pitch.toFixed(1) },
    { key: 'yaw', label: 'YAW', unit: '°/s', category: 'SENSOR', getValue: (d) => d.attitude.yaw.toFixed(1) },

    // ENGINES
    { key: 'port_rpm', label: 'PORT RPM', unit: 'RPM', category: 'ENGINE', getValue: (d) => d.engines.port.rpm.toFixed(0) },
    { key: 'stbd_rpm', label: 'STBD RPM', unit: 'RPM', category: 'ENGINE', getValue: (d) => d.engines.stbd.rpm.toFixed(0) },
    { key: 'port_oil', label: 'PORT OIL', unit: 'BAR', category: 'ENGINE', getValue: (d) => d.engines.port.oilPressure.toFixed(1) },
    { key: 'stbd_oil', label: 'STBD OIL', unit: 'BAR', category: 'ENGINE', getValue: (d) => d.engines.stbd.oilPressure.toFixed(1) },
    { key: 'port_temp', label: 'PORT TEMP', unit: '°C', category: 'ENGINE', getValue: (d) => d.engines.port.coolantTemp.toFixed(0) },
    { key: 'stbd_temp', label: 'STBD TEMP', unit: '°C', category: 'ENGINE', getValue: (d) => d.engines.stbd.coolantTemp.toFixed(0) },
    { key: 'port_hours', label: 'PORT HOURS', unit: 'H', category: 'ENGINE', getValue: (d) => d.engines.port.hours.toFixed(0) },
    { key: 'stbd_hours', label: 'STBD HOURS', unit: 'H', category: 'ENGINE', getValue: (d) => d.engines.stbd.hours.toFixed(0) },
    { key: 'port_fuel', label: 'PORT FUEL', unit: 'L/H', category: 'ENGINE', getValue: (d) => d.engines.port.fuelRate.toFixed(1) },
    { key: 'stbd_fuel', label: 'STBD FUEL', unit: 'L/H', category: 'ENGINE', getValue: (d) => d.engines.stbd.fuelRate.toFixed(1) },
    { key: 'port_status', label: 'PORT STATUS', unit: '', category: 'ENGINE', getValue: (d) => d.engines.port.status },
    { key: 'stbd_status', label: 'STBD STATUS', unit: '', category: 'ENGINE', getValue: (d) => d.engines.stbd.status },

    // ELECTRICAL & HYBRID
    { key: 'batt_soc', label: 'BATTERY', unit: '%', category: 'ELEC', getValue: (d) => d.electrics.battery.soc.toFixed(0) },
    { key: 'batt_volt', label: 'VOLTAGE', unit: 'V', category: 'ELEC', getValue: (d) => d.electrics.battery.voltage.toFixed(1) },
    { key: 'batt_curr', label: 'CURRENT', unit: 'A', category: 'ELEC', getValue: (d) => d.electrics.battery.current.toFixed(1) },
    { key: 'solar', label: 'SOLAR', unit: 'W', category: 'ELEC', getValue: (d) => d.electrics.solar.powerW.toFixed(0) },
    { key: 'hybrid_range', label: 'E-RANGE', unit: 'NM', category: 'ENGINE', getValue: (d) => d.hybrid.rangeElectric.toFixed(1) },
    { key: 'hybrid_mode', label: 'MODE', unit: '', category: 'ENGINE', getValue: (d) => d.hybrid.mode },
    { key: 'hybrid_power', label: 'E-MOTOR', unit: 'kW', category: 'ENGINE', getValue: (d) => d.hybrid.electricMotorPower.toFixed(1) },
    { key: 'autopilot', label: 'AUTOPILOT', unit: '°', category: 'NAV', getValue: (d) => d.autopilot.enabled ? d.autopilot.targetHeading.toFixed(0) : 'OFF' },
    { key: 'autopilot_mode', label: 'AP MODE', unit: '', category: 'NAV', getValue: (d) => d.autopilot.mode },
    { key: 'shore_power', label: 'SHORE POWER', unit: '', category: 'ELEC', getValue: (d) => d.electrics.shorePower.connected ? 'ON' : 'OFF' },
    { key: 'batt_ttg', label: 'BATT TTG', unit: '', category: 'ELEC', getValue: (d) => d.electrics.battery.ttg },
    { key: 'ac_loads', label: 'AC LOADS', unit: 'W', category: 'ELEC', getValue: (d) => d.electrics.acLoads.powerW.toFixed(0) },
    { key: 'dc_loads', label: 'DC LOADS', unit: 'W', category: 'ELEC', getValue: (d) => d.electrics.dcLoads.powerW.toFixed(0) },


    // --- NEW TANKS METRICS ---
    { key: 'tank_fuel_1', label: 'FUEL 1 (MAIN)', unit: '%', category: 'TANK', getValue: (d) => d.tanks.fuel.tank1.level.toFixed(0) },
    { key: 'tank_fuel_2', label: 'FUEL 2 (PORT)', unit: '%', category: 'TANK', getValue: (d) => d.tanks.fuel.tank2.level.toFixed(0) },
    { key: 'tank_fuel_3', label: 'FUEL 3 (STBD)', unit: '%', category: 'TANK', getValue: (d) => d.tanks.fuel.tank3.level.toFixed(0) },
    { key: 'tank_fuel_total', label: 'TOTAL FUEL', unit: 'L', category: 'TANK', getValue: (d) => d.tanks.fuel.totalLiters.toFixed(0) },
    
    { key: 'tank_water_1', label: 'WATER 1 (FWD)', unit: '%', category: 'TANK', getValue: (d) => d.tanks.freshWater.tank1.level.toFixed(0) },
    { key: 'tank_water_2', label: 'WATER 2 (AFT)', unit: '%', category: 'TANK', getValue: (d) => d.tanks.freshWater.tank2.level.toFixed(0) },
    
    { key: 'tank_black_1', label: 'BLACK 1 (MST)', unit: '%', category: 'TANK', getValue: (d) => d.tanks.blackWater.tank1.level.toFixed(0) },
    { key: 'tank_black_2', label: 'BLACK 2 (GST)', unit: '%', category: 'TANK', getValue: (d) => d.tanks.blackWater.tank2.level.toFixed(0) },
    { key: 'tank_grey_1', label: 'GREY WATER', unit: '%', category: 'TANK', getValue: (d) => d.tanks.greyWater.tank1.level.toFixed(0) },


    // --- NEW TRIP COMPUTER METRICS ---
    { key: 'trip_range', label: 'RANGE (NM)', unit: 'NM', category: 'TRIP', getValue: (d) => d.trip.range > 500 ? '>500' : d.trip.range.toFixed(0) },
    { key: 'trip_econ', label: 'ECONOMY', unit: 'L/NM', category: 'TRIP', getValue: (d) => d.trip.fuelEconomy.toFixed(1) },
    { key: 'trip_tte', label: 'TIME TO EMPTY', unit: 'H', category: 'TRIP', getValue: (d) => d.trip.timeToEmpty },
    { key: 'trip_fuel_rate', label: 'INST FUEL', unit: 'L/H', category: 'TRIP', getValue: (d) => d.trip.instantFuelRate.toFixed(1) },
    { key: 'trip_avg_fuel_rate', label: 'AVG FUEL', unit: 'L/H', category: 'TRIP', getValue: (d) => d.trip.averageFuelRate.toFixed(1) },
    { key: 'trip_fuel_used', label: 'FUEL USED', unit: 'L', category: 'TRIP', getValue: (d) => d.trip.fuelUsedTrip.toFixed(1) },
];

export const DEFAULT_DASHBOARD: DashboardWidget[] = [
    { id: '1', metricKey: 'sog', label: 'SOG', size: 'xl', color: 'text-emerald-400' },
    { id: '2', metricKey: 'hdg', label: 'HEADING', size: 'xl', color: 'text-white' },
    { id: '3', metricKey: 'depth', label: 'DEPTH', size: 'lg', color: 'text-cyan-400' },
    
    // Environmental Group
    { id: '4', metricKey: 'airtemp', label: 'AIR TEMP', size: 'md', color: 'text-orange-400' },
    { id: '5', metricKey: 'watertemp', label: 'SEA TEMP', size: 'md', color: 'text-blue-300' },
    { id: '6', metricKey: 'baro', label: 'BARO', size: 'md', color: 'text-purple-400' }, // New
    { id: '7', metricKey: 'humidity', label: 'HUMIDITY', size: 'md', color: 'text-indigo-400' }, // New
    { id: '8', metricKey: 'aws', label: 'WIND SPEED', size: 'sm', color: 'text-blue-300' }, // Smaller
    { id: '9', metricKey: 'awa', label: 'WIND ANGLE', size: 'sm', color: 'text-blue-300' }, // Smaller

    { id: '10', metricKey: 'roll', label: 'ROLL', size: 'sm', color: 'text-amber-400' },
    { id: '11', metricKey: 'pitch', label: 'PITCH', size: 'sm', color: 'text-orange-400' },

    { id: '12', metricKey: 'port_rpm', label: 'PORT RPM', size: 'lg', color: 'text-red-400' },
    { id: '13', metricKey: 'stbd_rpm', label: 'STBD RPM', size: 'lg', color: 'text-red-400' },
    { id: '14', metricKey: 'tank_fuel_total', label: 'TOTAL FUEL', size: 'lg', color: 'text-amber-400' },
    { id: '15', metricKey: 'batt_soc', label: 'BATTERY SOC', size: 'md', color: 'text-emerald-400' },
    { id: '16', metricKey: 'solar', label: 'SOLAR POWER', size: 'md', color: 'text-yellow-300' },
    { id: '17', metricKey: 'trip_range', label: 'RANGE', size: 'lg', color: 'text-lime-400' },
    { id: '18', metricKey: 'autopilot_mode', label: 'AP MODE', size: 'sm', color: 'text-purple-400' },
    { id: '19', metricKey: 'hybrid_mode', label: 'DRIVE MODE', size: 'sm', color: 'text-indigo-400' },
    { id: '20', metricKey: 'shore_power', label: 'SHORE', size: 'sm', color: 'text-emerald-400' },
    { id: '21', metricKey: 'ac_loads', label: 'AC LOADS', size: 'sm', color: 'text-orange-400' },
    { id: '22', metricKey: 'dc_loads', label: 'DC LOADS', size: 'sm', color: 'text-rose-400' },
    { id: '23', metricKey: 'port_hours', label: 'P.HOURS', size: 'sm', color: 'text-slate-400' },
    { id: '24', metricKey: 'stbd_hours', label: 'S.HOURS', size: 'sm', color: 'text-slate-400' },
    { id: '25', metricKey: 'trip_fuel_rate', label: 'INST FUEL', size: 'md', color: 'text-lime-500' },
    { id: '26', metricKey: 'tank_water_1', label: 'FWD WATER', size: 'sm', color: 'text-cyan-200' },
    { id: '27', metricKey: 'tank_black_total', label: 'BLACK TOTAL', size: 'sm', color: 'text-amber-700' },
];

export function getMetricDefinition(key: string): MetricDefinition | undefined {
    return METRIC_REGISTRY.find(m => m.key === key);
}
