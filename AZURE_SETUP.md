# Azure Premium Features Setup Guide

This guide walks you through setting up premium Azure services to maximize performance and leverage your Azure credits.

## Overview

The SageSure Social app can leverage three powerful Azure services:

1. **Azure CDN** - Global content delivery network for faster image loading
2. **Azure Redis Cache** - In-memory caching for faster API responses
3. **Azure Application Insights** - Comprehensive monitoring and analytics

## 1. Azure CDN Setup

### Create CDN Profile and Endpoint

```bash
# Set variables
RESOURCE_GROUP="sagesure-rg"
LOCATION="eastus"
STORAGE_ACCOUNT="sagesurestorage"
CDN_PROFILE="sagesure-cdn"
CDN_ENDPOINT="sagesure"

# Create CDN Profile (Standard Microsoft tier recommended)
az cdn profile create \
  --name $CDN_PROFILE \
  --resource-group $RESOURCE_GROUP \
  --sku Standard_Microsoft \
  --location $LOCATION

# Create CDN Endpoint
az cdn endpoint create \
  --name $CDN_ENDPOINT \
  --profile-name $CDN_PROFILE \
  --resource-group $RESOURCE_GROUP \
  --origin $STORAGE_ACCOUNT.blob.core.windows.net \
  --origin-host-header $STORAGE_ACCOUNT.blob.core.windows.net \
  --enable-compression true \
  --content-types-to-compress \
    "image/jpeg" \
    "image/png" \
    "image/webp" \
    "image/gif"
```

### Configure Caching Rules

```bash
# Set caching behavior for images (7 days)
az cdn endpoint rule add \
  --name $CDN_ENDPOINT \
  --profile-name $CDN_PROFILE \
  --resource-group $RESOURCE_GROUP \
  --order 1 \
  --rule-name "ImageCaching" \
  --match-variable UrlPath \
  --operator BeginsWith \
  --match-values "/images/" \
  --action-name CacheExpiration \
  --cache-behavior Override \
  --cache-duration 7.00:00:00
```

### Environment Variables

Add to `.env.production.local` or Vercel environment variables:

```bash
AZURE_CDN_ENABLED=true
AZURE_CDN_ENDPOINT=https://sagesure.azureedge.net
AZURE_STORAGE_ACCOUNT_NAME=sagesurestorage
```

### Cost Estimate
- **Standard Microsoft CDN**: ~$0.087/GB for first 10TB
- **Estimated monthly cost**: $5-20 depending on traffic
- **Benefits**: 50-90% faster global image delivery

## 2. Azure Redis Cache Setup

### Create Redis Cache

```bash
# Create Azure Cache for Redis (Basic C0 for dev, Standard C1+ for production)
az redis create \
  --name sagesure-redis \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Basic \
  --vm-size c0 \
  --enable-non-ssl-port false

# Get connection string
az redis list-keys \
  --name sagesure-redis \
  --resource-group $RESOURCE_GROUP
```

### Recommended Tiers
- **Development**: Basic C0 (250MB, $0.02/hour = ~$15/month)
- **Production**: Standard C1 (1GB, $0.08/hour = ~$60/month)
- **High Performance**: Premium P1 (6GB, $0.27/hour = ~$200/month)

### Environment Variables

```bash
AZURE_REDIS_ENABLED=true
AZURE_REDIS_CONNECTION_STRING="rediss://sagesure-redis.redis.cache.windows.net:6380,password=YOUR_KEY,ssl=True"
```

### Install Redis Package

```bash
npm install redis
```

### Cost Estimate
- **Basic C0**: ~$15/month (perfect for <10K users)
- **Standard C1**: ~$60/month (production ready)
- **Benefits**: 10-100x faster token lookups, reduced database costs

## 3. Azure Application Insights Setup

### Create Application Insights

```bash
# Create Application Insights resource
az monitor app-insights component create \
  --app sagesure-social \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --application-type web

# Get instrumentation key and connection string
az monitor app-insights component show \
  --app sagesure-social \
  --resource-group $RESOURCE_GROUP \
  --query '[instrumentationKey, connectionString]' \
  --output tsv
```

### Environment Variables

```bash
APP_INSIGHTS_ENABLED=true
APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=YOUR_KEY;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/;LiveEndpoint=https://eastus.livediagnostics.monitor.azure.com/"
```

### Install Application Insights Package

```bash
npm install applicationinsights
```

### Cost Estimate
- **First 5GB/month**: Free
- **After 5GB**: $2.30/GB
- **Estimated monthly cost**: $0-10 for most apps
- **Benefits**: Real-time monitoring, error tracking, performance insights

## 4. Complete Setup for All Services

### Full Azure CLI Script

Create a file `setup-azure-premium.sh`:

