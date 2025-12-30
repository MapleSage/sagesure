# Azure App Service Deployment Guide

This guide explains how to deploy the SageSure Social app to Azure App Service using GitHub Actions.

## Current Setup

- **Resource Group**: `sagesure-social-rg`
- **App Service Plan**: `sagesure-social-plan` (Premium P1V2)
- **Web App**: `sagesure-social-app`
- **URL**: https://sagesure-social-app.azurewebsites.net

## GitHub Actions Setup

### Step 1: Add GitHub Secrets

Go to https://github.com/MapleSage/sagesure/settings/secrets/actions and add these secrets:

#### Required Secrets:

1. **AZURE_WEBAPP_PUBLISH_PROFILE**
   - Copy from: `azure-publish-profile.xml` (in project root)
   - This file contains credentials for deployment

2. **AZURE_STORAGE_CONNECTION_STRING**
   - Your Azure Storage connection string for posts/blogs/tokens

3. **AZURE_OPENAI_API_KEY**
   - Your Azure OpenAI API key

4. **AZURE_OPENAI_ENDPOINT**
   - Example: `https://your-openai.openai.azure.com/`

5. **AZURE_OPENAI_DEPLOYMENT_NAME**
   - Your deployment name (e.g., `gpt-4`)

6. **AZURE_OPENAI_API_VERSION**
   - Example: `2024-02-15-preview`

7. **LINKEDIN_CLIENT_ID** & **LINKEDIN_CLIENT_SECRET**
   - LinkedIn OAuth credentials

8. **FACEBOOK_APP_ID** & **FACEBOOK_APP_SECRET**
   - Facebook OAuth credentials

9. **TWITTER_CLIENT_ID** & **TWITTER_CLIENT_SECRET**
   - Twitter/X OAuth credentials

10. **HUBSPOT_API_KEY**
    - HubSpot API key

11. **CRON_SECRET**
    - Secret for cron job authentication

### Step 2: Copy Publish Profile

```bash
# The publish profile is already downloaded to:
cat azure-publish-profile.xml
```

Copy the entire contents and paste it as the `AZURE_WEBAPP_PUBLISH_PROFILE` secret.

### Step 3: Trigger Deployment

Once secrets are added, deployment happens automatically on:
- Every push to `main` branch
- Manual trigger via GitHub Actions UI

## Deployment Process

The GitHub Actions workflow (`.github/workflows/azure-deploy.yml`) will:

1. ✅ Checkout code
2. ✅ Install Node.js 20.x
3. ✅ Install dependencies
4. ✅ Build Next.js app with standalone output
5. ✅ Prepare deployment package
6. ✅ Deploy to Azure App Service
7. ✅ Configure environment variables
8. ✅ Display deployment URL

## Cron Jobs on Azure

Unlike Vercel's Hobby plan, Azure App Service allows:
- **Unlimited cron frequency**
- **Better control** with Azure Functions or WebJobs
- **No restrictions** on execution time

### Setting Up Cron Jobs

Option 1: **Azure Functions** (Recommended)
- Create timer-triggered functions
- Schedule: Every 6 hours or any custom schedule
- Better monitoring and logging

Option 2: **WebJobs**
- Upload cron scripts
- Configure schedule in Azure Portal

Option 3: **External Cron Service**
- Use services like cron-job.org
- Call your API endpoints on schedule

## Monitoring

- **Logs**: https://portal.azure.com → Your App → Log stream
- **Metrics**: Monitor CPU, memory, requests
- **Application Insights**: Already configured

## Benefits of Azure Deployment

✅ **No cron limitations** (vs Vercel Hobby's daily limit)
✅ **Use your Azure credits**
✅ **Better control** over environment
✅ **Premium performance** (P1V2 plan)
✅ **Integrated monitoring** with Application Insights
✅ **Custom domain** support
✅ **WebSockets** support
✅ **Always-on** enabled

## Cost Optimization

The P1V2 plan costs ~$73/month, but you're using credits so it's free for now!

When credits expire, you can:
- Scale down to B1 ($13/month)
- Use consumption-based Azure Functions
- Keep critical features on Azure, use Vercel for static content

## Next Steps

1. Add all GitHub secrets (listed above)
2. Commit and push to trigger deployment
3. Visit https://sagesure-social-app.azurewebsites.net
4. Set up cron jobs using Azure Functions
5. Configure custom domain (if needed)

## Troubleshooting

**Deployment fails?**
- Check GitHub Actions logs
- Verify all secrets are added
- Check Azure Portal logs

**App not starting?**
- Check startup command in Azure Portal
- Should be: `node server.js`
- Verify environment variables are set

**Cron jobs not working?**
- Set up Azure Functions for scheduled tasks
- Check function logs in Azure Portal
