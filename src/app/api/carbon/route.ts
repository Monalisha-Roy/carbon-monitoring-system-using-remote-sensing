import { NextRequest, NextResponse } from 'next/server';
import { getLandCover, calculateAreaStatistics } from '@/lib/earthEngine';

// Carbon coefficients (tons CO2e per hectare)
// Based on IPCC guidelines and average values
const CARBON_COEFFICIENTS: { [key: string]: number } = {
  'Tree cover': parseFloat(process.env.CARBON_COEFFICIENTS_FOREST || '150'),
  'Shrubland': parseFloat(process.env.CARBON_COEFFICIENTS_GRASSLAND || '50'),
  'Grassland': parseFloat(process.env.CARBON_COEFFICIENTS_GRASSLAND || '50'),
  'Cropland': parseFloat(process.env.CARBON_COEFFICIENTS_CROPLAND || '30'),
  'Built-up': parseFloat(process.env.CARBON_COEFFICIENTS_BARREN || '5'),
  'Bare / sparse vegetation': parseFloat(process.env.CARBON_COEFFICIENTS_BARREN || '5'),
  'Snow and ice': 0,
  'Permanent water bodies': 0,
  'Herbaceous wetland': 80,
  'Mangroves': 200,
  'Moss and lichen': 40,
};

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

interface LandCoverData {
  class: number;
  className: string;
  areaHectares: number;
  carbonStock: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { geometry, historicalYear = 2015, currentYear = 2021 } = body;

    if (!geometry) {
      return NextResponse.json(
        { error: 'Missing required parameter: geometry' },
        { status: 400 }
      );
    }

    // Get historical land cover
    const historicalLandCover = await getLandCover(geometry, historicalYear);
    const historicalStats = await calculateAreaStatistics(
      historicalLandCover.select('Map'),
      geometry
    );

    // Get current land cover
    const currentLandCover = await getLandCover(geometry, currentYear);
    const currentStats = await calculateAreaStatistics(
      currentLandCover.select('Map'),
      geometry
    );

    // Process statistics
    const historicalData = processLandCoverData(historicalStats);
    const currentData = processLandCoverData(currentStats);

    // Calculate carbon change
    const carbonAnalysis = calculateCarbonChange(historicalData, currentData, historicalYear, currentYear);

    // Calculate potential credits
    const credits = calculateCredits(carbonAnalysis);

    return NextResponse.json({
      success: true,
      data: {
        historical: {
          year: historicalYear,
          landCover: historicalData,
          totalCarbonStock: carbonAnalysis.historicalTotalCarbon,
        },
        current: {
          year: currentYear,
          landCover: currentData,
          totalCarbonStock: carbonAnalysis.currentTotalCarbon,
        },
        carbonChange: {
          totalChange: carbonAnalysis.carbonChange,
          annualChange: carbonAnalysis.annualChange,
          percentChange: carbonAnalysis.percentChange,
        },
        credits: credits,
        methodology: {
          coefficients: CARBON_COEFFICIENTS,
          notes: 'Carbon estimates based on IPCC guidelines and global average values. Actual values may vary based on local conditions.',
        },
      },
    });
  } catch (error: any) {
    console.error('Error estimating carbon credits:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to estimate carbon credits' },
      { status: 500 }
    );
  }
}

function processLandCoverData(stats: any): LandCoverData[] {
  if (!stats.groups) {
    return [];
  }

  return stats.groups.map((group: any) => {
    const classValue = group.class;
    const className = LANDCOVER_CLASSES[classValue] || `Class ${classValue}`;
    const areaHectares = group.sum / 10000;
    const carbonCoefficient = CARBON_COEFFICIENTS[className] || 0;
    const carbonStock = areaHectares * carbonCoefficient;

    return {
      class: classValue,
      className,
      areaHectares: Math.round(areaHectares * 100) / 100,
      carbonStock: Math.round(carbonStock * 100) / 100,
    };
  });
}

function calculateCarbonChange(
  historical: LandCoverData[],
  current: LandCoverData[],
  historicalYear: number,
  currentYear: number
) {
  const historicalTotalCarbon = historical.reduce((sum, item) => sum + item.carbonStock, 0);
  const currentTotalCarbon = current.reduce((sum, item) => sum + item.carbonStock, 0);
  
  const carbonChange = currentTotalCarbon - historicalTotalCarbon;
  const yearsDifference = currentYear - historicalYear;
  const annualChange = carbonChange / yearsDifference;
  const percentChange = historicalTotalCarbon > 0 
    ? ((carbonChange / historicalTotalCarbon) * 100) 
    : 0;

  return {
    historicalTotalCarbon: Math.round(historicalTotalCarbon * 100) / 100,
    currentTotalCarbon: Math.round(currentTotalCarbon * 100) / 100,
    carbonChange: Math.round(carbonChange * 100) / 100,
    annualChange: Math.round(annualChange * 100) / 100,
    percentChange: Math.round(percentChange * 100) / 100,
  };
}

function calculateCredits(carbonAnalysis: any) {
  const { carbonChange, annualChange } = carbonAnalysis;

  // Carbon credits are typically measured in tons of CO2e
  // 1 carbon credit = 1 ton CO2e sequestered
  
  let eligibility = 'Not Eligible';
  let reason = '';

  if (carbonChange > 0) {
    eligibility = 'Potentially Eligible';
    reason = 'Positive carbon sequestration detected. Further verification required.';
  } else if (carbonChange < 0) {
    eligibility = 'Not Eligible';
    reason = 'Net carbon loss detected. No credits available.';
  } else {
    eligibility = 'Not Eligible';
    reason = 'No significant carbon change detected.';
  }

  // Calculate potential credit value (assuming $15-30 per ton CO2e)
  const minPricePerCredit = 15;
  const maxPricePerCredit = 30;
  const potentialCredits = carbonChange > 0 ? carbonChange : 0;

  return {
    eligibility,
    reason,
    potentialCredits: Math.round(potentialCredits * 100) / 100,
    estimatedValue: {
      min: Math.round(potentialCredits * minPricePerCredit * 100) / 100,
      max: Math.round(potentialCredits * maxPricePerCredit * 100) / 100,
      currency: 'USD',
    },
    annualSequestration: Math.round(Math.max(0, annualChange) * 100) / 100,
    notes: [
      'These are preliminary estimates only',
      'Actual credits require third-party verification',
      'Permanence and additionality criteria must be met',
      'Project must follow recognized standards (e.g., Verra, Gold Standard)',
    ],
  };
}
