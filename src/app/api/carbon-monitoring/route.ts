import { NextRequest, NextResponse } from 'next/server';
import ee from '@google/earthengine';
import {
  getDynamicWorldLandCover,
  checkCollectionSize,
  calculateAreaStatistics,
  ensureInitialized,
} from '@/lib/earthEngine';

/**
 * Carbon Monitoring API
 * Fetches comprehensive satellite data for carbon stock calculation
 * including coordinates, area, land classification, AGB, BGB, dead wood, litter, and SOC
 */

// Dynamic World class definitions
const DYNAMIC_WORLD_CLASSES: { [key: number]: string } = {
  0: 'Water',
  1: 'Trees',
  2: 'Grass',
  3: 'Flooded vegetation',
  4: 'Crops',
  5: 'Shrub and scrub',
  6: 'Built',
  7: 'Bare',
  8: 'Snow and ice',
};

interface CarbonDataPoint {
  date: string;
  coordinates: any;
  totalAreaHa: number;
  landClassification: Array<{
    class: number;
    className: string;
    areaHa: number;
    percentage: number;
  }>;
  carbonPools: {
    agb: number; // Above Ground Biomass (tonnes/ha)
    bgb: number; // Below Ground Biomass (tonnes/ha)
    soc: number; // Soil Organic Carbon (tonnes/ha)
  };
  totalCarbonStock: number; // Total carbon stock in tonnes
  dataQuality: {
    imageCount: number;
    temporalWindow: string;
    dataAvailable: boolean;
  };
}

/**
 * Find the closest available data to a target date
 */
async function findClosestData(
  geometry: any,
  targetDate: string,
  maxMonthsSearch: number = 6
): Promise<{ collection: any; startDate: string; endDate: string; monthsUsed: number }> {
  const target = new Date(targetDate);
  
  // Try progressively larger windows centered on target date
  for (let monthsWindow = 1; monthsWindow <= maxMonthsSearch; monthsWindow++) {
    const startDate = new Date(target);
    startDate.setMonth(startDate.getMonth() - monthsWindow);
    const endDate = new Date(target);
    endDate.setMonth(endDate.getMonth() + monthsWindow);
    
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    const collection = await getDynamicWorldLandCover(geometry, startStr, endStr);
    const size = await checkCollectionSize(collection);
    
    if (size > 0) {
      return {
        collection,
        startDate: startStr,
        endDate: endStr,
        monthsUsed: monthsWindow * 2,
      };
    }
  }
  
  throw new Error(`No satellite data found within ${maxMonthsSearch * 2} months of ${targetDate}`);
}

/**
 * Get land classification for a date
 */
async function getLandClassification(
  geometry: any,
  targetDate: string
): Promise<{
  classification: any;
  areaStatistics: Array<{ class: number; className: string; areaHa: number; percentage: number }>;
  dataQuality: any;
}> {
  const { collection, startDate, endDate, monthsUsed } = await findClosestData(geometry, targetDate);
  
  // Get image count
  const imageCount = await checkCollectionSize(collection);
  
  // Get mode (most frequent classification)
  const classificationImage = collection.select('label').mode().rename('classification');
  
  // Calculate area statistics
  const areaStats = await calculateAreaStatistics(classificationImage, geometry);
  
  // Calculate total area from the sum of all class areas
  const totalArea = areaStats.groups.reduce((sum: number, group: any) => {
    return sum + (group.sum / 10000); // Convert m² to hectares
  }, 0);
  
  const processedStats = areaStats.groups.map((group: any) => {
    const classValue = group.class;
    const areaHa = group.sum / 10000; // Convert m² to hectares
    const percentage = totalArea > 0 ? (areaHa / totalArea) * 100 : 0;
    
    return {
      class: classValue,
      className: DYNAMIC_WORLD_CLASSES[classValue] || `Unknown (${classValue})`,
      areaHa: parseFloat(areaHa.toFixed(2)),
      percentage: parseFloat(percentage.toFixed(2)),
    };
  });
  
  return {
    classification: classificationImage,
    areaStatistics: processedStats,
    dataQuality: {
      imageCount,
      temporalWindow: `${monthsUsed} months`,
      dateRange: { startDate, endDate },
    },
  };
}

/**
 * Get biomass data from WCMC biomass carbon density dataset
 * Returns AGB and BGB in tonnes/ha
 * Note: WCMC dataset has 'carbon_tonnes_per_ha' band which includes total biomass
 * We'll estimate AGB as 80% and BGB as 20% of total biomass (typical forest ratio)
 */
