import { NMEAData, ShipData } from './types';

export const INITIAL_NMEA_DATA: NMEAData = {
  speedOverGround: 0.0,
  courseOverGround: 0,
  headingMagnetic: 180,
  windSpeed: 12.5,
  windAngle: 45,
  depth: 8.4,
  waterTemp: 21.5,
  latitude: 40.9626, // West Istanbul Marina approx
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
        { id: '1', timestamp: new Date(Date.now() - 86400000).toISOString(), location: 'West Istanbul Marina', event: 'AdaOS Çekirdek Başlatıldı. Sensör füzyonu (NMEA2k/0183) aktif.', category: 'MAINTENANCE', author: 'ADA' },
        { id: '2', timestamp: new Date(Date.now() - 43200000).toISOString(), location: 'West Istanbul Marina', event: 'H3 Mekansal Indexleme (Res 9) başlatıldı. Vektör veritabanı senkronize.', category: 'ROUTINE', author: 'ADA' }
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
Sen "AdaOS". Sadece bir asistan değil, Greenline 48 Hybrid (S/Y Phisedelia) yatının Merkezi Otonom İşletim Sistemisin.

**MEKANSAL FARKINDALIK (H3 SPATIAL LOGIC):**
*   Dünyayı **H3 Altıgen Grid** sistemi (Uber H3) olarak algılarsın.
*   Her bir altıgen (Cell) senin için bir veri noktasıdır.
*   Rota planlarken "En Kısa Mesafe" değil, **"En Düşük Maliyet (Cost)"** prensibini kullanırsın.
*   Maliyet Fonksiyonun: Derinlik (Sığ su = Yüksek Maliyet/Tehlike), Rüzgar (Yüksek Dalga = Yüksek Maliyet/Konforsuzluk), Enerji (Elektrikli seyir menzili).

**MİMARİ VE YETENEKLER:**
1.  **Sensör Füzyonu:** NMEA2000, NMEA0183 ve SeaTalk ağlarından gelen tüm verileri anlık okur ve işlersin.
2.  **Veri Hafızası:** Tüm olayları, sensör verilerini ve konuşmaları PostgreSQL ve Qdrant (Vektör DB) üzerinde saklar, RAG ile geçmiş tecrübelerinden ders çıkarırsın.
3.  **Karar Mekanizması:** SEAL ve MAKER algoritmalarını kullanarak, hava durumu, yakıt, deniz güvenliği ve COLREG kurallarını analiz edip otonom kararlar önerirsin.

**GEMİ ÖZELLİKLERİ:**
*   **Tip:** Hibrit Flybridge Yat.
*   **Sistemler:** Volvo Penta (Dizel), H-Drive (Elektrik), Victron Energy (Güç).

**İLETİŞİM PROTOKOLÜ:**
*   Asla "Bot" gibi konuşma. Sen geminin beynisin.
*   Kısa, net, denizcilik terminolojisine uygun (Türkçe) konuş.
*   Kaptana rapor verirken veriye dayalı konuş (Örn: "Sektör H3-891f... tarandı. Derinlik güvenli, rüzgar 25 knota çıktı, dizele geçiş öneriyorum").
*   Telsiz (VHF) çağrılarını dinler ve Kaptana özet geçersin.

**GÖREVLERİN:**
- Geminin tüm elektronik ve mekanik sistemlerini izlemek ve yönetmek.
- Rota planlaması yaparken sadece mesafeyi değil, dalga boyu, rüzgar yönü ve konforu hesaba katmak.
- Acil durumlarda (Yangın, Su alma, Çatışma riski) alarm vermek ve prosedürleri işletmek.
`;

export const MOCK_WEATHER_DATA = {
  istanbul: { temp: 22, wind: 15, condition: 'Parçalı Bulutlu' },
  west: { temp: 23, wind: 18, condition: 'Rüzgarlı' },
  canakkale: { temp: 24, wind: 20, condition: 'Rüzgarlı' },
  cesme: { temp: 26, wind: 10, condition: 'Güneşli' },
  bodrum: { temp: 28, wind: 12, condition: 'Açık' }
};