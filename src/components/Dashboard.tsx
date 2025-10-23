'use client';

import { useState, useEffect, useRef } from 'react';
import { LandCoverBarChart, LandCoverPieChart, CarbonChangeChart } from './Charts';

interface DashboardProps {
  satelliteData?: any;
  classificationData?: any;
  carbonData?: any;
  polygon?: any;
}

export default function Dashboard({ satelliteData, classificationData, carbonData, polygon }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'satellite' | 'classification' | 'carbon'>('satellite');

  if (!satelliteData && !classificationData && !carbonData) {
    return (
      <div className="bg-slate-800 rounded-2xl shadow-xl p-12 text-center border-2 border-blue-500/30">
        <div className="text-6xl mb-4">🗺️</div>
        <p className="text-blue-200 text-xl font-semibold">
          Draw a polygon on the map to start analyzing land cover and carbon credits
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-2xl shadow-2xl border-2 border-blue-500/30">
      {/* Tabs */}
      <div className="border-b-2 border-blue-500/30 bg-slate-700">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('satellite')}
            className={`px-6 py-4 text-sm font-bold border-b-4 transition-all ${
              activeTab === 'satellite'
                ? 'border-blue-500 text-blue-300 bg-slate-800'
                : 'border-transparent text-blue-400 hover:text-blue-300 hover:border-blue-400'
            }`}
          >
            🛰️ Satellite Data
          </button>
          <button
            onClick={() => setActiveTab('classification')}
            className={`px-6 py-4 text-sm font-bold border-b-4 transition-all ${
              activeTab === 'classification'
                ? 'border-blue-500 text-blue-300 bg-slate-800'
                : 'border-transparent text-blue-400 hover:text-blue-300 hover:border-blue-400'
            }`}
          >
            🌳 Land Classification
          </button>
          <button
            onClick={() => setActiveTab('carbon')}
            className={`px-6 py-4 text-sm font-bold border-b-4 transition-all ${
              activeTab === 'carbon'
                ? 'border-blue-500 text-blue-300 bg-slate-800'
                : 'border-transparent text-blue-400 hover:text-blue-300 hover:border-blue-400'
            }`}
          >
            💰 Carbon Credits
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'satellite' && satelliteData && (
          <SatelliteDataView data={satelliteData} polygon={polygon} />
        )}
        {activeTab === 'classification' && classificationData && (
          <ClassificationView data={classificationData} />
        )}
        {activeTab === 'carbon' && carbonData && (
          <CarbonView data={carbonData} />
        )}
      </div>
    </div>
  );
}

function SatelliteDataView({ data, polygon }: { data: any; polygon?: any }) {
  console.log('SatelliteDataView - data:', data);
  console.log('SatelliteDataView - polygon:', polygon);
  console.log('SatelliteDataView - images:', data.images);
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-4 text-blue-100 flex items-center gap-2">
          📊 Vegetation Indices
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Mean NDVI"
            value={data.statistics?.NDVI_mean?.toFixed(3) || 'N/A'}
            description="Normalized Difference Vegetation Index"
            gradient="from-green-500/20 to-emerald-500/20"
          />
          <StatCard
            title="Min NDVI"
            value={data.statistics?.NDVI_min?.toFixed(3) || 'N/A'}
            description="Minimum vegetation index"
            gradient="from-blue-500/20 to-cyan-500/20"
          />
          <StatCard
            title="Max NDVI"
            value={data.statistics?.NDVI_max?.toFixed(3) || 'N/A'}
            description="Maximum vegetation index"
            gradient="from-blue-600/20 to-indigo-600/20"
          />
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4 text-blue-100 flex items-center gap-2">
          🛰️ Satellite Images
        </h3>
        
        <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-200">
            <strong>ℹ️ Note:</strong> Satellite imagery tiles are loaded from Google Earth Engine. 
            You can zoom and pan within each map preview below.
          </p>
          <details className="mt-2">
            <summary className="text-xs text-blue-300 cursor-pointer hover:text-blue-200">Debug Info</summary>
            <div className="mt-2 p-2 bg-slate-900 rounded text-xs font-mono text-blue-100 overflow-x-auto">
              <div>True Color URL: {data.images?.trueColor?.substring(0, 100)}...</div>
              <div>NDVI URL: {data.images?.ndvi?.substring(0, 100)}...</div>
              <div>EVI URL: {data.images?.evi?.substring(0, 100)}...</div>
              <div>Has Polygon: {polygon ? 'Yes' : 'No'}</div>
            </div>
          </details>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.images?.trueColor && (
            <ImageButton title="True Color" url={data.images.trueColor} description="Natural color view" polygon={polygon} />
          )}
          {data.images?.ndvi && (
            <ImageButton title="NDVI" url={data.images.ndvi} description="Vegetation health map" polygon={polygon} />
          )}
          {data.images?.evi && (
            <ImageButton title="EVI" url={data.images.evi} description="Enhanced vegetation index" polygon={polygon} />
          )}
        </div>
      </div>

      <div className="bg-blue-900/30 border-2 border-blue-500/30 rounded-xl p-5 shadow-md">
        <p className="text-sm text-blue-200 font-semibold">
          <strong>📅 Date Range:</strong> {data.dateRange?.startDate} to {data.dateRange?.endDate}
        </p>
      </div>
    </div>
  );
}

