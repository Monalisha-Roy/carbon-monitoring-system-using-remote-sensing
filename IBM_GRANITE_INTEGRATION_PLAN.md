# IBM Granite Geospatial Biomass Model Integration Plan

## Executive Summary

This document outlines the integration of IBM's Granite Geospatial Foundation Model for precise Above-Ground Biomass (AGB) estimation into your existing Next.js carbon monitoring application. The integration will provide AI-powered biomass predictions as an alternative/supplement to the current WCMC static dataset.

---

## Current Architecture Analysis

### Your Existing Stack
- **Frontend**: Next.js 15.5.6 with React 19, Leaflet maps
- **Backend**: Next.js API routes (server-side)
- **Earth Engine**: Service account authentication, polygon-based analysis
- **Current Biomass Source**: WCMC/biomass_carbon_density/v1_0 (static, 2010 data)
- **Deployment**: Node.js server-side rendering

### Current Workflow
```
User draws polygon → API route → GEE authentication → 
Data fetching (WCMC biomass, OpenLandMap SOC, Dynamic World) → 
Carbon calculations → Response to frontend
```

---

## Integration Architecture

### Proposed Hybrid System

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface (React)                    │
│  - Leaflet Map with Polygon Drawing                          │
│  - Toggle: "Use AI Biomass Estimation"                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Next.js API Route (/api/biomass-ai)            │
│  1. Validate polygon & dates                                 │
│  2. Choose data source based on toggle                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴────────────────────┐
        ↓                                        ↓
┌──────────────────┐              ┌──────────────────────────┐
│  Legacy Path     │              │  AI-Powered Path         │
│  WCMC Dataset    │              │  IBM Granite Model       │
└──────────────────┘              └──────────────────────────┘
                                              ↓
                        ┌─────────────────────┴─────────────────────┐
                        ↓                                           ↓
        ┌───────────────────────────┐          ┌──────────────────────────────┐
        │ Step 1: GEE Data Export   │          │ Step 2: Granite Inference    │
        │ - HLS imagery extraction  │    →     │ - Python microservice        │
        │ - Cloud masking          │          │ - TerraWatch/Terratorch      │
        │ - Export to Cloud Storage │          │ - Return biomass raster      │
        └───────────────────────────┘          └──────────────────────────────┘
                                                            ↓
                                        ┌───────────────────────────────┐
                                        │ Step 3: Aggregate Results     │
                                        │ - Clip to polygon            │
                                        │ - Calculate mean/total AGB   │
                                        │ - Return to Next.js API      │
                                        └───────────────────────────────┘
```

---

## Detailed Implementation Plan

### Phase 1: Infrastructure Setup (Week 1-2)

#### 1.1 Python Microservice Setup

**Technology Stack:**
- **Framework**: FastAPI (async support, easy deployment)
- **ML Libraries**: PyTorch, Terratorch, IBM Granite model
- **GIS**: rasterio, geopandas, shapely
- **Cloud Storage**: Google Cloud Storage (integrates with GEE)

**File Structure:**
```
land-classification/
├── src/                          # Existing Next.js app
├── python-service/               # NEW: Python microservice
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                   # FastAPI app
│   ├── models/
│   │   ├── granite_model.py      # Model loading & inference
│   │   └── weights/              # Model checkpoints
│   ├── processors/
│   │   ├── hls_preprocessor.py   # HLS data preparation
│   │   └── polygon_aggregator.py # Spatial aggregation
│   └── utils/
│       ├── gcs_handler.py        # Cloud storage operations
│       └── geospatial.py         # CRS handling, clipping
└── docker-compose.yml            # Orchestrate Next.js + Python
```

**requirements.txt:**
```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
torch==2.1.0
torchvision==0.16.0
terratorch==0.1.0  # IBM's inference framework
rasterio==1.3.9
geopandas==0.14.2
shapely==2.0.2
numpy==1.24.3
google-cloud-storage==2.14.0
earthengine-api==0.1.384
pillow==10.2.0
pydantic==2.5.0
```

#### 1.2 Google Cloud Storage Setup

```bash
# Create GCS bucket for temporary data exchange
gcloud storage buckets create gs://your-project-biomass-temp \
  --location=us-central1 \
  --uniform-bucket-level-access

