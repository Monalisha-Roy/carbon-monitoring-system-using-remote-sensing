# Map Search Feature Documentation

## 🔍 Location Search Bar

The interactive map now includes a **powerful search bar** that allows you to quickly find and navigate to any location worldwide!

## Features

### ✨ What You Can Search For

The search bar uses **OpenStreetMap's Nominatim** service and can find:

- **Cities and Towns**: "New Delhi", "Mumbai", "Bangalore"
- **Countries**: "India", "Brazil", "Kenya"
- **States/Regions**: "Maharashtra", "California", "Amazon Rainforest"
- **Landmarks**: "Taj Mahal", "Amazon River", "Mount Everest"
- **Addresses**: "123 Main Street, New York"
- **Natural Features**: "Himalayan Mountains", "Western Ghats"
- **Parks and Reserves**: "Jim Corbett National Park", "Sundarbans"
- **Coordinates**: Can also search by lat/long

### 📍 Location

The search bar appears at the **top-left corner** of the map, above the zoom controls.

## How to Use

### Basic Search

1. **Click the search bar** or press anywhere in the search input
2. **Type a location name** (e.g., "Amazon Rainforest")
3. **Press Enter** or click on a result from the dropdown
4. The map will **automatically zoom** to that location
5. A **marker** will briefly appear at the searched location

### Search Tips

**Be Specific**:
```
✅ "Maharashtra, India" - Better
❌ "Maharashtra" - Less precise
```

**Use Full Names**:
```
✅ "Jim Corbett National Park, Uttarakhand, India"
❌ "JC Park"
```

**Country Names Help**:
```
✅ "Amazon Rainforest, Brazil"
❌ "Rainforest"
```

**Coordinates Work Too**:
```
✅ "28.6139, 77.2090" (New Delhi)
✅ "-3.4653, -62.2159" (Manaus, Brazil)
```

## Search Results

When you type, you'll see:
- **Dropdown list** of matching locations
- **Location names** with addresses
- **Hover effect** on results
- **Click any result** to jump to that location

### Auto-features

- **Auto-zoom**: Automatically adjusts zoom level for the location
- **Auto-center**: Centers the map on the searched location
- **Auto-clear**: Search box clears after selection
- **Temporary marker**: Shows the exact search result location

## Use Cases

### For Land Classification Projects

**Search for Project Areas**:
```
1. Type "Sundarbans National Park"
2. Map zooms to the mangrove forests
3. Draw polygon around specific area
4. Run land classification analysis
```

**Compare Different Regions**:
```
1. Search "Western Ghats, Kerala"
2. Draw polygon and analyze
3. Search "Eastern Ghats, Odisha"
4. Compare land cover patterns
```

### For Carbon Credit Analysis

**Find Reforestation Sites**:
```
1. Search "Aravalli Range, Rajasthan"
2. Identify degraded forest areas
3. Draw polygon around reforestation zone
4. Estimate carbon sequestration potential
```

**Locate Agricultural Regions**:
```
1. Search "Punjab, India" (agricultural belt)
2. Draw polygon over croplands
3. Analyze carbon in agricultural soil
```

### For Conservation Monitoring

**Monitor Protected Areas**:
```
1. Search specific national park
2. Draw boundary polygon
3. Track land cover changes over time
4. Generate conservation reports
```

## Keyboard Shortcuts

- **Enter**: Submit search and jump to result
- **Escape**: Close search results dropdown
- **Tab**: Navigate through search results
- **Arrow Keys**: Move through result list

## Search Examples by Region

### India
```
- "Corbett National Park"
- "Western Ghats"
- "Thar Desert, Rajasthan"
- "Chilika Lake, Odisha"
- "Kerala Backwaters"
```

### Africa
```
- "Serengeti National Park, Tanzania"
- "Congo Rainforest"
- "Sahara Desert, Morocco"
- "Okavango Delta, Botswana"
```

### South America
```
- "Amazon Rainforest, Brazil"
- "Pantanal, Brazil"
- "Atacama Desert, Chile"
- "Patagonia, Argentina"
```

