# Land Classification & Carbon Credit Analyzer

A production-ready web application for analyzing land cover, vegetation indices, and estimating carbon credits using satellite data from Google Earth Engine.

## Features

### 🗺️ Interactive Mapping
- Draw custom polygons directly on the map
- Leaflet-based interactive map with satellite and street view layers
- Polygon editing and deletion capabilities
- GeoJSON export functionality

### 🛰️ Satellite Data Integration
- Google Earth Engine integration using Sentinel-2 and Landsat data
- Automated cloud masking and image composites
- NDVI (Normalized Difference Vegetation Index) calculation
- EVI (Enhanced Vegetation Index) calculation
- Date range selection for temporal analysis

### 🤖 AI/ML Land Classification
- Land cover classification using ESA WorldCover dataset
- Near real-time classification with Google Dynamic World
- Multiple land cover classes (forest, cropland, grassland, etc.)
- Area statistics for each land cover type

### 💰 Carbon Credit Estimation
- Historical land cover change analysis
- Carbon sequestration calculations based on IPCC guidelines
- Credit eligibility assessment
- Potential credit value estimation
- Annual carbon change tracking

### 📊 Data Visualization
- Interactive charts and graphs (Chart.js)
- Bar charts and pie charts for land cover distribution
- Time series visualization for carbon stock changes
- NDVI trend analysis
- Comprehensive dashboard with multiple views

### 📄 Export Capabilities
- CSV export for statistical data
- PDF report generation with charts and tables
- GeoJSON export for spatial data
- Downloadable analysis reports

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Mapping**: Leaflet, React-Leaflet, Leaflet-Draw
- **Charts**: Chart.js, React-ChartJS-2
- **Satellite Data**: Google Earth Engine (Sentinel-2, Landsat, ESA WorldCover)
- **Styling**: Tailwind CSS
- **Export**: jsPDF, csv-stringify
- **Deployment**: Vercel-ready

## Prerequisites

