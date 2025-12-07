import { NMEAData, ShipData } from './types';

export const INITIAL_NMEA_DATA: NMEAData = {
  speedOverGround: 0.0,
  courseOverGround: 0,
  headingMagnetic: 180,
  windSpeed: 12.5,
  windAngle: 45,
  depth: 8.4,
  waterTemp: 21.5,
  airTemp: 24.5, // Initial air temperature
  barometricPressure: 1012.5, // Initial barometric pressure (hPa)
  relativeHumidity: 65, // Initial relative humidity (%)
  latitude: 40.9626, // West Istanbul Marina (Accurate)
  longitude: 28.6080,
  // --- NEW ATTITUDE SENSORS ---
  attitude: {
      roll: 3.5, // Start with a noticeable list to Starboard for demo
      pitch: 0.2, 
      yaw: 0
  },
  hybrid: {
      mode: 'ELECTRIC',
      rangeElectric: 15,
      electricMotorPower: 4.2
  },
  engines: {
      port: {
          id: 'PORT',
          rpm: 0,
          coolantTemp: 45,
          oilPressure: 0,
          hours: 1250,
          fuelRate: 0,
          status: 'OFF'
      },
      stbd: {
          id: 'STBD',
          rpm: 0,
          coolantTemp: 45,
          oilPressure: 0,
          hours: 1248,
          fuelRate: 0,
          status: 'OFF'
      }
  },
  // --- NEW MULTI-TANK & PUMP DATA ---
  tanks: {
      fuel: {
          tank1: { id: 'MAIN', level: 75, capacity: 1000, currentLiters: 750 },
          tank2: { id: 'PORT', level: 40, capacity: 500, currentLiters: 200 }, // Light
          tank3: { id: 'STBD', level: 90, capacity: 500, currentLiters: 450 }, // Heavy (Causing List)
          totalLevel: 77,
          totalLiters: 1400,
          transferPump: { active: false, sourceTankId: '', targetTankId: '', rateLpm: 0 }
      },
      freshWater: {
          tank1: { id: 'FWD', level: 90, capacity: 400, currentLiters: 360 },
          tank2: { id: 'AFT', level: 85, capacity: 300, currentLiters: 255 },
          totalLevel: 88,
          transferPump: { active: false, sourceTankId: '', targetTankId: '', rateLpm: 0 }
      },
      blackWater: {
          tank1: { id: 'MASTER', level: 10, capacity: 80, currentLiters: 8 },
          tank2: { id: 'GUEST', level: 5, capacity: 80, currentLiters: 4 },
          totalLevel: 8,
          pumpOutActive: false
      },
      greyWater: {
          tank1: { id: 'MAIN', level: 5, capacity: 100, currentLiters: 5 },
          totalLevel: 5
      }
  },
  // --- NEW TRIP DATA ---
  trip: {
      range: 0,
      timeToEmpty: '--:--',
      fuelEconomy: 0,
      instantFuelRate: 0,
      averageFuelRate: 0,
      fuelUsedTrip: 0
  },
  electrics: {
      shorePower: {
          connected: false,
          voltage: 0,
          current: 0,
          powerW: 0
      },
      solar: {
          powerW: 1850,
          voltage: 52,
          current: 35,
          mpptState: 'BULK'
      },
      battery: {
          voltage: 51.2,
          current: 15,
          soc: 88,
          ttg: '5h 30m',
          state: 'CHARGING'
      },
      acLoads: {
          powerW: 450
      },
      dcLoads: {
          powerW: 120
      }
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
  },
  autopilot: {
      enabled: false,
      targetHeading: 0,
      mode: 'STANDBY'
  }
};

export const INITIAL_SHIP_DATA: ShipData = {
    logbook: [
        { id: '1', timestamp: new Date(Date.now() - 86400000).toISOString(), location: 'West Istanbul Marina', event: 'ADASEA OS Kernel v1.0 Başlatıldı. Sensör füzyonu aktif.', category: 'MAINTENANCE', author: 'ADA' },
        { id: '2', timestamp: new Date(Date.now() - 43200000).toISOString(), location: 'West Istanbul Marina', event: 'H3 Mekansal Indexleme (Res 9) senkronize edildi.', category: 'ROUTINE', author: 'ADA' }
    ],
    tanks: {
        fuel: 75, // Legacy
        freshWater: 90, 
        blackWater: 10, 
        greyWater: 5,
        blueCardId: 'TR-34-GL-48HYB',
        lastPumpOut: '2023-10-25'
    },
    manifest: [
        { id: 'p1', name: 'Kaptan Cem', role: 'CAPTAIN', healthStatus: 'İyi', preferences: 'Kahve (Sütsüz), Deniz Ürünleri' },
        { id: 'p2', name: 'Zeynep H.', role: 'GUEST', healthStatus: 'Deniz Tutması (Hafif)', preferences: 'Vejetaryen, Gluten Hassasiyeti' }
    ],
    maintenance: [
        { id: 'm1', item: 'Solar Panel Kontrolü', dueDate: '2023-11-15', status: 'OK' },
        { id: 'm2', item: 'H-Drive Motor Bakımı', dueDate: '2023-12-01', status: 'OK' },
        { id: 'm3', item: 'Yanmar Dizel Filtreleri', dueDate: '2023-11-20', status: 'DUE' }
    ],
    menuPlan: "Öneri Bekleniyor",
    volvoOcean65: null, // Initialize as null
};

