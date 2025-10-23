import { NextRequest, NextResponse } from 'next/server';
import ee from '@google/earthengine';
import {
  getSentinel2Data,
  calculateNDVI,
  calculateEVI,
  maskS2Clouds,
  getImageUrl,
  calculateAreaStatistics,
} from '@/lib/earthEngine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { geometry, startDate, endDate, cloudCoverMax = 20 } = body;

    if (!geometry || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: geometry, startDate, endDate' },
        { status: 400 }
      );
    }

    // Get Sentinel-2 data
    const sentinel2 = await getSentinel2Data(geometry, startDate, endDate, cloudCoverMax);

    // Apply cloud masking and calculate indices
    const processed = sentinel2
      .map(maskS2Clouds)
      .map(calculateNDVI)
      .map(calculateEVI);

    // Create median composite
    const composite = processed.median();

    // Get visualization parameters for different bands
    const trueColorVis = {
      bands: ['B4', 'B3', 'B2'],
      min: 0,
      max: 0.3,
    };

    const ndviVis = {
      bands: ['NDVI'],
      min: -1,
      max: 1,
      palette: ['red', 'yellow', 'green'],
    };

    const eviVis = {
      bands: ['EVI'],
      min: -1,
      max: 1,
      palette: ['brown', 'yellow', 'green', 'darkgreen'],
    };

    // Get image URLs for visualization
    const [trueColorUrl, ndviUrl, eviUrl] = await Promise.all([
      getImageUrl(composite, geometry, trueColorVis),
      getImageUrl(composite, geometry, ndviVis),
      getImageUrl(composite, geometry, eviVis),
    ]);

    // Calculate NDVI statistics
    const ndviStats = await composite.select('NDVI').reduceRegion({
      reducer: ee.Reducer.mean().combine({
        reducer2: ee.Reducer.minMax(),
        sharedInputs: true,
      }),
      geometry: ee.Geometry.Polygon(geometry.coordinates),
      scale: 10,
      maxPixels: 1e13,
    });

    const stats = await new Promise((resolve, reject) => {
      ndviStats.evaluate((result: any, error: any) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    const responseData = {
      success: true,
      data: {
        images: {
          trueColor: trueColorUrl,
          ndvi: ndviUrl,
          evi: eviUrl,
        },
        statistics: stats,
        dateRange: { startDate, endDate },
      },
    };

    console.log('Sending response with images:', responseData.data.images);

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Error processing satellite data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process satellite data' },
      { status: 500 }
    );
  }
}
