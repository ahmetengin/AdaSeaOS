import React, { useState, useEffect, useRef } from 'react';
import { NMEAData, HexCell } from '../types';

// Declare Leaflet & H3 globally
declare const L: any;
declare const h3: any;

interface SpyglassMapProps {
    data: NMEAData;
    onClose: () => void;
    onControl: (action: string, payload: any) => void;
}

export const SpyglassMap: React.FC<SpyglassMapProps> = ({ data, onClose, onControl }) => {
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'PROPULSION' | 'ENERGY' | 'SENSORS' | 'ATMOSPHERE' | 'DOMOTIC'>('PROPULSION');
    
    // Map Refs
    const mapRef = useRef<any>(null);
    const boatMarkerRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const gridLayerRef = useRef<any>(null);

    // H3 State
    const [hexGrid, setHexGrid] = useState<HexCell[]>([]);
    const [selectedCell, setSelectedCell] = useState<HexCell | null>(null);

    // --- H3 GRID GENERATION LOGIC (Moved from RouteMap) ---
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

        // Auto-close panels on small screens initially
        if (window.innerWidth < 768) {
            setLeftOpen(false);
            setRightOpen(false);
        }

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

            polygon.on('click', () => setSelectedCell(cell));
            gridLayerRef.current.addLayer(polygon);
        });
    }, [hexGrid, selectedCell]);

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
                    <span className="font-display font-bold tracking-widest text-lg text-white">SPYGLASS <span className="text-cyan-500">H3</span></span>
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

            {/* --- SELECTED CELL OVERLAY (Floating) --- */}
            {selectedCell && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur border border-cyan-500/50 p-4 rounded-xl shadow-2xl w-64 animate-in slide-in-from-top-5">
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

            {/* Footer */}
            <div className="absolute bottom-0 w-full h-8 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center px-4 text-[10px] text-slate-500 uppercase tracking-widest z-20 pointer-events-none">
                 <div>H3 HEXAGONAL GRID SYSTEM</div>
                 <div>INTELLIGENT ROUTING ACTIVE</div>
            </div>
        </div>
    );
};
