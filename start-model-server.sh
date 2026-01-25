#!/bin/bash
# Start Model Server Script (Unix/Linux/Mac)
# This script starts the Python model inference server

echo "🚀 Starting Carbon Monitoring Model Server..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python3 is not installed or not in PATH"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/upgrade requirements
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt --quiet

# Check if model files exist
if [ ! -f "python/models/AGB_model.pkl" ]; then
    echo "❌ Error: AGB_model.pkl not found in python/models/"
    exit 1
fi

if [ ! -f "python/models/SOC_model.pkl" ]; then
    echo "❌ Error: SOC_model.pkl not found in python/models/"
    exit 1
fi

echo "✅ Model files found"

# Start the model server
echo "🌟 Starting model server on http://localhost:5000"
echo "Press Ctrl+C to stop the server"
echo ""

python python/model_server.py
