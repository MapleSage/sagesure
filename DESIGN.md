# SageSure Social - Design Document

## Version: 2.0

## Last Updated: November 19, 2025

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Dashboard │  │ Calendar │  │  Blogs   │  │ Settings │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js API)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Posts   │  │  Media   │  │   AI     │  │  OAuth   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
│ Azure Table      │  │ Azure Blob   │  │ External APIs│
│ Storage          │  │ Storage      │  │ (Social,AI)  │
│ (Database)       │  │ (Media)      │  │              │
└──────────────────┘  └──────────────┘  └──────────────┘
```

---

## 2. Media Upload System Design

### 2.1 Component Architecture

```
MediaUploadComponent
├── UploadOptions
│   ├── LocalFileUpload
│   ├── GoogleDrivePicker
│   ├── DropboxChooser
│   ├── OneDrivePicker
│   ├── AIImageGenerator
│   └── MediaLibrary
├── UploadProgress
├── MediaPreview
└── MediaManager
```

### 2.2 Upload Flow Diagram

```
User Action
    │
    ▼
┌─────────────────┐
│ Select Upload   │
│ Method          │
└─────────────────┘
    │
    ├─── Local File ────────┐
    ├─── Google Drive ──────┤
    ├─── Dropbox ───────────┤
    ├─── OneDrive ──────────┤
    ├─── AI Generate ───────┤
    └─── Media Library ─────┤
                            │
                            ▼
                    ┌───────────────┐
                    │ File Selected │
                    └───────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Upload to     │
                    │ Azure Blob    │
                    └───────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Generate URL  │
                    │ & Metadata    │
                    └───────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Save to DB    │
                    └───────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Show Preview  │
                    └───────────────┘
```

### 2.3 Database Schema for Media

#### Media Table

```typescript
{
  partitionKey: userId,
  rowKey: mediaId,
  url: string,              // Azure Blob URL
  filename: string,
  type: "image" | "video",
  mimeType: string,
  size: number,             // bytes
  width: number,
  height: number,
  source: "upload" | "google-drive" | "dropbox" | "onedrive" | "ai-generated",
  createdAt: string,
  usedInPosts: string[],    // Array of post IDs
  tags: string[],
}
```

---

## 3. Social Media Posting Design

### 3.1 Posting Flow

```
User Creates Post
    │
    ▼
┌─────────────────┐
│ Validate Content│
│ & Media         │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ Save as Draft   │
│ (Optional)      │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ User Clicks     │
│ "Publish"       │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ Show Progress   │
│ Modal           │
└─────────────────┘
    │
    ├─── LinkedIn ──────┐
    ├─── Facebook ──────┤
    ├─── Twitter ───────┤
    └─── Instagram ─────┤
                        │
                        ▼
                ┌───────────────┐
                │ Post to API   │
                └───────────────┘
                        │
                        ▼
                ┌───────────────┐
                │ Get Response  │
                └───────────────┘
                        │
                        ▼
                ┌───────────────┐
                │ Update Status │
                │ in UI         │
                └───────────────┘
                        │
                        ▼
                ┌───────────────┐
                │ Save Result   │
                │ to DB         │
                └───────────────┘
```

### 3.2 Post Status States

```typescript
type PostStatus =
  | "draft" // Saved but not published
  | "publishing" // Currently being published
  | "published" // Successfully published to all platforms
  | "partial" // Published to some platforms, failed on others
  | "failed" // Failed to publish to all platforms
  | "scheduled"; // Scheduled for future publishing

type PlatformStatus = {
  platform: string;
  status: "pending" | "success" | "failed";
  postId?: string; // ID from the platform
  postUrl?: string; // URL to view the post
  error?: string;
  timestamp: string;
};
```

### 3.3 Error Handling Strategy

```
Post Attempt
    │
    ▼
Try to Post
    │
    ├─── Success ────────┐
    │                    │
    └─── Failure         │
         │               │
         ▼               │
    ┌─────────────┐     │
    │ Log Error   │     │
    └─────────────┘     │
         │               │
         ▼               │
    ┌─────────────┐     │
    │ Show User   │     │
    │ Friendly    │     │
    │ Message     │     │
    └─────────────┘     │
         │               │
         ▼               │
    ┌─────────────┐     │
    │ Offer Retry │     │
    └─────────────┘     │
         │               │
         └───────────────┘
                │
                ▼
         ┌─────────────┐
         │ Save Status │
         │ to DB       │
         └─────────────┘