async function getBiomassData(
  geometry: any,
  date: string
): Promise<{
  agb: number;
  bgb: number;
}> {
  try {
    await ensureInitialized();
    
    const polygon = ee.Geometry.Polygon(geometry.coordinates);
    
    // Load WCMC biomass carbon density dataset
    const biomassDataset = new ee.ImageCollection('WCMC/biomass_carbon_density/v1_0')
      .filterBounds(polygon)
      .first();
    
    // Select the total carbon band
    const carbonImage = biomassDataset.select('carbon_tonnes_per_ha');
    
    // Calculate mean value for the polygon
    const carbonStats = carbonImage.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: polygon,
      scale: 300, // 300m resolution
      maxPixels: 1e13,
    });
    
    // Evaluate the result
    const totalCarbon = await new Promise<number>((resolve, reject) => {
      carbonStats.get('carbon_tonnes_per_ha').evaluate((value: number, error: any) => {
        if (error) {
          console.error('Error evaluating biomass carbon:', error);
          reject(error);
        } else {
          resolve(value || 0);
        }
      });
    });
    
    // Split into AGB (80%) and BGB (20%) - typical forest biomass allocation
    // This is a simplified approach based on IPCC guidelines
    const agb = totalCarbon * 0.8;
    const bgb = totalCarbon * 0.2;
    
    return {
      agb: parseFloat(agb.toFixed(2)),
      bgb: parseFloat(bgb.toFixed(2)),
    };
  } catch (error: any) {
    console.error('❌ Error fetching biomass data:', error);
    throw new Error(`Failed to fetch biomass data: ${error.message}`);
  }
}

/**
 * Get Soil Organic Carbon (SOC) data from OpenLandMap
 * Converts to tC/ha using: SOC stock (t C/ha) = SOC (g/kg) × Bulk Density (g/cm³) × Depth (m) × 0.1
 */
async function getSOCData(geometry: any, date: string): Promise<number> {
  try {
    await ensureInitialized();
    
    const polygon = ee.Geometry.Polygon(geometry.coordinates);
    
    // Load OpenLandMap SOC dataset as an Image (not ImageCollection)
    // Using ee object directly since it's a single image asset
    const socImage = (ee as any).Image('OpenLandMap/SOL/SOL_ORGANIC-CARBON_USDA-6A1C_M/v02').select('b0'); // SOC in g/kg for 0cm depth
    
    // Estimate bulk density (typical value for mineral soils: 1.3 g/cm³)
    // This is a simplified approach - ideally use actual bulk density data
    const bulkDensity = 1.3; // g/cm³
    
    // Soil depth in meters (top 30cm is standard for carbon accounting)
    const depth = 0.3; // meters
    
    // Calculate mean SOC for the polygon
    const socStats = socImage.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: polygon,
      scale: 250, // 250m resolution
      maxPixels: 1e13,
    });
    
    // Evaluate the result
    const socGperKg = await new Promise<number>((resolve, reject) => {
      socStats.get('b0').evaluate((value: number, error: any) => {
        if (error) {
          console.error('Error evaluating SOC:', error);
          reject(error);
        } else {
          resolve(value || 0);
        }
      });
    });
    
    // Convert to tC/ha using the formula: SOC stock = SOC (g/kg) × Bulk Density (g/cm³) × Depth (m) × 0.1
    const socStock = socGperKg * bulkDensity * depth * 0.1;
    
    return parseFloat(socStock.toFixed(2));
  } catch (error: any) {
    console.error('❌ Error fetching SOC data:', error);
    throw new Error(`Failed to fetch SOC data: ${error.message}`);
  }
}

/**
 * Get comprehensive carbon monitoring data for a specific date
 */
