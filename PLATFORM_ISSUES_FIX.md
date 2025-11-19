# Platform Connection Issues - Quick Fix Guide

## Current Issues

Based on your error messages:

### ✅ Facebook - WORKING

- Posts successfully

### ❌ LinkedIn - FAILING

- Error: "Requested version 20240101 is not active"
- **Fix Applied**: Updated API version to 202405
- **Action Required**: Reconnect your LinkedIn account

### ❌ Twitter/X - FAILING

- Error: "Unauthorized"
- **Likely Cause**: Token expired or invalid
- **Action Required**: Reconnect your X account

### ❌ Instagram - FAILING

- Error: "No Instagram business account linked to this Facebook page"
- **Action Required**: Link Instagram Business account in Facebook Page settings

---

## How to Fix

### 1. Reconnect LinkedIn

1. Go to Dashboard → Connected Accounts tab
2. Click "Connect" next to LinkedIn
3. Authorize the app again
4. Try posting again

**Why this is needed**: LinkedIn API version was updated, requiring fresh authorization.

### 2. Reconnect Twitter/X

1. Go to Dashboard → Connected Accounts tab
2. Click "Connect" next to X (Twitter)
3. Authorize the app again
4. Try posting again

**Why this is needed**: X tokens expire or become invalid. Fresh authorization is required.

### 3. Fix Instagram

Instagram requires a **Business Account** linked to your Facebook Page:

#### Step 1: Convert to Business Account

1. Open Instagram app
2. Go to Settings → Account
3. Switch to Professional Account
4. Choose "Business"

#### Step 2: Link to Facebook Page

1. In Instagram Settings → Account → Linked Accounts
2. Link your Facebook Page
3. OR in Facebook Page Settings → Instagram → Connect Account

#### Step 3: Reconnect in App

1. Go to Dashboard → Connected Accounts
2. Click "Connect" next to Instagram
3. Select your Facebook Page that has Instagram linked

---

## Character Limits (Now Enforced!)

The app now shows real-time character counts and warnings:

| Platform        | Character Limit | Notes                          |
| --------------- | --------------- | ------------------------------ |
| **X (Twitter)** | 280             | STRICT - will fail if exceeded |
| **LinkedIn**    | 3,000           | Recommended max                |
| **Facebook**    | 63,206          | Very high limit                |
| **Instagram**   | 2,200           | Caption limit                  |

### Visual Indicators

- **Green**: Within limit
- **Yellow**: Near limit (90%+)
- **Red**: Over limit - POST WILL FAIL

---

## Testing After Fixes

1. **Reconnect all platforms** (LinkedIn, X, Instagram)
2. **Create a short test post** (under 280 characters to work on all platforms)
3. **Select all platforms**
4. **Check character counters** - should all be green
5. **Click Publish**
6. **Check results** - should see success for all connected platforms

### Example Test Post (275 characters)

```
Testing our social media management platform! 🚀

This post is optimized for all platforms including X's 280 character limit.

#SocialMedia #Testing #Marketing
```

---

## Common Errors Explained

### "Platform not connected"

- **Cause**: No OAuth token found
- **Fix**: Connect the platform in Connected Accounts tab

### "Token expired"

- **Cause**: OAuth tokens expire after time
- **Fix**: Reconnect the platform

### "Content too long for X"

- **Cause**: Post exceeds 280 characters
- **Fix**: Shorten content or use platform-specific content

### "Instagram requires an image"

- **Cause**: Instagram doesn't allow text-only posts
- **Fix**: Add an image or video

### "No Instagram business account"

- **Cause**: Instagram not linked to Facebook Page
- **Fix**: Follow Instagram setup steps above

---

## Pro Tips

1. **Use Platform-Specific Content**: Uncheck "Use same content for all platforms" to customize for each
2. **Watch Character Counters**: Red = will fail, Yellow = getting close
3. **Test with Short Posts First**: Ensure connections work before long posts
4. **Reconnect Monthly**: OAuth tokens can expire, reconnect if issues arise
5. **Instagram Needs Images**: Always include media for Instagram posts

---

## Still Having Issues?

Check Vercel logs for detailed error messages:

1. Go to Vercel Dashboard
2. Select your project
3. Click "Logs"
4. Filter by `/api/posts/create`
5. Look for error details

The logs will show:

- Which platform failed
- Exact error message
- Token status
- API response details
