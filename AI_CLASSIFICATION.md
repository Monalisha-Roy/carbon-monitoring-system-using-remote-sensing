# 🤖 AI-Powered Land Classification

## Overview
Your land classification system now uses **AI/Machine Learning** models by default for land cover analysis.

## AI Models Used

### 1. Dynamic World (Primary - AI-Based)
- **Type**: Deep Learning Convolutional Neural Network (CNN)
- **Provider**: Google Earth Engine
- **Resolution**: 10 meters
- **Coverage**: Global
- **Update Frequency**: Near real-time (every 2-5 days)
- **Training**: Trained on millions of Sentinel-2 satellite images

**Features**:
- ✓ Real-time AI classification
- ✓ Temporal consistency analysis  
- ✓ Pixel-level confidence scores
- ✓ 9 land cover classes
- ✓ Handles seasonal variations

**Classes**:
1. Water
2. Trees
3. Grass
4. Flooded vegetation
5. Crops
6. Shrub and scrub
7. Built areas
8. Bare ground
9. Snow and ice

### 2. ESA WorldCover (Fallback)
- **Type**: Random Forest + Deep Learning
- **Resolution**: 10 meters
- **Coverage**: Global
- **Year**: 2021 (static dataset)
- **Training**: Sentinel-1 & Sentinel-2 imagery

## How It Works

1. **Data Collection**: System fetches Sentinel-2 satellite imagery for your polygon
2. **AI Processing**: Dynamic World's neural network analyzes each pixel
3. **Classification**: AI assigns most likely land cover class
4. **Temporal Analysis**: Multiple observations over time increase accuracy
5. **Results**: Pixel-level classifications with confidence scores

## API Configuration

The classification API (`/api/classify`) now uses AI by default:

```typescript
{
  geometry: yourPolygon,
  startDate: '2023-01-01',
  endDate: '2025-10-22',
  useDynamicWorld: true  // AI classification enabled by default
}
```

## UI Updates

The Dashboard now shows:
- 🤖 AI-Powered indicator
- Model name and type
- AI features and capabilities
- Confidence information
- Real-time classification badge

## Advantages of AI Classification

1. **More Accurate**: Deep learning captures complex patterns
2. **Up-to-date**: Near real-time updates
3. **Consistent**: Temporal analysis reduces noise
4. **Detailed**: 10m resolution pixel-level classification
5. **Adaptive**: Handles seasonal and regional variations

## Future Enhancements

Possible additions:
- Custom AI model training
- Transfer learning for specific regions
- Multi-model ensemble predictions
- Uncertainty quantification
- Change detection using AI
- Semantic segmentation for finer details

## Technical Details

**Model Architecture**: 
- Fully Convolutional Network (FCN)
- Trained on multi-spectral Sentinel-2 bands
- Uses temporal context (multiple time steps)
- Outputs probability distribution over classes

**Confidence Scoring**:
- Based on temporal consistency
- Higher confidence when multiple observations agree
- Lower confidence at class boundaries

## Testing

To test the AI classification:
1. Draw a polygon on the map
2. Go to "Land Classification" tab
3. Look for the 🤖 AI-Powered indicator
4. See model details and features
5. View classified results with statistics

---

Your system now uses cutting-edge AI for land cover classification! 🚀
