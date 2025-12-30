# Multi-Brand Social Media Architecture

## Problem
Currently, the app only supports ONE social media account per platform (LinkedIn, Facebook, Twitter, Instagram).

You have TWO brands:
- **SageSure AI** (`sagesure.io`)
- **MapleSage** (`blog.maplesage.com`)

Each brand needs its own set of social accounts, but posts are currently going to your personal account.

## Solution Architecture

### Phase 1: Database Schema Update

**Current:**
```
tokens[userId]["linkedin"] = { accessToken, organizationId }
tokens[userId]["facebook"] = { accessToken, pageId }
```

**New:**
```
tokens[userId]["linkedin-sagesure"] = { accessToken, organizationId: 109911035, brand: "sagesure" }
tokens[userId]["linkedin-maplesage"] = { accessToken, organizationId: XXX, brand: "maplesage" }
tokens[userId]["facebook-sagesure"] = { accessToken, pageId: YYY, brand: "sagesure" }
tokens[userId]["facebook-maplesage"] = { accessToken, pageId: ZZZ, brand: "maplesage" }
```

### Phase 2: UI Changes

#### Settings Page
Add brand selector when connecting accounts:
```
┌─────────────────────────────────┐
│ Connect LinkedIn                │
│                                 │
│ Select Brand:                   │
│ ( ) SageSure AI                 │
│ ( ) MapleSage                   │
│                                 │
│ [Connect LinkedIn]              │
└─────────────────────────────────┘
```

#### Post Creation
Auto-detect brand from content URL:
- If content contains `blog.maplesage.com` → Use MapleSage accounts
- If content contains `sagesure.io` → Use SageSure accounts

### Phase 3: Publishing Logic Update

When publishing, determine brand and use correct account:

```typescript
const brand = detectBrand(postContent); // "sagesure" or "maplesage"
const platformKey = `${platform}-${brand}`; // e.g., "linkedin-sagesure"
const tokenData = await getToken(userId, platformKey);
```

## Implementation Steps

### Step 1: Add Brand Field to Tokens
```typescript
// lib/azure-storage.ts
export async function saveToken(userId: string, platform: string, data: any, brand?: string) {
  const platformKey = brand ? `${platform}-${brand}` : platform;
  // ... save with platformKey as rowKey
}
```

### Step 2: Update OAuth Callbacks
Add brand parameter to OAuth flows:
- `/oauth/linkedin/authorize?brand=sagesure`
- `/oauth/linkedin/callback` → extract brand from state

### Step 3: Update Publishing Functions
```typescript
// lib/platforms/linkedin.ts
export async function postToLinkedIn(accessToken, content, imageUrl, organizationId) {
  // No changes needed here - just pass correct organizationId
}

// app/api/posts/create/route.ts
const brand = detectBrand(content);
const tokenData = await getToken(userId, `linkedin-${brand}`);
```

### Step 4: Update Settings UI
Show all connected accounts grouped by brand:

```
SageSure AI:
  ✓ LinkedIn (Organization: SageSure AI)
  ✓ Facebook (Page: SageSure AI)
  ✗ Twitter (Not connected)
  ✗ Instagram (Not connected)

MapleSage:
  ✓ LinkedIn (Organization: MapleSage)
  ✗ Facebook (Not connected)
  ✗ Twitter (Not connected)
  ✗ Instagram (Not connected)
```

## Quick Fix (Temporary)

For immediate relief, you can:

1. **Disconnect all platforms** in Settings
2. **Connect LinkedIn for SageSure**
   - Will use Organization ID: 109911035
3. **Manually post MapleSage content** through LinkedIn directly

## Long-term Solution

Implement the full multi-brand architecture above. This will take:
- 2-3 hours to implement
- Requires reconnecting all accounts with brand tags
- Allows seamless multi-brand posting

## Migration Path

1. Add `brand` field to existing tokens (default to "sagesure")
2. Update all OAuth flows to include brand selection
3. Update posting logic to detect brand
4. Test with one platform (LinkedIn) first
5. Roll out to all platforms

## Questions to Answer

1. **Default Brand**: Which brand should be default if URL detection fails?
   - Suggestion: "sagesure"

2. **Instagram**: MapleSage posts require images. Will you always have images for MapleSage?
   - Current requirement: Instagram needs media

3. **OAuth Redirect**: After connecting, show which brand was connected
   - "✓ LinkedIn connected for SageSure AI"

4. **Unsuccessful Posts**: Auto-detect brand from blog URL?
   - Yes - already implemented in blogs page

## Testing Plan

1. Connect LinkedIn for SageSure → Test post
2. Connect LinkedIn for MapleSage → Test post
3. Verify posts go to correct organization pages
4. Repeat for Facebook, Twitter, Instagram

## Rollback Plan

If multi-brand breaks:
1. Keep old `getToken(userId, "linkedin")` as fallback
2. Try brand-specific first: `getToken(userId, "linkedin-sagesure")`
3. Fall back to generic: `getToken(userId, "linkedin")`
