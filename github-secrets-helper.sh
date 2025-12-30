#!/bin/bash

echo "=== GitHub Secrets Setup Helper ==="
echo ""
echo "Go to: https://github.com/MapleSage/sagesure/settings/secrets/actions"
echo ""
echo "Add each secret one by one:"
echo "================================"
echo ""

# Read .env.local and format for GitHub Secrets
if [ -f .env.local ]; then
    echo "📋 Copy these values from your .env.local:"
    echo ""
    
    # List of secrets we need
    SECRETS=(
        "AZURE_STORAGE_CONNECTION_STRING"
        "AZURE_OPENAI_API_KEY"
        "AZURE_OPENAI_ENDPOINT"
        "AZURE_OPENAI_DEPLOYMENT_NAME"
        "AZURE_OPENAI_API_VERSION"
        "LINKEDIN_CLIENT_ID"
        "LINKEDIN_CLIENT_SECRET"
        "FACEBOOK_APP_ID"
        "FACEBOOK_APP_SECRET"
        "TWITTER_CLIENT_ID"
        "TWITTER_CLIENT_SECRET"
        "HUBSPOT_API_KEY"
        "CRON_SECRET"
    )
    
    for secret in "${SECRETS[@]}"; do
        value=$(grep "^${secret}=" .env.local | cut -d '=' -f2-)
        if [ -n "$value" ]; then
            echo "✓ $secret"
            echo "  Value: ${value:0:30}..."
            echo ""
        else
            echo "⚠ $secret - NOT FOUND in .env.local"
            echo ""
        fi
    done
else
    echo "❌ .env.local file not found!"
fi

echo ""
echo "📄 AZURE_WEBAPP_PUBLISH_PROFILE:"
echo "  Copy from: azure-publish-profile.xml"
echo ""
echo "================================"
echo "Total secrets to add: 14"