# Set lifecycle policy (delete files after 24 hours)
echo '{
  "lifecycle": {
    "rule": [{
      "action": {"type": "Delete"},
      "condition": {"age": 1}
    }]
  }
}' > lifecycle.json

gcloud storage buckets update gs://your-project-biomass-temp \
  --lifecycle-file=lifecycle.json
```

---

### Phase 2: GEE HLS Data Extraction (Week 2-3)

#### 2.1 Create New Earth Engine Function

**File**: `src/lib/earthEngine.ts` (add new function)

```typescript
/**
 * Extract Harmonized Landsat-Sentinel (HLS) imagery for Granite model
 * Returns GCS path to exported imagery
 */
export async function extractHLSForGranite(
  geometry: any,
  targetDate: string,
  cloudCoverMax: number = 20
): Promise<string> {
  await ensureInitialized();
  
  const polygon = ee.Geometry.Polygon(geometry.coordinates);
  
  // Calculate date range (±30 days for leaf-on season flexibility)
  const startDate = ee.Date(targetDate).advance(-30, 'day');
  const endDate = ee.Date(targetDate).advance(30, 'day');
  
  // Load HLS imagery (Landsat 8/9 + Sentinel-2)
  const landsat = new ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .merge(new ee.ImageCollection('LANDSAT/LC09/C02/T1_L2'))
    .filterBounds(polygon)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.lt('CLOUD_COVER', cloudCoverMax))
    .map(maskLandsatClouds);
  
  const sentinel = new ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(polygon)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', cloudCoverMax))
    .map(maskS2Clouds);
  
  // Harmonize band names to match HLS standard
  const landsatHarmonized = landsat.map((img: any) => {
    return img.select(
      ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'],
      ['B02', 'B03', 'B04', 'B8A', 'B11', 'B12']  // HLS naming
    );
  });
  
  const sentinelHarmonized = sentinel.map((img: any) => {
    return img.select(
      ['B2', 'B3', 'B4', 'B8A', 'B11', 'B12'],
      ['B02', 'B03', 'B04', 'B8A', 'B11', 'B12']
    );
  });
  
  // Merge and create cloud-free composite
  const hlsComposite = landsatHarmonized
    .merge(sentinelHarmonized)
    .median()  // Use median to reduce cloud influence
    .clip(polygon);
  
  // Required bands for Granite model
  const requiredBands = ['B02', 'B03', 'B04', 'B8A', 'B11', 'B12'];
  const finalImage = hlsComposite.select(requiredBands);
  
  // Export to Google Cloud Storage
  const exportId = `hls_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const gcsPath = `gs://your-project-biomass-temp/${exportId}`;
  
  return new Promise((resolve, reject) => {
    ee.batch.Export.image.toCloudStorage({
      image: finalImage,
      description: exportId,
      bucket: 'your-project-biomass-temp',
      fileNamePrefix: exportId,
      scale: 30,  // 30m resolution for HLS
      region: polygon,
      fileFormat: 'GeoTIFF',
      formatOptions: {
        cloudOptimized: true
      },
      maxPixels: 1e9
    }).start();
    
    // Poll for export completion
    const checkExport = setInterval(async () => {
      const status = await getExportStatus(exportId);
      if (status === 'COMPLETED') {
        clearInterval(checkExport);
        resolve(`${gcsPath}.tif`);
      } else if (status === 'FAILED') {
        clearInterval(checkExport);
        reject(new Error('GEE export failed'));
      }
    }, 5000);  // Check every 5 seconds
  });
}

/**
 * Cloud masking for Landsat
 */
function maskLandsatClouds(image: any) {
  const qa = image.select('QA_PIXEL');
  const cloudBit = 1 << 3;
  const cloudShadowBit = 1 << 4;
  const mask = qa.bitwiseAnd(cloudBit).eq(0)
    .and(qa.bitwiseAnd(cloudShadowBit).eq(0));
  return image.updateMask(mask).multiply(0.0000275).add(-0.2);
}

