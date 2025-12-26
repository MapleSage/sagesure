#!/bin/bash

# =============================================================================
# SageSure Social - Azure Premium Services Setup Script
# =============================================================================
# This script creates all Azure resources needed for production deployment
#
# Prerequisites:
# - Azure CLI installed: https://docs.microsoft.com/cli/azure/install-azure-cli
# - Logged in to Azure: az login
# - Active Azure subscription
#
# What this creates:
# - Azure CDN Profile & Endpoint (~$5-20/month)
# - Azure Redis Cache (~$15-60/month)
# - Application Insights (~$0-10/month)
# Total: ~$20-90/month depending on tier selection
#
# Usage:
#   chmod +x scripts/setup-azure-premium.sh
#   ./scripts/setup-azure-premium.sh
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="${RESOURCE_GROUP:-sagesure-rg}"
LOCATION="${LOCATION:-eastus}"
STORAGE_ACCOUNT="${STORAGE_ACCOUNT:-sagesurestorage}"
CDN_PROFILE="sagesure-cdn"
CDN_ENDPOINT="sagesure"
REDIS_NAME="sagesure-redis"
APPINSIGHTS_NAME="sagesure-social"

# Redis tier options
REDIS_TIER="${REDIS_TIER:-Basic}"  # Basic, Standard, or Premium
REDIS_SIZE="${REDIS_SIZE:-c0}"      # c0 (250MB), c1 (1GB), c2 (2.5GB), etc.

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}SageSure Social - Azure Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed${NC}"
    echo "Install from: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in
echo -e "${YELLOW}Checking Azure login status...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${RED}Error: Not logged in to Azure${NC}"
    echo "Run: az login"
    exit 1
fi

SUBSCRIPTION=$(az account show --query name -o tsv)
echo -e "${GREEN}✓ Logged in to Azure${NC}"
echo -e "  Subscription: ${SUBSCRIPTION}"
echo ""

# Confirm configuration
echo -e "${YELLOW}Configuration:${NC}"
echo "  Resource Group: ${RESOURCE_GROUP}"
echo "  Location: ${LOCATION}"
echo "  Storage Account: ${STORAGE_ACCOUNT}"
echo "  Redis Tier: ${REDIS_TIER} ${REDIS_SIZE}"
echo ""
read -p "Continue with this configuration? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled"
    exit 0
fi

# Create resource group if it doesn't exist
echo -e "${YELLOW}Checking resource group...${NC}"
if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${GREEN}✓ Resource group exists${NC}"
else
    echo -e "${YELLOW}Creating resource group...${NC}"
    az group create \
        --name "$RESOURCE_GROUP" \
        --location "$LOCATION"
    echo -e "${GREEN}✓ Resource group created${NC}"
fi
echo ""

# =============================================================================
# 1. AZURE CDN SETUP
# =============================================================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}1. Setting up Azure CDN${NC}"
echo -e "${BLUE}========================================${NC}"

# Create CDN Profile
echo -e "${YELLOW}Creating CDN Profile...${NC}"
if az cdn profile show --name "$CDN_PROFILE" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${GREEN}✓ CDN Profile already exists${NC}"
else
    az cdn profile create \
        --name "$CDN_PROFILE" \
        --resource-group "$RESOURCE_GROUP" \
        --sku Standard_Microsoft \
        --location "$LOCATION"
    echo -e "${GREEN}✓ CDN Profile created${NC}"
fi

# Create CDN Endpoint
echo -e "${YELLOW}Creating CDN Endpoint...${NC}"
if az cdn endpoint show --name "$CDN_ENDPOINT" --profile-name "$CDN_PROFILE" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${GREEN}✓ CDN Endpoint already exists${NC}"
else
    az cdn endpoint create \
        --name "$CDN_ENDPOINT" \
        --profile-name "$CDN_PROFILE" \
        --resource-group "$RESOURCE_GROUP" \
        --origin "${STORAGE_ACCOUNT}.blob.core.windows.net" \
        --origin-host-header "${STORAGE_ACCOUNT}.blob.core.windows.net" \
        --enable-compression true \
        --content-types-to-compress \
            "image/jpeg" \
            "image/png" \
            "image/webp" \
            "image/gif" \
            "image/svg+xml"
    echo -e "${GREEN}✓ CDN Endpoint created${NC}"
fi

