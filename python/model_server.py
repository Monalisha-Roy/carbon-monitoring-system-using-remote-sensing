"""
Model Inference Server for AGB and SOC Predictions
Serves pre-trained ML models via HTTP endpoints
"""

import pickle
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
import warnings

# Suppress version warnings
warnings.filterwarnings('ignore', category=UserWarning)
warnings.filterwarnings('ignore', category=FutureWarning)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js API calls

# Model paths
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
AGB_MODEL_PATH = os.path.join(MODELS_DIR, 'AGB_model.pkl')
SOC_MODEL_PATH = os.path.join(MODELS_DIR, 'SOC_model.pkl')

# Load models at startup
agb_model = None
soc_model = None

def load_models():
    """Load pre-trained models from disk"""
    global agb_model, soc_model
    
    # Try to load AGB model
    try:
        with open(AGB_MODEL_PATH, 'rb') as f:
            agb_model = pickle.load(f)
        logger.info(f"AGB model loaded successfully from {AGB_MODEL_PATH}")
        logger.info(f"   Model type: {type(agb_model).__name__}")
    except Exception as e:
        logger.error(f"Failed to load AGB model: {e}")
        agb_model = None
    
    # Try to load SOC model with multiple approaches
    try:
        with open(SOC_MODEL_PATH, 'rb') as f:
            soc_model = pickle.load(f)
        logger.info(f"SOC model loaded successfully from {SOC_MODEL_PATH}")
        logger.info(f"   Model type: {type(soc_model).__name__}")
    except Exception as e:
        logger.warning(f"Could not load SOC model with pickle: {e}")
        # Try joblib as fallback
        try:
            import joblib
            soc_model = joblib.load(SOC_MODEL_PATH)
            logger.info(f"SOC model loaded with joblib from {SOC_MODEL_PATH}")
        except Exception as e2:
            logger.error(f"Failed to load SOC model with joblib: {e2}")
            soc_model = None
    
    if agb_model is None and soc_model is None:
        raise RuntimeError("Failed to load any models!")
    
    if agb_model is None:
        logger.warning("AGB model not available - will use fallback estimates")
    if soc_model is None:
        logger.warning("SOC model not available - will use fallback estimates")

# Load models when app starts
try:
    load_models()
except Exception as e:
    logger.error(f"Critical error loading models: {e}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'models': {
            'agb': agb_model is not None,
            'soc': soc_model is not None
        }
    })

@app.route('/predict/agb', methods=['POST'])
def predict_agb():
    """
    Predict Above Ground Biomass (AGB)
    
    Expected input features (20):
    - latitude, longitude, height
    - VV, VH, VH_ent, VH_var (Sentinel-1 SAR)
    - B2, B3, B4, B5, B6, B7, B8, B11, B12 (Sentinel-2 optical)
    - NDVI, NDVI_sigma
    - elevation, slope
    """
    try:
        data = request.get_json()
        
        if not data or 'features' not in data:
            return jsonify({'error': 'Missing features in request'}), 400
        
        features = data['features']
        
        # Expected feature order (must match training data - 19 features)
        # Note: 'height' (canopy height) removed as model was trained without it
        feature_names = [
            'latitude', 'longitude',
            'VV', 'VH', 'VH_ent', 'VH_var',
            'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B11', 'B12',
            'NDVI', 'NDVI_sigma',
            'elevation', 'slope'
        ]
        
        # Extract features in correct order
        feature_values = []
        missing_features = []
        
        for feature_name in feature_names:
            if feature_name not in features:
                missing_features.append(feature_name)
                feature_values.append(0.0)  # Default to 0 for missing features
            else:
                feature_values.append(float(features[feature_name]))
        
        if missing_features:
            logger.warning(f"Missing features (using 0): {missing_features}")
        
        # Convert to numpy array and reshape for prediction
        X = np.array([feature_values])
        
        # Check if model is available
        if agb_model is None:
            # Fallback: estimate AGB from NDVI (simplified empirical relationship)
            ndvi = features.get('NDVI', 0.5)
            agb_prediction = max(0, ndvi * 100)  # Rough estimate
            logger.warning(f"Using fallback AGB estimate: {agb_prediction:.2f} t/ha")
        else:
            # Make prediction
            agb_prediction = agb_model.predict(X)[0]
            logger.info(f"AGB prediction: {agb_prediction:.2f} t/ha")
        
        return jsonify({
            'success': True,
            'agb': float(agb_prediction),
            'bgb': float(agb_prediction * 0.2),  # BGB as 20% of AGB (root-to-shoot ratio per MacDicken 1997)
            'features_used': len(feature_values),
            'missing_features': missing_features
        })
        
    except Exception as e:
        logger.error(f"Error predicting AGB: {e}")
        return jsonify({
            'error': 'Prediction failed',
            'details': str(e)
        }), 500

