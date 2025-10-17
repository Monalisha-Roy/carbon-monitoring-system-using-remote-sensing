# Quick Start Guide

Get up and running with the Land Classification & Carbon Credit Analyzer in minutes!

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Google Earth Engine
Create a `.env.local` file:
```env
GEE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GEE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key-Here\n-----END PRIVATE KEY-----\n"
GEE_PROJECT_ID=your-project-id
```

👉 **Don't have GEE credentials?** See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.

### 3. Run the App
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎯 First Analysis (2 minutes)

1. **Draw a polygon**:
   - Click the rectangle/polygon icon in the top-right of the map
   - Draw a shape on the map (forests or agricultural land work best)
   - Double-click to finish

2. **Set date range** (optional):
   - Default is 2023-01-01 to 2023-12-31
   - Adjust if you want different dates

3. **Click "Analyze"**:
   - Wait 10-30 seconds while satellite data is processed
   - Results will appear automatically

4. **Explore results**:
   - **Satellite Data**: View NDVI, EVI, and true color imagery
   - **Land Classification**: See land cover types and area statistics
   - **Carbon Credits**: Check eligibility and potential value

5. **Export data**:
   - Click export buttons on the right sidebar
   - Download as CSV, PDF, or GeoJSON

## 📊 Understanding the Results

### Satellite Data Tab
- **Mean NDVI**: Average vegetation health (-1 to 1, higher is better)
  - < 0: Water, snow, clouds
  - 0 - 0.2: Bare soil, sand
  - 0.2 - 0.5: Sparse vegetation
  - > 0.5: Dense vegetation

- **Images**:
  - True Color: What you'd see with your eyes
  - NDVI: Vegetation density (greener = more vegetation)
  - EVI: Enhanced vegetation index (similar to NDVI but better for dense areas)

### Land Classification Tab
- Shows different land cover types in your polygon
- Area in hectares for each type
- Pie/bar charts for visualization

### Carbon Credits Tab
- **Eligibility**: Whether the area qualifies for carbon credits
- **Total Change**: Net carbon sequestration (positive = good!)
- **Potential Credits**: Estimated tons of CO2e sequestered
- **Value**: Rough market value ($15-30 per credit)

**Important**: These are preliminary estimates only. Actual carbon credits require third-party verification.

## 💡 Tips & Tricks

### Best Practices
- **Start small**: Draw polygons < 10,000 hectares for faster processing
- **Avoid clouds**: Use dry season dates for better imagery
- **Forest areas**: Work best for carbon credit analysis
- **Compare years**: Use 2015-2021 for maximum change detection

### Common Use Cases

**1. Forest Conservation**
```
Dates: 2015 vs 2021
Look for: Increased tree cover
Result: Positive carbon credits
```

**2. Agricultural Monitoring**
```
Dates: Growing season (e.g., Apr-Sep)
Look for: High NDVI in croplands
Result: Crop health assessment
```

**3. Urban Expansion**
```
Dates: 2015 vs 2021
Look for: Built-up area increase
Result: Quantify urbanization
```

**4. Reforestation Projects**
```
Dates: Before/after planting
Look for: Tree cover increase
Result: Carbon sequestration validation
```

## 🔧 Troubleshooting

### "Failed to authenticate with Earth Engine"
- Check your `.env.local` file exists
- Verify credentials are correct
- Restart the dev server

### "No satellite data found"
- Try a different date range
- Increase cloud cover threshold
- Check polygon is on land (not ocean)

### Map not loading
- Refresh the page
- Clear browser cache
- Check browser console for errors

### Analysis is slow
- Reduce polygon size
- Use shorter date ranges
- Check your internet connection

## 📚 Next Steps

Once you're comfortable with basic usage:

1. **Customize carbon coefficients** in `.env.local`
2. **Try different date ranges** for temporal analysis
3. **Export and share** reports with stakeholders
4. **Compare multiple areas** by drawing different polygons
5. **Deploy to production** on Vercel (see README)

## 🎓 Learning Resources

- **NDVI Explained**: [NASA Guide](https://earthobservatory.nasa.gov/features/MeasuringVegetation/measuring_vegetation_2.php)
- **Carbon Credits**: [IPCC Guidelines](https://www.ipcc.ch/)
- **Earth Engine**: [Developer Guides](https://developers.google.com/earth-engine)
- **Sentinel-2**: [ESA Documentation](https://sentinel.esa.int/web/sentinel/missions/sentinel-2)

## ⚡ Keyboard Shortcuts

- **Ctrl/Cmd + Z**: Undo last polygon
- **Delete**: Remove selected polygon
- **Esc**: Cancel current drawing

## 📊 Example Workflows

### Academic Research
1. Define study area with polygon
2. Analyze land cover changes over time
3. Export data for statistical analysis
4. Generate PDF reports for publications

### Carbon Project Development
1. Draw project boundary
2. Analyze baseline (2015) vs current (2021)
3. Estimate potential credits
4. Export GeoJSON for verification

### Conservation Monitoring
1. Monitor protected areas
2. Track vegetation health over time
3. Detect deforestation or degradation
4. Generate reports for stakeholders

## 🆘 Getting Help

- **Documentation**: See [README.md](./README.md)
- **Setup Issues**: Check [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **GitHub Issues**: Report bugs or request features
- **Earth Engine Forum**: [Google Group](https://groups.google.com/g/google-earth-engine-developers)

---

**Happy analyzing! 🌍🌱**