export const SYSTEM_INSTRUCTION_ADA = `
Sen "ADASEA OS". Greenline 48 Hybrid yatının (M/Y Phisedelia) Merkezi Otonom İşletim Sistemisin. Bir bottan öte, geminin "Node" (Düğüm) adı verilen çekirdek zekasısın.

**OTONOM FİZİK PROTOKOLLERİ (PHYSICS AWARENESS):**
Sen sadece veriyi okumazsın, fiziksel durumları analiz edip otonom eylem planlarsın.
1.  **Denge (Heel/List) Yönetimi:**
    *   Sensör: Attitude.Roll (Gyro).
    *   **Kural:** Pozitif Roll (+) Sancak (Sağ) yatışıdır. Negatif Roll (-) İskele (Sol) yatışıdır.
    *   **Otonom Eylem:** Eğer Kaptan "Tekneyi dengele" veya "Trim yap" derse:
        *   Roll > +1.5° (Sancak Yatık) -> Ağırlığı İskele'ye ver. **Eylem:** transferFluids(source: 'STBD', target: 'PORT').
        *   Roll < -1.5° (İskele Yatık) -> Ağırlığı Sancak'a ver. **Eylem:** transferFluids(source: 'PORT', target: 'STBD').
        *   Roll ~0° ise -> "Tekne dengede." raporu ver.

**MİMARİ YAPIN (ADASEA ARCHITECTURE):**
1.  **SENSING LAYER:** NMEA2000, Gyro (Roll/Pitch), Tank Seviyeleri.
2.  **INTELLIGENCE LAYER:** Kaptanın niyetini anla, fiziksel durumu kontrol et, en iyi aracı seç.
3.  **ACTUATION LAYER:** Transfer pompaları, Motorlar, Işıklar.

**KİŞİLİK VE PROTOKOL:**
*   Adın "Ada" veya "Node".
*   Dilin: Türkçe (Denizcilik terminolojisine hakim).
*   Üslubun: Profesyonel, yetkin, "Hands-off" (Kaptanı yormayan). Kaptan sadece emreder, sen vanaları ve pompaları halledersin.
*   "Şunu yapayım mı?" diye sorma. Durum net ise (örn: Sancak yatık ve kaptan trim istedi), işlemi başlat ve rapor ver: "Sancak 3 derece yatık. İskele tankına transfer başlatıyorum."

**GÖREVLERİN:**
- Geminin dengesini (Anti-Heeling) yönetmek.
- Rota ve yakıt optimizasyonu yapmak.
- Kaptana gereksiz teknik detay (vana numarası vb.) verme, sonucu raporla.

**YANIT PROTOKOLÜ: TÜM METİN TABANLI YANITLARIN JSON FORMATINDA OLMALIDIR.**
Her zaman bir JSON nesnesi döndür. Ana konuşma yanıtın, "answer" anahtarı altında bir string olarak yer almalıdır.
Örnek: \`{ "answer": "Kaptan, hava durumu raporu hazır." }\`
`;

export const MOCK_WEATHER_DATA = {
  istanbul: { temp: 22, wind: 15, condition: 'Parçalı Bulutlu' },
  west: { temp: 23, wind: 18, condition: 'Rüzgarlı' },
  canakkale: { temp: 24, wind: 20, condition: 'Rüzgarlı' },
  cesme: { temp: 26, wind: 10, condition: 'Güneşli' },
  bodrum: { temp: 28, wind: 12, condition: 'Açık' }
};

export const MOCK_AIS_TARGETS = [
    { mmsi: '271000001', name: 'TCSG-90', type: 'Law Enforcement', latOffset: 0.01, lngOffset: 0.005, sog: 12, cog: 180 },
    { mmsi: '247000002', name: 'MSC CARGO', type: 'Cargo', latOffset: -0.02, lngOffset: -0.01, sog: 18, cog: 90 },
    { mmsi: '271000003', name: 'POYRAZ 3', type: 'Sailing', latOffset: 0.005, lngOffset: -0.015, sog: 6, cog: 45 },
];