@app.route('/predict/soc', methods=['POST'])
def predict_soc():
    """
    Predict Soil Organic Carbon (SOC)
    
    Expected input features vary based on training data.
    Common features include climate, vegetation indices, terrain, etc.
    """
    try:
        data = request.get_json()
        
        if not data or 'features' not in data:
            return jsonify({'error': 'Missing features in request'}), 400
        
        features = data['features']
        
        # For SOC, we'll accept features as a list or dict
        # and try to extract them intelligently
        if isinstance(features, list):
            feature_values = features
        elif isinstance(features, dict):
            # SOC model expects 16 features - match TABLE II from training data:
            # B2, B3, B4, B8, B11 (Sentinel-2)
            # NDVI (derived)
            # VV, VH (Sentinel-1)
            # Elevation, Slope, Aspect (SRTM)
            # Precip_annual (CHIRPS)
            # Temp_mean (ERA5-Land)
            # Soil_texture (OpenLandMap)
            # Latitude, Longitude (geometry)
            soc_feature_names = [
                'B2', 'B3', 'B4', 'B8', 'B11',
                'NDVI',
                'VV', 'VH',
                'elevation', 'slope', 'aspect',
                'precip_annual', 'temp_mean', 'soil_texture',
                'latitude', 'longitude'
            ]
            
            feature_values = []
            missing_features = []
            
            for feature_name in soc_feature_names:
                if feature_name in features:
                    feature_values.append(float(features[feature_name]))
                else:
                    missing_features.append(feature_name)
                    feature_values.append(0.0)
            
            logger.info(f"SOC features received: {list(features.keys())}")
            logger.info(f"SOC feature values: {feature_values}")
            
            if missing_features:
                logger.warning(f"Missing SOC features (using 0): {missing_features}")
        else:
            return jsonify({'error': 'Invalid features format'}), 400
        
        # Convert to numpy array and reshape for prediction
        X = np.array([feature_values])
        
        # Get bulk density for unit conversion (default 1.3 g/cm³ if not provided)
        bulk_density = features.get('bulk_density', 1.3) if isinstance(features, dict) else 1.3
        soil_depth = 30  # cm (standard depth for SOC measurement)
        
        # Check if model is available
        if soc_model is None:
            # Fallback: estimate SOC from NDVI and elevation (simplified)
            ndvi = features.get('NDVI', 0.5) if isinstance(features, dict) else 0.5
            elevation = features.get('elevation', 100) if isinstance(features, dict) else 100
            # Higher NDVI and lower elevation typically mean more SOC
            soc_concentration = max(0, 20 + ndvi * 40 - elevation * 0.01)  # g/kg
            logger.warning(f"Using fallback SOC estimate: {soc_concentration:.2f} g/kg")
        else:
            # Make prediction - model outputs SOC concentration in g/kg
            soc_concentration = soc_model.predict(X)[0]
            logger.info(f"SOC concentration (model output): {soc_concentration:.2f} g/kg")
        
        # Convert SOC from g/kg to t/ha using formula: SOC_stock = H × BD × OC × 10
        # where H = soil depth (cm), BD = bulk density (g/cm³), OC = organic carbon (g/kg)
        # Factor 10 converts to tonnes per hectare
        soc_stock = soil_depth * bulk_density * soc_concentration * 0.01  # Simplified: H * BD * OC / 100
        logger.info(f"SOC stock (converted): {soc_stock:.2f} t/ha (H={soil_depth}cm, BD={bulk_density} g/cm³)")
        
        return jsonify({
            'success': True,
            'soc': float(soc_stock),  # Return in t/ha
            'soc_concentration': float(soc_concentration),  # Also return raw g/kg value
            'bulk_density': float(bulk_density),
            'soil_depth_cm': soil_depth,
            'features_used': len(feature_values)
        })
        
    except Exception as e:
        logger.error(f"Error predicting SOC: {e}")
        return jsonify({
            'error': 'Prediction failed',
            'details': str(e)
        }), 500

@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    """
    Batch prediction for both AGB and SOC
    Useful for multi-temporal analysis
    """
    try:
        data = request.get_json()
        
        if not data or 'samples' not in data:
            return jsonify({'error': 'Missing samples in request'}), 400
        
        samples = data['samples']
        results = []
        
        for idx, sample in enumerate(samples):
            try:
                # Predict AGB
                agb_features = sample.get('features', {})
                agb_result = predict_agb_internal(agb_features)
                
                # Predict SOC
                soc_result = predict_soc_internal(agb_features)
                
                results.append({
                    'index': idx,
                    'agb': agb_result['agb'],
                    'bgb': agb_result['bgb'],
                    'soc': soc_result['soc'],
                    'date': sample.get('date'),
                    'success': True
                })
            except Exception as e:
                results.append({
                    'index': idx,
                    'error': str(e),
                    'success': False
                })
        
        return jsonify({
            'success': True,
            'results': results
        })
        
    except Exception as e:
        logger.error(f"Error in batch prediction: {e}")
        return jsonify({
            'error': 'Batch prediction failed',
            'details': str(e)
        }), 500

def predict_agb_internal(features):
    """Internal helper for AGB prediction"""
    feature_names = [
        'latitude', 'longitude',
        'VV', 'VH', 'VH_ent', 'VH_var',
        'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B11', 'B12',
        'NDVI', 'NDVI_sigma',
        'elevation', 'slope'
    ]
    
    feature_values = [float(features.get(f, 0.0)) for f in feature_names]
    X = np.array([feature_values])
    agb = agb_model.predict(X)[0]
    
    return {
        'agb': float(agb),
        'bgb': float(agb * 0.24)
    }

def predict_soc_internal(features):
    """Internal helper for SOC prediction"""
    common_soc_features = [
        'latitude', 'longitude',
        'VV', 'VH',
        'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B11', 'B12',
        'NDVI',
        'elevation', 'slope'
    ]
    
    feature_values = [float(features.get(f, 0.0)) for f in common_soc_features]
    X = np.array([feature_values])
    soc = soc_model.predict(X)[0]
    
    return {'soc': float(soc)}

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Starting model server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
