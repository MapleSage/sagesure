# SageSure Social - Requirements Document

## Version: 2.0

## Last Updated: November 19, 2025

---

## 1. Core Features

### 1.1 Social Media Posting

- ✅ Post to multiple platforms simultaneously (LinkedIn, Facebook, Twitter, Instagram)
- ✅ Platform-specific content customization
- ✅ Draft management
- ✅ Post scheduling
- ⚠️ **CRITICAL**: Actual posting to social platforms (currently broken)
- ❌ **MISSING**: Proper error handling and user feedback

### 1.2 Media Management

- ❌ **MISSING**: Local file upload from disk
- ❌ **MISSING**: Google Drive integration
- ❌ **MISSING**: Dropbox integration
- ❌ **MISSING**: OneDrive integration
- ❌ **MISSING**: Direct image/video upload
- ❌ **MISSING**: Media library/gallery
- ⚠️ **BROKEN**: AI image generation (not working)
- ⚠️ **LIMITED**: Only URL input currently available

### 1.3 Content Creation

- ✅ AI-powered content generation (Gemini)
- ✅ Spell check
- ✅ Content suggestions
- ✅ Platform-specific character limits
- ✅ Preview for each platform

### 1.4 Calendar Events & Suggestions

- ✅ AI-generated calendar events (30 days)
- ✅ Social post suggestions for events
- ✅ Brand-aligned content
- ✅ Settings management (company, brand, customer profile)

### 1.5 Blog Management

- ✅ Blog creation
- ✅ Blog to social post conversion
- ✅ HubSpot integration
- ✅ Blog publishing

---

## 2. Critical Issues to Fix

### 2.1 Media Upload System (HIGH PRIORITY)

**Problem**: Users can only enter image URLs, no way to upload files

**Required Features**:

1. **Local File Upload**

   - Drag & drop support
   - Click to browse
   - Support formats: JPG, PNG, GIF, MP4, MOV
   - Max file size: 10MB for images, 100MB for videos
   - Image preview before upload
   - Progress indicator during upload

2. **Cloud Storage Integration**

   - Google Drive picker
   - Dropbox chooser
   - OneDrive picker
   - Direct file import from cloud storage

3. **Media Library**

   - Store uploaded media
   - Reuse previously uploaded media
   - Organize by date/type
   - Delete unused media

4. **AI Image Generation**
   - Fix current broken implementation
   - Generate images with DALL-E or Stable Diffusion
   - Preview generated images
   - Edit/regenerate options
   - Save to media library

### 2.2 Social Media Posting (CRITICAL)

**Problem**: Posts save to database but don't actually post to social platforms

**Required Fixes**:

1. **LinkedIn Posting**

   - Fix API endpoint (use correct v2 API)
   - Handle image upload properly
   - Test with real account
   - Handle token refresh

2. **Facebook Posting**

   - Verify page permissions
   - Test image posting
   - Handle errors gracefully

3. **Twitter/X Posting**

   - Fix media upload
   - Handle API v2 properly
   - Test with real account

4. **Instagram Posting**

   - Verify business account connection
   - Test image posting
   - Handle container creation properly

5. **Error Handling**
   - Show specific error messages to user
   - Log errors for debugging
   - Retry failed posts
   - Save failed posts as drafts

### 2.3 User Feedback (HIGH PRIORITY)

**Problem**: Users don't know if posts actually succeeded or failed

**Required Features**:

1. **Post Status Indicators**

   - Real-time posting progress
   - Success/failure per platform
   - Detailed error messages
   - Retry option for failed posts

2. **Notifications**

   - Toast notifications for actions
   - Success confirmations
   - Error alerts with details
   - Progress indicators

3. **Post History**
   - Show actual post status
   - Link to live posts on platforms
   - View post analytics
   - Edit/delete posts

---

## 3. Feature Requirements

### 3.1 Media Upload Component

#### 3.1.1 Upload Options

```
┌─────────────────────────────────────────┐
│  Add Media                              │
├─────────────────────────────────────────┤
│  [📁 Upload from Computer]              │
│  [☁️  Import from Google Drive]         │
│  [📦 Import from Dropbox]               │
│  [📊 Import from OneDrive]              │
│  [🎨 Generate with AI]                  │
│  [📚 Choose from Library]               │
└─────────────────────────────────────────┘
```

#### 3.1.2 Upload Flow

1. User clicks upload option
2. File picker opens (or cloud picker)
3. User selects file(s)
4. File uploads to Azure Blob Storage
5. Preview shown with edit options
6. URL saved for posting

#### 3.1.3 Storage

- Use Azure Blob Storage for media files
- Generate unique filenames
- Store metadata (size, type, upload date)
- Associate with user account
- Clean up unused files periodically

### 3.2 AI Image Generation

#### 3.2.1 Generation Flow

1. User enters prompt
2. AI enhances prompt (Gemini)
3. Generate image (DALL-E 3 or Stable Diffusion)
4. Show preview
5. Options: Regenerate, Edit prompt, Use image
6. Save to media library
7. Attach to post

#### 3.2.2 Image Generation Options

- Style selection (realistic, artistic, cartoon, etc.)
- Size selection (1024x1024, 1792x1024, etc.)
- Quality selection (standard, HD)
- Multiple variations
- Edit/refine generated images

### 3.3 Post Publishing

#### 3.3.1 Publishing Flow

1. User creates post with content and media
2. Selects platforms
3. Clicks "Publish"
4. System shows progress modal:
   ```
   Publishing to platforms...
   ✓ LinkedIn - Posted successfully
   ✓ Facebook - Posted successfully
   ⚠ Twitter - Failed: Invalid token
   ⏳ Instagram - Posting...
   ```