```

---

## 4. UI/UX Design

### 4.1 Media Upload Component

#### Design Mockup

```
┌────────────────────────────────────────────────────────┐
│  Add Media                                             │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │                                                  │ │
│  │     Drag & drop files here                       │ │
│  │     or click to browse                           │ │
│  │                                                  │ │
│  │     [📁 Browse Files]                            │ │
│  │                                                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Or import from:                                       │
│                                                        │
│  [☁️  Google Drive]  [📦 Dropbox]  [📊 OneDrive]      │
│                                                        │
│  [🎨 Generate with AI]  [📚 Media Library]            │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### After Upload

```
┌────────────────────────────────────────────────────────┐
│  Media Attached                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────┐                                     │
│  │              │  image.jpg                          │
│  │   [Image]    │  1.2 MB                             │
│  │   Preview    │  1920x1080                          │
│  │              │                                     │
│  └──────────────┘  [✏️ Edit] [🗑️ Remove]              │
│                                                        │
│  [+ Add More Media]                                    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 4.2 Publishing Progress Modal

```
┌────────────────────────────────────────────────────────┐
│  Publishing to Social Media                     [✕]   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ✓ LinkedIn                                            │
│    Posted successfully                                 │
│    View post →                                         │
│                                                        │
│  ✓ Facebook                                            │
│    Posted successfully                                 │
│    View post →                                         │
│                                                        │
│  ⚠ Twitter                                             │
│    Failed: Invalid authentication token                │
│    [🔄 Retry] [ℹ️ Help]                                │
│                                                        │
│  ⏳ Instagram                                           │
│    Posting... 45%                                      │
│    ████████░░░░░░░░░░                                  │
│                                                        │
├────────────────────────────────────────────────────────┤
│  Posted to 2 of 4 platforms                           │
│                                                        │
│  [Close] [View All Posts]                             │
└────────────────────────────────────────────────────────┘
```

### 4.3 AI Image Generation Modal

```
┌────────────────────────────────────────────────────────┐
│  Generate Image with AI                          [✕]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Describe the image you want:                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ A professional business meeting in a modern      │ │
│  │ office with diverse team members...              │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Style:  [Realistic ▼]                                │
│  Size:   [1024x1024 ▼]                                │
│  Quality: [HD ▼]                                       │
│                                                        │
│  [🎨 Generate Image]                                   │
│                                                        │
│  ─────────────────────────────────────────────────    │
│                                                        │
│  Generated Image:                                      │
│  ┌──────────────────────────────────────────────────┐ │
│  │                                                  │ │
│  │         [Generated Image Preview]                │ │
│  │                                                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  [🔄 Regenerate] [✏️ Edit Prompt] [✓ Use This Image]  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 5. API Design

### 5.1 Media Upload API

#### POST /api/media/upload

```typescript
// Request
Content-Type: multipart/form-data
Body: {
  file: File,
  userId: string
}

// Response
{
  success: true,
  media: {
    id: string,
    url: string,
    filename: string,
    type: "image" | "video",
    size: number,
    width: number,
    height: number,
    createdAt: string
  }
}
```

#### GET /api/media/list

```typescript
// Request
Query: {
  userId: string,
  type?: "image" | "video",
  limit?: number,
  offset?: number
}

// Response
{
  success: true,
  media: Media[],
  total: number,
  hasMore: boolean
}
```

#### DELETE /api/media/:mediaId

```typescript
// Response
{
  success: true,
  message: "Media deleted successfully"
}
```

### 5.2 AI Image Generation API

#### POST /api/ai/generate-image-dalle

```typescript
// Request
{
  prompt: string,
  style?: "realistic" | "artistic" | "cartoon",
  size?: "1024x1024" | "1792x1024" | "1024x1792",
  quality?: "standard" | "hd"
}

// Response
{
  success: true,
  image: {
    url: string,
    revisedPrompt: string,
    size: string
  }
}
```

### 5.3 Enhanced Post Creation API

#### POST /api/posts/create

```typescript
// Request
{
  content: string,
  platforms: string[],
  mediaIds?: string[],        // NEW: Reference to uploaded media
  platformContent?: Record<string, string>,
  scheduledFor?: string,
  isDraft?: boolean
}

// Response
{
  success: true,
  postId: string,
  results: PlatformStatus[],
  summary: {
    total: number,
    succeeded: number,
    failed: number,
    failedPlatforms: {
      platform: string,
      error: string
    }[]
  }
}
```

---

## 6. Azure Blob Storage Design

### 6.1 Container Structure

