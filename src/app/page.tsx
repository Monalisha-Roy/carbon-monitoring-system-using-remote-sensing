'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Feature, Polygon } from 'geojson';

// Import map component dynamically to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-slate-700 rounded-lg flex items-center justify-center">
      <p className="text-white">Loading map...</p>
    </div>
  ),
});

interface CarbonPool {
  agb: number;
  bgb: number;
  soc: number;
}

interface LandClassItem {
  class: number;
  className: string;
  areaHa: number;
  percentage: number;
}

interface DataPoint {
  date: string;
  coordinates: any;
  totalAreaHa: number;
  landClassification: LandClassItem[];
  carbonPools: CarbonPool;
  totalCarbonStock: number;
  dataQuality: {
    imageCount: number;
    temporalWindow: string;
    dataAvailable: boolean;
  };
}

interface CarbonMonitoringData {
  startDate: DataPoint;
  endDate: DataPoint;
  carbonStockChange: {
    totalChange: number;
    percentChange: number;
    annualChange: number;
    status: string;
    co2Equivalent: number;
  };
  timePeriod: {
    startDate: string;
    endDate: string;
    durationDays: number;
    durationYears: number;
  };
  metadata: any;
}

export default function Home() {
  const [polygon, setPolygon] = useState<Feature<Polygon> | null>(null);
  const [loading, setLoading] = useState(false);
  const [carbonMonitoringData, setCarbonMonitoringData] = useState<CarbonMonitoringData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Date range for analysis - for carbon monitoring
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState('2024-01-01');

  const analyzePolygon = useCallback(async (geo: Feature<Polygon>) => {
    if (!geo) return;

    setLoading(true);
    setError(null);
    setCarbonMonitoringData(null);

    try {
      console.log(`🌍 Fetching carbon monitoring data from ${startDate} to ${endDate}`);

      const response = await fetch('/api/carbon-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geometry: geo.geometry,
          startDate,
          endDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || errorData.details || 'Failed to fetch carbon monitoring data');
      }

      const result = await response.json();
      setCarbonMonitoringData(result.data);
    } catch (err: any) {
      console.error('Analysis error:', err);
      console.error('Error stack:', err.stack);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="animated-gradient shadow-lg border-b-4 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            Land Cover and Carbon Stock Monitoring System
          </h1>
          <p className="text-sm text-blue-100 mt-2 font-medium">
            Comprehensive satellite data collection for carbon stock assessment
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

        {/* Map */}
        <div className="bg-slate-800 rounded-2xl shadow-xl p-6 border-2 border-blue-500/30 hover:border-blue-500/50 transition-all mb-6">
          <h2 className="text-xl font-bold mb-4 text-blue-100 flex items-center gap-2">
            🗺️ Draw Polygon Area
          </h2>
          <div className="h-[600px] rounded-lg overflow-hidden">
            <MapComponent 
              onPolygonCreated={handlePolygonCreated}
              onPolygonUpdated={handlePolygonCreated}
            />
          </div>
          {polygon && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-200">
                ✅ Polygon defined with {polygon.geometry.coordinates[0].length} points
              </p>
            </div>
          )}
        </div>

        {/* Results */}
        {carbonMonitoringData && (
          <div className="space-y-6">
            {/* Time Period Summary */}
            <div className="bg-slate-800 rounded-2xl shadow-xl p-6 border-2 border-blue-500/30">
              <h2 className="text-2xl font-bold text-white mb-4">📊 Analysis Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                  title="Start Date"
                  value={carbonMonitoringData.timePeriod.startDate}
                  icon="📅"
                />
                <StatCard
                  title="End Date"
                  value={carbonMonitoringData.timePeriod.endDate}
                  icon="📅"
                />
                <StatCard
                  title="Duration"
                  value={`${carbonMonitoringData.timePeriod.durationYears} years`}
                  icon="⏱️"
                />
                <StatCard
                  title="Area"
                  value={`${carbonMonitoringData.startDate.totalAreaHa.toFixed(2)} ha`}
                  icon="📏"
                />
              </div>
            </div>

            {/* Carbon Stock Change Summary */}
            <div className="bg-gradient-to-br from-green-900/30 to-slate-800 rounded-2xl shadow-xl p-6 border-2 border-green-500/30">
              <h2 className="text-2xl font-bold text-white mb-4">🌱 Carbon Stock Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                  title="Start Carbon Stock"
                  value={`${carbonMonitoringData.startDate.totalCarbonStock.toFixed(2)} t`}
                  icon="📊"
                />
                <StatCard
                  title="End Carbon Stock"
                  value={`${carbonMonitoringData.endDate.totalCarbonStock.toFixed(2)} t`}
                  icon="📊"
                />
                <StatCard
                  title="Total Change"
                  value={`${carbonMonitoringData.carbonStockChange.totalChange > 0 ? '+' : ''}${carbonMonitoringData.carbonStockChange.totalChange.toFixed(2)} t`}
                  icon={carbonMonitoringData.carbonStockChange.totalChange > 0 ? "📈" : "📉"}
                />
                <StatCard
                  title="Percent Change"
                  value={`${carbonMonitoringData.carbonStockChange.percentChange > 0 ? '+' : ''}${carbonMonitoringData.carbonStockChange.percentChange.toFixed(2)}%`}
                  icon={carbonMonitoringData.carbonStockChange.percentChange > 0 ? "⬆️" : "⬇️"}
                />
                <StatCard
                  title="CO₂ Equivalent"
                  value={`${carbonMonitoringData.carbonStockChange.co2Equivalent > 0 ? '+' : ''}${carbonMonitoringData.carbonStockChange.co2Equivalent.toFixed(2)} t`}
                  icon="🌍"
                />
              </div>
              <div className="mt-4 p-4 bg-slate-700/30 rounded-lg">
                <p className="text-center text-lg font-bold text-white">
                  Status: <span className={`${carbonMonitoringData.carbonStockChange.totalChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {carbonMonitoringData.carbonStockChange.status}
                  </span>
                  {' '}({carbonMonitoringData.carbonStockChange.annualChange > 0 ? '+' : ''}{carbonMonitoringData.carbonStockChange.annualChange.toFixed(2)} t/year)
                </p>
              </div>
            </div>

            {/* Data Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Start Date Data */}
              <DataPointCard
                title="Start Date Data"
                dataPoint={carbonMonitoringData.startDate}
                color="blue"
              />

              {/* End Date Data */}
              <DataPointCard
                title="End Date Data"
                dataPoint={carbonMonitoringData.endDate}
                color="green"
              />
            </div>

            {/* Metadata */}
            <div className="bg-slate-800 rounded-2xl shadow-xl p-6 border-2 border-blue-500/30">
              <h3 className="text-xl font-semibold text-white mb-4">ℹ️ Metadata</h3>
              <div className="space-y-2 text-sm">
                <p className="text-blue-200">
                  <strong>Analysis Date:</strong>{' '}
                  {new Date(carbonMonitoringData.metadata.analysisDate).toLocaleString()}
                </p>
                <p className="text-blue-200">
                  <strong>Coordinate System:</strong> {carbonMonitoringData.metadata.coordinateSystem}
                </p>
                <p className="text-blue-200">
                  <strong>Units:</strong> Area in {carbonMonitoringData.metadata.areaUnit}, Carbon in{' '}
                  {carbonMonitoringData.metadata.carbonUnit}
                </p>
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-200 mb-2">📝 Notes:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-yellow-100">
                    {carbonMonitoringData.metadata.notes.map((note: string, i: number) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t-4 border-blue-500 mt-12 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-blue-200 font-medium">
            🛰️ Powered by Google Earth Engine & Dynamic World AI
          </p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg p-4 border border-blue-500/20">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{icon}</span>
        <p className="text-sm text-blue-200">{title}</p>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function DataPointCard({
  title,
  dataPoint,
  color,
}: {
  title: string;
  dataPoint: DataPoint;
  color: 'blue' | 'green';
}) {
  const borderColor = color === 'blue' ? 'border-blue-500/30' : 'border-green-500/30';
  const bgColor = color === 'blue' ? 'from-blue-900/20' : 'from-green-900/20';

  return (
    <div className={`bg-gradient-to-br ${bgColor} to-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 ${borderColor}`}>
      <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>

      {/* Data Quality */}
      <div className="mb-4 p-3 bg-slate-700/30 rounded-lg">
        <p className="text-sm font-semibold text-blue-200 mb-2">📡 Data Quality</p>
        <div className="space-y-1 text-xs text-blue-100">
          <p>Images used: {dataPoint.dataQuality.imageCount}</p>
          <p>Temporal window: {dataPoint.dataQuality.temporalWindow}</p>
          <p>Status: {dataPoint.dataQuality.dataAvailable ? '✅ Available' : '❌ Unavailable'}</p>
        </div>
      </div>

      {/* Land Classification */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-blue-200 mb-2">🗺️ Land Classification</p>
        <div className="space-y-2">
          {dataPoint.landClassification.map((item) => (
            <div
              key={item.class}
              className="flex justify-between items-center p-2 bg-slate-700/30 rounded"
            >
              <span className="text-sm text-white">{item.className}</span>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">
                  {item.areaHa.toFixed(2)} ha
                </p>
                <p className="text-xs text-blue-300">{item.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Carbon Pools */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-blue-200 mb-2">🌲 Carbon Pools (tonnes/ha)</p>
        <div className="space-y-2">
          <CarbonPoolItem label="Above Ground Biomass (AGB)" value={dataPoint.carbonPools.agb} />
          <CarbonPoolItem label="Below Ground Biomass (BGB)" value={dataPoint.carbonPools.bgb} />
          <CarbonPoolItem label="Soil Organic Carbon (SOC)" value={dataPoint.carbonPools.soc} />
        </div>
      </div>

      {/* Total Carbon Stock */}
      <div className="p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg">
        <p className="text-sm font-semibold text-green-200 mb-1">💎 Total Carbon Stock</p>
        <p className="text-2xl font-bold text-white">
          {dataPoint.totalCarbonStock.toFixed(2)} tonnes
        </p>
        <p className="text-xs text-green-300 mt-1">
          ({(dataPoint.totalCarbonStock / dataPoint.totalAreaHa).toFixed(2)} t/ha)
        </p>
      </div>
    </div>
  );
}

function CarbonPoolItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center p-2 bg-slate-700/30 rounded">
      <span className="text-sm text-white">{label}</span>
      <span className="text-sm font-semibold text-white">
        {value.toFixed(2)}
      </span>
    </div>
  );
}