### Global
```
- "Great Barrier Reef, Australia"
- "Yellowstone National Park, USA"
- "Borneo Rainforest, Malaysia"
- "Madagascar"
```

## Technical Details

### Search Provider
- **Service**: OpenStreetMap Nominatim
- **Coverage**: Worldwide
- **Accuracy**: High for major locations, variable for rural areas
- **Language**: Supports multiple languages
- **Rate Limit**: Free tier, reasonable limits

### Search Parameters
```javascript
{
  provider: OpenStreetMapProvider,
  style: 'bar',              // Search bar style
  showMarker: true,          // Show marker at result
  showPopup: false,          // No popup (cleaner)
  autoClose: true,           // Close after selection
  retainZoomLevel: false,    // Auto-adjust zoom
  animateZoom: true,         // Smooth zoom animation
  keepResult: false,         // Clear after use
}
```

## Customization

### Change Search Provider

Edit `src/components/MapComponent.tsx`:

```tsx
// Use Google Maps (requires API key)
import { GoogleProvider } from 'leaflet-geosearch';
const provider = new GoogleProvider({
  params: {
    key: 'YOUR_API_KEY',
  },
});
```

### Modify Search Appearance

Edit `src/app/globals.css` in the Geosearch section:

```css
.leaflet-control-geosearch form input {
  min-width: 300px;  /* Wider search bar */
  font-size: 16px;   /* Larger text */
}
```

### Change Search Behavior

```tsx
const searchControl = new GeoSearchControl({
  provider: provider,
  retainZoomLevel: true,  // Keep current zoom
  showMarker: false,      // No marker
  autoComplete: true,     // Enable autocomplete
  autoCompleteDelay: 250, // Delay for suggestions
});
```

## Troubleshooting

### Search not working
- **Check internet connection** (requires online access)
- **Try more specific search terms**
- **Check browser console** for API errors
- **Wait a moment** between rapid searches (rate limiting)

### No results found
- **Try different spelling** (e.g., "Mumbai" vs "Bombay")
- **Add country name** for clarity
- **Use English names** when possible
- **Try nearby major city** first

### Search bar doesn't appear
- **Refresh the page**
- **Check that leaflet-geosearch is installed**
- **Verify CSS is loading** (check developer tools)

### Results in wrong location
- **Add more context** (city, state, country)
- **Use official names** (e.g., "Mumbai" not "Bombay")
- **Check coordinates** if available

## Performance

- ⚡ **Fast**: Autocomplete results in ~200ms
- 🌐 **Global**: Works worldwide
- 💾 **No storage**: Results not cached (fresh data)
- 📶 **Online only**: Requires internet connection

## Privacy

- 🔒 Search queries sent to OpenStreetMap Nominatim
- 📍 No personal data collected
- 🆓 Free service (open source)
- ✅ GDPR compliant

## Best Practices

### ✅ Do's
- Be specific with location names
- Include country for international searches
- Use proper place names
- Wait for results before new search

### ❌ Don'ts
- Don't spam rapid searches (rate limited)
- Don't use abbreviations only
- Don't expect instant results for obscure places
- Don't search with just numbers (unless coordinates)

## Integration with Analysis

Perfect workflow:
```
1. 🔍 Search for location
2. 🗺️  Map zooms to area
3. ✏️  Draw polygon over area of interest
4. 🛰️  Switch to satellite view
5. 📊 Run land classification
6. 💰 Check carbon credits
7. 📄 Export results
```

## Future Enhancements

Potential improvements:
- [ ] Search history
- [ ] Favorite locations
- [ ] Custom location presets
- [ ] Offline geocoding
- [ ] Multi-language support
- [ ] Voice search
- [ ] Reverse geocoding (click to get location name)

---

## Quick Reference

**Location**: Top-left corner of map
**Shortcut**: Click and type
**Provider**: OpenStreetMap Nominatim
**Coverage**: Worldwide
**Cost**: Free

**Status**: ✅ **ACTIVE AND READY TO USE**

Happy searching! 🔍🗺️
