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

interface YearData {
  year: number;
  totalAreaHa: number;
  carbonPools: CarbonPool;
  totalCarbonDensity: number;
  totalCarbonStock: number;
  co2Equivalent: number;
}

interface CarbonChange {
  agbChange: number;
  bgbChange: number;
  socChange: number;
  densityChange: number;
  totalChange: number;
  percentChange: number;
  annualChange: number;
  co2EquivalentChange: number;
  status: string;
}

interface CarbonMonitoringData {
  startYear: YearData;
  endYear: YearData;
  carbonChange: CarbonChange;
  period: {
    startYear: number;
    endYear: number;
    durationYears: number;
  };
  area: {
    hectares: number;
    squareMeters: number;
  };
  metadata: any;
}

export default function Home() {
  const [polygon, setPolygon] = useState<Feature<Polygon> | null>(null);
  const [loading, setLoading] = useState(false);
  const [carbonData, setCarbonData] = useState<CarbonMonitoringData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Year range for analysis
  const [startYear, setStartYear] = useState(2020);
  const [endYear, setEndYear] = useState(2024);
  
  // Generate available years (2016 to current year)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: currentYear - 2015 }, (_, i) => 2016 + i);

  const analyzePolygon = useCallback(async (geo: Feature<Polygon>) => {
    if (!geo) return;

    setLoading(true);
    setError(null);
    setCarbonData(null);

    try {
      console.log(`Analyzing carbon stock from ${startYear} to ${endYear}`);

      const response = await fetch('/api/carbon-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geometry: geo.geometry,
          startYear,
          endYear,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to analyze carbon stock');
      }

      const result = await response.json();
      setCarbonData(result.data);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  }, [startYear, endYear]);

  const handlePolygonCreated = useCallback((geojson: Feature<Polygon>) => {
    setPolygon(geojson);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-800 to-blue-800 shadow-lg border-b-4 border-green-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            Carbon Stock Monitoring System
          </h1>
          <p className="text-sm text-green-100 mt-2 font-medium">
            Estimate carbon stocks and calculate carbon credits using satellite data and ML models
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="bg-slate-800 rounded-2xl shadow-xl p-6 mb-6 border-2 border-green-500/30">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-semibold text-green-200 mb-2">
                Start Year
              </label>
              <select
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-green-400/30 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all bg-slate-700 text-white"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-semibold text-green-200 mb-2">
                End Year
              </label>
              <select
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-green-400/30 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all bg-slate-700 text-white"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <button
                onClick={() => polygon && analyzePolygon(polygon)}
                disabled={!polygon || loading}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                {loading ? 'Analyzing...' : 'Analyze Carbon Stock'}
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

        {/* Loading Indicator */}
        {loading && (
          <div className="bg-slate-800 rounded-2xl shadow-xl p-8 mb-6 border-2 border-blue-500/50">
            <div className="flex flex-col items-center justify-center">
              {/* Spinner */}
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-500/30 rounded-full animate-pulse"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-green-500 rounded-full animate-spin"></div>
                <div className="absolute top-2 left-2 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              
              {/* Status Text */}
              <h3 className="text-xl font-bold text-white mt-6 mb-2">Analyzing Carbon Stock</h3>
              <p className="text-green-200 text-center max-w-md">
                Processing satellite imagery and running ML models...
              </p>
              
              {/* Progress Steps */}
              <div className="mt-6 space-y-3 w-full max-w-sm">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-green-300">Fetching Sentinel-2 optical data</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                    <svg className="w-4 h-4 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <span className="text-blue-300">Processing SAR imagery (Sentinel-1)</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-slate-400 rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-slate-400">Running AGB & SOC predictions</span>
                </div>
              </div>
              
              {/* Estimated Time */}
              <p className="text-slate-400 text-sm mt-6">
                This may take 30-60 seconds depending on area size
              </p>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="bg-slate-800 rounded-2xl shadow-xl p-6 border-2 border-green-500/30 hover:border-green-500/50 transition-all mb-6">
          <h2 className="text-xl font-bold mb-4 text-green-100 flex items-center gap-2">
            Draw Area of Interest
          </h2>
          <div className="h-[400px] rounded-lg overflow-hidden">
            <MapComponent 
              onPolygonCreated={handlePolygonCreated}
              onPolygonUpdated={handlePolygonCreated}
            />
          </div>
          {polygon && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-200">
                Polygon defined with {polygon.geometry.coordinates[0].length} points
              </p>
            </div>
          )}
        </div>

        {/* Results */}
        {carbonData && (
          <div className="space-y-6">
            {/* Summary Header */}
            <div className="bg-gradient-to-r from-green-900/50 to-blue-900/50 rounded-2xl shadow-xl p-6 border-2 border-green-500/30">
              <h2 className="text-2xl font-bold text-white mb-4">Carbon Stock Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                  title="Area Analyzed"
                  value={`${carbonData.area.hectares.toFixed(2)} ha`}
                  icon="area"
                />
                <StatCard
                  title="Analysis Period"
                  value={`${carbonData.period.startYear} - ${carbonData.period.endYear}`}
                  icon="calendar"
                />
                <StatCard
                  title="Duration"
                  value={`${carbonData.period.durationYears} years`}
                  icon="time"
                />
                <StatCard
                  title="Carbon Change Status"
                  value={carbonData.carbonChange.status}
                  icon={carbonData.carbonChange.totalChange > 0 ? 'up' : carbonData.carbonChange.totalChange < 0 ? 'down' : 'neutral'}
                  color={carbonData.carbonChange.totalChange > 0 ? 'green' : carbonData.carbonChange.totalChange < 0 ? 'red' : 'yellow'}
                />
              </div>
            </div>

            {/* Year Comparison - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Start Year */}
              <YearCard
                title={`Year ${carbonData.startYear.year}`}
                data={carbonData.startYear}
                color="blue"
              />

              {/* End Year */}
              <YearCard
                title={`Year ${carbonData.endYear.year}`}
                data={carbonData.endYear}
                color="green"
              />
            </div>

            {/* Carbon Change / Difference */}
            <div className="bg-gradient-to-br from-purple-900/30 to-slate-800/50 rounded-2xl shadow-xl p-6 border-2 border-purple-500/30">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                Carbon Stock Difference ({carbonData.period.startYear} to {carbonData.period.endYear})
              </h3>
              
              {/* Per Hectare Changes */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-purple-200 mb-4">Change per Hectare (t/ha)</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <ChangeCard
                    label="AGB Change"
                    value={carbonData.carbonChange.agbChange}
                    unit="t/ha"
                  />
                  <ChangeCard
                    label="BGB Change"
                    value={carbonData.carbonChange.bgbChange}
                    unit="t/ha"
                  />
                  <ChangeCard
                    label="SOC Change"
                    value={carbonData.carbonChange.socChange}
                    unit="t/ha"
                  />
                  <ChangeCard
                    label="Total Density Change"
                    value={carbonData.carbonChange.densityChange}
                    unit="t/ha"
                    highlight
                  />
                </div>
              </div>

              {/* Total Area Changes */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20">
                <h4 className="text-lg font-semibold text-purple-200 mb-4">Total Carbon Stock Change (for entire area)</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                    <p className="text-sm text-purple-300 mb-1">Total Change</p>
                    <p className={`text-2xl font-bold ${carbonData.carbonChange.totalChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {carbonData.carbonChange.totalChange >= 0 ? '+' : ''}{carbonData.carbonChange.totalChange.toFixed(2)}
                      <span className="text-sm ml-1">tonnes C</span>
                    </p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                    <p className="text-sm text-purple-300 mb-1">Percentage Change</p>
                    <p className={`text-2xl font-bold ${carbonData.carbonChange.percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {carbonData.carbonChange.percentChange >= 0 ? '+' : ''}{carbonData.carbonChange.percentChange.toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                    <p className="text-sm text-purple-300 mb-1">Annual Change</p>
                    <p className={`text-2xl font-bold ${carbonData.carbonChange.annualChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {carbonData.carbonChange.annualChange >= 0 ? '+' : ''}{carbonData.carbonChange.annualChange.toFixed(2)}
                      <span className="text-sm ml-1">t/year</span>
                    </p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                    <p className="text-sm text-purple-300 mb-1">CO2 Equivalent Change</p>
                    <p className={`text-2xl font-bold ${carbonData.carbonChange.co2EquivalentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {carbonData.carbonChange.co2EquivalentChange >= 0 ? '+' : ''}{carbonData.carbonChange.co2EquivalentChange.toFixed(2)}
                      <span className="text-sm ml-1">t CO2</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Carbon Credit Potential */}
              <div className="mt-6 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-xl p-6 border border-yellow-500/30">
                <h4 className="text-lg font-semibold text-yellow-200 mb-3 flex items-center gap-2">
                  Carbon Credit Estimation
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-sm text-yellow-300 mb-1">CO2 Sequestered/Released</p>
                    <p className={`text-xl font-bold ${carbonData.carbonChange.co2EquivalentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {Math.abs(carbonData.carbonChange.co2EquivalentChange).toFixed(2)} tonnes CO2
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {carbonData.carbonChange.co2EquivalentChange >= 0 ? 'Sequestered (Carbon Sink)' : 'Released (Carbon Source)'}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-sm text-yellow-300 mb-1">Potential Carbon Credits</p>
                    <p className="text-xl font-bold text-yellow-400">
                      {carbonData.carbonChange.co2EquivalentChange > 0 
                        ? `~${Math.floor(carbonData.carbonChange.co2EquivalentChange)} credits`
                        : 'N/A (Carbon Loss)'
                      }
                    </p>
                    <p className="text-xs text-gray-400 mt-1">1 credit = 1 tonne CO2</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-sm text-yellow-300 mb-1">Estimated Value (USD)</p>
                    <p className="text-xl font-bold text-yellow-400">
                      {carbonData.carbonChange.co2EquivalentChange > 0 
                        ? `$${(carbonData.carbonChange.co2EquivalentChange * 25).toFixed(0)} - $${(carbonData.carbonChange.co2EquivalentChange * 50).toFixed(0)}`
                        : 'N/A'
                      }
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Based on $25-50/tonne market rate</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Methodology Info */}
            <div className="bg-slate-800 rounded-2xl shadow-xl p-6 border-2 border-blue-500/30">
              <h3 className="text-xl font-semibold text-white mb-4">Methodology</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold text-blue-200 mb-2">Formulas Used:</h4>
                  <ul className="space-y-2 text-blue-100">
                    <li>BGB = AGB x 0.2 (root-to-shoot ratio)</li>
                    <li>SOC = H x BD x OC x 0.01 (H=30cm, BD=bulk density)</li>
                    <li>Total Carbon = AGB + BGB + SOC</li>
                    <li>CO2 equivalent = Carbon x 3.67</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-200 mb-2">Data Sources:</h4>
                  <ul className="space-y-2 text-blue-100">
                    <li>AGB Model: XGBRegressor (19 features)</li>
                    <li>SOC Model: RandomForestRegressor (16 features)</li>
                    <li>Satellite: Sentinel-1, Sentinel-2, SRTM</li>
                    <li>Climate: CHIRPS, ERA5-Land</li>
                  </ul>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Analysis performed on: {new Date(carbonData.metadata.analysisDate).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t-4 border-green-500 mt-12 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-green-200 font-medium">
            Powered by Google Earth Engine and Local ML Models
          </p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  color = 'blue' 
}: { 
  title: string; 
  value: string; 
  icon: string;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}) {
  const colorClasses = {
    blue: 'border-blue-500/20',
    green: 'border-green-500/20',
    red: 'border-red-500/20',
    yellow: 'border-yellow-500/20',
  };

  const iconMap: Record<string, string> = {
    area: '📏',
    calendar: '📅',
    time: '⏱️',
    up: '📈',
    down: '📉',
    neutral: '➡️',
  };

  return (
    <div className={`bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg p-4 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{iconMap[icon] || '📊'}</span>
        <p className="text-sm text-blue-200">{title}</p>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function YearCard({ 
  title, 
  data, 
  color 
}: { 
  title: string; 
  data: YearData; 
  color: 'blue' | 'green';
}) {
  const borderColor = color === 'blue' ? 'border-blue-500/30' : 'border-green-500/30';
  const bgColor = color === 'blue' ? 'from-blue-900/30' : 'from-green-900/30';
  const accentColor = color === 'blue' ? 'text-blue-400' : 'text-green-400';

  return (
    <div className={`bg-gradient-to-br ${bgColor} to-slate-800/50 rounded-2xl shadow-xl p-6 border-2 ${borderColor}`}>
      <h3 className={`text-xl font-bold ${accentColor} mb-4`}>{title}</h3>
      
      {/* Carbon Pools */}
      <div className="space-y-3 mb-4">
        <h4 className="text-sm font-semibold text-gray-300">Carbon Pools (t/ha)</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">AGB</p>
            <p className="text-lg font-bold text-white">{data.carbonPools.agb.toFixed(2)}</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">BGB</p>
            <p className="text-lg font-bold text-white">{data.carbonPools.bgb.toFixed(2)}</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">SOC</p>
            <p className="text-lg font-bold text-white">{data.carbonPools.soc.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Total Carbon Density */}
      <div className={`bg-slate-700/30 rounded-lg p-4 mb-4 border ${borderColor}`}>
        <p className="text-sm text-gray-300 mb-1">Total Carbon Density</p>
        <p className={`text-2xl font-bold ${accentColor}`}>
          {data.totalCarbonDensity.toFixed(2)} <span className="text-sm">t/ha</span>
        </p>
      </div>

      {/* Total Carbon Stock */}
      <div className={`bg-gradient-to-r ${color === 'blue' ? 'from-blue-600/20' : 'from-green-600/20'} to-transparent rounded-lg p-4 border ${borderColor}`}>
        <p className="text-sm text-gray-300 mb-1">Total Carbon Stock</p>
        <p className="text-3xl font-bold text-white">
          {data.totalCarbonStock.toFixed(2)} <span className="text-lg text-gray-400">tonnes</span>
        </p>
        <p className="text-sm text-gray-400 mt-1">
          = {data.co2Equivalent.toFixed(2)} t CO2 equivalent
        </p>
      </div>
    </div>
  );
}

function ChangeCard({ 
  label, 
  value, 
  unit, 
  highlight = false 
}: { 
  label: string; 
  value: number; 
  unit: string;
  highlight?: boolean;
}) {
  const isPositive = value >= 0;
  const bgClass = highlight ? 'bg-purple-700/30' : 'bg-slate-700/50';
  const borderClass = highlight ? 'border-purple-500/30' : 'border-transparent';

  return (
    <div className={`${bgClass} rounded-lg p-4 text-center border ${borderClass}`}>
      <p className="text-sm text-gray-300 mb-1">{label}</p>
      <p className={`text-xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}{value.toFixed(2)}
        <span className="text-sm ml-1 text-gray-400">{unit}</span>
      </p>
    </div>
  );
}
