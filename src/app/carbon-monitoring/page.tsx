'use client';

import { useState, useCallback } from 'react';
import { Feature, Polygon } from 'geojson';
import dynamic from 'next/dynamic';

// Dynamically import MapComponent to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-slate-700 rounded-lg flex items-center justify-center">
      <p className="text-white">Loading map...</p>
    </div>
  ),
});

interface CarbonPool {
  agb: number | null;
  bgb: number | null;
  deadWood: number | null;
  litter: number | null;
  soc: number | null;
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
  dataQuality: {
    imageCount: number;
    temporalWindow: string;
    dataAvailable: boolean;
  };
}

interface CarbonMonitoringData {
  startDate: DataPoint;
  endDate: DataPoint;
  timePeriod: {
    startDate: string;
    endDate: string;
    durationDays: number;
    durationYears: number;
  };
  metadata: any;
}

export default function CarbonMonitoringPage() {
  const [polygon, setPolygon] = useState<Feature<Polygon> | null>(null);
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState('2024-01-01');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CarbonMonitoringData | null>(null);

  const handlePolygonCreated = useCallback((geojson: Feature<Polygon>) => {
    setPolygon(geojson);
    setError(null);
    setData(null);
  }, []);

  const handleAnalyze = async () => {
    if (!polygon) {
      setError('Please draw a polygon on the map first');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch('/api/carbon-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geometry: polygon.geometry,
          startDate,
          endDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch carbon monitoring data');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🌱 Carbon Monitoring System
          </h1>
          <p className="text-blue-200">
            Comprehensive satellite data collection for carbon stock assessment
          </p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
              <h2 className="text-xl font-semibold text-white mb-4">
                📍 Draw Polygon Area
              </h2>
              <div className="rounded-lg overflow-hidden border-2 border-blue-500/50">
                <MapComponent
                  onPolygonCreated={handlePolygonCreated}
                />
              </div>
            </div>
          </div>

          {/* Date Controls */}
          <div className="space-y-4">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
              <h2 className="text-xl font-semibold text-white mb-4">
                📅 Time Period
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-blue-500/50 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-blue-500/50 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={loading || !polygon}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg disabled:cursor-not-allowed"
                >
                  {loading ? '⏳ Analyzing...' : '🔍 Analyze Carbon Data'}
                </button>
              </div>

              {polygon && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-200">
                    ✅ Polygon defined with {polygon.geometry.coordinates[0].length} points
                  </p>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-200">❌ {error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        {data && (
          <div className="space-y-6">
            {/* Time Period Summary */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
              <h2 className="text-2xl font-bold text-white mb-4">📊 Analysis Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                  title="Start Date"
                  value={data.timePeriod.startDate}
                  icon="📅"
                />
                <StatCard
                  title="End Date"
                  value={data.timePeriod.endDate}
                  icon="📅"
                />
                <StatCard
                  title="Duration"
                  value={`${data.timePeriod.durationYears} years`}
                  icon="⏱️"
                />
                <StatCard
                  title="Area"
                  value={`${data.startDate.totalAreaHa.toFixed(2)} ha`}
                  icon="📏"
                />
              </div>
            </div>

            {/* Data Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Start Date Data */}
              <DataPointCard
                title="Start Date Data"
                dataPoint={data.startDate}
                color="blue"
              />

              {/* End Date Data */}
              <DataPointCard
                title="End Date Data"
                dataPoint={data.endDate}
                color="green"
              />
            </div>

            {/* Metadata */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
              <h3 className="text-xl font-semibold text-white mb-4">ℹ️ Metadata</h3>
              <div className="space-y-2 text-sm">
                <p className="text-blue-200">
                  <strong>Analysis Date:</strong>{' '}
                  {new Date(data.metadata.analysisDate).toLocaleString()}
                </p>
                <p className="text-blue-200">
                  <strong>Coordinate System:</strong> {data.metadata.coordinateSystem}
                </p>
                <p className="text-blue-200">
                  <strong>Units:</strong> Area in {data.metadata.areaUnit}, Carbon in{' '}
                  {data.metadata.carbonUnit}
                </p>
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-200 mb-2">📝 Notes:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-yellow-100">
                    {data.metadata.notes.map((note: string, i: number) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
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
    <div className={`bg-gradient-to-br ${bgColor} to-slate-800/50 backdrop-blur-sm rounded-xl p-6 border ${borderColor}`}>
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
      <div>
        <p className="text-sm font-semibold text-blue-200 mb-2">🌲 Carbon Pools (tonnes/ha)</p>
        <div className="space-y-2">
          <CarbonPoolItem label="Above Ground Biomass" value={dataPoint.carbonPools.agb} />
          <CarbonPoolItem label="Below Ground Biomass" value={dataPoint.carbonPools.bgb} />
          <CarbonPoolItem label="Dead Wood" value={dataPoint.carbonPools.deadWood} />
          <CarbonPoolItem label="Litter" value={dataPoint.carbonPools.litter} />
          <CarbonPoolItem label="Soil Organic Carbon" value={dataPoint.carbonPools.soc} />
        </div>
      </div>
    </div>
  );
}

function CarbonPoolItem({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex justify-between items-center p-2 bg-slate-700/30 rounded">
      <span className="text-sm text-white">{label}</span>
      <span className="text-sm font-semibold text-white">
        {value !== null ? value.toFixed(2) : '⚠️ Pending'}
      </span>
    </div>
  );
}
