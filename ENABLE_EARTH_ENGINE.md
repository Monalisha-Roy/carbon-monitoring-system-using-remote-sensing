# Enable Earth Engine for Your Google Cloud Project

Your authentication is working, but your project needs to be registered with Earth Engine. Follow these steps:

## Step 1: Register Your Cloud Project with Earth Engine

1. **Go to Earth Engine Code Editor**: https://code.earthengine.google.com/
2. **Sign in** with your Google account
3. **Click "Get Started"** if you haven't used Earth Engine before
4. **Register your project**:
   - Click on your profile icon (top right)
   - Select "Register a new Cloud Project"
   - Enter your project ID: `carbon-credit-475010`
   - Select project type: "Commercial" or "Noncommercial" (based on your use)
   - Click "Continue" and follow the prompts

## Step 2: Enable Earth Engine API in Google Cloud Console

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project**: `carbon-credit-475010`
3. **Go to APIs & Services** → **Library**
4. **Search for** "Earth Engine API"
5. **Click on it** and press **"Enable"**

## Step 3: Grant Service Account Permissions

1. **Go to**: https://console.cloud.google.com/iam-admin/iam
2. **Find your service account**: `earth-engine-sa@carbon-credit-475010.iam.gserviceaccount.com`
3. **Click the pencil icon** to edit
4. **Add these roles**:
   - Earth Engine Resource Admin
   - Earth Engine Resource Writer
   - Service Account Token Creator

## Step 4: Wait for Propagation (5-10 minutes)

After enabling and granting permissions, wait 5-10 minutes for the changes to propagate.

## Step 5: Restart Your Dev Server

```powershell
Stop-Process -Name "node" -Force; npm run dev
```

## Verify It's Working

1. Open http://localhost:3000
2. Draw a polygon on the map
3. Click "Analyze"
4. You should now see satellite imagery!

## Alternative: Use Earth Engine Python API (Simpler Setup)

If the above steps don't work, we can switch to using Earth Engine's Python API instead, which might be easier to set up. Let me know if you'd like to try that approach.

## Common Issues

### Issue: "Project is not registered"
**Solution**: Make sure you registered your project at https://code.earthengine.google.com/

### Issue: "Permission denied"
**Solution**: Add the Earth Engine roles to your service account in IAM

### Issue: Still getting errors
**Solution**: Try using a personal Google account instead of a service account (easier for development)

## Need Help?

If you're still having issues, you can:
1. Use Earth Engine with your personal Google account (easier for testing)
2. Switch to a different satellite data provider (like Sentinel Hub)
3. Use pre-downloaded satellite data

Let me know which approach you'd prefer!
