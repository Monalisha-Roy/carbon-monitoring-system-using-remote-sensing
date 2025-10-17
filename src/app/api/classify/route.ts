import { NextRequest, NextResponse } from 'next/server';
import ee from '@google/earthengine';
import {
  getLandCover,
  getDynamicWorldLandCover,
  calculateAreaStatistics,
  getImageUrl,
} from '@/lib/earthEngine';

// ESA WorldCover class definitions
const LANDCOVER_CLASSES: { [key: number]: string } = {
  10: 'Tree cover',
  20: 'Shrubland',
  30: 'Grassland',
  40: 'Cropland',
  50: 'Built-up',
  60: 'Bare / sparse vegetation',
  70: 'Snow and ice',
  80: 'Permanent water bodies',
  90: 'Herbaceous wetland',
  95: 'Mangroves',
  100: 'Moss and lichen',
};

const LANDCOVER_COLORS: { [key: number]: string } = {
  10: '#006400',
  20: '#ffbb22',
  30: '#ffff4c',
  40: '#f096ff',
  50: '#fa0000',
  60: '#b4b4b4',
  70: '#f0f0f0',
  80: '#0064c8',
  90: '#0096a0',
  95: '#00cf75',
  100: '#fae6a0',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { geometry, year = 2021, useDynamicWorld = false, startDate, endDate } = body;

    if (!geometry) {
      return NextResponse.json(
        { error: 'Missing required parameter: geometry' },
        { status: 400 }
      );
    }

    let landcoverImage;
    let classificationData;

    if (useDynamicWorld && startDate && endDate) {
      // Use Dynamic World for near real-time classification
      const dynamicWorld = await getDynamicWorldLandCover(geometry, startDate, endDate);
      
      // Get the most likely land cover class
      landcoverImage = dynamicWorld.select('label').mode();
      
      classificationData = {
        source: 'Dynamic World',
        dateRange: { startDate, endDate },
        classes: {
          0: 'Water',
          1: 'Trees',
          2: 'Grass',
          3: 'Flooded vegetation',
          4: 'Crops',
          5: 'Shrub and scrub',
          6: 'Built',
          7: 'Bare',
          8: 'Snow and ice',
        },
      };
    } else {
      // Use ESA WorldCover
      landcoverImage = await getLandCover(geometry, year);
      landcoverImage = landcoverImage.select('Map');
      
      classificationData = {
        source: 'ESA WorldCover',
        year,
        classes: LANDCOVER_CLASSES,
      };
    }

    // Calculate area statistics
    const areaStats = await calculateAreaStatistics(landcoverImage, geometry);

    // Process area statistics
    const processedStats = processAreaStatistics(areaStats, classificationData.classes);

    // Get visualization URL
    const visParams = useDynamicWorld
      ? {
          min: 0,
          max: 8,
          palette: ['419bdf', '397d49', '88b053', '7a87c6', 'e49635', 'dfc35a', 'c4281b', 'a59b8f', 'b39fe1'],
        }
      : {
          min: 10,
          max: 100,
          palette: Object.values(LANDCOVER_COLORS),
        };

    const imageUrl = await getImageUrl(landcoverImage, geometry, visParams);

    return NextResponse.json({
      success: true,
      data: {
        classification: classificationData,
        areaStatistics: processedStats,
        imageUrl,
      },
    });
  } catch (error: any) {
    console.error('Error classifying land cover:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to classify land cover' },
      { status: 500 }
    );
  }
}

function processAreaStatistics(stats: any, classes: { [key: number]: string }) {
  if (!stats.groups) {
    return [];
  }

  return stats.groups.map((group: any) => {
    const classValue = group.class;
    const areaM2 = group.sum;
    const areaHectares = areaM2 / 10000;
    
    return {
      class: classValue,
      className: classes[classValue] || `Class ${classValue}`,
      areaHectares: Math.round(areaHectares * 100) / 100,
      areaSquareMeters: Math.round(areaM2),
    };
  }).sort((a: any, b: any) => b.areaHectares - a.areaHectares);
}
