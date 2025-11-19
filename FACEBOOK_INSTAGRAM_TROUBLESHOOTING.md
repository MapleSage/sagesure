# Facebook & Instagram Connection Troubleshooting

## Common Issues and Solutions

### Issue 1: "App Not Set Up" Error

**Problem**: Facebook app is in Development mode

**Solution**:

1. Go to https://developers.facebook.com/apps
2. Select your app
3. Click "App Mode" in top right
4. Switch from "Development" to "Live"
5. Complete the App Review if required

### Issue 2: "Redirect URI Mismatch"

**Problem**: The redirect URI in your app doesn't match Facebook settings

**Current Redirect URI**: `https://sagesure-social-9mjddxhgn-maplesage-s-projects.vercel.app/api/oauth/facebook/callback`

**Solution**:

1. Go to Facebook App Settings
2. Click "Facebook Login" → "Settings"
3. Add to "Valid OAuth Redirect URIs":
   ```
   https://sagesure-social-9mjddxhgn-maplesage-s-projects.vercel.app/api/oauth/facebook/callback
   ```
4. Save changes

### Issue 3: Missing Permissions

**Required Permissions**:

- `pages_manage_posts` - Post to Facebook Pages
- `pages_read_engagement` - Read page data
- `instagram_basic` - Access Instagram account
- `instagram_content_publish` - Publish to Instagram

**Solution**:

1. Go to App Dashboard → App Review → Permissions and Features
2. Request these permissions:
   - pages_manage_posts
   - pages_read_engagement
   - instagram_basic
   - instagram_content_publish
3. Submit for review if required

### Issue 4: No Facebook Page

**Problem**: User doesn't have a Facebook Page

**Solution**:

1. Create a Facebook Page at https://www.facebook.com/pages/create
2. Make sure you're an admin of the page
3. Try connecting again

### Issue 5: Instagram Not Linked

**Problem**: Instagram account not linked to Facebook Page

**Solution**:

1. Go to your Facebook Page
2. Click "Settings"
3. Click "Instagram" in left menu
4. Click "Connect Account"
5. Login to Instagram
6. Select "Business" account type
7. Link to your Facebook Page

### Issue 6: Instagram Not a Business Account

**Problem**: Instagram account is Personal, not Business

**Solution**:

1. Open Instagram app
2. Go to Profile → Settings → Account
3. Click "Switch to Professional Account"
4. Choose "Business"
5. Link to Facebook Page

### Issue 7: Environment Variables Not Set

**Problem**: Missing META_CLIENT_ID or META_CLIENT_SECRET

**Check Environment Variables**:

```bash
# In Vercel Dashboard:
# Settings → Environment Variables

META_CLIENT_ID=your_facebook_app_id
META_CLIENT_SECRET=your_facebook_app_secret
NEXTAUTH_URL=https://sagesure-social-9mjddxhgn-maplesage-s-projects.vercel.app
```

## Testing Steps

### 1. Test Facebook Connection

1. Go to Dashboard
2. Click "Connected Accounts"
3. Click "Connect" on Facebook
4. You should be redirected to Facebook
5. Login and authorize
6. Should redirect back with success message

**If it fails**, check browser console and URL for error details

### 2. Check Error Messages

Look for these in the URL after failed connection:

- `error=facebook_auth_failed` - OAuth failed
- `details=...` - Specific error message

### 3. Check Server Logs

In Vercel Dashboard:

1. Go to your project
2. Click "Deployments"
3. Click latest deployment
4. Click "Functions"
5. Look for logs from `/api/oauth/facebook/callback`

## Quick Fixes

### Fix 1: Update Redirect URI in Facebook

```
Current Production URL: https://sagesure-social-9mjddxhgn-maplesage-s-projects.vercel.app

Add these to Facebook App Settings → Facebook Login → Valid OAuth Redirect URIs:
- https://sagesure-social-9mjddxhgn-maplesage-s-projects.vercel.app/api/oauth/facebook/callback
- https://sagesure-social-9mjddxhgn-maplesage-s-projects.vercel.app/oauth/facebook/callback
```

### Fix 2: Use Facebook Test Users

For testing in Development mode:

1. Go to App Dashboard → Roles → Test Users
2. Create test users
3. Use test user to connect

### Fix 3: Request Basic Permissions First

If advanced permissions are pending review, start with basic:

1. Remove advanced permissions from scope
2. Test with just `public_profile` and `email`
3. Add more permissions after approval

## Facebook App Configuration Checklist

- [ ] App is in Live mode (or using Test Users)
- [ ] Valid OAuth Redirect URIs configured
- [ ] Required permissions requested/approved
- [ ] Facebook Page created and you're admin
- [ ] Instagram Business account created
- [ ] Instagram linked to Facebook Page
- [ ] Environment variables set in Vercel
- [ ] App Domain configured in Facebook settings

## Still Not Working?

### Get Detailed Error Info

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try connecting Facebook
4. Look for failed requests
5. Check response for error details

### Common Error Messages

**"redirect_uri_mismatch"**
→ Fix redirect URI in Facebook settings

**"access_denied"**
→ User denied permission or app not approved

**"invalid_client"**
→ Wrong CLIENT_ID or CLIENT_SECRET

**"No Facebook pages found"**
→ User needs to create a Facebook Page

**"instagram_business_account not found"**
→ Instagram not linked to Facebook Page

## Contact Support

If still having issues, provide:

1. Error message from URL
2. Screenshot of Facebook App settings
3. Screenshot of connection attempt
4. Browser console errors

---

**Last Updated**: November 19, 2025
