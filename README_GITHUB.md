# 🌍 Land Classification & Carbon Credit Analyzer

A comprehensive web application for analyzing land cover classification and estimating carbon credits using satellite imagery from Google Earth Engine.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.6-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## ✨ Features

- 🗺️ **Interactive Map** - Draw polygons on an interactive Leaflet map with search functionality
- 🛰️ **Satellite Imagery** - Access Sentinel-2 satellite data via Google Earth Engine
- 🌱 **Vegetation Analysis** - Calculate NDVI (Normalized Difference Vegetation Index) and EVI
- 🏞️ **Land Classification** - Analyze land cover using ESA WorldCover and Dynamic World datasets
- 💰 **Carbon Credit Estimation** - Estimate carbon credits based on land cover changes
- 📊 **Interactive Dashboard** - Visualize results with charts and interactive satellite imagery
- 📥 **Export Options** - Export data as CSV, PDF reports, or GeoJSON

## 🚀 Live Demo

[Add your deployed link here]

## 📸 Screenshots

[Add screenshots of your application here]

## 🛠️ Tech Stack

- **Framework:** Next.js 15.5.6 (with Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Mapping:** Leaflet + React-Leaflet + Leaflet-Draw
- **Charts:** Chart.js + React-ChartJS-2
- **Satellite Data:** Google Earth Engine API
- **Search:** Leaflet-geosearch (OpenStreetMap)
- **Exports:** jsPDF, csv-stringify

## 📋 Prerequisites

- Node.js 18+ and npm
- Google Cloud Project with Earth Engine API enabled
- Service account credentials for Google Earth Engine

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/land-classification.git
cd land-classification
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Google Earth Engine Service Account Configuration
GEE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GEE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GEE_PROJECT_ID=your-project-id

# Carbon Estimation Configuration (Optional - uses defaults if not provided)
CARBON_COEFFICIENTS_FOREST=150
CARBON_COEFFICIENTS_GRASSLAND=50
CARBON_COEFFICIENTS_CROPLAND=30
CARBON_COEFFICIENTS_BARREN=5
```

### 4. Set Up Google Earth Engine

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Earth Engine API**
   - Go to [APIs & Services > Library](https://console.cloud.google.com/apis/library)
   - Search for "Earth Engine API" and enable it

3. **Register Your Project with Earth Engine**
   - Go to [Earth Engine Code Editor](https://code.earthengine.google.com/)
   - Click "Register a new Cloud Project"
   - Select your project and choose usage type (Commercial/Noncommercial)

4. **Create a Service Account**
   - Go to [IAM & Admin > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
   - Click "Create Service Account"
   - Name it (e.g., "earth-engine-sa")
   - Grant these roles:
     - Earth Engine Resource Admin
     - Earth Engine Resource Writer
     - Service Usage Consumer

5. **Generate Service Account Key**
   - Click on your service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose JSON format
   - Download the JSON file
   - Copy the `private_key`, `client_email`, and `project_id` to your `.env.local` file

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

1. **Search for a Location**
   - Use the search bar to find any location worldwide

2. **Draw a Polygon**
   - Click the polygon tool (⬟) on the map
   - Click to draw points and close the polygon
   - Or use the rectangle tool for quick selection

3. **Analyze**
   - Click the "Analyze" button
   - Wait for the analysis to complete (~10-20 seconds)

4. **View Results**
   - **Satellite Data Tab:** View true color, NDVI, and EVI imagery
   - **Land Classification Tab:** See land cover breakdown with charts
   - **Carbon Credits Tab:** View carbon stock and credit estimates

5. **Export Data**
   - Export as CSV for raw data
   - Export as PDF for formatted reports
   - Export as GeoJSON for GIS applications

## 🗂️ Project Structure

```
land-classification/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── satellite/route.ts    # Satellite data API
│   │   │   ├── classify/route.ts     # Land classification API
│   │   │   └── carbon/route.ts       # Carbon estimation API
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Main page
│   ├── components/
│   │   ├── MapComponent.tsx          # Interactive map
│   │   ├── Dashboard.tsx             # Results dashboard
│   │   └── Charts.tsx                # Chart components
│   ├── lib/
│   │   ├── earthEngine.ts            # Earth Engine utilities
│   │   └── export.ts                 # Export functions
│   └── types/
│       └── earthengine.d.ts          # TypeScript definitions
├── public/                           # Static assets
├── .env.local                        # Environment variables (not committed)
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
└── next.config.ts                    # Next.js config
```

## 🌐 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/land-classification)

### Deploy to Other Platforms

This is a standard Next.js app and can be deployed to:
- Netlify
- AWS Amplify
- Google Cloud Run
- Self-hosted with PM2

See [Next.js Deployment Documentation](https://nextjs.org/docs/deployment) for details.

## 🔐 Security Notes

- **Never commit** your `.env.local` file or `service-account-key.json`
- **Rotate credentials** regularly
- **Limit service account permissions** to minimum required
- **Use environment variables** for all sensitive data
- **Enable API restrictions** in Google Cloud Console

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Earth Engine](https://earthengine.google.com/) for satellite imagery
- [ESA WorldCover](https://esa-worldcover.org/) for land cover data
- [Sentinel-2](https://sentinel.esa.int/web/sentinel/missions/sentinel-2) for optical imagery
- [Leaflet](https://leafletjs.com/) for mapping functionality
- [Chart.js](https://www.chartjs.org/) for data visualization

## 📧 Contact

Your Name - [@your_twitter](https://twitter.com/your_twitter) - your.email@example.com

Project Link: [https://github.com/YOUR_USERNAME/land-classification](https://github.com/YOUR_USERNAME/land-classification)

## 🐛 Known Issues

- Earth Engine API has rate limits (5000 requests/day for free tier)
- Large polygons may take longer to process
- Sentinel-2 imagery may not be available for all dates/locations

## 🔮 Future Enhancements

- [ ] Historical time-series analysis
- [ ] Multiple polygon comparison
- [ ] Custom date range selection
- [ ] Additional satellite datasets (Landsat, MODIS)
- [ ] Machine learning for custom classification
- [ ] Real-time change detection alerts
- [ ] User authentication and saved analyses

---

Made with ❤️ using Next.js and Google Earth Engine