/**
 * Get export task status
 */
async function getExportStatus(taskId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ee.data.getTaskStatus(taskId, (status: any, error: any) => {
      if (error) reject(error);
      else resolve(status[0]?.state || 'UNKNOWN');
    });
  });
}
```

#### 2.2 Create API Route for AI Biomass

**File**: `src/app/api/biomass-ai/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { extractHLSForGranite, ensureInitialized } from '@/lib/earthEngine';

export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();
    
    const { geometry, date } = await request.json();
    
    if (!geometry || !date) {
      return NextResponse.json(
        { error: 'Missing geometry or date' },
        { status: 400 }
      );
    }
    
    console.log('🚀 Starting AI biomass estimation...');
    
    // Step 1: Extract HLS imagery from GEE
    console.log('📡 Extracting HLS imagery from Earth Engine...');
    const gcsPath = await extractHLSForGranite(geometry, date);
    console.log(`✅ HLS imagery exported to: ${gcsPath}`);
    
    // Step 2: Call Python microservice for inference
    console.log('🤖 Running Granite model inference...');
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    
    const inferenceResponse = await fetch(`${pythonServiceUrl}/predict-biomass`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gcs_path: gcsPath,
        geometry: geometry,
        date: date
      })
    });
    
    if (!inferenceResponse.ok) {
      throw new Error('Inference service failed');
    }
    
    const result = await inferenceResponse.json();
    console.log('✅ Biomass estimation complete');
    
    return NextResponse.json({
      success: true,
      data: {
        agb: result.mean_agb,  // tonnes/ha
        bgb: result.mean_agb * 0.2,  // Estimate BGB as 20% of AGB
        totalBiomass: result.total_agb,  // total tonnes
        confidence: result.confidence,
        pixelCount: result.pixel_count,
        areaHa: result.area_ha,
        model: 'IBM Granite Geospatial',
        imagery: {
          source: 'HLS (Landsat-8/9 + Sentinel-2)',
          resolution: '30m',
          gcsPath: gcsPath
        }
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error in AI biomass estimation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to estimate biomass' },
      { status: 500 }
    );
  }
}
```

---

### Phase 3: Python Microservice Implementation (Week 3-4)

#### 3.1 FastAPI Main Application

**File**: `python-service/main.py`

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Tuple
import asyncio
from models.granite_model import GraniteInference
from processors.hls_preprocessor import HLSPreprocessor
from processors.polygon_aggregator import PolygonAggregator
from utils.gcs_handler import GCSHandler

app = FastAPI(title="Granite Biomass Inference Service")

# Initialize components
granite_model = GraniteInference(model_path="./models/weights/granite_geospatial.pth")
hls_processor = HLSPreprocessor()
aggregator = PolygonAggregator()
gcs_handler = GCSHandler()

class BiomassRequest(BaseModel):
    gcs_path: str
    geometry: dict
    date: str

class BiomassResponse(BaseModel):
    mean_agb: float
    total_agb: float
    confidence: float
    pixel_count: int
    area_ha: float

@app.post("/predict-biomass", response_model=BiomassResponse)
async def predict_biomass(request: BiomassRequest):
    """
    Main endpoint for biomass prediction
    """
    try:
        print(f"📥 Received request for {request.gcs_path}")
        
        # Step 1: Download HLS imagery from GCS
        local_path = await gcs_handler.download(request.gcs_path)
        print(f"✅ Downloaded imagery to {local_path}")
        
        # Step 2: Preprocess HLS data for Granite model
        model_input = hls_processor.prepare_for_granite(
            image_path=local_path,
            target_crs='EPSG:4326',
            target_resolution=30
        )
        print(f"✅ Preprocessed {model_input.shape} input tensor")
        
        # Step 3: Run inference with Granite model
        biomass_prediction = await granite_model.predict(model_input)
        print(f"✅ Inference complete: {biomass_prediction.shape}")
        
        # Step 4: Aggregate results within polygon
        results = aggregator.aggregate_to_polygon(
            biomass_raster=biomass_prediction,
            geometry=request.geometry['coordinates'],
            image_path=local_path  # For geotransform
        )
        
        print(f"✅ Mean AGB: {results['mean_agb']:.2f} t/ha")
        
        # Cleanup temporary files
        await gcs_handler.cleanup(local_path)
        await gcs_handler.delete_from_gcs(request.gcs_path)
        
        return BiomassResponse(
            mean_agb=results['mean_agb'],
            total_agb=results['total_agb'],
            confidence=results['confidence'],
            pixel_count=results['pixel_count'],
            area_ha=results['area_ha']
        )
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": granite_model.is_loaded(),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

#### 3.2 Granite Model Wrapper

**File**: `python-service/models/granite_model.py`

```python
import torch
import numpy as np
from typing import Optional
# Note: Replace with actual Terratorch/Granite imports
# from terratorch import GraniteGeospatialModel