5. Show final summary
6. Save post with status per platform

#### 3.3.2 Error Handling

- Specific error messages per platform
- Retry button for failed platforms
- Save as draft if all fail
- Log errors for debugging
- Show user-friendly messages

---

## 4. Technical Requirements

### 4.1 Media Storage

- **Service**: Azure Blob Storage
- **Container**: user-media
- **Structure**: `{userId}/{timestamp}-{filename}`
- **Access**: Private with SAS tokens
- **CDN**: Optional for faster delivery

### 4.2 File Upload API

```typescript
POST /api/media/upload
Content-Type: multipart/form-data

Response:
{
  success: true,
  url: "https://storage.../image.jpg",
  mediaId: "12345",
  metadata: {
    size: 1024000,
    type: "image/jpeg",
    width: 1920,
    height: 1080
  }
}
```

### 4.3 Cloud Storage Integration

- **Google Drive**: Use Google Picker API
- **Dropbox**: Use Dropbox Chooser
- **OneDrive**: Use OneDrive File Picker

### 4.4 AI Image Generation

- **Service**: OpenAI DALL-E 3 or Stability AI
- **Prompt Enhancement**: Gemini AI
- **Storage**: Save generated images to Azure Blob
- **Cost**: Track API usage per user

---

## 5. User Experience Requirements

### 5.1 Media Upload UX

- Drag & drop anywhere on post creation area
- Visual feedback during upload
- Progress bar with percentage
- Preview with edit/remove options
- Multiple file upload support
- Paste images from clipboard

### 5.2 Posting UX

- Clear status indicators
- Real-time progress updates
- Detailed error messages
- One-click retry for failures
- Link to view live posts
- Post analytics (likes, shares, comments)

### 5.3 Mobile Responsiveness

- All features work on mobile
- Touch-friendly upload
- Mobile-optimized media picker
- Responsive preview

---

## 6. Security Requirements

### 6.1 File Upload Security

- Validate file types
- Scan for malware
- Limit file sizes
- Sanitize filenames
- Check user quotas
- Rate limiting

### 6.2 Media Access

- Private storage by default
- SAS tokens for temporary access
- User can only access their media
- Automatic cleanup of old files

---

## 7. Performance Requirements

### 7.1 Upload Performance

- Max upload time: 30 seconds for 10MB
- Chunked upload for large files
- Resume interrupted uploads
- Compress images before upload

### 7.2 Posting Performance

- Post to all platforms in parallel
- Max posting time: 10 seconds per platform
- Timeout handling
- Queue for scheduled posts

---

## 8. Testing Requirements

### 8.1 Media Upload Testing

- Test all file types
- Test large files
- Test multiple uploads
- Test cloud storage pickers
- Test error scenarios

### 8.2 Posting Testing

- Test each platform individually
- Test with real accounts
- Test error scenarios
- Test token refresh
- Test rate limits

---

## 9. Documentation Requirements

### 9.1 User Documentation

- How to upload media
- How to use cloud storage
- How to generate AI images
- How to troubleshoot posting errors
- FAQ for common issues

### 9.2 Developer Documentation

- API documentation
- Architecture diagrams
- Setup instructions
- Deployment guide
- Troubleshooting guide

---

## 10. Priority Matrix

### P0 - Critical (Must Fix Immediately)

1. ❌ Fix social media posting to actually post
2. ❌ Add local file upload
3. ❌ Show posting results to user
4. ❌ Fix error handling

### P1 - High Priority (Next Sprint)

1. ❌ Add Google Drive integration
2. ❌ Fix AI image generation
3. ❌ Add media library
4. ❌ Add post analytics

### P2 - Medium Priority

1. ❌ Add Dropbox integration
2. ❌ Add OneDrive integration
3. ❌ Add video upload support
4. ❌ Add image editing

### P3 - Low Priority

1. ❌ Add post templates
2. ❌ Add team collaboration
3. ❌ Add approval workflows
4. ❌ Add advanced analytics

---

## 11. Success Metrics

### 11.1 Functionality

- ✅ 100% of posts actually publish to platforms
- ✅ 95% upload success rate
- ✅ < 5 second upload time for images
- ✅ < 10 second posting time per platform

### 11.2 User Satisfaction

- ✅ Users can upload media easily
- ✅ Users know if posts succeeded/failed
- ✅ Clear error messages
- ✅ Easy retry for failures

---

## 12. Current Status

### What Works

- ✅ User authentication
- ✅ OAuth connections to platforms
- ✅ Draft management
- ✅ AI content generation
- ✅ Calendar events feature
- ✅ Blog management

### What's Broken

- ❌ Social media posting (saves but doesn't post)
- ❌ AI image generation
- ❌ Media upload (only URL input)
- ❌ Error feedback to users

### What's Missing

- ❌ Local file upload
- ❌ Cloud storage integration
- ❌ Media library
- ❌ Post analytics
- ❌ Proper error handling

---

## Next Steps

1. **Immediate** (Today):

   - Fix social media posting APIs
   - Add local file upload
   - Add proper error messages

2. **This Week**:

   - Implement Azure Blob Storage
   - Add Google Drive integration
   - Fix AI image generation
   - Add media library

3. **Next Week**:
   - Add post analytics
   - Add Dropbox/OneDrive
   - Add video support
   - Comprehensive testing

---

**Document Owner**: Development Team
**Last Review**: November 19, 2025
**Next Review**: November 26, 2025
