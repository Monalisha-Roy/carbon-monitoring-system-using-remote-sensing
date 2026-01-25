# Start Model Server Script
# This script starts the Python model inference server

Write-Host "🚀 Starting Carbon Monitoring Model Server..." -ForegroundColor Green

# Check if Python is installed
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: Python is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if virtual environment exists
if (-not (Test-Path ".\venv")) {
    Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "🔧 Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Install/upgrade requirements
Write-Host "📦 Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet

# Check if model files exist
if (-not (Test-Path ".\python\models\AGB_model.pkl")) {
    Write-Host "❌ Error: AGB_model.pkl not found in python/models/" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path ".\python\models\SOC_model.pkl")) {
    Write-Host "❌ Error: SOC_model.pkl not found in python/models/" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Model files found" -ForegroundColor Green

# Start the model server
Write-Host "🌟 Starting model server on http://localhost:5000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Cyan
Write-Host ""

python python/model_server.py
