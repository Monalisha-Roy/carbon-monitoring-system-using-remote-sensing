# Project Structure

```
land-classification/
├── public/                          # Static assets
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── api/                    # API Routes (Backend)
│   │   │   ├── satellite/
│   │   │   │   └── route.ts       # Satellite data processing API
│   │   │   ├── classify/
│   │   │   │   └── route.ts       # Land classification API
│   │   │   └── carbon/
│   │   │       └── route.ts       # Carbon credit estimation API
│   │   ├── globals.css            # Global styles
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Main application page
│   ├── components/                 # React Components
│   │   ├── MapComponent.tsx       # Interactive Leaflet map with drawing
│   │   ├── Dashboard.tsx          # Main dashboard with tabs
│   │   └── Charts.tsx             # Chart.js visualization components
│   ├── lib/                        # Utility libraries
│   │   ├── earthEngine.ts         # Google Earth Engine integration
│   │   └── export.ts              # Data export utilities (CSV, PDF, GeoJSON)
│   └── types/                      # TypeScript type definitions
│       └── earthengine.d.ts       # Earth Engine types
├── .env.example                    # Environment variable template
├── .env.local                      # Your actual credentials (git-ignored)
├── .gitignore                      # Git ignore rules
├── next.config.ts                  # Next.js configuration
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── postcss.config.mjs              # PostCSS configuration
├── README.md                       # Main documentation
├── SETUP_GUIDE.md                  # Google Earth Engine setup
└── QUICK_START.md                  # Quick start guide
```

## Key Files Explained

### Frontend Components

**`src/app/page.tsx`**
- Main application page
- Manages state for polygon, satellite data, classification, and carbon data
- Handles user interactions and API calls
- Orchestrates the entire user flow

**`src/components/MapComponent.tsx`**
- Leaflet-based interactive map
- Polygon drawing and editing functionality
- Satellite and street map layers
- GeoJSON geometry handling

**`src/components/Dashboard.tsx`**
- Tabbed interface for results
- Three main views: Satellite Data, Land Classification, Carbon Credits
- Data visualization and statistics display
- Export controls

**`src/components/Charts.tsx`**
- Chart.js components for data visualization
- Bar charts, pie charts, and line charts
- NDVI time series, land cover distribution, carbon change

### Backend API Routes

**`src/app/api/satellite/route.ts`**
- Fetches Sentinel-2 satellite imagery
- Applies cloud masking
- Calculates NDVI and EVI
- Returns image URLs and statistics

**`src/app/api/classify/route.ts`**
- Classifies land cover using ESA WorldCover or Dynamic World
- Calculates area statistics for each land cover type
- Returns classification results and visualizations

**`src/app/api/carbon/route.ts`**
- Compares historical vs current land cover
- Estimates carbon sequestration
- Calculates potential carbon credits
- Returns eligibility and value estimates

### Core Libraries

**`src/lib/earthEngine.ts`**
- Google Earth Engine initialization and authentication
- Satellite data retrieval functions
- Vegetation index calculations (NDVI, EVI)
- Land cover classification
- Image export and area statistics

**`src/lib/export.ts`**
- CSV export functionality
- PDF report generation with tables and charts
- GeoJSON export for spatial data
- Blob download utilities

### Type Definitions

**`src/types/earthengine.d.ts`**
- TypeScript definitions for @google/earthengine module
- Interface definitions for Image, ImageCollection, Geometry
- Reducer and Filter type definitions

### Configuration Files

**`.env.local`** (create this)
```env
GEE_SERVICE_ACCOUNT_EMAIL=your-email@project.iam.gserviceaccount.com
GEE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GEE_PROJECT_ID=your-project-id
CARBON_COEFFICIENTS_FOREST=150
CARBON_COEFFICIENTS_GRASSLAND=50
CARBON_COEFFICIENTS_CROPLAND=30
CARBON_COEFFICIENTS_BARREN=5
```

**`package.json`**
- Project dependencies
- Scripts: dev, build, start
- All required packages for mapping, charts, GEE, exports

**`next.config.ts`**
- Next.js configuration
- Turbopack enabled for faster builds

