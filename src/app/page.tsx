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
  const [endDate, setEndDate] = useState('2023-12-31');

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

      // Fetch classification data
      const classResponse = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geometry: geo.geometry,
          year: 2021,
        }),
      });

      if (!classResponse.ok) {
        throw new Error('Failed to fetch classification data');
      }

      const classData = await classResponse.json();
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Land Classification & Carbon Credit Analyzer
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Analyze land cover, vegetation indices, and estimate carbon credits using satellite data
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => polygon && analyzePolygon(polygon)}
                disabled={!polygon || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Map and Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Map */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4">Interactive Map</h2>
            <MapComponent 
              onPolygonCreated={handlePolygonCreated}
              onPolygonUpdated={handlePolygonCreated}
            />
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
              {polygon ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Polygon Status</span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      Active
                    </span>
                  </div>
                  {classificationData?.areaStatistics && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Area</span>
                      <span className="font-semibold">
                        {classificationData.areaStatistics
                          .reduce((sum: number, item: any) => sum + item.areaHectares, 0)
                          .toFixed(2)}{' '}
                        ha
                      </span>
                    </div>
                  )}
                  {carbonData?.credits && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Credit Eligibility</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        carbonData.credits.eligibility === 'Potentially Eligible'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {carbonData.credits.eligibility}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Draw a polygon on the map to see statistics
                </p>
              )}
            </div>

            {/* Export Options */}
            {(satelliteData || classificationData || carbonData) && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Export Data</h2>
                <div className="space-y-2">
                  <button
                    onClick={handleExportCSV}
                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors text-sm font-medium"
                  >
                    📊 Export as CSV
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors text-sm font-medium"
                  >
                    📄 Export as PDF Report
                  </button>
                  <button
                    onClick={handleExportGeoJSON}
                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors text-sm font-medium"
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
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            Powered by Google Earth Engine, Sentinel-2, and ESA WorldCover
          </p>
        </div>
      </footer>
    </div>
  );
}
