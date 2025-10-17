# Google Earth Engine Setup Guide

This guide will walk you through setting up Google Earth Engine for this project.

## Prerequisites

- A Google account
- Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "land-classification-app")
5. Click "Create"

## Step 2: Enable the Earth Engine API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Earth Engine API"
3. Click on it and click "Enable"

## Step 3: Register for Earth Engine Access

1. Go to [https://signup.earthengine.google.com](https://signup.earthengine.google.com)
2. Click "Sign Up"
3. Select "Commercial" or "Academia & Research" based on your use case
4. Fill in the required information about your project
5. Wait for approval (usually within 1-2 business days)

## Step 4: Create a Service Account

1. In Google Cloud Console, go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Enter details:
   - **Service account name**: `earth-engine-service`
   - **Service account ID**: (auto-generated)
   - **Description**: "Service account for Earth Engine API access"
4. Click "Create and Continue"

## Step 5: Grant Permissions

1. In the "Grant this service account access to project" section:
   - Add role: **Earth Engine Resource Admin**
   - Add role: **Service Account User** (optional, for additional security)
2. Click "Continue"
3. Click "Done"

## Step 6: Create and Download Key

1. In the Service Accounts list, find the account you just created
2. Click on it to open details
3. Go to the "Keys" tab
4. Click "Add Key" > "Create new key"
5. Choose "JSON" format
6. Click "Create"
7. The key file will download automatically - **keep this file secure!**

## Step 7: Extract Credentials

1. Open the downloaded JSON file in a text editor
2. You'll see something like:

```json
{
  "type": "service_account",
  "project_id": "your-project-12345",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEv...LOTS OF TEXT...==\n-----END PRIVATE KEY-----\n",
  "client_email": "earth-engine-service@your-project-12345.iam.gserviceaccount.com",
  ...
}
```

3. Extract these values:
   - `client_email` → This goes in `GEE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → This goes in `GEE_PRIVATE_KEY`
   - `project_id` → This goes in `GEE_PROJECT_ID`

## Step 8: Configure Environment Variables

1. In your project directory, open `.env.local`
2. Add the extracted values:

```env
GEE_SERVICE_ACCOUNT_EMAIL=earth-engine-service@your-project-12345.iam.gserviceaccount.com
GEE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...FULL KEY HERE...==\n-----END PRIVATE KEY-----\n"
GEE_PROJECT_ID=your-project-12345
```

**Important Notes**:
- Keep the quotes around the private key
- Keep the `\n` characters in the private key - they're important!
- Never commit `.env.local` to version control
- Keep your service account key file secure

## Step 9: Verify Access

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open the browser console (F12)
3. Draw a polygon on the map
4. Click "Analyze"
5. Check the console for "Google Earth Engine initialized successfully"

If you see errors:
- Double-check all environment variables
- Ensure the private key includes `\n` characters
- Verify the service account has Earth Engine permissions
- Make sure you've been approved for Earth Engine access

## Troubleshooting

### "Failed to authenticate with Earth Engine"
- Verify `GEE_SERVICE_ACCOUNT_EMAIL` is correct
- Check that `GEE_PRIVATE_KEY` includes the full key with `\n` characters
- Ensure the service account key is still active (not deleted)

### "Earth Engine API not enabled"
- Go to Google Cloud Console > APIs & Services > Library
- Search for "Earth Engine API"
- Make sure it's enabled

### "Permission denied"
- Verify the service account has "Earth Engine Resource Admin" role
- Check that you've been approved for Earth Engine access
- Make sure you're using the correct Google Cloud project

### "Module not found: @google/earthengine"
- Run `npm install` to ensure all dependencies are installed
- Check `package.json` includes `@google/earthengine`

## Security Best Practices

1. **Never commit credentials**: Always use `.env.local` for secrets
2. **Rotate keys regularly**: Create new service account keys periodically
3. **Limit permissions**: Only grant necessary roles to the service account
4. **Monitor usage**: Check Google Cloud Console for unusual API activity
5. **Use different accounts**: Use separate service accounts for dev/staging/production

## Cost Considerations

- Google Earth Engine is free for research and education
- Commercial use has usage quotas
- Monitor your usage in Google Cloud Console
- Set up billing alerts to avoid unexpected charges

## Additional Resources

- [Earth Engine Documentation](https://developers.google.com/earth-engine)
- [Earth Engine Python API](https://developers.google.com/earth-engine/guides/python_install)
- [Sentinel-2 Data](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED)
- [ESA WorldCover](https://developers.google.com/earth-engine/datasets/catalog/ESA_WorldCover_v200)

## Support

If you encounter issues:
1. Check the [Earth Engine FAQ](https://developers.google.com/earth-engine/faq)
2. Visit [Earth Engine Developers Forum](https://groups.google.com/g/google-earth-engine-developers)
3. Review Google Cloud Console logs for error details

---

**Setup complete!** You're now ready to analyze land cover and estimate carbon credits using satellite data.
