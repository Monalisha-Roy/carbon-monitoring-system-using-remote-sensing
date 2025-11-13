import { NextRequest, NextResponse } from 'next/server';
import ee from '@google/earthengine';
import {
  getLandCover,
  getDynamicWorldLandCover,
  calculateAreaStatistics,
  getImageUrl,
  checkCollectionSize,
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
    const { geometry, year = 2021, useDynamicWorld = true, startDate, endDate } = body;

    if (!geometry) {
      return NextResponse.json(
        { error: 'Missing required parameter: geometry' },
        { status: 400 }
      );
    }

    let landcoverImage;
    let classificationData;
    let confidenceData = null;

    if (useDynamicWorld && startDate && endDate) {
      // Use Dynamic World AI-based classifier (Deep Learning)
      
      // Progressive fallback: Try to get data, extending time range if needed
      let monthsToTry = 1;
      let maxMonths = 12; // Maximum 1 year back
      let dynamicWorld;
      let recentStartStr;
      let actualMonthsUsed = 0;
      
      while (monthsToTry <= maxMonths) {
        const recentStartDate = new Date(endDate);
        recentStartDate.setMonth(recentStartDate.getMonth() - monthsToTry);
        recentStartStr = recentStartDate.toISOString().split('T')[0];
        
        try {
          dynamicWorld = await getDynamicWorldLandCover(geometry, recentStartStr, endDate);
          
          // Check if collection has any images
          const collectionSize = await checkCollectionSize(dynamicWorld);
          
          if (collectionSize === 0) {
            console.log(`No images found for ${monthsToTry} month(s), trying longer period...`);
            monthsToTry++;
            continue;
          }
          
          // Try to get the mode and calculate stats
          const testImage = dynamicWorld.select('label').mode().rename('classification');
          const testStats = await calculateAreaStatistics(testImage, geometry);
          
          if (testStats && testStats.groups && testStats.groups.length > 0) {
            actualMonthsUsed = monthsToTry;
            landcoverImage = testImage;
            break;
          } else {
            monthsToTry++;
          }
        } catch (error) {
          // Error during processing, try longer period
          console.log(`Error processing ${monthsToTry} month(s):`, error);
          monthsToTry++;
        }
      }
      
      if (!landcoverImage) {
        throw new Error('No Dynamic World data available for this region in the past year. Try a different location or date range.');
      }
      
      classificationData = {
        source: 'Dynamic World AI Classifier',
        model: 'Deep Learning CNN (Convolutional Neural Network)',
        description: 'AI-powered near real-time land classification using neural networks trained on millions of Sentinel-2 images',
        classificationDate: endDate,
        temporalWindow: `${actualMonthsUsed} month${actualMonthsUsed > 1 ? 's' : ''}`,
        dateRange: { startDate: recentStartStr, endDate },
        features: [
          'Current/Present land classification',
          `Recent ${actualMonthsUsed}-month temporal analysis`,
          'Pixel-level confidence scores',
          'Global coverage at 10m resolution'
        ],
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
      
      confidenceData = {
        message: 'Dynamic World uses AI to provide pixel-level confidence scores',
        method: 'Temporal ensemble of deep learning predictions',
      };
    } else {
      // Use ESA WorldCover (also AI-generated but static)
      console.log('📊 Using ESA WorldCover dataset');
      landcoverImage = await getLandCover(geometry, year);
      landcoverImage = landcoverImage.select('Map');
      
      classificationData = {
        source: 'ESA WorldCover',
        model: 'Random Forest + Deep Learning',
        description: 'Global land cover map generated using AI on Sentinel-1 & Sentinel-2',
        year,
        classes: LANDCOVER_CLASSES,
      };
    }

    // Calculate area statistics
    console.log('Calculating area statistics...');
    const areaStats = await calculateAreaStatistics(landcoverImage, geometry);
    console.log('Area stats received:', JSON.stringify(areaStats, null, 2));

    // Process area statistics
    const processedStats = processAreaStatistics(areaStats, classificationData.classes);
    console.log('Processed stats:', JSON.stringify(processedStats, null, 2));

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
        confidence: confidenceData,
        aiPowered: useDynamicWorld,
      },
    });
  } catch (error: any) {
    console.error('❌ Error classifying land cover:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to classify land cover',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
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
