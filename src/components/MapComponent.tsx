'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';
import type { GeoJSON, Polygon, Feature } from 'geojson';

// Fix Leaflet default marker icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapComponentProps {
  onPolygonCreated: (geojson: Feature<Polygon>) => void;
  onPolygonUpdated?: (geojson: Feature<Polygon>) => void;
}

export default function MapComponent({ onPolygonCreated, onPolygonUpdated }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  
  // Store callbacks in refs to avoid recreating the map on callback changes
  const onPolygonCreatedRef = useRef(onPolygonCreated);
  const onPolygonUpdatedRef = useRef(onPolygonUpdated);
  
  // Update refs when callbacks change
  useEffect(() => {
    onPolygonCreatedRef.current = onPolygonCreated;
    onPolygonUpdatedRef.current = onPolygonUpdated;
  }, [onPolygonCreated, onPolygonUpdated]);

  useEffect(() => {
    if (typeof window === 'undefined' || mapInitialized) return;

    // Initialize map
    const map = L.map('map', {
      center: [20.5937, 78.9629], // Center of India
      zoom: 5,
    });

    mapRef.current = map;

    // Define base layers
    const streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    });

    // Satellite imagery
    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19,
      }
    );

    // Labels overlay for satellite view
    const labels = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png',
      {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
        pane: 'shadowPane' // Ensure labels appear on top
      }
    );

    // Create layer groups
    const satelliteWithLabels = L.layerGroup([satellite, labels]);

    // Add default layer (street map)
    streetMap.addTo(map);

    // Layer control
    const baseMaps = {
      'Street Map': streetMap,
      'Satellite': satellite,
      'Satellite with Labels': satelliteWithLabels,
    };

    L.control.layers(baseMaps).addTo(map);

    // Add search control
    const provider = new OpenStreetMapProvider();
    const searchControl = new (GeoSearchControl as any)({
      provider: provider,
      style: 'bar',
      showMarker: true,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: false,
      searchLabel: 'Search for a location...',
    });
    map.addControl(searchControl);

    // Initialize feature group for drawn items
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // Initialize draw control
    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: '<strong>Error:</strong> Shape edges cannot cross!',
          },
          shapeOptions: {
            color: '#2563eb',
            fillOpacity: 0.3,
          },
        },
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: false,
        rectangle: {
          shapeOptions: {
            color: '#2563eb',
            fillOpacity: 0.3,
          },
        },
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });

    map.addControl(drawControl);

    // Event handlers
    map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      drawnItems.clearLayers(); // Only allow one polygon at a time
      drawnItems.addLayer(layer);

      const geojson = layer.toGeoJSON() as Feature<Polygon>;
      onPolygonCreatedRef.current(geojson);
    });

    map.on(L.Draw.Event.EDITED, (event: any) => {
      const layers = event.layers;
      layers.eachLayer((layer: any) => {
        const geojson = layer.toGeoJSON() as Feature<Polygon>;
        if (onPolygonUpdatedRef.current) {
          onPolygonUpdatedRef.current(geojson);
        }
      });
    });

    map.on(L.Draw.Event.DELETED, () => {
      // Polygon deleted
      drawnItems.clearLayers();
    });

    // Force map to resize properly
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    setMapInitialized(true);

    return () => {
      map.remove();
      setMapInitialized(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full" style={{ height: '700px' }}>
      <div 
        id="map" 
        className="w-full h-full rounded-lg shadow-lg" 
        style={{ height: '700px', zIndex: 0 }} 
      />
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md z-[1000]">
        <p className="text-sm text-gray-700 font-medium">
          Draw or select a polygon on the map to analyze land cover
        </p>
      </div>
    </div>
  );
}
