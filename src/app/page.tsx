'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Feature, Polygon } from 'geojson';
import Dashboard from '@/components/Dashboard';
import { exportToCSV, exportToPDF, exportGeoJSON } from '@/lib/export';

// Import map component dynamically to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

export default function Home() {
  const [polygon, setPolygon] = useState<Feature<Polygon> | null>(null);
  const [loading, setLoading] = useState(false);
  const [satelliteData, setSatelliteData] = useState<any>(null);
  const [classificationData, setClassificationData] = useState<any>(null);
  const [carbonData, setCarbonData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Date range for analysis
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2025-08-31');

  const analyzePolygon = useCallback(async (geo: Feature<Polygon>) => {
    if (!geo) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch satellite data
      const satResponse = await fetch('/api/satellite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geometry: geo.geometry,
          startDate,
          endDate,
          cloudCoverMax: 20,
        }),
      });

      if (!satResponse.ok) {
        throw new Error('Failed to fetch satellite data');
      }

      const satData = await satResponse.json();
      setSatelliteData(satData.data);
      console.log('Satellite data received:', satData.data);
      console.log('Image URLs:', satData.data?.images);

      // Fetch classification data (using AI-powered Dynamic World)
      console.log('🔍 Calling classification API with:', { startDate, endDate, useDynamicWorld: true });
      const classResponse = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geometry: geo.geometry,
          startDate,
          endDate,
          useDynamicWorld: true, // Enable AI classification
        }),
      });

      console.log('Classification API response status:', classResponse.status);
      
      if (!classResponse.ok) {
        const errorText = await classResponse.text();
        console.error('Classification API error:', errorText);
        throw new Error('Failed to fetch classification data');
      }

      const classData = await classResponse.json();
      console.log('Classification data received:', classData);
      setClassificationData(classData.data);

      // Fetch carbon estimation
      const carbonResponse = await fetch('/api/carbon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geometry: geo.geometry,
          historicalYear: 2015,
          currentYear: 2021,
        }),
      });

      if (!carbonResponse.ok) {
        throw new Error('Failed to fetch carbon data');
      }

      const carbonResult = await carbonResponse.json();
      setCarbonData(carbonResult.data);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const handlePolygonCreated = useCallback(async (geojson: Feature<Polygon>) => {
    setPolygon(geojson);
    setError(null);
    
    // Auto-analyze on polygon creation
    await analyzePolygon(geojson);
  }, [analyzePolygon]);

  const handleExportCSV = () => {
    if (!classificationData?.areaStatistics) return;
    exportToCSV(classificationData.areaStatistics, 'land-classification-data');
  };

  const handleExportPDF = () => {
    const totalArea = classificationData?.areaStatistics?.reduce(
      (sum: number, item: any) => sum + item.areaHectares,
      0
    );

    exportToPDF(
      {
        title: 'Land Classification & Carbon Credit Report',
        polygonArea: totalArea,
        satelliteData,
        classificationData,
        carbonData,
      },
      'land-classification-report'
    );
  };

  const handleExportGeoJSON = () => {
    if (!polygon) return;
    
    const properties = {
      analysisDate: new Date().toISOString(),
      dateRange: { startDate, endDate },
      totalArea: classificationData?.areaStatistics?.reduce(
        (sum: number, item: any) => sum + item.areaHectares,
        0
      ),
      carbonEligibility: carbonData?.credits?.eligibility,
    };

    exportGeoJSON(polygon.geometry, properties, 'analyzed-polygon');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="animated-gradient shadow-lg border-b-4 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            🌍 Land Classification & Carbon Credit Analyzer
          </h1>
          <p className="text-sm text-blue-100 mt-2 font-medium">
            Analyze land cover, vegetation indices, and estimate carbon credits using satellite data
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="bg-slate-800 rounded-2xl shadow-xl p-6 mb-6 border-2 border-blue-500/30">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-blue-200 mb-2">
                📅 Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-400/30 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-700 text-white"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-blue-200 mb-2">
                📅 End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-400/30 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-700 text-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => polygon && analyzePolygon(polygon)}
                disabled={!polygon || loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                {loading ? '🔄 Analyzing...' : '🚀 Analyze'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border-2 border-red-500/50 rounded-2xl p-5 mb-6 shadow-lg">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-200 font-semibold">{error}</p>
            </div>
          </div>
        )}

        {/* Map and Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Map - Takes 2 columns (66% width) */}
          <div className="lg:col-span-2 bg-slate-800 rounded-2xl shadow-xl p-6 border-2 border-blue-500/30 hover:border-blue-500/50 transition-all">
            <h2 className="text-xl font-bold mb-4 text-blue-100 flex items-center gap-2">
              🗺️ Interactive Map
            </h2>
            <MapComponent 
              onPolygonCreated={handlePolygonCreated}
              onPolygonUpdated={handlePolygonCreated}
            />
          </div>

          {/* Quick Stats - Takes 1 column (33% width) */}
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-2xl shadow-xl p-6 border-2 border-blue-500/30">
              <h2 className="text-xl font-bold mb-4 text-blue-100 flex items-center gap-2">
                📊 Quick Stats
              </h2>
              {polygon ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-slate-700 rounded-xl p-3 border border-blue-400/30">
                    <span className="text-blue-200 font-medium">Polygon Status</span>
                    <span className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-sm font-bold shadow-md">
                      ✓ Active
                    </span>
                  </div>
                  {classificationData?.areaStatistics && (
                    <div className="flex justify-between items-center bg-slate-700 rounded-xl p-3 border border-blue-400/30">
                      <span className="text-blue-200 font-medium">Total Area</span>
                      <span className="font-bold text-white text-lg">
                        {classificationData.areaStatistics
                          .reduce((sum: number, item: any) => sum + item.areaHectares, 0)
                          .toFixed(2)}{' '}
                        ha
                      </span>
                    </div>
                  )}
                  {carbonData?.credits && (
                    <div className="flex justify-between items-center bg-slate-700 rounded-xl p-3 border border-blue-400/30">
                      <span className="text-blue-200 font-medium">Credit Eligibility</span>
                      <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-md ${
                        carbonData.credits.eligibility === 'Potentially Eligible'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                          : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                      }`}>
                        {carbonData.credits.eligibility}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-blue-300 text-center py-8 font-medium">
                  🎯 Draw a polygon on the map to see statistics
                </p>
              )}
            </div>

            {/* Export Options */}
            {(satelliteData || classificationData || carbonData) && (
              <div className="bg-slate-800 rounded-2xl shadow-xl p-6 border-2 border-blue-500/30">
                <h2 className="text-xl font-bold mb-4 text-blue-100 flex items-center gap-2">
                  💾 Export Data
                </h2>
                <div className="space-y-3">
                  <button
                    onClick={handleExportCSV}
                    className="w-full px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl transition-all text-sm font-bold shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                  >
                    📊 Export as CSV
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl transition-all text-sm font-bold shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                  >
                    📄 Export as PDF Report
                  </button>
                  <button
                    onClick={handleExportGeoJSON}
                    className="w-full px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all text-sm font-bold shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                  >
                    🗺️ Export as GeoJSON
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard */}
        <Dashboard
          satelliteData={satelliteData}
          classificationData={classificationData}
          carbonData={carbonData}
          polygon={polygon}
        />
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t-4 border-blue-500 mt-12 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-blue-200 font-medium">
            🛰️ Powered by Google Earth Engine, Sentinel-2, and ESA WorldCover
          </p>
        </div>
      </footer>
    </div>
  );
}
