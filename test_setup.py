"""
Test script to verify model files and server setup
"""

import sys
import os

def test_model_files():
    """Check if model files exist and can be loaded"""
    print("🔍 Checking model files...")
    
    models_dir = os.path.join(os.path.dirname(__file__), 'python', 'models')
    agb_path = os.path.join(models_dir, 'AGB_model.pkl')
    soc_path = os.path.join(models_dir, 'SOC_model.pkl')
    
    # Check if files exist
    if not os.path.exists(agb_path):
        print(f"❌ AGB_model.pkl not found at {agb_path}")
        return False
    
    if not os.path.exists(soc_path):
        print(f"❌ SOC_model.pkl not found at {soc_path}")
        return False
    
    print("✅ Model files found")
    
    # Try loading models
    try:
        import pickle
        
        print("📦 Loading AGB model...")
        with open(agb_path, 'rb') as f:
            agb_model = pickle.load(f)
        print(f"✅ AGB model loaded successfully (type: {type(agb_model).__name__})")
        
        print("📦 Loading SOC model...")
        with open(soc_path, 'rb') as f:
            soc_model = pickle.load(f)
        print(f"✅ SOC model loaded successfully (type: {type(soc_model).__name__})")
        
        return True
    except Exception as e:
        print(f"❌ Error loading models: {e}")
        return False

def test_dependencies():
    """Check if required Python packages are installed"""
    print("\n🔍 Checking Python dependencies...")
    
    required_packages = {
        'flask': 'Flask',
        'flask_cors': 'flask-cors',
        'numpy': 'numpy',
        'sklearn': 'scikit-learn'
    }
    
    missing = []
    
    for module, package in required_packages.items():
        try:
            __import__(module)
            print(f"✅ {package} installed")
        except ImportError:
            print(f"❌ {package} not installed")
            missing.append(package)
    
    if missing:
        print(f"\n⚠️ Missing packages: {', '.join(missing)}")
        print("Install with: pip install -r requirements.txt")
        return False
    
    return True

def test_model_prediction():
    """Test a sample prediction"""
    print("\n🧪 Testing model predictions...")
    
    try:
        import pickle
        import numpy as np
        
        models_dir = os.path.join(os.path.dirname(__file__), 'python', 'models')
        
        # Load AGB model
        with open(os.path.join(models_dir, 'AGB_model.pkl'), 'rb') as f:
            agb_model = pickle.load(f)
        
        # Create sample features (20 features for AGB)
        sample_features = np.array([[
            26.0,   # latitude
            92.0,   # longitude
            15.0,   # height
            -12.0,  # VV
            -20.0,  # VH
            5.0,    # VH_ent
            10.0,   # VH_var
            0.05,   # B2
            0.08,   # B3
            0.10,   # B4
            0.35,   # B5
            0.40,   # B6
            0.45,   # B7
            0.50,   # B8
            0.30,   # B11
            0.25,   # B12
            0.70,   # NDVI
            0.05,   # NDVI_sigma
            100.0,  # elevation
            5.0     # slope
        ]])
        
        # Make prediction
        agb_prediction = agb_model.predict(sample_features)[0]
        print(f"✅ AGB prediction successful: {agb_prediction:.2f} t/ha")
        
        # Test SOC model
        with open(os.path.join(models_dir, 'SOC_model.pkl'), 'rb') as f:
            soc_model = pickle.load(f)
        
        # SOC features (simplified - adjust based on your model)
        soc_features = np.array([[0.70, 100.0, 5.0, 20.0, 1500.0, 0.05, 0.08, 0.10, 0.50, 0.30, 26.0, 92.0]])
        soc_prediction = soc_model.predict(soc_features)[0]
        print(f"✅ SOC prediction successful: {soc_prediction:.2f} t/ha")
        
        return True
    except Exception as e:
        print(f"❌ Error during prediction test: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("=" * 60)
    print("Carbon Monitoring System - Setup Verification")
    print("=" * 60)
    
    results = []
    
    # Test 1: Dependencies
    results.append(("Dependencies", test_dependencies()))
    
    # Test 2: Model files
    results.append(("Model Files", test_model_files()))
    
    # Test 3: Model predictions
    if results[-1][1]:  # Only if model files loaded successfully
        results.append(("Model Predictions", test_model_prediction()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    all_passed = all(result[1] for result in results)
    
    if all_passed:
        print("\n🎉 All tests passed! You're ready to start the server.")
        print("\nNext steps:")
        print("1. Start model server: python python/model_server.py")
        print("2. Start Next.js app: npm run dev")
        print("3. Open http://localhost:3000")
    else:
        print("\n⚠️ Some tests failed. Please fix the issues above.")
        sys.exit(1)

if __name__ == '__main__':
    main()