CDN_URL="https://${CDN_ENDPOINT}.azureedge.net"
echo -e "${GREEN}✓ CDN URL: ${CDN_URL}${NC}"
echo ""

# =============================================================================
# 2. AZURE REDIS CACHE SETUP
# =============================================================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}2. Setting up Azure Redis Cache${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "${YELLOW}Creating Redis Cache (this may take 10-15 minutes)...${NC}"
if az redis show --name "$REDIS_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${GREEN}✓ Redis Cache already exists${NC}"
else
    az redis create \
        --name "$REDIS_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --sku "$REDIS_TIER" \
        --vm-size "$REDIS_SIZE" \
        --enable-non-ssl-port false \
        --minimum-tls-version 1.2
    echo -e "${GREEN}✓ Redis Cache created${NC}"
fi

# Get Redis connection info
echo -e "${YELLOW}Retrieving Redis connection string...${NC}"
REDIS_HOST=$(az redis show --name "$REDIS_NAME" --resource-group "$RESOURCE_GROUP" --query hostName -o tsv)
REDIS_PORT=$(az redis show --name "$REDIS_NAME" --resource-group "$RESOURCE_GROUP" --query sslPort -o tsv)
REDIS_KEY=$(az redis list-keys --name "$REDIS_NAME" --resource-group "$RESOURCE_GROUP" --query primaryKey -o tsv)
REDIS_CONNECTION="rediss://${REDIS_HOST}:${REDIS_PORT},password=${REDIS_KEY},ssl=True"

echo -e "${GREEN}✓ Redis Cache configured${NC}"
echo ""

# =============================================================================
# 3. APPLICATION INSIGHTS SETUP
# =============================================================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}3. Setting up Application Insights${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "${YELLOW}Creating Application Insights...${NC}"
if az monitor app-insights component show --app "$APPINSIGHTS_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${GREEN}✓ Application Insights already exists${NC}"
else
    az monitor app-insights component create \
        --app "$APPINSIGHTS_NAME" \
        --location "$LOCATION" \
        --resource-group "$RESOURCE_GROUP" \
        --application-type web \
        --retention-time 90
    echo -e "${GREEN}✓ Application Insights created${NC}"
fi

# Get App Insights connection string
echo -e "${YELLOW}Retrieving Application Insights connection string...${NC}"
APPINSIGHTS_CONNECTION=$(az monitor app-insights component show \
    --app "$APPINSIGHTS_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query connectionString -o tsv)

echo -e "${GREEN}✓ Application Insights configured${NC}"
echo ""

# =============================================================================
# SUMMARY & NEXT STEPS
# =============================================================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Setup Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}✓ Azure CDN Profile & Endpoint${NC}"
echo -e "${GREEN}✓ Azure Redis Cache (${REDIS_TIER} ${REDIS_SIZE})${NC}"
echo -e "${GREEN}✓ Application Insights${NC}"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Add these environment variables to your .env.local and Vercel:"
echo ""
echo -e "${BLUE}# Azure CDN${NC}"
echo "AZURE_CDN_ENABLED=true"
echo "AZURE_CDN_ENDPOINT=${CDN_URL}"
echo ""
echo -e "${BLUE}# Azure Redis Cache${NC}"
echo "AZURE_REDIS_ENABLED=true"
echo "AZURE_REDIS_CONNECTION_STRING=\"${REDIS_CONNECTION}\""
echo ""
echo -e "${BLUE}# Application Insights${NC}"
echo "APP_INSIGHTS_ENABLED=true"
echo "APPLICATIONINSIGHTS_CONNECTION_STRING=\"${APPINSIGHTS_CONNECTION}\""
echo ""

echo "2. Install npm dependencies:"
echo "   npm install redis applicationinsights"
echo ""

echo "3. Deploy your application to Vercel"
echo ""

echo "4. Monitor your resources in Azure Portal:"
echo "   https://portal.azure.com/#@/resource/subscriptions/$(az account show --query id -o tsv)/resourceGroups/${RESOURCE_GROUP}"
echo ""

echo -e "${YELLOW}Monthly Cost Estimate:${NC}"
echo "  CDN (Standard Microsoft): ~\$5-20"
echo "  Redis (${REDIS_TIER} ${REDIS_SIZE}): ~\$15-60"
echo "  App Insights (first 5GB free): ~\$0-10"
echo "  Total: ~\$20-90/month"
echo ""

echo -e "${GREEN}Setup complete! 🎉${NC}"
