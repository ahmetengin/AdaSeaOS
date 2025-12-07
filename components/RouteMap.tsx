import React, { useEffect, useRef, useState } from 'react';
import { NMEAData, RoutePlan, HexCell } from '../types';

// Declare Leaflet & H3 globally
declare const L: any;
declare const h3: any;

interface RouteMapProps {
    data: NMEAData;
    routePlan?: RoutePlan;
}

// Mock Waypoint Coordinates for Path Visualization
const WAYPOINTS_MOCK: Record<string, [number, number]> = {
    'Marmara Adası': [40.5833, 27.5667],
    'Çanakkale': [40.1553, 26.4142],
    'Bodrum': [37.0344, 27.4305]
};

export const RouteMap: React.FC<RouteMapProps> = ({ data, routePlan }) => {
    const mapRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const boatMarkerRef = useRef<any>(null);
    const gridLayerRef = useRef<any>(null);
    const pathLayerRef = useRef<any>(null);
    
    const [hexGrid, setHexGrid] = useState<HexCell[]>([]);
    const [selectedCell, setSelectedCell] = useState<HexCell | null>(null);
    const [optimalPath, setOptimalPath] = useState<string[]>([]);

    // --- H3 GRID GENERATION LOGIC ---
    const updateHexGrid = (lat: number, lng: number) => {
        if (!h3) return;

        const resolution = 8;
        const currentCell = h3.latLngToCell(lat, lng, resolution);
        
        // 1. Generate Local Grid (Spatial Awareness)
        const kRing = h3.gridDisk(currentCell, 5); // Increased range

        const cells: HexCell[] = kRing.map((index: string) => {
            const center = h3.cellToLatLng(index);
            const boundary = h3.cellToBoundary(index);

            const isCenter = index === currentCell;
            
            // SIMULATED COST FUNCTION
            // "Denizlerin olduğu tüm alanı skorluyoruz"
            let depthFactor = 0.8 + (Math.random() * 0.2); // 0-1 (1 is deep/good)
            let windFactor = 0.7 + (Math.random() * 0.3); // 0-1 (1 is calm/good)
            
            // Create Fake "No Go" Zones
            // Using Math.sin to create consistent "Terrain" patterns based on coords
            const terrainNoise = Math.sin(center[0] * 150) * Math.cos(center[1] * 150);
            
            let status: HexCell['status'] = 'OPTIMAL';
            
            if (terrainNoise > 0.85) {
                status = 'DANGER'; // Shallow / Land
                depthFactor = 0.1;
            } else if (terrainNoise > 0.5) {
                status = 'CAUTION'; // High Waves
                windFactor = 0.4;
            }

            const totalScore = (depthFactor * 50) + (windFactor * 50);

            return {
                h3Index: index,
                center: center,
                boundary: boundary,
                score: {
                    total: Math.round(totalScore),
                    depthFactor: parseFloat(depthFactor.toFixed(2)),
                    windFactor: parseFloat(windFactor.toFixed(2)),
                    trafficFactor: parseFloat(Math.random().toFixed(2))
                },
                status: status
            };
        });

        setHexGrid(cells);

        // 2. Generate Optimal Path Projection (Algorithm Visualization)
        // Simulate a path to the next waypoint
        const nextWptName = routePlan?.waypoints?.[0] || 'Marmara Adası';
        const targetCoords = WAYPOINTS_MOCK[nextWptName] || [data.latitude - 0.1, data.longitude - 0.1];
        
        try {
            // In a real app, this would be A* search over the Hex Grid nodes
            // Here we visualize the H3 line as the "Computed Vector"
            const targetCell = h3.latLngToCell(targetCoords[0], targetCoords[1], resolution);
            
            // Limit path length for visualization to avoid browser hang on long distance
            // If distance is huge, just project a few steps ahead
            const dist = h3.gridDistance(currentCell, targetCell);
            
            let path = [];
            if (dist < 50) {
                 path = h3.gridPath(currentCell, targetCell);
            } else {
                 // Mock a short projection if target is far
                 const neighbor = h3.gridDisk(currentCell, 1)[1]; // simple neighbor
                 path = [currentCell, neighbor]; 
            }
            setOptimalPath(path);
        } catch (e) {
            // Fallback
            setOptimalPath([]);
        }
    };

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false,
            center: [data.latitude, data.longitude],
            zoom: 13,
            dragging: true,
            scrollWheelZoom: true,
            doubleClickZoom: false
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 20
        }).addTo(map);

        gridLayerRef.current = L.layerGroup().addTo(map);
        pathLayerRef.current = L.layerGroup().addTo(map);

        const boatIcon = L.divIcon({
            className: 'boat-marker-small',
            html: `<div style="width: 16px; height: 16px; background: #06b6d4; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 20px #06b6d4; z-index: 100;"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });

        const marker = L.marker([data.latitude, data.longitude], { icon: boatIcon, zIndexOffset: 1000 }).addTo(map);
        boatMarkerRef.current = marker;
        mapRef.current = map;

        updateHexGrid(data.latitude, data.longitude);

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Update Boat & Grid
    useEffect(() => {
        if (mapRef.current && boatMarkerRef.current) {
            const newLatLng = [data.latitude, data.longitude];
            boatMarkerRef.current.setLatLng(newLatLng);
            updateHexGrid(data.latitude, data.longitude);
        }
    }, [data.latitude, data.longitude]);

    // Render Hexagons
    useEffect(() => {
        if (!mapRef.current || !gridLayerRef.current) return;

        gridLayerRef.current.clearLayers();
        pathLayerRef.current.clearLayers();

        // 1. Render Local Awareness Grid
        hexGrid.forEach(cell => {
            let color = '#06b6d4';
            let fillOpacity = 0.05;
            let weight = 0.5;
            
            if (cell.status === 'CAUTION') {
                color = '#f59e0b';
                fillOpacity = 0.15;
            } else if (cell.status === 'DANGER') {
                color = '#ef4444';
                fillOpacity = 0.3;
                weight = 1;
            }

            // Highlight selected
            if (selectedCell?.h3Index === cell.h3Index) {
                color = '#ffffff';
                weight = 2;
                fillOpacity = 0.2;
            }

            const polygon = L.polygon(cell.boundary, {
                color: color,
                weight: weight,
                fillColor: color,
                fillOpacity: fillOpacity,
                interactive: true // Enable clicks
            });

            polygon.on('click', () => setSelectedCell(cell));
            gridLayerRef.current.addLayer(polygon);
        });

        // 2. Render Optimal Path Projection
        if (optimalPath.length > 0 && h3) {
            optimalPath.forEach((h3Index) => {
                // Don't draw over the local grid if it's already there (optional, but looks cleaner layered)
                const coords = h3.cellToBoundary(h3Index);
                const poly = L.polygon(coords, {
                    color: '#10b981', // Emerald for Path
                    weight: 2,
                    fillColor: '#10b981',
                    fillOpacity: 0.1,
                    dashArray: '5, 5',
                    interactive: false
                });
                pathLayerRef.current.addLayer(poly);
            });
        }

    }, [hexGrid, selectedCell, optimalPath]);

    const destination = routePlan?.destination || 'Bodrum Marina';
    const eta = routePlan?.estimatedTime || '18s 24dk';
    const weatherSum = routePlan?.weatherSummary || 'Poyraz 15-20kn';
    const nextWpt = routePlan?.waypoints?.[0] || 'Marmara Adası';

    return (
        <div className="glass-panel w-full h-full rounded-2xl relative overflow-hidden flex flex-col p-4">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2 z-10 relative">
                <h3 className="text-lg font-display font-semibold text-cyan-400">
                    AdaOS Spatial Map (H3)
                </h3>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-950/50 rounded border border-cyan-800/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                    <span className="text-[9px] font-bold text-cyan-400 tracking-wider">H3 INDEXING RES:8</span>
                </div>
            </div>
            
            <div className="flex-1 bg-slate-900/50 rounded-lg relative overflow-hidden border border-slate-700">
                 <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
                 
                 {/* Legend */}
                 <div className="absolute top-2 right-2 bg-slate-900/90 backdrop-blur p-2 rounded border border-slate-700 z-[400] text-[9px] text-slate-400 space-y-1 shadow-xl">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500/50 border border-emerald-500"></div> OPTIMAL PATH</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-cyan-500/50 border border-cyan-500"></div> SAFE ZONE</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500/50 border border-amber-500"></div> CAUTION (Wind)</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500/50 border border-red-500"></div> NO GO (Depth)</div>
                 </div>

                 {/* SELECTED CELL INSPECTOR */}
                 {selectedCell && (
                     <div className="absolute top-2 left-2 w-48 bg-slate-900/95 backdrop-blur-md rounded-lg border border-cyan-500/30 shadow-2xl z-[500] p-3 text-cyan-50 transition-all animate-in fade-in slide-in-from-left-4">
                         <div className="flex justify-between items-start mb-2 border-b border-slate-700 pb-1">
                             <div>
                                 <div className="text-[9px] text-slate-500 uppercase tracking-wider">SECTOR ID</div>
                                 <div className="text-[10px] font-mono text-cyan-400 truncate w-32">{selectedCell.h3Index}</div>
                             </div>
                             <button onClick={() => setSelectedCell(null)} className="text-slate-500 hover:text-white">
                                 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                             </button>
                         </div>
                         
                         <div className="space-y-2">
                             <div>
                                 <div className="flex justify-between text-[9px] mb-0.5">
                                     <span className="text-slate-400">TOTAL SCORE</span>
                                     <span className="font-bold">{selectedCell.score.total}/100</span>
                                 </div>
                                 <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                                     <div className={`h-full ${selectedCell.score.total > 70 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${selectedCell.score.total}%` }}></div>
                                 </div>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-2 mt-2">
                                 <div className="bg-slate-800 p-1.5 rounded border border-slate-700">
                                     <div className="text-[8px] text-slate-500">DEPTH FACTOR</div>
                                     <div className="text-xs font-mono">{selectedCell.score.depthFactor}</div>
                                 </div>
                                 <div className="bg-slate-800 p-1.5 rounded border border-slate-700">
                                     <div className="text-[8px] text-slate-500">WIND FACTOR</div>
                                     <div className="text-xs font-mono">{selectedCell.score.windFactor}</div>
                                 </div>
                             </div>

                             <div className="text-[9px] text-center mt-1 py-1 bg-slate-800/50 rounded text-slate-400 border border-slate-700">
                                 STATUS: <span className={`font-bold ${selectedCell.status === 'OPTIMAL' ? 'text-green-400' : selectedCell.status === 'DANGER' ? 'text-red-400' : 'text-amber-400'}`}>{selectedCell.status}</span>
                             </div>
                         </div>
                     </div>
                 )}

                 {/* Bottom Info Bar */}
                 <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur px-3 py-2 rounded border border-slate-700 z-[400]">
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="text-[10px] text-slate-500">ACTIVE ALGORITHM</div>
                            <div className="font-mono text-cyan-300 text-xs flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                COST-BASED A* SEARCH
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-[9px] text-slate-500">NEXT WAYPOINT</div>
                             <div className="font-mono text-white text-xs">{nextWpt}</div>
                        </div>
                    </div>
                 </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm z-10 relative">
                <div className="bg-slate-800/50 p-2.5 rounded border border-slate-700">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Varış</div>
                    <div className="font-semibold text-white truncate">{destination}</div>
                </div>
                <div className="bg-slate-800/50 p-2.5 rounded border border-slate-700">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">ETA</div>
                    <div className="font-semibold text-amber-400">{eta}</div>
                </div>
                <div className="col-span-2 bg-slate-800/50 p-2.5 rounded border border-slate-700 flex justify-between items-center">
                    <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Maliyet Fonksiyonu (Cost Fn)</div>
                        <div className="font-semibold text-cyan-200 text-xs">{weatherSum}</div>
                    </div>
                    <svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
            </div>
        </div>
    );
};