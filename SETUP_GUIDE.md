# Carbon Monitoring System - Setup Guide

## Local Model Integration

This guide explains how to run the carbon monitoring system with local ML models for AGB and SOC predictions.

## Prerequisites

1. **Python 3.8+** installed
2. **Node.js 18+** installed
3. **Model files** in `python/models/`:
   - `AGB_model.pkl` (Above Ground Biomass model)
   - `SOC_model.pkl` (Soil Organic Carbon model)

## Quick Start

### 1. Start the Model Server

The system requires a Python server to run inference with the local ML models.

**Windows (PowerShell):**
```powershell
.\start-model-server.ps1
```

**Linux/Mac:**
```bash
chmod +x start-model-server.sh
./start-model-server.sh
```

**Manual Start:**
```bash
# Install dependencies
pip install -r requirements.txt

# Run server
python python/model_server.py
```

The model server will start on `http://localhost:5000`

### 2. Start the Next.js Application

In a **separate terminal**:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Environment Variables

Create a `.env.local` file with the following:

```env
# Google Earth Engine credentials (required)
GEE_PRIVATE_KEY=<your-service-account-private-key>
GEE_SERVICE_ACCOUNT_EMAIL=<service-account@project.iam.gserviceaccount.com>
GEE_PROJECT_ID=<google-cloud-project-id>

# Model server URL (optional, defaults to http://localhost:5000)
MODEL_SERVER_URL=http://localhost:5000
```

## Architecture

```
User Request → Next.js API Routes → Google Earth Engine (satellite data)
                    ↓
            Python Model Server (local ML models)
                    ↓
            AGB/SOC Predictions → Dashboard
```

### Data Flow

1. **User draws polygon** on map
2. **Next.js API fetches satellite data** from Google Earth Engine:
   - Sentinel-1 (SAR data)
   - Sentinel-2 (optical bands, NDVI)
   - SRTM (elevation, slope)
   - ETH Global Canopy Height
3. **Features sent to local model server** for predictions
4. **Model server returns** AGB, BGB, and SOC estimates
5. **Dashboard displays** carbon stock analysis

## API Endpoints

### Model Server Endpoints

- `GET /health` - Health check
- `POST /predict/agb` - Predict Above Ground Biomass
- `POST /predict/soc` - Predict Soil Organic Carbon
- `POST /predict/batch` - Batch predictions

### Next.js API Routes

- `POST /api/predict-agb` - Fetch satellite data and predict AGB
- `POST /api/carbon-monitoring` - Comprehensive carbon analysis
- `POST /api/satellite` - Satellite imagery and indices
- `POST /api/classify` - Land cover classification

## Model Requirements

### AGB Model Features (20 features)
```python
[latitude, longitude, height, VV, VH, VH_ent, VH_var,
 B2, B3, B4, B5, B6, B7, B8, B11, B12,
 NDVI, NDVI_sigma, elevation, slope]
```

### SOC Model Features
```python
[NDVI, elevation, slope, temperature, precipitation,
 B2, B3, B4, B8, B11, latitude, longitude]
```

## Troubleshooting

### Model Server Not Running

**Error:** `Model server is not running. Please start it with: python python/model_server.py`

**Solution:** Start the model server in a separate terminal before using the application.

### Port Already in Use

**Error:** `Address already in use: 5000`

**Solution:** 
1. Change the port in `.env.local`: `MODEL_SERVER_URL=http://localhost:5001`
2. Start server with: `PORT=5001 python python/model_server.py`

### Model Loading Errors

**Error:** `Failed to load AGB/SOC model`

**Solution:**
1. Verify model files exist in `python/models/`
2. Ensure models are pickle (.pkl) files
3. Check model compatibility with installed scikit-learn version

### Earth Engine Authentication Errors

**Error:** `Google Earth Engine not initialized`

**Solution:**
1. Verify `.env.local` has correct GEE credentials
2. Check private key format (newlines should be literal `\n` in the file)
3. Ensure service account has Earth Engine API enabled

## Development

### Running Tests

```bash
# Test model server
curl http://localhost:5000/health

# Test AGB prediction
curl -X POST http://localhost:5000/predict/agb \
  -H "Content-Type: application/json" \
  -d '{"features": {...}}'
```

### Monitoring Logs

Model server logs show:
- ✅ Successful predictions
- ⚠️ Warnings (missing features)
- ❌ Errors with details

Next.js API logs show:
- 🌍 Earth Engine operations
- 🛰️ Satellite data fetching
- 🤖 Model server calls
- 💚 Carbon stock calculations

## Production Deployment

For production, consider:

1. **Deploy model server separately** (e.g., on AWS Lambda, Google Cloud Run)
2. **Update MODEL_SERVER_URL** to production URL
3. **Add authentication** to model server endpoints
4. **Scale with load balancing** for high traffic
5. **Monitor model performance** and retrain periodically

## Model Updates

To update models:

1. Train new models using notebooks in `ml/` folder
2. Save as `.pkl` files with pickle
3. Replace files in `python/models/`
4. Restart model server

No code changes needed if feature order remains the same.

## Support

For issues:
1. Check logs in both terminals (Next.js and Python server)
2. Verify all dependencies are installed
3. Ensure model files are not corrupted
4. Check Earth Engine quota limits

## License

See [LICENSE](LICENSE) file for details.