1. **Node.js**: Version 20 or higher
2. **Google Earth Engine Account**:
   - Sign up at [https://earthengine.google.com](https://earthengine.google.com)
   - Create a Google Cloud Project
   - Enable Earth Engine API
   - Create a service account with Earth Engine permissions
   - Download the service account private key (JSON)

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd land-classification
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   - Copy `.env.example` to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Edit `.env.local` and add your Google Earth Engine credentials:
     ```env
     GEE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
     GEE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
     GEE_PROJECT_ID=your-gee-project-id
     ```

## Setting Up Google Earth Engine

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select an existing one

2. **Enable Earth Engine API**:
   - In the Google Cloud Console, enable the Earth Engine API
   - Go to APIs & Services > Library
   - Search for "Earth Engine API" and enable it

3. **Create a Service Account**:
   - Go to IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Give it a name and description
   - Grant it the "Earth Engine Resource Admin" role
   - Click "Create Key" and download the JSON file

4. **Register for Earth Engine**:
   - Go to [https://signup.earthengine.google.com](https://signup.earthengine.google.com)
   - Register your project for Earth Engine access

5. **Extract Credentials**:
   - Open the downloaded JSON key file
   - Copy the `client_email` to `GEE_SERVICE_ACCOUNT_EMAIL`
   - Copy the `private_key` to `GEE_PRIVATE_KEY`
   - Copy the `project_id` to `GEE_PROJECT_ID`

## Running the Application

1. **Development mode**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser

2. **Production build**:
   ```bash
   npm run build
   npm start
   ```

## Usage Guide

1. **Draw a Polygon**:
   - Use the polygon or rectangle drawing tools on the map
   - Click to create vertices, double-click to complete
   - Edit or delete polygons using the edit tools

2. **Configure Analysis**:
   - Select start and end dates for satellite data
   - Default range is current year (2023)

3. **Analyze**:
   - Click the "Analyze" button after drawing a polygon
   - The app will automatically fetch and process:
     - Satellite imagery
     - Land cover classification
     - Carbon credit estimates

4. **View Results**:
   - Switch between tabs: Satellite Data, Land Classification, Carbon Credits
   - Explore charts, statistics, and visualizations
   - Check carbon credit eligibility and potential value

5. **Export Data**:
   - Export statistical data as CSV
   - Generate comprehensive PDF reports
   - Download polygon geometry as GeoJSON

## API Endpoints

### POST `/api/satellite`
Fetch and process satellite data for a polygon.

**Request body**:
```json
{
  "geometry": { "type": "Polygon", "coordinates": [...] },
  "startDate": "2023-01-01",
  "endDate": "2023-12-31",
  "cloudCoverMax": 20
}
```

### POST `/api/classify`
Classify land cover for a polygon.

**Request body**:
```json
{
  "geometry": { "type": "Polygon", "coordinates": [...] },
  "year": 2021,
  "useDynamicWorld": false
}
```

### POST `/api/carbon`
Estimate carbon credits for a polygon.

**Request body**:
```json
{
  "geometry": { "type": "Polygon", "coordinates": [...] },
  "historicalYear": 2015,
  "currentYear": 2021
}
```

## Carbon Estimation Methodology

The carbon credit estimation follows these principles:

1. **Carbon Coefficients**: Based on IPCC guidelines and global averages
   - Forest: 150 tons CO2e/hectare
   - Grassland: 50 tons CO2e/hectare
   - Cropland: 30 tons CO2e/hectare
   - Mangroves: 200 tons CO2e/hectare

2. **Change Detection**: Compares historical (2015) vs current (2021) land cover

3. **Sequestration Calculation**: 
   - Total change = Current carbon stock - Historical carbon stock
   - Annual change = Total change / Years difference

4. **Credit Eligibility**:
   - Positive change = Potentially eligible
   - Negative change = Not eligible
   - Requires third-party verification for actual credits

## Deployment

### Deploy to Vercel

1. **Push to GitHub**:
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard
   - Deploy!

3. **Environment Variables**:
   - Add all variables from `.env.local` to Vercel's environment variables section

## Customization

### Carbon Coefficients
Edit `.env.local` to customize carbon coefficients:
```env
CARBON_COEFFICIENTS_FOREST=150
CARBON_COEFFICIENTS_GRASSLAND=50
CARBON_COEFFICIENTS_CROPLAND=30
```

### Satellite Data Sources
Modify `src/lib/earthEngine.ts` to change:
- Satellite collections (Sentinel-2, Landsat, etc.)
- Cloud cover thresholds
- Date ranges
- Vegetation indices

### Land Cover Classes
Update `src/app/api/classify/route.ts` to modify land cover classifications.

## Troubleshooting

### Earth Engine Authentication Fails
- Verify service account email and private key are correct
- Ensure Earth Engine API is enabled in Google Cloud Console
- Check that service account has Earth Engine permissions

### Map Not Loading
- Leaflet requires client-side rendering
- Ensure dynamic import is used for MapComponent
- Check browser console for errors

### No Satellite Data
- Verify date range has available imagery
- Check cloud cover threshold settings
- Ensure polygon is within satellite coverage area

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for research, commercial, or educational purposes.

## Acknowledgments

- Google Earth Engine for satellite data access
- ESA WorldCover for land cover classification
- IPCC for carbon estimation guidelines
- Sentinel-2 for high-resolution imagery

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

## Roadmap

- [ ] Time series analysis for vegetation trends
- [ ] Additional ML models for crop classification
- [ ] Integration with carbon credit marketplaces
- [ ] Multi-polygon comparison
- [ ] Historical imagery viewer
- [ ] Mobile-responsive improvements
- [ ] User authentication and saved analyses
- [ ] API rate limiting and caching
- [ ] Advanced carbon modeling with soil data

---

**Built with ❤️ for sustainable land monitoring and carbon credit validation**