class GraniteInference:
    """
    Wrapper for IBM Granite Geospatial Foundation Model
    """
    def __init__(self, model_path: str):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"🔧 Loading Granite model on {self.device}...")
        
        # Load pretrained Granite model
        # This is pseudocode - adjust based on actual Terratorch API
        self.model = self._load_granite_model(model_path)
        self.model.to(self.device)
        self.model.eval()
        
        print("✅ Granite model loaded successfully")
    
    def _load_granite_model(self, model_path: str):
        """
        Load Granite model using Terratorch
        
        Actual implementation:
        from terratorch.models import load_model
        model = load_model('granite-geospatial-biomass', checkpoint=model_path)
        """
        # Placeholder - replace with actual loading code
        # return GraniteGeospatialModel.from_pretrained(model_path)
        pass
    
    async def predict(self, input_tensor: torch.Tensor) -> np.ndarray:
        """
        Run biomass inference
        
        Args:
            input_tensor: [B, C, H, W] where C=6 (HLS bands)
        
        Returns:
            biomass_map: [H, W] in tonnes/ha
        """
        with torch.no_grad():
            # Move input to device
            input_tensor = input_tensor.to(self.device)
            
            # Normalize input (Granite expects specific normalization)
            input_normalized = self._normalize_input(input_tensor)
            
            # Run inference
            output = self.model(input_normalized)
            
            # Post-process output
            biomass_map = self._postprocess_output(output)
            
            return biomass_map.cpu().numpy()
    
    def _normalize_input(self, tensor: torch.Tensor) -> torch.Tensor:
        """
        Normalize HLS bands for Granite model
        
        Granite expects specific normalization per band
        """
        # Mean and std for each HLS band (from Granite paper)
        mean = torch.tensor([0.1, 0.1, 0.1, 0.4, 0.2, 0.1]).view(1, 6, 1, 1)
        std = torch.tensor([0.05, 0.05, 0.05, 0.1, 0.08, 0.06]).view(1, 6, 1, 1)
        
        return (tensor - mean.to(tensor.device)) / std.to(tensor.device)
    
    def _postprocess_output(self, output: torch.Tensor) -> torch.Tensor:
        """
        Convert model output to biomass in tonnes/ha
        """
        # Granite outputs log-transformed biomass
        # Convert back to tonnes/ha
        biomass = torch.exp(output) - 1
        
        # Clip to reasonable range (0-500 tonnes/ha)
        biomass = torch.clamp(biomass, 0, 500)
        
        return biomass.squeeze()
    
    def is_loaded(self) -> bool:
        return self.model is not None
```

#### 3.3 HLS Preprocessor

**File**: `python-service/processors/hls_preprocessor.py`

```python
import rasterio
import numpy as np
import torch
from rasterio.warp import reproject, Resampling