function ClassificationView({ data }: { data: any }) {
  console.log('ClassificationView - Full data:', data);
  console.log('ClassificationView - areaStatistics:', data.areaStatistics);
  console.log('ClassificationView - classification:', data.classification);
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-4 text-blue-100 flex items-center gap-2">
          {data.aiPowered ? '🤖' : '🌍'} AI-Powered Land Cover Analysis
        </h3>
        
        {/* AI Model Information */}
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl p-5 mb-4 border-2 border-blue-500/50 backdrop-blur-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 bg-blue-500/30 rounded-lg">
              <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-100 font-bold mb-1">
                {data.classification?.source || 'AI Classifier'}
              </p>
              {data.classification?.model && (
                <p className="text-xs text-blue-300 mb-2">
                  <strong>Model:</strong> {data.classification.model}
                </p>
              )}
              {data.classification?.description && (
                <p className="text-xs text-blue-200 mb-2">
                  {data.classification.description}
                </p>
              )}
              {data.classification?.features && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {data.classification.features.map((feature: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-200 border border-blue-400/30">
                      ✓ {feature}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {data.classification?.year && (
            <p className="text-sm text-blue-200 font-semibold mt-3 pt-3 border-t border-blue-500/30">
              <strong>📅 Year:</strong> {data.classification.year}
            </p>
          )}
          {data.classification?.classificationDate && (
            <p className="text-sm text-blue-200 font-semibold mt-3 pt-3 border-t border-blue-500/30">
              <strong>📅 Classification Date:</strong> {data.classification.classificationDate}
              {data.classification.temporalWindow && (
                <span className="text-xs text-blue-300 ml-2">
                  (using {data.classification.temporalWindow} of recent data)
                </span>
              )}
            </p>
          )}
          {data.classification?.dateRange && !data.classification?.classificationDate && (
            <p className="text-sm text-blue-200 font-semibold mt-3 pt-3 border-t border-blue-500/30">
              <strong>📅 Date Range:</strong> {data.classification.dateRange.startDate} to {data.classification.dateRange.endDate}
            </p>
          )}
          {data.confidence && (
            <div className="mt-3 pt-3 border-t border-blue-500/30">
              <p className="text-xs text-blue-300">
                <strong>🎯 Confidence:</strong> {data.confidence.message}
              </p>
            </div>
          )}
        </div>
      </div>

      {data.areaStatistics && data.areaStatistics.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-700 p-4 rounded-xl border-2 border-blue-500/30">
              <LandCoverBarChart data={data.areaStatistics} />
            </div>
            <div className="bg-slate-700 p-4 rounded-xl border-2 border-blue-500/30">
              <LandCoverPieChart data={data.areaStatistics} />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 text-blue-100">📋 Area Statistics</h3>
            <div className="overflow-x-auto rounded-xl border-2 border-blue-500/30">
              <table className="min-w-full divide-y divide-blue-500/30">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-500">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Land Cover Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Area (Hectares)
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Area (m²)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-700 divide-y divide-blue-500/30">
                  {data.areaStatistics.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-slate-600 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-100">
                        {item.className}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200">
                        {item.areaHectares.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200">
                        {item.areaSquareMeters?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CarbonView({ data }: { data: any }) {
  const isEligible = data.credits?.eligibility === 'Potentially Eligible';

  return (
    <div className="space-y-6 ">
      <div>
        <h3 className="text-xl font-bold mb-4 text-blue-100 flex items-center gap-2">
          💰 Carbon Credit Estimation
        </h3>
        
        {/* Eligibility Status */}
        <div className={`rounded-xl p-6 mb-6 shadow-lg border-2 ${
          isEligible 
            ? 'bg-green-900/20 border-green-500/50' 
            : 'bg-orange-900/20 border-orange-500/50'
        }`}>
          <div className="flex items-center">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
              isEligible ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-orange-500 to-red-600'
            }`}>
              {isEligible ? (
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-4">
              <h4 className={`text-xl font-bold ${
                isEligible ? 'text-green-300' : 'text-orange-300'
              }`}>
                {data.credits?.eligibility}
              </h4>
              <p className={`text-sm font-medium ${
                isEligible ? 'text-green-400' : 'text-orange-400'
              }`}>
                {data.credits?.reason}
              </p>
            </div>
          </div>
        </div>

        {/* Carbon Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Total Carbon Change"
            value={`${data.carbonChange?.totalChange?.toLocaleString() || 0} tons`}
            description="CO2e over the period"
            valueColor={data.carbonChange?.totalChange > 0 ? 'text-green-400' : 'text-red-400'}
            gradient={data.carbonChange?.totalChange > 0 ? 'from-green-500/20 to-emerald-500/20' : 'from-red-500/20 to-pink-500/20'}
          />
          <StatCard
            title="Annual Change"
            value={`${data.carbonChange?.annualChange?.toLocaleString() || 0} tons/year`}
            description="Average annual sequestration"
            valueColor={data.carbonChange?.annualChange > 0 ? 'text-green-400' : 'text-red-400'}
            gradient={data.carbonChange?.annualChange > 0 ? 'from-blue-500/20 to-cyan-500/20' : 'from-orange-500/20 to-red-500/20'}
          />
          <StatCard
            title="Percent Change"
            value={`${data.carbonChange?.percentChange?.toFixed(1) || 0}%`}
            description="Relative to baseline"
            valueColor={data.carbonChange?.percentChange > 0 ? 'text-green-400' : 'text-red-400'}
            gradient={data.carbonChange?.percentChange > 0 ? 'from-emerald-500/20 to-green-500/20' : 'from-orange-500/20 to-red-500/20'}
          />
        </div>

        {/* Potential Credits */}
        {isEligible && (
          <div className="bg-blue-900/30 border-2 border-blue-500/50 rounded-xl p-6 mb-6 shadow-lg">
            <h4 className="text-xl font-bold text-blue-100 mb-4 flex items-center gap-2">
              💵 Potential Credit Value
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-700 rounded-lg p-4 border border-blue-400/30 shadow-md">
                <p className="text-sm text-blue-300 mb-2 font-semibold">Potential Credits</p>
                <p className="text-3xl font-bold text-white">
                  {data.credits?.potentialCredits?.toLocaleString()} tons CO2e
                </p>
              </div>
              <div className="bg-slate-700 rounded-lg p-4 border border-blue-400/30 shadow-md">
                <p className="text-sm text-blue-300 mb-2 font-semibold">Estimated Value (USD)</p>
                <p className="text-3xl font-bold text-white">
                  ${data.credits?.estimatedValue?.min?.toLocaleString()} - ${data.credits?.estimatedValue?.max?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Carbon Change Chart */}
        {data.historical && data.current && (
          <CarbonChangeChart historical={data.historical} current={data.current} />
        )}

        {/* Important Notes */}
        <div className="bg-orange-900/20 border-2 border-orange-500/50 rounded-xl p-5 mt-6 shadow-md">
          <h4 className="text-sm font-bold text-orange-300 mb-3 flex items-center gap-2">
            ⚠️ Important Notes:
          </h4>
          <ul className="list-disc list-inside text-sm text-orange-200 space-y-2 font-medium">
            {data.credits?.notes?.map((note: string, index: number) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  description, 
  valueColor = 'text-white',
  gradient = 'from-blue-500/20 to-cyan-500/20'
}: { 
  title: string; 
  value: string; 
  description: string;
  valueColor?: string;
  gradient?: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-5 shadow-lg border-2 border-blue-400/30 transform hover:scale-105 transition-all backdrop-blur-sm`}>
      <p className="text-sm text-blue-200 mb-2 font-semibold">{title}</p>
      <p className={`text-3xl font-bold ${valueColor} mb-2`}>{value}</p>
      <p className="text-xs text-blue-300 font-medium">{description}</p>
    </div>
  );
}

function ImageButton({ title, url, description, polygon }: { title: string; url: string; description: string; polygon?: any }) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!showMap) return;
    
    // Only run on client side
    if (typeof window === 'undefined' || !containerRef.current) {
      console.log('Window or container not ready');
      return;
    }

    console.log('ImageButton - Initializing map for:', title);
    console.log('Tile URL:', url);
    console.log('Polygon:', polygon);
    console.log('Container ref:', containerRef.current);

    setIsLoading(true);
    setError(null);

    // Import Leaflet only on client side
    import('leaflet').then((LeafletModule) => {
      try {
        console.log('Leaflet module loaded:', LeafletModule);
        const L = (LeafletModule as any).default || LeafletModule;
        console.log('L object:', L);
        
        // Clean up any existing map
        if (mapRef.current) {
          console.log('Removing existing map');
          mapRef.current.remove();
        }

        if (!containerRef.current) {
          console.log('Container disappeared');
          return;
        }

        // Calculate center from polygon if available
        let center: [number, number] = [0, 0];
        let zoom = 2;
        
        if (polygon && polygon.coordinates && polygon.coordinates[0]) {
          const coords = polygon.coordinates[0];
          const lats = coords.map((c: number[]) => c[1]);
          const lngs = coords.map((c: number[]) => c[0]);
          const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
          const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
          center = [centerLat, centerLng];
          zoom = 13; // Zoom in closer when we have a polygon
          console.log('Map center:', center, 'zoom:', zoom);
        }

        // Create a new map instance
        console.log('Creating map with center:', center, 'zoom:', zoom);
        const map = L.map(containerRef.current, {
          center: center,
          zoom: zoom,
          zoomControl: true,
          attributionControl: false,
          preferCanvas: true,
        });

        console.log('Map created successfully:', map);

        // Add a base layer first (OSM) to see if the map is working
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          opacity: 0.3, // Make it semi-transparent so we can see Earth Engine tiles on top
        }).addTo(map);

        // Add Earth Engine tile layer on top
        console.log('Adding tile layer with URL:', url);
        const tileLayer = L.tileLayer(url, {
          attribution: 'Google Earth Engine',
          maxZoom: 18,
          opacity: 1,
          errorTileUrl: '', // Don't show broken tile images
        }).addTo(map);

        console.log('Tile layer added:', tileLayer);

        // Listen for tile load events
        tileLayer.on('tileerror', (e: any) => {
          console.error('Tile load error:', e);
          console.error('Failed tile URL:', e.tile.src);
        });

        tileLayer.on('tileload', (e: any) => {
          console.log('Tile loaded successfully:', e);
          console.log('Tile URL:', e.tile.src);
          console.log('Tile natural size:', e.tile.naturalWidth, 'x', e.tile.naturalHeight);
          
          // Check if the tile is actually visible (not transparent/empty)
          if (e.tile.complete && e.tile.naturalWidth > 0) {
            console.log('✓ Tile has content');
          } else {
            console.warn('⚠ Tile may be empty or not loaded');
          }
        });

        // Add polygon overlay if available
        if (polygon && polygon.coordinates && polygon.coordinates[0]) {
          const coords = polygon.coordinates[0].map((c: number[]) => [c[1], c[0]]);
          L.polygon(coords, {
            color: '#3b82f6',
            weight: 2,
            fillOpacity: 0.1,
          }).addTo(map);
          console.log('Polygon overlay added');
        }

        mapRef.current = map;

        // Fit map to show something
        setTimeout(() => {
          map.invalidateSize();
          setIsLoading(false);
          console.log('Map ready and invalidated');
        }, 100);
      } catch (err) {
        console.error('Error creating map:', err);
        setError(`Failed to load map: ${err}`);
        setIsLoading(false);
      }
    }).catch((err) => {
      console.error('Error loading Leaflet:', err);
      setError(`Failed to load mapping library: ${err}`);
      setIsLoading(false);
    });

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [url, polygon, showMap]);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // Note: title is intentionally not in dependencies as it's static

  return (
    <div className="border-2 border-blue-500/30 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all bg-slate-700">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 border-b-2 border-blue-400">
        <h4 className="text-sm font-bold text-white">{title}</h4>
      </div>
      
      <div className="p-4">
        <p className="text-sm text-blue-200 mb-3">{description}</p>
        
        {!showMap ? (
          <div className="space-y-3">
            <div className="w-full h-64 rounded-lg bg-slate-900 border-2 border-blue-500/20 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 text-blue-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p className="text-blue-300 text-sm mb-3">Click to load map</p>
                <button
                  onClick={() => setShowMap(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all"
                >
                  Load Interactive Map
                </button>
              </div>
            </div>
            
            <div className="text-xs text-blue-300 bg-slate-800 rounded p-2">
              <div className="font-mono overflow-x-auto mb-2">
                URL: {url.substring(0, 80)}...
              </div>
              {polygon && polygon.coordinates && polygon.coordinates[0] && (
                <div className="mt-2 pt-2 border-t border-blue-500/20">
                  <div className="font-semibold mb-1">Test: View sample tile directly</div>
                  <a 
                    href={url.replace('{z}', '10').replace('{x}', '0').replace('{y}', '0')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline text-xs"
                  >
                    Open tile z=10, x=0, y=0 in new tab →
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="relative">
            <div 
              ref={containerRef} 
              className="w-full h-64 rounded-lg overflow-hidden border-2 border-blue-500/20 bg-slate-900"
            />
            
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-lg">
                <div className="text-blue-300 flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="text-sm">Loading map...</span>
                </div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-lg">
                <div className="text-red-400 text-sm">{error}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
