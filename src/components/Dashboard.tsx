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
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <p className="text-gray-500 text-lg">
          Draw a polygon on the map to start analyzing land cover and carbon credits
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('satellite')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'satellite'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Satellite Data
          </button>
          <button
            onClick={() => setActiveTab('classification')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'classification'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Land Classification
          </button>
          <button
            onClick={() => setActiveTab('carbon')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'carbon'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Carbon Credits
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
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Vegetation Indices</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Mean NDVI"
            value={data.statistics?.NDVI_mean?.toFixed(3) || 'N/A'}
            description="Normalized Difference Vegetation Index"
          />
          <StatCard
            title="Min NDVI"
            value={data.statistics?.NDVI_min?.toFixed(3) || 'N/A'}
            description="Minimum vegetation index"
          />
          <StatCard
            title="Max NDVI"
            value={data.statistics?.NDVI_max?.toFixed(3) || 'N/A'}
            description="Maximum vegetation index"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Satellite Images</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.images?.trueColor && (
            <ImageCard title="True Color" url={data.images.trueColor} polygon={polygon} />
          )}
          {data.images?.ndvi && (
            <ImageCard title="NDVI" url={data.images.ndvi} polygon={polygon} />
          )}
          {data.images?.evi && (
            <ImageCard title="EVI" url={data.images.evi} polygon={polygon} />
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Date Range:</strong> {data.dateRange?.startDate} to {data.dateRange?.endDate}
        </p>
      </div>
    </div>
  );
}

function ClassificationView({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Land Cover Analysis</h3>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600">
            <strong>Source:</strong> {data.classification?.source}
          </p>
          {data.classification?.year && (
            <p className="text-sm text-gray-600">
              <strong>Year:</strong> {data.classification.year}
            </p>
          )}
        </div>
      </div>

      {data.areaStatistics && data.areaStatistics.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LandCoverBarChart data={data.areaStatistics} />
            <LandCoverPieChart data={data.areaStatistics} />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Area Statistics</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Land Cover Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Area (Hectares)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Area (m²)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.areaStatistics.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.className}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.areaHectares.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Carbon Credit Estimation</h3>
        
        {/* Eligibility Status */}
        <div className={`rounded-lg p-4 mb-6 ${
          isEligible ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              isEligible ? 'bg-green-500' : 'bg-yellow-500'
            }`}>
              {isEligible ? (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-4">
              <h4 className={`text-lg font-semibold ${
                isEligible ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {data.credits?.eligibility}
              </h4>
              <p className={`text-sm ${
                isEligible ? 'text-green-600' : 'text-yellow-600'
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
            valueColor={data.carbonChange?.totalChange > 0 ? 'text-green-600' : 'text-red-600'}
          />
          <StatCard
            title="Annual Change"
            value={`${data.carbonChange?.annualChange?.toLocaleString() || 0} tons/year`}
            description="Average annual sequestration"
            valueColor={data.carbonChange?.annualChange > 0 ? 'text-green-600' : 'text-red-600'}
          />
          <StatCard
            title="Percent Change"
            value={`${data.carbonChange?.percentChange?.toFixed(1) || 0}%`}
            description="Relative to baseline"
            valueColor={data.carbonChange?.percentChange > 0 ? 'text-green-600' : 'text-red-600'}
          />
        </div>

        {/* Potential Credits */}
        {isEligible && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-semibold text-blue-900 mb-4">Potential Credit Value</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700 mb-1">Potential Credits</p>
                <p className="text-2xl font-bold text-blue-900">
                  {data.credits?.potentialCredits?.toLocaleString()} tons CO2e
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700 mb-1">Estimated Value (USD)</p>
                <p className="text-2xl font-bold text-blue-900">
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
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
          <h4 className="text-sm font-semibold text-amber-900 mb-2">Important Notes:</h4>
          <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
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
  valueColor = 'text-gray-900' 
}: { 
  title: string; 
  value: string; 
  description: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${valueColor} mb-1`}>{value}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}

function ImageCard({ title, url, polygon }: { title: string; url: string; polygon?: any }) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamically import Leaflet only on the client side
    let mounted = true;

    const initMap = async () => {
      if (typeof window === 'undefined') return;

      const L = (await import('leaflet')).default;

      if (!mounted || !containerRef.current) return;

      // Calculate center and bounds from polygon if available
      let center: [number, number] = [0, 0];
      let zoom = 2;

      if (polygon && polygon.geometry && polygon.geometry.coordinates) {
        const coords = polygon.geometry.coordinates[0];
        const lats = coords.map((c: number[]) => c[1]);
        const lngs = coords.map((c: number[]) => c[0]);
        const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
        const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
        center = [centerLat, centerLng];
        zoom = 12; // Zoom in closer when we have a polygon
      }

      // Initialize the map
      const map = L.map(containerRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: false,
      });

      mapRef.current = map;

      // Add the tile layer from Earth Engine
      L.tileLayer(url, {
        maxZoom: 18,
        attribution: 'Google Earth Engine',
      }).addTo(map);

      // Add polygon overlay if available
      if (polygon && polygon.geometry && polygon.geometry.coordinates) {
        const coords = polygon.geometry.coordinates[0].map((c: number[]) => [c[1], c[0]]);
        L.polygon(coords, {
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          weight: 2,
        }).addTo(map);
      }
    };

    initMap();

    // Cleanup
    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [url, polygon]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
      </div>
      <div 
        ref={containerRef}
        style={{ height: '300px', width: '100%' }}
        className="bg-gray-50"
      />
    </div>
  );
}
