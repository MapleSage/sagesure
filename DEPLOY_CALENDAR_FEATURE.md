# Deploy Calendar Events Feature

## Quick Deployment Steps

### 1. Initialize New Tables

After deploying, initialize the new database tables:

```bash
curl https://your-app-url.vercel.app/api/init
```

This creates the `events` and `settings` tables in Azure Table Storage.

### 2. Verify Environment Variables

Ensure these are set in your deployment:

```
GEMINI_API_KEY=your_gemini_api_key
AZURE_STORAGE_CONNECTION_STRING=your_azure_connection_string
```

### 3. Test the Feature

1. Navigate to your app: `https://your-app-url.vercel.app/dashboard`
2. Click "Calendar Events" in the navigation
3. Click "Settings" and enter:
   - Company Name: "SageSure" (or your company)
   - Brand Identity: "Professional, trustworthy, and customer-focused insurance provider"
   - Customer Profile: "Homeowners and property owners seeking comprehensive insurance coverage"
4. Click "Save Settings"
5. Click "Generate Events & Suggestions"
6. Wait for AI to generate events (may take 30-60 seconds)
7. Review the events table
8. Click "View Suggested Posts"
9. Review drafts and publish as needed

## Build and Deploy

```bash
cd sagesure-social
npm run build
vercel --prod
```

Or if using Azure:

```bash
cd sagesure-social
npm run build
# Deploy using your Azure deployment method
```

## Troubleshooting

### "Company name not set" error

- Go to Calendar Events → Settings
- Enter company name and save

### Events not generating

- Check Gemini API key is valid
- Check API logs for errors
- Verify Azure Storage connection

### Posts not appearing in drafts

- Check that events were generated successfully
- Verify the suggestions API completed
- Check the drafts tab in dashboard

## Feature Access

Users can access the feature from:

- Dashboard → Calendar Events (navigation tab)
- Direct URL: `/calendar`

## What Gets Created

When you run "Generate Events & Suggestions":

1. **15 calendar events** saved to Azure Table Storage
2. **15 draft posts** (one per event) saved as drafts
3. All content tailored to your brand identity and customer profile

## Next Steps

After deployment:

1. Configure settings for your company
2. Generate initial events and suggestions
3. Review and customize the suggested posts
4. Schedule or publish posts from the drafts tab
5. Monitor engagement and adjust brand identity/customer profile as needed
