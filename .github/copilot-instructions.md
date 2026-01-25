# Carbon Monitoring System - AI Agent Instructions

## Project Overview

This is a Next.js 15 application that performs carbon stock estimation using **Google Earth Engine** (GEE) for satellite data processing and ML models for biomass estimation. The system calculates Above Ground Biomass (AGB), Below Ground Biomass (BGB), and Soil Organic Carbon (SOC) for user-drawn polygons.

**Architecture**: Next.js frontend → API routes → Earth Engine backend → ML models on Hugging Face

## Critical Setup Requirements

### Environment Variables (Required)

The application **requires** three GEE credentials in `.env.local`:

```
GEE_PRIVATE_KEY=<service-account-private-key>
GEE_SERVICE_ACCOUNT_EMAIL=<service-account@project.iam.gserviceaccount.com>
GEE_PROJECT_ID=<google-cloud-project-id>
```

**Important**: `GEE_PRIVATE_KEY` must have literal `\n` replaced with actual newlines (handled in code via `.replace(/\\n/g, '\n')` at [src/lib/earthEngine.ts](src/lib/earthEngine.ts#L14)).

### Development Commands

```bash
npm run dev        # Next.js dev server with Turbopack
npm run build      # Production build with Turbopack
npm start          # Production server
```

## Key Architecture Patterns

### 1. Earth Engine Integration ([src/lib/earthEngine.ts](src/lib/earthEngine.ts))

- **Singleton initialization**: `initializeEarthEngine()` is called once via `ensureInitialized()` wrapper
- **Authentication flow**: Service account → Private key auth → Cloud project initialization
- All GEE operations must call `await ensureInitialized()` before using `ee` API
- Image collections require explicit `.evaluate()` callbacks for async data extraction

**Example pattern**:
```typescript
export async function myGEEFunction(geometry: any) {
  await ensureInitialized();  // Always first
  const polygon = ee.Geometry.Polygon(geometry.coordinates);
  // ... GEE operations
}
```

### 2. API Route Architecture

All API routes follow this structure:
- Accept GeoJSON polygon geometry + date parameters
- Use progressive fallback for satellite data (expand time windows if no data found)
- Return structured JSON with data quality metrics

**Critical pattern - Temporal Fallback** ([src/app/api/carbon-monitoring/route.ts](src/app/api/carbon-monitoring/route.ts#L51-L73)):
```typescript
async function findClosestData(geometry, targetDate, maxMonthsSearch = 6) {
  for (let monthsWindow = 1; monthsWindow <= maxMonthsSearch; monthsWindow++) {
    // Expand search window progressively until data found
  }
}
```

### 3. Carbon Calculation Pipeline ([src/app/api/carbon-monitoring/route.ts](src/app/api/carbon-monitoring/route.ts))

**Formula**: Total Carbon Stock = (AGB + BGB + SOC) × Area (hectares)

**Data sources**:
- **AGB**: `WCMC/biomass_carbon_density/v1_0` dataset (tonnes C/ha)
- **BGB**: Calculated as AGB × 0.24 (root-to-shoot ratio)
- **SOC**: OpenLandMap dataset with formula: `SOC (g/kg) × Bulk Density (1.3 g/cm³) × Depth (0.3m) × 0.1`
- **Land Classification**: Google Dynamic World AI (`GOOGLE/DYNAMICWORLD/V1`) - mode composite

**CO₂ conversion**: Carbon stock × 3.67 = CO₂ equivalent

### 4. Frontend Data Flow ([src/app/page.tsx](src/app/page.tsx))

1. User draws polygon on Leaflet map ([src/components/MapComponent.tsx](src/components/MapComponent.tsx))
2. `onPolygonCreated` callback passes GeoJSON to parent
3. Parent fetches from 3 API routes in sequence:
   - `/api/satellite` - Sentinel-2 vegetation indices
   - `/api/classify` - Land cover classification
   - `/api/carbon-monitoring` - Carbon stock analysis
4. Dashboard displays results in tabs ([src/components/Dashboard.tsx](src/components/Dashboard.tsx))

### 5. Map Component Conventions ([src/components/MapComponent.tsx](src/components/MapComponent.tsx))

- **Dynamic import required**: Map component must be loaded with `dynamic(() => import(...), { ssr: false })` to avoid Next.js SSR issues with Leaflet
- **Leaflet icon fix**: Default markers need CDN URLs explicitly set (see [MapComponent.tsx](src/components/MapComponent.tsx#L13-L17))
- **Layer structure**: Street map, Satellite, and Satellite+Labels base layers
- **Draw controls**: Only polygons allowed, one at a time (cleared on new draw)

## ML Model Integration

### AGB Model (Deployed on Hugging Face)

- **Repository**: https://huggingface.co/mona0125/agb-biomass-estimation-ne-india
- **Training notebooks**: [ml/agb_model_training_v2.ipynb](ml/agb_model_training_v2.ipynb), [ml/northeast_agb_model.ipynb](ml/northeast_agb_model.ipynb)
- **Note**: ML models trained on Northeast India data; raw satellite datasets **not included** in repo

### SOC Model

- **Training notebook**: [ml/SOC_model_final.ipynb](ml/SOC_model_final.ipynb)
- Currently uses OpenLandMap dataset directly (not custom ML model)

## Common Pitfalls

1. **Earth Engine 401 errors**: Check environment variables are loaded and private key formatting is correct
2. **No satellite data**: API uses progressive temporal fallback - if still failing, check polygon isn't over ocean/invalid area
3. **Map not rendering**: Ensure dynamic import with `ssr: false` and Leaflet CSS imported
4. **Turbopack build failures**: This project uses `--turbopack` flag for dev and build (Next.js 15 feature)

## Project-Specific Conventions

- **File naming**: React components use PascalCase (e.g., `Dashboard.tsx`), utilities use camelCase (e.g., `earthEngine.ts`)
- **Error handling**: API routes return structured `{ error, details }` objects with 400/500 status codes
- **TypeScript**: Strict mode enabled; Earth Engine types defined in [src/types/earthengine.d.ts](src/types/earthengine.d.ts)
- **Styling**: Tailwind CSS 4 with dark theme (slate-800/blue-500 palette)
- **Date handling**: ISO 8601 strings (`YYYY-MM-DD`) for all date parameters

## Testing & Debugging

- **Earth Engine debugging**: Check browser console for `'Google Earth Engine initialized successfully'` message
- **API debugging**: All API routes have extensive `console.log` statements with emoji prefixes (🌍, 🌳, 📊)
- **Data quality checks**: API responses include `dataQuality` field with `imageCount` and `temporalWindow` metadata