async function getCarbonDataForDate(
  geometry: any,
  targetDate: string
): Promise<CarbonDataPoint> {
  try {
    console.log(`📊 Fetching carbon data for date: ${targetDate}`);
    
    // Get land classification
    const { areaStatistics, dataQuality } = await getLandClassification(geometry, targetDate);
    console.log(`✅ Land classification complete: ${areaStatistics.length} classes found`);
    
    // Calculate total area
    const totalAreaHa = areaStatistics.reduce((sum, item) => sum + item.areaHa, 0);
    console.log(`📐 Total area: ${totalAreaHa.toFixed(2)} ha`);
    
    // Get biomass data
    console.log(`🌳 Fetching biomass data...`);
    const biomassData = await getBiomassData(geometry, targetDate);
    console.log(`✅ Biomass data: AGB=${biomassData.agb} t/ha, BGB=${biomassData.bgb} t/ha`);
    
    // Get SOC data
    console.log(`🌱 Fetching SOC data...`);
    const soc = await getSOCData(geometry, targetDate);
    console.log(`✅ SOC data: ${soc} t/ha`);
    
    // Calculate total carbon stock per hectare (tC/ha)
    const carbonPerHa = biomassData.agb + biomassData.bgb + soc;
    
    // Calculate total carbon stock for the entire area (tonnes)
    const totalCarbonStock = carbonPerHa * totalAreaHa;
    console.log(`💚 Total carbon stock: ${totalCarbonStock.toFixed(2)} tonnes`);
    
    return {
      date: targetDate,
      coordinates: geometry.coordinates,
      totalAreaHa: parseFloat(totalAreaHa.toFixed(2)),
      landClassification: areaStatistics,
      carbonPools: {
        agb: biomassData.agb,
        bgb: biomassData.bgb,
        soc: soc,
      },
      totalCarbonStock: parseFloat(totalCarbonStock.toFixed(2)),
      dataQuality: {
        imageCount: dataQuality.imageCount,
        temporalWindow: dataQuality.temporalWindow,
        dataAvailable: true,
      },
    };
  } catch (error: any) {
    console.error(`❌ Error fetching carbon data for ${targetDate}:`, error);
    throw new Error(`Failed to fetch carbon data for ${targetDate}: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { geometry, startDate, endDate } = body;

    if (!geometry || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: geometry, startDate, endDate' },
        { status: 400 }
      );
    }

    console.log(`🌍 Fetching carbon monitoring data from ${startDate} to ${endDate}`);

    // Fetch data for both dates in parallel
    const [startData, endData] = await Promise.all([
      getCarbonDataForDate(geometry, startDate),
      getCarbonDataForDate(geometry, endDate),
    ]);

    // Calculate time period
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDifference = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const yearsDifference = daysDifference / 365.25;

    // Calculate carbon stock change
    const carbonStockChange = endData.totalCarbonStock - startData.totalCarbonStock;
    const carbonStockChangePercent = startData.totalCarbonStock > 0 
      ? (carbonStockChange / startData.totalCarbonStock) * 100 
      : 0;
    const annualCarbonChange = yearsDifference > 0 
      ? carbonStockChange / yearsDifference 
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        startDate: {
          ...startData,
        },
        endDate: {
          ...endData,
        },
        carbonStockChange: {
          totalChange: parseFloat(carbonStockChange.toFixed(2)),
          percentChange: parseFloat(carbonStockChangePercent.toFixed(2)),
          annualChange: parseFloat(annualCarbonChange.toFixed(2)),
          status: carbonStockChange > 0 ? 'Increase' : carbonStockChange < 0 ? 'Decrease' : 'No Change',
          co2Equivalent: parseFloat((carbonStockChange * 3.67).toFixed(2)), // Convert C to CO2
        },
        timePeriod: {
          startDate,
          endDate,
          durationDays: daysDifference,
          durationYears: parseFloat(yearsDifference.toFixed(2)),
        },
        metadata: {
          analysisDate: new Date().toISOString(),
          coordinateSystem: 'EPSG:4326',
          areaUnit: 'hectares',
          carbonUnit: 'tonnes',
          datasets: {
            biomass: 'WCMC/biomass_carbon_density/v1_0',
            soc: 'OpenLandMap/SOL/SOL_ORGANIC-CARBON_USDA-6A1C_M/v02',
            landCover: 'GOOGLE/DYNAMICWORLD/V1',
          },
          notes: [
            'Land classification from Google Dynamic World AI',
            'AGB and BGB from WCMC Biomass Carbon Density dataset',
            'SOC calculated using OpenLandMap with formula: SOC (g/kg) × Bulk Density (1.3 g/cm³) × Depth (0.3m) × 0.1',
            'Total Carbon Stock = (AGB + BGB + SOC) × Area',
            'CO₂ equivalent calculated using factor 3.67',
          ],
        },
      },
    });
  } catch (error: any) {
    console.error('❌ Error in carbon monitoring:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch carbon monitoring data',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