class HLSPreprocessor:
    """
    Prepare HLS imagery for Granite model input
    """
    def __init__(self):
        self.required_bands = ['B02', 'B03', 'B04', 'B8A', 'B11', 'B12']
        self.target_resolution = 30  # meters
    
    def prepare_for_granite(
        self,
        image_path: str,
        target_crs: str = 'EPSG:4326',
        target_resolution: int = 30
    ) -> torch.Tensor:
        """
        Load and preprocess HLS GeoTIFF for Granite model
        
        Returns:
            torch.Tensor: [1, 6, H, W] ready for inference
        """
        with rasterio.open(image_path) as src:
            # Read all bands
            bands = []
            for i in range(1, 7):  # 6 HLS bands
                band = src.read(i)
                bands.append(band)
            
            # Stack bands: [6, H, W]
            image_array = np.stack(bands, axis=0)
            
            # Handle nodata values
            image_array = self._fill_nodata(image_array, src.nodata)
            
            # Normalize reflectance values to [0, 1]
            image_array = image_array.astype(np.float32) / 10000.0
            
            # Convert to torch tensor: [1, 6, H, W]
            tensor = torch.from_numpy(image_array).unsqueeze(0)
            
            # Ensure dimensions are multiples of 32 (Granite requirement)
            tensor = self._pad_to_divisible(tensor, divisor=32)
            
            return tensor
    
    def _fill_nodata(self, array: np.ndarray, nodata_value) -> np.ndarray:
        """
        Fill nodata values with interpolation
        """
        if nodata_value is None:
            return array
        
        mask = array == nodata_value
        
        # Simple nearest neighbor interpolation
        from scipy.ndimage import distance_transform_edt
        
        for band_idx in range(array.shape[0]):
            band = array[band_idx]
            band_mask = mask[band_idx]
            
            if band_mask.any():
                # Find nearest valid pixel for each invalid pixel
                indices = distance_transform_edt(
                    band_mask,
                    return_distances=False,
                    return_indices=True
                )
                band[band_mask] = band[tuple(indices[:, band_mask])]
                array[band_idx] = band
        
        return array
    
    def _pad_to_divisible(self, tensor: torch.Tensor, divisor: int = 32) -> torch.Tensor:
        """
        Pad spatial dimensions to be divisible by divisor
        """
        _, _, h, w = tensor.shape
        
        pad_h = (divisor - h % divisor) % divisor
        pad_w = (divisor - w % divisor) % divisor
        
        if pad_h > 0 or pad_w > 0:
            tensor = torch.nn.functional.pad(
                tensor,
                (0, pad_w, 0, pad_h),
                mode='reflect'
            )
        
        return tensor
```

#### 3.4 Polygon Aggregator

**File**: `python-service/processors/polygon_aggregator.py`

```python
import numpy as np
import rasterio
from rasterio.features import geometry_mask
from shapely.geometry import Polygon
from typing import Dict, List, Tuple

class PolygonAggregator:
    """
    Aggregate pixel-wise biomass within polygon boundaries
    """
    def aggregate_to_polygon(
        self,
        biomass_raster: np.ndarray,
        geometry: List[List[List[float]]],
        image_path: str
    ) -> Dict:
        """
        Calculate biomass statistics within polygon
        
        Args:
            biomass_raster: [H, W] array of biomass values (tonnes/ha)
            geometry: GeoJSON polygon coordinates
            image_path: Path to original image (for geotransform)
        
        Returns:
            Dict with mean_agb, total_agb, confidence, etc.
        """
        # Open image to get geotransform
        with rasterio.open(image_path) as src:
            transform = src.transform
            crs = src.crs
        
        # Create polygon from coordinates
        polygon = Polygon(geometry[0])
        
        # Create mask for pixels inside polygon
        mask = geometry_mask(
            [polygon],
            out_shape=biomass_raster.shape,
            transform=transform,
            invert=True  # True where polygon exists
        )
        
        # Extract biomass values within polygon
        valid_pixels = biomass_raster[mask]
        
        # Remove any remaining invalid values
        valid_pixels = valid_pixels[valid_pixels > 0]
        valid_pixels = valid_pixels[valid_pixels < 500]  # Remove outliers
        
        if len(valid_pixels) == 0:
            raise ValueError("No valid pixels found within polygon")
        
        # Calculate statistics
        mean_agb = float(np.mean(valid_pixels))
        std_agb = float(np.std(valid_pixels))
        median_agb = float(np.median(valid_pixels))
        
        # Calculate total biomass
        pixel_area_ha = (30 * 30) / 10000  # 30m pixel = 0.09 ha
        total_area_ha = len(valid_pixels) * pixel_area_ha
        total_agb = mean_agb * total_area_ha
        
        # Confidence based on coefficient of variation
        cv = std_agb / mean_agb if mean_agb > 0 else 1.0
        confidence = max(0.0, min(1.0, 1.0 - cv))
        
        return {
            'mean_agb': mean_agb,
            'median_agb': median_agb,
            'std_agb': std_agb,
            'total_agb': total_agb,
            'confidence': confidence,
            'pixel_count': len(valid_pixels),
            'area_ha': total_area_ha
        }
