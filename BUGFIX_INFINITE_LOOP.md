# Bug Fix: Maximum Update Depth Exceeded

## Problem
The application was experiencing an infinite re-render loop with the error:
```
Maximum update depth exceeded. This can happen when a component calls setState 
inside useEffect, but useEffect either doesn't have a dependency array, or one 
of the dependencies changes on every render.
```

## Root Cause
The `MapComponent` had a `useEffect` dependency array that included:
```tsx
}, [mapInitialized, onPolygonCreated, onPolygonUpdated]);
```

The issue was that `onPolygonCreated` and `onPolygonUpdated` are callback functions passed from the parent component. In React, **functions are recreated on every render** unless they are wrapped in `useCallback`. This meant:

1. Parent renders → creates new function references
2. MapComponent receives new props → useEffect runs (dependencies changed)
3. useEffect calls `setMapInitialized(true)` → triggers re-render
4. Parent re-renders → creates new function references again
5. **Infinite loop!** 🔄

## Solution

### Part 1: Fix MapComponent Dependencies
Changed the `useEffect` to only run once on mount by removing the problematic dependencies:

**Before:**
```tsx
}, [mapInitialized, onPolygonCreated, onPolygonUpdated]);
```

**After:**
```tsx
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

### Part 2: Use Refs for Callbacks
To ensure the callbacks still work correctly when they change, we use refs:

```tsx
// Store callbacks in refs to avoid recreating the map on callback changes
const onPolygonCreatedRef = useRef(onPolygonCreated);
const onPolygonUpdatedRef = useRef(onPolygonUpdated);

// Update refs when callbacks change
useEffect(() => {
  onPolygonCreatedRef.current = onPolygonCreated;
  onPolygonUpdatedRef.current = onPolygonUpdated;
}, [onPolygonCreated, onPolygonUpdated]);
```

Then use the refs in event handlers:
```tsx
map.on(L.Draw.Event.CREATED, (event: any) => {
  // ... layer creation code ...
  onPolygonCreatedRef.current(geojson); // Use ref instead of prop
});
```

### Part 3: Use useCallback in Parent Component
Wrapped the callback functions in `useCallback` to prevent unnecessary recreations:

```tsx
// Move analyzePolygon before handlePolygonCreated
const analyzePolygon = useCallback(async (geo: Feature<Polygon>) => {
  // ... analysis logic ...
}, [startDate, endDate]);

const handlePolygonCreated = useCallback(async (geojson: Feature<Polygon>) => {
  setPolygon(geojson);
  setError(null);
  await analyzePolygon(geojson);
}, [analyzePolygon]);
```

## Why This Works

1. **Map initializes only once**: The empty dependency array `[]` ensures the map is created once on mount
2. **Callbacks stay current**: The ref pattern ensures we always call the latest callback version
3. **No unnecessary re-renders**: `useCallback` memoizes functions, preventing prop changes
4. **Proper cleanup**: The cleanup function in useEffect still runs on unmount

## Key Lessons

### ✅ Do's
- Use `useCallback` for functions passed as props to child components
- Use refs to store callback references in components that shouldn't re-render
- Keep `useEffect` dependency arrays minimal and intentional
- Use empty `[]` for effects that should only run once on mount

### ❌ Don'ts
- Don't include function props directly in useEffect dependencies
- Don't recreate functions on every render (use useCallback)
- Don't ignore useEffect dependency warnings without understanding them
- Don't call setState in useEffect without proper guards

## Testing the Fix

After the fix:
1. ✅ Map loads once and doesn't re-initialize
2. ✅ Drawing polygons works correctly
3. ✅ Callbacks fire when polygons are created/edited
4. ✅ No infinite loops or console errors
5. ✅ Date changes don't recreate the map
6. ✅ Analysis function can be reused without issues

## Related React Patterns

This fix demonstrates several important React patterns:

1. **useCallback Hook**: Memoize functions to prevent recreations
   ```tsx
   const memoizedFn = useCallback(() => { /* logic */ }, [deps]);
   ```

2. **useRef for Latest Values**: Store values that don't trigger re-renders
   ```tsx
   const latestValue = useRef(value);
   useEffect(() => { latestValue.current = value; }, [value]);
   ```

3. **Empty Dependency Array**: Run effect only on mount
   ```tsx
   useEffect(() => { /* runs once */ }, []);
   ```

4. **Cleanup Functions**: Clean up side effects on unmount
   ```tsx
   useEffect(() => {
     // setup
     return () => { /* cleanup */ };
   }, []);
   ```

## Performance Impact

**Before Fix:**
- Map re-initialized on every render (expensive!)
- Multiple Leaflet instances created
- Memory leaks from unreleased map instances
- Sluggish UI performance

**After Fix:**
- Map initialized once
- Single Leaflet instance
- Proper cleanup on unmount
- Smooth UI performance

---

**Status**: ✅ **FIXED**

No more infinite loops! The application now renders efficiently and correctly. 🎉
