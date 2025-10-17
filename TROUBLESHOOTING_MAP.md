# Map Not Visible - Troubleshooting Guide

## Issue
Leaflet map not showing up in the browser - gray box or blank area appears instead.

## Root Causes & Solutions

### ✅ Fix #1: Leaflet Icon Path Issue in Next.js
**Problem**: Leaflet's default marker icons don't load in Next.js because of webpack bundling.

**Solution**: Add icon configuration at the top of MapComponent.tsx:
```tsx
// Fix Leaflet default marker icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});
```

### ✅ Fix #2: Map Container Height
**Problem**: Map container needs explicit height to render.

**Solution**: Set explicit height on both container and map div:
```tsx
<div className="relative w-full" style={{ height: '500px' }}>
  <div 
    id="map" 
    className="w-full h-full rounded-lg shadow-lg" 
    style={{ height: '500px', zIndex: 0 }} 
  />
</div>
```

### ✅ Fix #3: Global CSS for Leaflet
**Problem**: Leaflet container needs proper CSS rules.

**Solution**: Add to globals.css:
```css
/* Ensure Leaflet map renders properly */
.leaflet-container {
  height: 100%;
  width: 100%;
  z-index: 0;
}

.leaflet-control-container {
  z-index: 1000;
}
```

### ✅ Fix #4: Map Size Invalidation
**Problem**: Map doesn't resize properly after initialization.

**Solution**: Force resize after mount:
```tsx
// Force map to resize properly
setTimeout(() => {
  map.invalidateSize();
}, 100);
```

## Quick Checklist

When map is not visible, check:

- [ ] **Leaflet CSS imported** in component
  ```tsx
  import 'leaflet/dist/leaflet.css';
  import 'leaflet-draw/dist/leaflet.draw.css';
  ```

- [ ] **Container has explicit height**
  ```tsx
  style={{ height: '500px' }}
  ```

- [ ] **Map initialized only once** (not in infinite loop)
  ```tsx
  useEffect(() => { /* map init */ }, []); // Empty deps!
  ```

- [ ] **Icon paths configured** (see Fix #1)

- [ ] **Browser console shows no errors**

- [ ] **Network tab shows tiles loading** (should see requests to tile.openstreetmap.org)

## Common Issues After Fixes

### Issue: Map shows but tiles don't load
**Symptoms**: Gray grid appears, no map imagery
**Cause**: Network issue or tile server problem
**Solution**: 
1. Check internet connection
2. Open browser DevTools → Network tab
3. Look for failed requests to openstreetmap.org
4. Try different tile server or wait and retry

### Issue: Map shows but drawing tools don't appear
**Symptoms**: Map renders, no polygon/rectangle buttons
**Cause**: Leaflet-Draw CSS not loaded
**Solution**:
```tsx
import 'leaflet-draw/dist/leaflet.draw.css'; // Make sure this is imported
```

### Issue: Can draw but polygons don't trigger callbacks
**Symptoms**: Drawing works but analysis doesn't start
**Cause**: Event handlers not properly set up
**Solution**: Check that event listeners are using refs:
```tsx
onPolygonCreatedRef.current(geojson); // Use ref!
```

## Verification Steps

1. **Start the dev server**:
   ```bash
   npm run dev
   ```

2. **Open browser DevTools** (F12)

3. **Check Console** - Should see no errors

4. **Check Network tab** - Should see:
   - ✅ Requests to `tile.openstreetmap.org`
   - ✅ Status 200 for tiles
   - ✅ CSS files loaded

5. **Inspect the map element**:
   ```
   Right-click map area → Inspect
   ```
   - Should see `<div id="map" class="leaflet-container">`
   - Should have explicit height style
   - Should contain `.leaflet-map-pane` child elements

6. **Test interactivity**:
   - ✅ Can zoom in/out
   - ✅ Can pan around
   - ✅ Drawing controls visible
   - ✅ Can draw polygons

## Still Not Working?

### Hard Reset
```bash
# Stop the dev server
# Delete .next folder
rm -rf .next

# Clear node_modules (optional)
rm -rf node_modules
npm install

# Restart
npm run dev
```

### Check Leaflet Version
Ensure compatible versions:
```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "leaflet-draw": "^1.0.4",
  "@types/leaflet": "^1.9.8",
  "@types/leaflet-draw": "^1.0.11"
}
```

### Browser Compatibility
Test in different browser:
- Chrome/Edge (best support)
- Firefox
- Safari

### Clear Browser Cache
Hard reload: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

## Expected Result

After all fixes, you should see:

✅ **Full interactive map** with street tiles
✅ **Zoom controls** (+ and - buttons)
✅ **Drawing toolbar** (polygon, rectangle icons)
✅ **Smooth panning and zooming**
✅ **Ability to draw polygons**
✅ **Map centered on India** (20.59°N, 78.96°E)

## Screenshot of Working Map

You should see:
- World map with street view
- Drawing controls in top-right corner
- Zoom controls in top-left
- Attribution at bottom
- Instruction text overlay at bottom-left

---

## Applied Fixes Summary

All fixes have been applied to your project:

✅ **Icon paths configured** - MapComponent.tsx updated
✅ **Container height set** - Explicit 500px height
✅ **Global CSS added** - globals.css updated
✅ **Map invalidation** - setTimeout for resize
✅ **Z-index fixed** - Proper layering

**Your map should now be fully visible and functional!** 🗺️

If you're still having issues after these fixes, check the browser console for specific error messages.