**`tsconfig.json`**
- TypeScript compiler options
- Path aliases (@/ for src/)

## Data Flow

### 1. User Draws Polygon
```
MapComponent → onPolygonCreated → page.tsx (setState)
```

### 2. Analysis Triggered
```
page.tsx → analyzePolygon() → Parallel API calls:
  ├─ /api/satellite
  ├─ /api/classify
  └─ /api/carbon
```

### 3. API Processing
```
API Route → earthEngine.ts → Google Earth Engine → Results
```

### 4. Display Results
```
page.tsx (setState) → Dashboard → Charts/Tables/Stats
```

### 5. Export Data
```
Export button → export.ts → Download file
```

## Tech Stack Details

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Mapping**: Leaflet + React-Leaflet + Leaflet-Draw
- **Charts**: Chart.js + React-ChartJS-2

### Backend
- **API**: Next.js API Routes (Serverless)
- **Satellite Data**: Google Earth Engine
- **Data Sources**:
  - Sentinel-2 (COPERNICUS/S2_SR_HARMONIZED)
  - ESA WorldCover (ESA/WorldCover/v200)
  - Dynamic World (GOOGLE/DYNAMICWORLD/V1)

### Data Processing
- **Vegetation Indices**: NDVI, EVI
- **Cloud Masking**: Sentinel-2 QA band
- **Classification**: ESA WorldCover classes
- **Carbon Estimation**: IPCC-based coefficients

### Export Formats
- **CSV**: Statistical data (csv-stringify)
- **PDF**: Reports with tables (jsPDF + jsPDF-autoTable)
- **GeoJSON**: Spatial data with properties

## Development Workflow

1. **Local Development**:
   ```bash
   npm run dev
   ```
   - Hot reload enabled
   - Turbopack for fast builds
   - Runs on localhost:3000

2. **Type Checking**:
   ```bash
   npx tsc --noEmit
   ```

3. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

4. **Deploy to Vercel**:
   ```bash
   git push origin main
   ```
   - Auto-deploys on push
   - Add env vars in Vercel dashboard

## Key Features Implementation

### Interactive Map
- Uses dynamic import to avoid SSR issues with Leaflet
- Polygon drawing with Leaflet-Draw
- Multiple base layers (street, satellite)
- Real-time polygon editing

### Satellite Analysis
- Cloud-masked composites
- Multi-spectral indices (NDVI, EVI)
- Time-series capable
- Configurable date ranges

### Land Classification
- ESA WorldCover for annual snapshots
- Dynamic World for near real-time
- Area calculations per class
- Visual overlays on map

### Carbon Estimation
- Historical comparison (2015 vs 2021)
- IPCC-based carbon coefficients
- Credit eligibility assessment
- Market value estimation

### Data Export
- CSV for spreadsheet analysis
- PDF reports with branding
- GeoJSON for GIS software
- All analyses in one export

## Extension Points

Want to add features? Here's where to start:

**Add new satellite data source**:
- Modify `src/lib/earthEngine.ts`
- Add new function for data source
- Update API route to call it

**Add new chart type**:
- Add component to `src/components/Charts.tsx`
- Import and use in `Dashboard.tsx`

**Add new API endpoint**:
- Create `src/app/api/your-endpoint/route.ts`
- Import earthEngine functions
- Return processed data

**Customize carbon coefficients**:
- Edit `.env.local`
- Or modify `src/app/api/carbon/route.ts`

**Add authentication**:
- Integrate NextAuth.js
- Protect API routes with middleware
- Add user session management

## Performance Considerations

- **API Routes**: Serverless, scales automatically
- **Image Loading**: Lazy loading with Next.js Image
- **Map**: Client-side only (dynamic import)
- **Charts**: Canvas-based, performant rendering
- **GEE**: Server-side processing, results cached by GEE

## Security Notes

- **Never commit** `.env.local` (in .gitignore)
- Service account keys are **highly sensitive**
- API routes run server-side (credentials safe)
- Use environment variables for all secrets
- Validate user input in API routes

---

This structure provides a solid foundation for a production-ready land classification and carbon credit analysis application!