```bash
#!/bin/bash

# Configuration
RESOURCE_GROUP="sagesure-rg"
LOCATION="eastus"
STORAGE_ACCOUNT="sagesurestorage"

# CDN Setup
echo "Setting up Azure CDN..."
az cdn profile create \
  --name sagesure-cdn \
  --resource-group $RESOURCE_GROUP \
  --sku Standard_Microsoft \
  --location $LOCATION

az cdn endpoint create \
  --name sagesure \
  --profile-name sagesure-cdn \
  --resource-group $RESOURCE_GROUP \
  --origin $STORAGE_ACCOUNT.blob.core.windows.net \
  --origin-host-header $STORAGE_ACCOUNT.blob.core.windows.net \
  --enable-compression true

# Redis Cache Setup
echo "Setting up Azure Redis Cache..."
az redis create \
  --name sagesure-redis \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard \
  --vm-size c1 \
  --enable-non-ssl-port false

# Application Insights Setup
echo "Setting up Application Insights..."
az monitor app-insights component create \
  --app sagesure-social \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --application-type web

echo "Azure Premium Services setup complete!"
echo ""
echo "Next steps:"
echo "1. Get Redis connection string: az redis list-keys --name sagesure-redis --resource-group $RESOURCE_GROUP"
echo "2. Get App Insights connection string: az monitor app-insights component show --app sagesure-social --resource-group $RESOURCE_GROUP --query connectionString"
echo "3. Add environment variables to your deployment"
```

### Make it executable and run:

```bash
chmod +x setup-azure-premium.sh
./setup-azure-premium.sh
```

## 5. Vercel Environment Variables

Add these to your Vercel project settings:

```bash
# Azure CDN
AZURE_CDN_ENABLED=true
AZURE_CDN_ENDPOINT=https://sagesure.azureedge.net

# Azure Redis
AZURE_REDIS_ENABLED=true
AZURE_REDIS_CONNECTION_STRING=rediss://sagesure-redis.redis.cache.windows.net:6380,password=YOUR_KEY,ssl=True

# Azure Application Insights
APP_INSIGHTS_ENABLED=true
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=YOUR_KEY;IngestionEndpoint=https://eastus-8.in.applicationinsights.azure.com/
```

## 6. Testing and Verification

### Test CDN

```bash
# Compare load times
curl -w "@curl-format.txt" -o /dev/null -s "https://sagesurestorage.blob.core.windows.net/images/test.jpg"
curl -w "@curl-format.txt" -o /dev/null -s "https://sagesure.azureedge.net/images/test.jpg"
```

### Test Redis

Check your application logs for:
```
[Redis] Client connected
[Redis] Cache hit for token:USER_ID:linkedin
```

### Test Application Insights

1. Go to Azure Portal → Application Insights
2. Check "Live Metrics" for real-time data
3. View "Application Map" to see dependencies
4. Check "Failures" for error tracking

## 7. Cost Summary (Monthly Estimates)

| Service | Tier | Estimated Cost | Primary Benefit |
|---------|------|----------------|-----------------|
| Azure CDN | Standard | $5-20 | Faster global delivery |
| Azure Redis | Standard C1 | $60 | 100x faster queries |
| App Insights | Pay-as-you-go | $0-10 | Complete monitoring |
| **Total** | | **$65-90/month** | Production-ready performance |

### Budget-Friendly Option (< $30/month)

Use Basic tiers for all services:
- CDN: Standard Microsoft ($5-10)
- Redis: Basic C0 ($15)
- App Insights: Free tier ($0-5)
- **Total: ~$20-30/month**

## 8. Migration Path

### Phase 1: CDN (Immediate, Low Cost)
1. Create CDN endpoint
2. Update image URLs in code
3. Deploy and test
4. **Impact**: Faster image loading globally

### Phase 2: Redis (Week 1-2)
1. Create Redis cache
2. Update token caching logic
3. Deploy and monitor performance
4. **Impact**: 10-50x faster API responses

### Phase 3: App Insights (Week 2-3)
1. Create App Insights resource
2. Initialize in application
3. Add custom tracking events
4. **Impact**: Complete visibility into app performance

## 9. Monitoring and Optimization

### CDN Metrics to Watch
- Cache hit ratio (target: >80%)
- Bandwidth savings
- Global latency reduction

### Redis Metrics to Watch
- Cache hit ratio (target: >90%)
- Memory usage
- Connection count

### App Insights Metrics to Watch
- Request duration (target: <500ms)
- Failed requests (target: <1%)
- Exception rate

## 10. Troubleshooting

### CDN Not Working
1. Check AZURE_CDN_ENABLED is 'true'
2. Verify CDN endpoint URL
3. Check blob storage public access
4. Allow 10-15 minutes for propagation

### Redis Connection Issues
1. Verify connection string format
2. Check firewall rules (allow Azure services)
3. Ensure SSL is enabled
4. Check Redis cache is running

### App Insights No Data
1. Verify connection string
2. Check APP_INSIGHTS_ENABLED is 'true'
3. Wait 2-3 minutes for data to appear
4. Check application logs for errors

## Support

For issues or questions:
1. Check Azure status: https://status.azure.com/
2. Review Azure docs: https://docs.microsoft.com/azure/
3. Contact Azure support through portal

## Next Steps

After setup is complete:
1. Monitor costs in Azure Cost Management
2. Set up budget alerts
3. Review performance improvements
4. Optimize caching strategies
5. Fine-tune Application Insights tracking