```
user-media/
├── {userId}/
│   ├── images/
│   │   ├── {timestamp}-{filename}.jpg
│   │   ├── {timestamp}-{filename}.png
│   │   └── ...
│   ├── videos/
│   │   ├── {timestamp}-{filename}.mp4
│   │   └── ...
│   └── ai-generated/
│       ├── {timestamp}-{prompt-hash}.jpg
│       └── ...
```

### 6.2 Access Control

- **Private by default**: No public access
- **SAS Tokens**: Generate temporary URLs for access
- **Token Expiry**: 1 hour for viewing, 15 minutes for upload
- **User Isolation**: Users can only access their own media

### 6.3 CDN Integration (Optional)

- Use Azure CDN for faster delivery
- Cache images for 24 hours
- Purge cache when media is deleted

---

## 7. Cloud Storage Integration Design

### 7.1 Google Drive Integration

```typescript
// Use Google Picker API
const picker = new google.picker.PickerBuilder()
  .addView(google.picker.ViewId.DOCS_IMAGES)
  .setOAuthToken(accessToken)
  .setCallback(handleGoogleDriveSelection)
  .build();

picker.setVisible(true);

// On selection
function handleGoogleDriveSelection(data) {
  if (data.action === google.picker.Action.PICKED) {
    const file = data.docs[0];
    // Download file and upload to Azure Blob
    downloadAndUpload(file.url, file.name);
  }
}
```

### 7.2 Dropbox Integration

```typescript
// Use Dropbox Chooser
Dropbox.choose({
  success: function (files) {
    files.forEach((file) => {
      // Download file and upload to Azure Blob
      downloadAndUpload(file.link, file.name);
    });
  },
  linkType: "direct",
  multiselect: true,
  extensions: [".jpg", ".png", ".gif", ".mp4"],
});
```

### 7.3 OneDrive Integration

```typescript
// Use OneDrive File Picker
OneDrive.open({
  clientId: process.env.ONEDRIVE_CLIENT_ID,
  action: "download",
  multiSelect: true,
  success: function (files) {
    files.value.forEach((file) => {
      // Download file and upload to Azure Blob
      downloadAndUpload(file["@microsoft.graph.downloadUrl"], file.name);
    });
  },
});
```

---

## 8. Performance Optimization

### 8.1 Upload Optimization

- **Chunked Upload**: Split large files into chunks
- **Parallel Upload**: Upload chunks in parallel
- **Compression**: Compress images before upload
- **Resume**: Support resuming interrupted uploads

### 8.2 Posting Optimization

- **Parallel Posting**: Post to all platforms simultaneously
- **Timeout Handling**: 30 second timeout per platform
- **Retry Logic**: Retry failed posts with exponential backoff
- **Queue System**: Queue scheduled posts for background processing

### 8.3 Caching Strategy

- **Media URLs**: Cache for 24 hours
- **User Settings**: Cache for 1 hour
- **Platform Tokens**: Cache until expiry
- **Post History**: Cache for 5 minutes

---

## 9. Security Considerations

### 9.1 File Upload Security

- **File Type Validation**: Only allow whitelisted types
- **File Size Limits**: 10MB for images, 100MB for videos
- **Malware Scanning**: Scan uploaded files
- **Filename Sanitization**: Remove special characters
- **User Quotas**: Limit total storage per user

### 9.2 API Security

- **Authentication**: Require valid session
- **Authorization**: Users can only access their own data
- **Rate Limiting**: Limit API calls per user
- **Input Validation**: Validate all inputs
- **CSRF Protection**: Use CSRF tokens

---

## 10. Testing Strategy

### 10.1 Unit Tests

- Test media upload functions
- Test posting functions
- Test error handling
- Test validation logic

### 10.2 Integration Tests

- Test end-to-end upload flow
- Test end-to-end posting flow
- Test cloud storage integration
- Test AI image generation

### 10.3 Manual Testing

- Test with real social media accounts
- Test all upload methods
- Test error scenarios
- Test on different devices/browsers

---

## 11. Deployment Strategy

### 11.1 Phase 1: Critical Fixes (Immediate)

1. Fix social media posting
2. Add local file upload
3. Add proper error messages
4. Deploy and test

### 11.2 Phase 2: Cloud Integration (Week 1)

1. Implement Azure Blob Storage
2. Add Google Drive integration
3. Fix AI image generation
4. Add media library
5. Deploy and test

### 11.3 Phase 3: Enhancement (Week 2)

1. Add Dropbox/OneDrive
2. Add video support
3. Add post analytics
4. Comprehensive testing
5. Deploy to production

---

**Document Owner**: Development Team
**Last Review**: November 19, 2025
**Next Review**: November 26, 2025