```

#### 3.5 Google Cloud Storage Handler

**File**: `python-service/utils/gcs_handler.py`

```python
from google.cloud import storage
import os
import tempfile
from pathlib import Path

class GCSHandler:
    """
    Handle downloads/uploads to Google Cloud Storage
    """
    def __init__(self):
        self.client = storage.Client()
    
    async def download(self, gcs_path: str) -> str:
        """
        Download file from GCS to local temp directory
        
        Args:
            gcs_path: gs://bucket-name/path/to/file.tif
        
        Returns:
            Local file path
        """
        # Parse GCS path
        gcs_path = gcs_path.replace('gs://', '')
        parts = gcs_path.split('/', 1)
        bucket_name = parts[0]
        blob_name = parts[1]
        
        # Create temp file
        temp_dir = tempfile.gettempdir()
        local_path = os.path.join(temp_dir, Path(blob_name).name)
        
        # Download from GCS
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(blob_name)
        blob.download_to_filename(local_path)
        
        print(f"📥 Downloaded {gcs_path} to {local_path}")
        return local_path
    
    async def cleanup(self, local_path: str):
        """Remove local temporary file"""
        if os.path.exists(local_path):
            os.remove(local_path)
            print(f"🗑️  Removed local file: {local_path}")
    
    async def delete_from_gcs(self, gcs_path: str):
        """Delete file from GCS after processing"""
        gcs_path = gcs_path.replace('gs://', '')
        parts = gcs_path.split('/', 1)
        bucket_name = parts[0]
        blob_name = parts[1]
        
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(blob_name)
        blob.delete()
        
        print(f"🗑️  Deleted from GCS: gs://{bucket_name}/{blob_name}")
```

---

### Phase 4: Frontend Integration (Week 4-5)

#### 4.1 Update Carbon Monitoring API

**File**: `src/app/api/carbon-monitoring/route.ts` (modify)

Add option to use AI biomass:

```typescript
// Add to POST function
const { geometry, startDate, endDate, useAIBiomass } = body;

