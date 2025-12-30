#!/bin/bash
set -e

# Configuration
RESOURCE_GROUP="sagesure-social-rg"
LOCATION="eastus"
APP_SERVICE_PLAN="sagesure-social-plan"
WEB_APP_NAME="sagesure-social-app"
NODE_VERSION="20-lts"

echo "=== Azure App Service Deployment ==="
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "App Service Plan: $APP_SERVICE_PLAN"
echo "Web App Name: $WEB_APP_NAME"
echo ""

# Check if App Service Plan exists
echo "Checking for existing App Service Plan..."
if az appservice plan show --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP &>/dev/null; then
    echo "✓ App Service Plan '$APP_SERVICE_PLAN' already exists"
else
    echo "Creating App Service Plan (Premium P1V2)..."
    az appservice plan create \
        --name $APP_SERVICE_PLAN \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --sku P1V2 \
        --is-linux
    echo "✓ App Service Plan created"
fi

# Check if Web App exists
echo ""
echo "Checking for existing Web App..."
if az webapp show --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP &>/dev/null; then
    echo "✓ Web App '$WEB_APP_NAME' already exists"
else
    echo "Creating Web App..."
    az webapp create \
        --name $WEB_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --plan $APP_SERVICE_PLAN \
        --runtime "NODE:$NODE_VERSION"
    echo "✓ Web App created"
fi

# Configure Web App settings
echo ""
echo "Configuring Web App settings..."
az webapp config set \
    --name $WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --startup-file "node .next/standalone/server.js" \
    --always-on true

# Set environment variables from .env.local
echo ""
echo "Setting environment variables..."
if [ -f .env.local ]; then
    az webapp config appsettings set \
        --name $WEB_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --settings @.env.local
    echo "✓ Environment variables set from .env.local"
else
    echo "⚠ No .env.local file found - skipping environment variables"
fi

echo ""
echo "=== Deployment Configuration Complete ==="
echo "Web App URL: https://$WEB_APP_NAME.azurewebsites.net"
echo ""
echo "Next steps:"
echo "1. Build the app: npm run build"
echo "2. Deploy: az webapp deployment source config-zip --src deploy.zip"
