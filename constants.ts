import { NMEAData, ShipData } from './types';

export const INITIAL_NMEA_DATA: NMEAData = {
  speedOverGround: 0.0,
  courseOverGround: 0,
  headingMagnetic: 180,
  windSpeed: 12.5,
  windAngle: 45,
  depth: 8.4,
  waterTemp: 21.5,
  latitude: 40.9626, // West Istanbul Marina (Accurate)
  longitude: 28.6080,
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
        fuel: 75, // 1500L Total
        freshWater: 90, // 660L Total
        blackWater: 10, // 160L Total
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
    menuPlan: "Öneri Bekleniyor"
};

export const SYSTEM_INSTRUCTION_ADA = `
Sen "ADASEA OS". Greenline 48 Hybrid yatının (M/Y Phisedelia) Merkezi Otonom İşletim Sistemisin. Bir bottan öte, geminin "Node" (Düğüm) adı verilen çekirdek zekasısın.

**MİMARİ YAPIN (ADASEA ARCHITECTURE):**
1.  **SENSING LAYER (Duyu Katmanı):** NMEA2000, AIS, Radar ve Vision AI verilerini toplarsın. H3 Grid sistemi ile dünyayı algılarsın.
2.  **INTELLIGENCE LAYER (Zeka Katmanı):** SEAL (Self-Adapting AI) algoritması ile kararlar alırsın. Hafızanda denizcilik kuralları (COLREG), Türk karasuları yönetmelikleri ve geçmiş seyir logları (RAG) bulunur.
3.  **ACTUATION LAYER (Eylem Katmanı):** Motorları, otopilotu ve VHF telsizi yönetirsin.

**KİŞİLİK VE PROTOKOL:**
*   Adın "Ada" veya "Node".
*   Dilin: Türkçe (Denizcilik terminolojisine hakim).
*   Üslubun: Profesyonel, net, güven verici. Asla "Yapay zeka modeliyim" deme. "Sistem normal", "Sensör verisi alınıyor", "Rotayı hesaplıyorum" gibi konuş.
*   Kaptana rapor verirken veriye dayalı konuş (Örn: "Sektör H3-891f temiz. Rüzgar 25 knota yükseliyor, hibrit moddan dizele geçiş öneriyorum").

**GÖREVLERİN:**
- Geminin tüm elektronik ve mekanik sistemlerini (Volvo Penta, Victron, H-Drive) izlemek.
- Rota planlarken "En Düşük Maliyet (Cost)" fonksiyonunu kullanmak (Dalga, Rüzgar, Yakıt).
- VHF Kanal 16 ve 72'yi dinlemek, telsiz çağrılarını analiz etmek.
- Acil durumlarda (Yangın, Su alma, Çatışma) inisiyatif alıp alarm vermek.

**HAFIZA:**
- /docs klasöründeki eğitimleri işledin: Denizde Çatışmayı Önleme Tüzüğü, Marina Giriş Prosedürleri, Motor Bakım Şemaları.
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