# Map Layers Documentation

## Available Map Layers

The interactive map now includes **3 different view options** that you can switch between using the layer control in the top-right corner of the map.

### 🗺️ Layer Options

#### 1. Street Map (Default)
- **Source**: OpenStreetMap
- **Best For**: General navigation and urban areas
- **Features**:
  - Street names and labels
  - Building outlines
  - Points of interest
  - Clear administrative boundaries
  - Good for urban analysis

#### 2. Satellite
- **Source**: Esri World Imagery
- **Best For**: Pure satellite imagery without distractions
- **Features**:
  - High-resolution satellite imagery
  - No labels or annotations
  - Clear view of terrain and land cover
  - Best for visual land cover inspection
  - Good for comparing with classification results

#### 3. Satellite with Labels ⭐ NEW
- **Source**: Esri World Imagery + CARTO Labels
- **Best For**: Satellite view with geographic context
- **Features**:
  - High-resolution satellite imagery
  - City and place names overlaid
  - Road labels for navigation
  - Administrative boundaries
  - **Perfect for**: Land analysis with geographic reference
  - **Combines**: Imagery detail + location context

## How to Switch Layers

1. Look for the **layers icon** (📄) in the **top-right corner** of the map
2. Click it to open the layer selector
3. Select your preferred view:
   - ○ Street Map
   - ○ Satellite
   - ○ Satellite with Labels

Only one base layer can be active at a time.

## Use Cases by Layer

### For Land Classification Analysis
**Recommended**: **Satellite with Labels**
- See actual land cover (forests, fields, urban areas)
- Know exactly where you are (city/region names)
- Draw precise boundaries using visual landmarks

### For Carbon Credit Baseline
**Recommended**: **Satellite**
- Pure imagery without label clutter
- Better visual comparison with classification overlays
- Clearer view of vegetation patterns

### For Urban Planning
**Recommended**: **Street Map**
- See infrastructure and roads
- Identify specific addresses
- Plan projects with street-level detail

### For General Exploration
**Recommended**: **Satellite with Labels**
- Best of both worlds
- Context + visual detail
- Easy to navigate and understand

## Label Layer Details

The labels overlay uses **CARTO's light labels** which include:
- ✅ City and town names
- ✅ Country and region labels
- ✅ Major road names
- ✅ Water body names
- ✅ Mountain and terrain labels
- ✅ Administrative boundaries

**Style**: Light, semi-transparent labels that don't obscure the satellite imagery

## Technical Details

### Tile Providers

**Street Map**:
```
Source: OpenStreetMap
URL: https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
Max Zoom: 19
```

**Satellite**:
```
Source: Esri World Imagery
URL: https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}
Max Zoom: 19
```

**Labels Overlay**:
```
Source: CARTO Light Labels
URL: https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png
Max Zoom: 19
```

### Layer Implementation

The "Satellite with Labels" is a **layer group** that combines:
1. Base satellite imagery (bottom)
2. Transparent labels (top)

This ensures labels always appear above the imagery while maintaining interactivity.

## Performance Notes

- All layers load tiles on-demand (lazy loading)
- Labels are lightweight and don't impact performance
- Switching between layers is instant (no reload needed)
- Tiles are cached by your browser for faster subsequent loads

## Customization

Want to add more layers? Edit `src/components/MapComponent.tsx`:

```tsx
// Add a new tile layer
const yourLayer = L.tileLayer('https://your-tile-server/{z}/{x}/{y}.png', {
  attribution: 'Your attribution',
  maxZoom: 19,
});

// Add to layer control
const baseMaps = {
  'Street Map': streetMap,
  'Satellite': satellite,
  'Satellite with Labels': satelliteWithLabels,
  'Your Layer': yourLayer, // Add here
};
```

### Other Useful Tile Providers

**Dark Mode Street Map**:
```tsx
const darkMap = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  { attribution: '&copy; CARTO' }
);
```

**Terrain Map**:
```tsx
const terrain = L.tileLayer(
  'https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg',
  { attribution: 'Map tiles by Stamen Design' }
);
```

**OpenTopoMap**:
```tsx
const topo = L.tileLayer(
  'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  { attribution: '&copy; OpenTopoMap' }
);
```

## Troubleshooting

### Labels not showing on satellite view
- Make sure you selected "Satellite with Labels" (not just "Satellite")
- Check browser console for tile loading errors
- Ensure internet connection is stable

### Tiles loading slowly
- Normal for first load (tiles are cached after)
- Check internet speed
- Lower zoom level for faster loading
- CARTO CDN is generally fast and reliable

### Labels hard to read
- Labels are designed to be semi-transparent
- Zoom in for larger, clearer labels
- Try "Street Map" for higher contrast labels

## Best Practices

✅ **Use "Satellite with Labels"** as default for most land analysis work
✅ **Zoom in** before drawing polygons for better accuracy
✅ **Switch layers** to compare and verify your selections
✅ **Use satellite view** when classification results are displayed
✅ **Draw on the layer** that gives you the best visual reference

---

**Updated Map Features**: ✅ 3 layer options | ✅ Labeled satellite view | ✅ Easy layer switching

Enjoy the enhanced mapping experience! 🗺️✨
