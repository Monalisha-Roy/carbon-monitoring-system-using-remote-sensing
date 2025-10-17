import ee from '@google/earthengine';

let isInitialized = false;

/**
 * Initialize Google Earth Engine with service account credentials
 */
export async function initializeEarthEngine(): Promise<void> {
  if (isInitialized) {
    return;
  }

  return new Promise((resolve, reject) => {
    const privateKey = process.env.GEE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const serviceAccount = process.env.GEE_SERVICE_ACCOUNT_EMAIL;
    const projectId = process.env.GEE_PROJECT_ID;

    if (!privateKey || !serviceAccount || !projectId) {
      reject(new Error('GEE credentials not configured. Please set environment variables.'));
      return;
    }

    ee.data.authenticateViaPrivateKey(
      {
        client_email: serviceAccount,
        private_key: privateKey,
      },
      () => {
        // Initialize with cloud project - use the newer API format
        const baseUrl = 'https://earthengine.googleapis.com/api';
        ee.initialize(
          baseUrl,
          null,
          () => {
            isInitialized = true;
            console.log('Google Earth Engine initialized successfully');
            resolve();
          },
          (error: Error) => {
            console.error('Failed to initialize Earth Engine:', error);
            reject(error);
          }
        );
      },
      (error: Error) => {
        console.error('Failed to authenticate with Earth Engine:', error);
        reject(error);
      }
    );
  });
}

/**
 * Ensure Earth Engine is initialized before use
 */
export async function ensureInitialized(): Promise<void> {
  if (!isInitialized) {
    await initializeEarthEngine();
  }
}

/**
 * Get Sentinel-2 imagery for a given polygon and date range
 */
export async function getSentinel2Data(
  geometry: any,
  startDate: string,
  endDate: string,
  cloudCoverMax: number = 20
) {
  await ensureInitialized();

  const polygon = ee.Geometry.Polygon(geometry.coordinates);

  // Load Sentinel-2 Surface Reflectance data
  const sentinel2 = new ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(polygon)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', cloudCoverMax));

  return sentinel2;
}

/**
 * Calculate NDVI (Normalized Difference Vegetation Index)
 */
export function calculateNDVI(image: any) {
  const ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
  return image.addBands(ndvi);
}

/**
 * Calculate EVI (Enhanced Vegetation Index)
 */
export function calculateEVI(image: any) {
  const evi = image.expression(
    '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))',
    {
      NIR: image.select('B8'),
      RED: image.select('B4'),
      BLUE: image.select('B2'),
    }
  ).rename('EVI');
  return image.addBands(evi);
}

/**
 * Cloud masking for Sentinel-2
 */
export function maskS2Clouds(image: any) {
  const qa = image.select('QA60');
  const cloudBitMask = 1 << 10;
  const cirrusBitMask = 1 << 11;
  const mask = qa.bitwiseAnd(cloudBitMask).eq(0)
    .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask).divide(10000);
}

/**
 * Get land cover classification using ESA WorldCover or Dynamic World
 */
export async function getLandCover(geometry: any, year: number = 2021) {
  await ensureInitialized();

  const polygon = ee.Geometry.Polygon(geometry.coordinates);

  // Use ESA WorldCover for land cover classification
  const landcover = new ee.ImageCollection('ESA/WorldCover/v200')
    .filterBounds(polygon)
    .first();

  return landcover;
}

/**
 * Get Dynamic World land cover (near real-time)
 */
export async function getDynamicWorldLandCover(
  geometry: any,
  startDate: string,
  endDate: string
) {
  await ensureInitialized();

  const polygon = ee.Geometry.Polygon(geometry.coordinates);

  const dynamicWorld = new ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1')
    .filterBounds(polygon)
    .filterDate(startDate, endDate);

  return dynamicWorld;
}

/**
 * Calculate area statistics for different land cover classes
 */
export async function calculateAreaStatistics(
  landcoverImage: any,
  geometry: any
): Promise<any> {
  await ensureInitialized();

  const polygon = ee.Geometry.Polygon(geometry.coordinates);

  // Calculate area for each class
  const areaImage = ee.Image.pixelArea().addBands(landcoverImage);

  const areas = areaImage.reduceRegion({
    reducer: ee.Reducer.sum().group({
      groupField: 1,
      groupName: 'class',
    }),
    geometry: polygon,
    scale: 10,
    maxPixels: 1e13,
  });

  return new Promise((resolve, reject) => {
    areas.evaluate((result: any, error: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * Get image as URL for visualization
 */
export async function getImageUrl(
  image: any,
  geometry: any,
  visParams: any
): Promise<string> {
  await ensureInitialized();

  const polygon = ee.Geometry.Polygon(geometry.coordinates);

  return new Promise((resolve, reject) => {
    image.getMap(visParams, (mapId: any, error: any) => {
      if (error) {
        console.error('Error getting map ID:', error);
        reject(error);
      } else if (!mapId || !mapId.urlFormat) {
        console.error('Invalid mapId response:', mapId);
        reject(new Error('Failed to get valid map URL from Earth Engine'));
      } else {
        // urlFormat already contains the full URL, just use it directly
        const url = mapId.urlFormat;
        console.log('Generated tile URL:', url);
        resolve(url);
      }
    });
  });
}

/**
 * Export processed data as GeoTIFF
 */
export async function exportToGeoTiff(
  image: any,
  geometry: any,
  description: string
): Promise<any> {
  await ensureInitialized();

  const polygon = ee.Geometry.Polygon(geometry.coordinates);

  const exportTask = ee.batch.Export.image.toDrive({
    image: image,
    description: description,
    scale: 10,
    region: polygon,
    fileFormat: 'GeoTIFF',
    maxPixels: 1e13,
  });

  return exportTask;
}
