# Carbon Monitoring System using Remote Sensing

A Next.js application for estimating carbon stocks using **local ML models** and **Google Earth Engine** satellite data. The system calculates Above Ground Biomass (AGB), Below Ground Biomass (BGB), and Soil Organic Carbon (SOC) for user-drawn polygons.

## Features

- **Interactive Map**: Draw polygons to analyze any area of interest
- **ML-Based Predictions**: XGBoost (AGB) and Random Forest (SOC) models
- **Satellite Data Integration**: Sentinel-1, Sentinel-2, SRTM, CHIRPS, ERA5 via Google Earth Engine
- **Carbon Stock Comparison**: Compare carbon stocks between two years (2016-present)
- **Carbon Credit Estimation**: Calculate potential carbon credits and monetary value
- **Comprehensive Analysis**: AGB, BGB, SOC, and total carbon density calculations

## 🏗️ Architecture

```
Frontend (Next.js + React + Leaflet)
    ↓
API Routes (Next.js Serverless Functions)
    ↓
┌─────────────────────┬──────────────────────┐
│   Google Earth      │   Python Model       │
│   Engine API        │   Server (Flask)     │
│   (Satellite Data)  │   (ML Predictions)   │
└─────────────────────┴──────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.8+
- Google Earth Engine service account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd carbon-monitoring-system-using-remote-sensing
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   
   Create `.env.local` in the root directory:
   ```env
   GEE_PRIVATE_KEY=<your-gee-private-key>
   GEE_SERVICE_ACCOUNT_EMAIL=<your-service-account@project.iam.gserviceaccount.com>
   GEE_PROJECT_ID=<your-project-id>
   MODEL_SERVER_URL=http://localhost:5000
   ```

### Running the Application

**Important:** You need to run TWO servers simultaneously:

#### Terminal 1: Start Model Server

```bash
cd python
python model_server.py
```

This starts the Python Flask server on `http://localhost:5000`

#### Terminal 2: Start Next.js App

```bash
npm run dev
```

This starts the Next.js app on `http://localhost:3000`

### Verify Setup

1. Open `http://localhost:3000` in your browser
2. Draw a polygon on the map
3. Click "Analyze" to fetch carbon stock estimates

## 📊 Data Sources

### Satellite Data (via Google Earth Engine)
- **Sentinel-1 GRD**: SAR data (VV, VH polarizations)
- **Sentinel-2 Surface Reflectance**: Optical bands (B2-B12)
- **SRTM DEM**: Elevation, slope, and aspect
- **CHIRPS**: Annual precipitation data
- **ERA5-Land**: Temperature data
- **OpenLandMap**: Soil texture and bulk density

### ML Models
- **AGB Model**: `python/models/AGB_model.pkl` - Trained on NE India data
- **SOC Model**: `python/models/SOC_model.pkl` - Soil organic carbon prediction

## 🔧 API Endpoints

### Next.js API Routes

| Endpoint | Description |
|----------|-------------|
| `POST /api/carbon-monitoring` | Carbon stock analysis with year-to-year comparison |

### Python Model Server

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `POST /predict/agb` | Predict Above Ground Biomass |
| `POST /predict/soc` | Predict Soil Organic Carbon |
| `POST /predict/batch` | Batch predictions for time series |

## 📁 Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/              # Next.js API routes
│   │   │   └── carbon-monitoring/  # Main carbon analysis endpoint
│   │   ├── page.tsx          # Main application page
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── MapComponent.tsx  # Leaflet map with polygon drawing
│   ├── lib/
│   │   └── earthEngine.ts    # Google Earth Engine client
│   └── types/
│       └── earthengine.d.ts  # Earth Engine TypeScript definitions
├── python/
│   ├── models/               # ML model files
│   │   ├── AGB_model.pkl
│   │   └── SOC_model.pkl
│   └── model_server.py       # Flask inference server
├── ml/                       # Jupyter notebooks for model training
├── requirements.txt          # Python dependencies
└── package.json              # Node.js dependencies
```

## 🧪 Testing

### Test Model Server

```bash
# Health check
curl http://localhost:5000/health

# Test AGB prediction
curl -X POST http://localhost:5000/predict/agb \
  -H "Content-Type: application/json" \
  -d '{
    "features": {
      "latitude": 26.0,
      "longitude": 92.0,
      "height": 15.0,
      "VV": -12.0,
      "VH": -20.0,
      "NDVI": 0.7,
      "elevation": 100.0,
      "slope": 5.0
    }
  }'
```

### Test Next.js API

Open browser console and run:
```javascript
fetch('/api/carbon-monitoring', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    geometry: {
      type: 'Polygon',
      coordinates: [[[92.0, 26.0], [92.1, 26.0], [92.1, 26.1], [92.0, 26.1], [92.0, 26.0]]]
    },
    startYear: 2020,
    endYear: 2024
  })
}).then(r => r.json()).then(console.log)
```

## 🐛 Troubleshooting

### Model Server Not Running

**Error:** `Model server is not running`

**Solution:** Start the Python server in a separate terminal before using the app.

### Earth Engine Authentication Failed

**Error:** `401 Unauthorized`

**Solution:** 
1. Check `.env.local` has correct credentials
2. Verify private key formatting (literal `\n` in file)
3. Ensure service account has Earth Engine API enabled

### Port Already in Use

**Error:** `Address already in use: 5000`

**Solution:**
```bash
# Change port
PORT=5001 python python/model_server.py

# Update .env.local
MODEL_SERVER_URL=http://localhost:5001
```

### Missing Model Files

**Error:** `Failed to load AGB/SOC model`

**Solution:** Ensure `AGB_model.pkl` and `SOC_model.pkl` exist in `python/models/`

## 📚 Documentation

- [Setup Guide](SETUP_GUIDE.md) - Detailed installation and configuration
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - Project architecture and patterns
- Training notebooks in `ml/` folder

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

See [LICENSE](LICENSE) file for details.

## Acknowledgments

- Google Earth Engine for satellite data access
- Sentinel-1 and Sentinel-2 missions
- OpenLandMap and WCMC for reference datasets
- Northeast India forest survey data for model training

## Support

For issues and questions:
1. Check [SETUP_GUIDE.md](SETUP_GUIDE.md)
2. Review console logs in both terminals
3. Verify all dependencies are installed
4. Open an issue on GitHub

---

**Made using Next.js 15, Google Earth Engine, and Machine Learning**
