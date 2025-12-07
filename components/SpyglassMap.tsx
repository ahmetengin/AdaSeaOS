import React, { useState, useEffect, useRef } from 'react';
import { NMEAData, HexCell, AISTarget } from '../types';
import { MOCK_AIS_TARGETS } from '../constants';

// Declare Leaflet & H3 globally
declare const L: any;
declare const h3: any;

interface SpyglassMapProps {
    data: NMEAData;
    onClose: () => void;
    onControl: (action: string, payload: any) => void;
}

export const SpyglassMap: React.FC<SpyglassMapProps> = ({ data, onClose, onControl }) => {
    // Map Refs
    const mapRef = useRef<any>(null);
    const boatMarkerRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const gridLayerRef = useRef<any>(null);
    const aisLayerRef = useRef<any>(null);

    // H3 & AIS State
    const [hexGrid, setHexGrid] = useState<HexCell[]>([]);
    const [aisTargets, setAisTargets] = useState<AISTarget[]>([]);
    const [selectedCell, setSelectedCell] = useState<HexCell | null>(null);
    const [selectedTarget, setSelectedTarget] = useState<AISTarget | null>(null);

    // --- AIS MOCK LOGIC ---
    useEffect(() => {
        // Initialize Targets
        const targets = MOCK_AIS_TARGETS.map(t => ({
            ...t,
            lat: data.latitude + t.latOffset,
            lng: data.longitude + t.lngOffset
        }));
        setAisTargets(targets);

        // Movement Loop
        const interval = setInterval(() => {
            setAisTargets(prev => prev.map(t => ({
                ...t,
                lat: t.lat + (Math.cos(t.cog * Math.PI / 180) * 0.00005),
                lng: t.lng + (Math.sin(t.cog * Math.PI / 180) * 0.00005)
            })));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // --- H3 GRID GENERATION LOGIC ---
    const updateHexGrid = (lat: number, lng: number) => {
        if (!h3) return;

        const resolution = 9; // High resolution for full screen
        const currentCell = h3.latLngToCell(lat, lng, resolution);
        
        // 1. Generate Local Grid (Spatial Awareness)
        const kRing = h3.gridDisk(currentCell, 6); // Wider range for Spyglass

        const cells: HexCell[] = kRing.map((index: string) => {
            const center = h3.cellToLatLng(index);
            const boundary = h3.cellToBoundary(index);
            
            // SIMULATED COST FUNCTION
            const terrainNoise = Math.sin(center[0] * 150) * Math.cos(center[1] * 150);
            
            let status: HexCell['status'] = 'OPTIMAL';
            let depthFactor = 0.8;
            let windFactor = 0.8;

            if (terrainNoise > 0.85) {
                status = 'DANGER'; 
                depthFactor = 0.1;
            } else if (terrainNoise > 0.5) {
                status = 'CAUTION';
                windFactor = 0.4;
            }

            const totalScore = (depthFactor * 50) + (windFactor * 50);

            return {
                h3Index: index,
                center: center,
                boundary: boundary,
                score: {
                    total: Math.round(totalScore),
                    depthFactor,
                    windFactor,
                    trafficFactor: 0.9
                },
                status: status
            };
        });

        setHexGrid(cells);
    };

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: true,
            center: [data.latitude, data.longitude],
            zoom: 14,
            zoomAnimation: true
        });

        // Dark Matter Basemap
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CARTO',
            maxZoom: 20
        }).addTo(map);

        // Nautical Chart Overlay
        L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenSeaMap',
            maxZoom: 18
        }).addTo(map);

        gridLayerRef.current = L.layerGroup().addTo(map);
        aisLayerRef.current = L.layerGroup().addTo(map);

        const boatIcon = L.divIcon({
            className: 'boat-marker',
            html: `<svg width="44" height="44" viewBox="0 0 44 44" style="transform-origin: center;">
                    <path d="M22 2 L32 36 L22 30 L12 36 Z" fill="#10b981" stroke="white" stroke-width="2" />
                   </svg>`,
            iconSize: [44, 44],
            iconAnchor: [22, 22]
        });

        const marker = L.marker([data.latitude, data.longitude], { icon: boatIcon }).addTo(map);
        boatMarkerRef.current = marker;
        mapRef.current = map;

        updateHexGrid(data.latitude, data.longitude);

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Update Map Position & Grid
    useEffect(() => {
        if (mapRef.current && boatMarkerRef.current) {
            const newLatLng = [data.latitude, data.longitude];
            boatMarkerRef.current.setLatLng(newLatLng);
            mapRef.current.panTo(newLatLng, { animate: true, duration: 1 });
            updateHexGrid(data.latitude, data.longitude);

            const iconEl = boatMarkerRef.current.getElement();
            if (iconEl) {
                const svg = iconEl.querySelector('svg');
                if (svg) svg.style.transform = `rotate(${data.headingMagnetic}deg)`;
            }
        }
    }, [data.latitude, data.longitude, data.headingMagnetic]);

    // Render Hexagons
    useEffect(() => {
        if (!gridLayerRef.current) return;
        gridLayerRef.current.clearLayers();

        hexGrid.forEach(cell => {
            let color = '#06b6d4';
            let fillOpacity = 0.05;
            let weight = 0.5;
            
            if (cell.status === 'CAUTION') { color = '#f59e0b'; fillOpacity = 0.15; } 
            else if (cell.status === 'DANGER') { color = '#ef4444'; fillOpacity = 0.3; weight = 1; }

            if (selectedCell?.h3Index === cell.h3Index) {
                color = '#ffffff'; weight = 2; fillOpacity = 0.2;
            }

            const polygon = L.polygon(cell.boundary, {
                color: color, weight: weight, fillColor: color, fillOpacity: fillOpacity, interactive: true
            });

            polygon.on('click', () => {
                setSelectedCell(cell);
                setSelectedTarget(null);
            });
            gridLayerRef.current.addLayer(polygon);
        });
    }, [hexGrid, selectedCell]);

    // Render AIS Targets
    useEffect(() => {
        if (!aisLayerRef.current) return;
        aisLayerRef.current.clearLayers();

        aisTargets.forEach(target => {
            const color = target.type === 'Law Enforcement' ? '#3b82f6' : '#f59e0b';
            
            const aisIcon = L.divIcon({
                className: 'ais-marker',
                html: `<div style="transform: rotate(${target.cog}deg);">
                        <svg width="24" height="24" viewBox="0 0 24 24">
                          <path d="M12 2L20 22L12 18L4 22L12 2Z" fill="${color}" stroke="white" stroke-width="1"/>
                        </svg>
                       </div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            const marker = L.marker([target.lat, target.lng], { icon: aisIcon }).addTo(aisLayerRef.current);
            marker.on('click', () => {
                setSelectedTarget(target);
                setSelectedCell(null);
            });
        });
    }, [aisTargets]);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 font-sans overflow-hidden flex flex-col">
            
            {/* Background Map Container */}
            <div className="absolute inset-0 z-0 bg-[#0f172a]">
                 <div ref={mapContainerRef} className="w-full h-full" />
            </div>

            {/* Top Bar */}
            <div className="relative z-20 h-16 flex justify-between items-center px-4 md:px-6 border-b border-slate-800/50 bg-slate-950/30 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="font-display font-bold tracking-widest text-lg text-white">SPYGLASS <span className="text-cyan-500">NODE</span></span>
                </div>
                
                {/* H3 Info Tag */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-cyan-950/50 border border-cyan-500/30 rounded">
                    <span className="text-xs text-cyan-400 font-mono font-bold">SPATIAL INDEX: RES 9</span>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-red-500/20 rounded-full group transition-colors bg-black/50 backdrop-blur">
                        <svg className="w-6 h-6 text-slate-400 group-hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            </div>

            {/* --- SELECTED CELL OVERLAY --- */}
            {selectedCell && (
                <div className="absolute top-20 left-4 z-50 bg-slate-900/90 backdrop-blur border border-cyan-500/50 p-4 rounded-xl shadow-2xl w-64 animate-in slide-in-from-left-5">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Sector Analysis</div>
                    <div className="text-lg font-mono text-cyan-400 font-bold mb-2 break-all">{selectedCell.h3Index}</div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="bg-slate-800 p-2 rounded">
                            <div className="text-[9px] text-slate-500">SCORE</div>
                            <div className="text-xl font-bold text-white">{selectedCell.score.total}</div>
                        </div>
                        <div className="bg-slate-800 p-2 rounded">
                            <div className="text-[9px] text-slate-500">STATUS</div>
                            <div className={`text-sm font-bold ${selectedCell.status === 'OPTIMAL' ? 'text-emerald-400' : 'text-red-400'}`}>{selectedCell.status}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SELECTED AIS TARGET OVERLAY --- */}
            {selectedTarget && (
                <div className="absolute top-20 right-4 z-50 bg-slate-900/90 backdrop-blur border border-amber-500/50 p-4 rounded-xl shadow-2xl w-64 animate-in slide-in-from-right-5">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-widest">AIS TARGET</div>
                            <div className="text-lg font-display font-bold text-white">{selectedTarget.name}</div>
                        </div>
                        <div className="text-[9px] font-mono text-amber-500 bg-amber-950/50 px-1 py-0.5 rounded">{selectedTarget.type}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-2">
                         <div className="bg-slate-800 p-2 rounded">
                            <div className="text-[9px] text-slate-500">MMSI</div>
                            <div className="text-sm font-mono text-white">{selectedTarget.mmsi}</div>
                        </div>
                        <div className="bg-slate-800 p-2 rounded">
                            <div className="text-[9px] text-slate-500">SOG / COG</div>
                            <div className="text-sm font-mono text-white">{selectedTarget.sog}kn / {selectedTarget.cog}°</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="absolute bottom-0 w-full h-8 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center px-4 text-[10px] text-slate-500 uppercase tracking-widest z-20 pointer-events-none">
                 <div>ADASEA OS > VISUAL INTELLIGENCE LAYER</div>
                 <div className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                     AIS RECEIVER ACTIVE
                 </div>
            </div>
        </div>
    );
};