// In getBiomassData function, add parameter:
async function getBiomassData(
  geometry: any,
  date: string,
  useAI: boolean = false
): Promise<{ agb: number; bgb: number }> {
  
  if (useAI) {
    // Call AI biomass API
    const response = await fetch(`http://localhost:3000/api/biomass-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ geometry, date })
    });
    
    const result = await response.json();
    return {
      agb: result.data.agb,
      bgb: result.data.bgb
    };
  }
  
  // Existing WCMC logic...
}
```

#### 4.2 Add Toggle to UI

**File**: `src/app/page.tsx` (modify)

```typescript
// Add state
const [useAIBiomass, setUseAIBiomass] = useState(false);

// Add toggle UI before date inputs
<div className="mb-6 flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
  <input
    type="checkbox"
    id="useAI"
    checked={useAIBiomass}
    onChange={(e) => setUseAIBiomass(e.target.checked)}
    className="w-5 h-5"
  />
  <label htmlFor="useAI" className="flex items-center space-x-2">
    <span className="text-lg">🤖</span>
    <div>
      <div className="font-semibold">Use AI Biomass Estimation</div>
      <div className="text-sm text-gray-600">
        IBM Granite model (more accurate, slower)
      </div>
    </div>
  </label>
</div>

// Update fetch call
const response = await fetch('/api/carbon-monitoring', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    geometry: geojson.geometry,
    startDate,
    endDate,
    useAIBiomass  // Pass flag
  }),
});
```

---

### Phase 5: Deployment (Week 5-6)

#### 5.1 Docker Configuration

**File**: `python-service/Dockerfile`

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgdal-dev \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Download Granite model weights (if not bundled)
RUN python -c "from models.granite_model import download_weights; download_weights()"

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**File**: `docker-compose.yml` (root)

```yaml
version: '3.8'

services:
  nextjs:
    build: .
    ports:
      - "3000:3000"
    environment:
      - GEE_PRIVATE_KEY=${GEE_PRIVATE_KEY}
      - GEE_SERVICE_ACCOUNT_EMAIL=${GEE_SERVICE_ACCOUNT_EMAIL}
      - GEE_PROJECT_ID=${GEE_PROJECT_ID}
      - PYTHON_SERVICE_URL=http://python-service:8000
    depends_on:
      - python-service
  
  python-service:
    build: ./python-service
    ports:
      - "8000:8000"
    environment:
      - GOOGLE_APPLICATION_CREDENTIALS=/app/credentials.json
    volumes:
      - ./service-account-key.json:/app/credentials.json:ro
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

#### 5.2 Cloud Deployment (Google Cloud Run)

```bash
# Build and push Python service
cd python-service
gcloud builds submit --tag gcr.io/YOUR_PROJECT/granite-service
gcloud run deploy granite-service \
  --image gcr.io/YOUR_PROJECT/granite-service \
  --platform managed \
  --region us-central1 \
  --memory 8Gi \
  --cpu 4 \
  --timeout 300s

# Get service URL
PYTHON_SERVICE_URL=$(gcloud run services describe granite-service \
  --region us-central1 --format 'value(status.url)')

# Deploy Next.js with Python service URL
cd ..
gcloud run deploy land-classification \
  --source . \
  --set-env-vars PYTHON_SERVICE_URL=$PYTHON_SERVICE_URL
```

---

## Performance Optimization

### Caching Strategy

1. **Cache HLS exports** for 24 hours (same polygon + date)
2. **Cache inference results** in Redis/Memcached
3. **Batch processing** for multiple dates

```typescript
// Add to API route
const cacheKey = `biomass_${hash(geometry)}_${date}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// ... run inference ...

await redis.set(cacheKey, JSON.stringify(result), 'EX', 86400);
```

---

## Cost Estimation

### Per Analysis (1 polygon, 2 dates)

| Component | Cost | Notes |
|-----------|------|-------|
| GEE processing | $0.01 | Export HLS imagery |
| GCS storage | $0.001 | Temporary file (24hr) |
| Python inference | $0.10 | Cloud Run (8GB RAM, 4 CPU, 30s) |
| **Total per analysis** | **~$0.11** | |

### Monthly (1000 analyses)
- **$110/month** for AI biomass
- vs **$0** for current WCMC (but less accurate)

---

## Timeline Summary

| Week | Phase | Deliverables |
|------|-------|-------------|
| 1-2 | Infrastructure | Python service setup, GCS bucket |
| 2-3 | GEE Integration | HLS extraction function, API route |
| 3-4 | Python Service | Granite model, preprocessing, aggregation |
| 4-5 | Frontend | UI toggle, result display |
| 5-6 | Deployment | Docker, Cloud Run, testing |

**Total: 6 weeks for full integration**

---

## Testing Strategy

1. **Unit tests**: Test each component separately
2. **Integration tests**: End-to-end polygon → biomass
3. **Validation**: Compare AI vs WCMC vs ground truth (if available)
4. **Performance tests**: Measure latency, optimize bottlenecks

---

## Alternative: Simplified Approach

If 6 weeks is too long, consider:

### Quick Integration (2 weeks)
1. Skip HLS extraction, use existing WCMC
2. Run Granite inference on **pre-computed** biomass layers
3. Just add aggregation logic

This loses temporal accuracy but is much faster to implement.

---

## Next Steps

1. **Decision**: Full integration vs simplified approach?
2. **Setup**: Create GCS bucket, Python environment
3. **Model Access**: Obtain Granite model weights from IBM
4. **POC**: Test with single polygon before full deployment

Would you like me to start implementing any specific phase? 🚀
