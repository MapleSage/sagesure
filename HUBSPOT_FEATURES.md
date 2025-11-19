# HubSpot-Style Features Implementation

## Based on Screenshots Analysis

---

## 1. Media Library Modal

### Features Required:

- ✅ Modal overlay with "Select up to 20 images" title
- ✅ Search bar: "Search by name, descriptions, folders, or stock images"
- ✅ Recently updated section with image grid
- ✅ Recently updated folders section
- ✅ Three action buttons:
  - "Insert files (0/20)" - Shows selected count
  - "Upload" dropdown - Options for upload sources
  - "Generate with AI" - AI image generation

### Upload Dropdown Options:

1. Upload from computer
2. Import from URL
3. Import from Google Drive
4. Import from Dropbox
5. Import from OneDrive

### UI Specifications:

```
┌────────────────────────────────────────────────────────┐
│  Select up to 20 images                          [✕]  │
├────────────────────────────────────────────────────────┤
│  [🔍 Search by name, descriptions, folders...]        │
│                                                        │
│  Recently updated                        View all →   │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                         │
│  │img │ │img │ │img │ │img │                         │
│  └────┘ └────┘ └────┘ └────┘                         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                         │
│  │img │ │img │ │img │ │img │                         │
│  └────┘ └────┘ └────┘ └────┘                         │
│                                                        │
│  Recently updated folders                View all →   │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                         │
│  │📁  │ │📁  │ │📁  │ │📁  │                         │
│  │294 │ │136 │ │2403│ │2403│                         │
│  └────┘ └────┘ └────┘ └────┘                         │
│                                                        │
├────────────────────────────────────────────────────────┤
│  [Insert files (0/20)] [Upload ▼] [Generate with AI] │
└────────────────────────────────────────────────────────┘
```

---

## 2. Post Creation Interface

### Left Panel - Post Composer

#### Account Selection:

```
Select accounts
┌────────────────────────────────────┐
│ Choose the accounts you're posting │
│ from                          [▼]  │
└────────────────────────────────────┘

☑ MaplesAge.com
☑ SageSure
☑ Instagram
  ☑ maplesageinc
☐ X
  □ MapleSage Inc
+ Connect new account
```

#### Content Editor:

```
Create your posts
┌────────────────────────────────────┐
│ Draft (all networks)               │
├────────────────────────────────────┤
│ What do you want to say to your    │
│ network?                           │
│                                    │
│ # Hashtags  @  📎  +              │
└────────────────────────────────────┘

Character count: 2201 / 1901
```

#### Media Section:

```
Add media ℹ️
┌────────────────────────────────────┐
│ [📷 Select image] [🎥 Select video]│
│                                    │
│ Select an image or a video or drag│
│ and drop images and videos straight│
│ from your desktop                  │
└────────────────────────────────────┘
```

#### Publishing Options:

```
Publishing options
○ Publish now
● Schedule for later ℹ️

Date                Time (GMT+5:30) ℹ️
[📅 11/19/2025]    [🕐 7:17 PM]

Your time zone: UTC+05:30

Marketing campaign
● Insurance-Transformation    [▼]
Open in Marketing Studio ℹ️
```

### Right Panel - Preview

```
Preview may display differently when posted. ℹ️

┌────────────────────────────────────┐
│ 📘 Facebook                        │
│                                    │
│ Scheduled: Wednesday, November 19, │
│ 2025 7:17 PM GMT+5:30             │
│                                    │
│ 👤 MapleSage                       │
│    Just now · 🌐                   │
│                                    │
│ Introducing SageSure               │
│                                    │
│ The specialty insurance market...  │
│                                    │
│ 👍 Like  💬 Comment  ↗️ Share      │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ 📘 MapleSage.com                   │
│    Just now · 🌐                   │
│                                    │
│ Introducing SageSure               │
│                                    │
│ The specialty insurance market...  │
│                                    │
│ 👍 Like  💬 Comment  ↗️ Share      │
└────────────────────────────────────┘
```

---

## 3. Published Posts Management

### List View Features:

```
┌────────────────────────────────────────────────────────┐
│ [📋 List] [📊 Calendar]                               │
│                                                        │
│ [🔍 Search for posts]  Users: Any ▼  Accounts: All ▼ │
│                                                        │
│ Date range: [📅 01/01/2000] to [📅 11/19/2025]       │
│ Campaign: All campaigns ▼  Created by: All users ▼   │
│                                                        │
│ [⚙️ Manage columns] [📤 Export posts]                 │
│                                                        │
├────────────────────────────────────────────────────────┤
│ ● Published                                            │
│ ○ Scheduled 0                                          │
│ ○ Unsuccessful 21                                      │
│ ○ Drafts 54                                           │
├────────────────────────────────────────────────────────┤
│ POST              PUBLISHED TIME    CLICKS  INTERACTIONS│
│                                                        │
│ [img] MapleSage   Nov 17, 2025     ---     ---        │
│       AWS re:...  Mon 12:20 PM                        │
│       🤖 Generated with AI                             │
│                                                        │
│ [img] MapleSage   Nov 17, 2025     ---     ---        │
│       AWS re:...  Mon 11:30 AM                        │
│       🤖 Generated with AI                             │
└────────────────────────────────────────────────────────┘
```

### Status Indicators:

- **Published**: Green dot, shows published time
- **Scheduled**: Yellow dot, shows scheduled time
- **Unsuccessful**: Red dot, shows error
- **Drafts**: Gray dot, shows draft count

---

## 4. Implementation Priority

### Phase 1: Media Library (P0)

1. Create media library modal component
2. Implement image grid with thumbnails
3. Add search functionality
4. Add folder organization
5. Implement "Upload" dropdown with options:
   - Upload from computer
   - Import from URL
   - Google Drive integration
   - Dropbox integration
   - OneDrive integration
6. Add "Generate with AI" button
7. Implement multi-select (up to 20 images)
8. Add "Insert files" button with counter

### Phase 2: Post Composer Enhancement (P0)

1. Improve account selection UI
2. Add character counter per platform
3. Enhance media section with drag & drop
4. Add hashtag and mention support
5. Improve scheduling UI
6. Add marketing campaign dropdown
7. Enhance preview panel

### Phase 3: Posts Management (P1)

1. Add list/calendar view toggle
2. Implement advanced filters
3. Add status tabs (Published, Scheduled, Unsuccessful, Drafts)
4. Show post analytics (clicks, interactions)
5. Add bulk actions
6. Add export functionality

---

## 5. Technical Implementation

### Media Library Component

```typescript
interface MediaLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: Media[]) => void;
  maxSelection?: number; // default 20
  allowedTypes?: ("image" | "video")[];
}

interface Media {
  id: string;
  url: string;
  thumbnail: string;
  filename: string;
  type: "image" | "video";
  size: number;
  width: number;
  height: number;
  folder?: string;
  createdAt: string;
  selected?: boolean;
}
```

### Upload Dropdown Component

```typescript
interface UploadOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

const uploadOptions: UploadOption[] = [
  {
    id: "computer",
    label: "Upload from computer",
    icon: <FaUpload />,
    action: () => openFileDialog(),
  },
  {
    id: "url",
    label: "Import from URL",
    icon: <FaLink />,
    action: () => openUrlDialog(),
  },
  {
    id: "google-drive",
    label: "Import from Google Drive",
    icon: <FaGoogleDrive />,
    action: () => openGoogleDrivePicker(),
  },
  // ... more options
];
```

### Post Status Component

```typescript
interface PostStatus {
  status: "published" | "scheduled" | "unsuccessful" | "draft";
  platforms: {
    platform: string;
    status: "success" | "failed" | "pending";
    postId?: string;
    postUrl?: string;
    error?: string;
  }[];
  publishedAt?: string;
  scheduledFor?: string;
  clicks?: number;
  interactions?: number;
}
```

---

## 6. UI Components Needed

### New Components:

1. `MediaLibraryModal` - Main media selection modal
2. `MediaGrid` - Grid of media thumbnails
3. `MediaFolders` - Folder navigation
4. `UploadDropdown` - Upload options dropdown
5. `AIImageGenerator` - AI generation modal
6. `AccountSelector` - Multi-account selection
7. `PostPreview` - Platform-specific preview
8. `PublishingOptions` - Schedule and campaign options
9. `PostsList` - Posts management list
10. `PostFilters` - Advanced filtering
11. `StatusTabs` - Status filter tabs
12. `CharacterCounter` - Platform-specific counter

### Enhanced Components:

1. `Dashboard` - Add media library integration
2. `PostComposer` - Enhance with new features
3. `MediaUpload` - Replace with new system

---

## 7. API Endpoints Needed

### Media Library:

- `GET /api/media/library` - List all media
- `GET /api/media/folders` - List folders
- `GET /api/media/search?q=query` - Search media
- `POST /api/media/upload` - Upload media
- `POST /api/media/import-url` - Import from URL
- `POST /api/media/import-drive` - Import from cloud
- `DELETE /api/media/:id` - Delete media

### Posts Management:

- `GET /api/posts/list?status=published` - List posts by status
- `GET /api/posts/analytics/:id` - Get post analytics
- `PATCH /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/bulk-action` - Bulk operations

---

## 8. Database Schema Updates

### Media Table Enhancement:

```typescript
{
  partitionKey: userId,
  rowKey: mediaId,
  url: string,
  thumbnail: string,
  filename: string,
  type: 'image' | 'video',
  mimeType: string,
  size: number,
  width: number,
  height: number,
  folder: string,
  tags: string[],
  description: string,
  source: 'upload' | 'url' | 'google-drive' | 'dropbox' | 'onedrive' | 'ai',
  usedInPosts: string[],
  clicks: number,
  views: number,
  createdAt: string,
  updatedAt: string
}
```

### Posts Table Enhancement:

```typescript
{
  partitionKey: userId,
  rowKey: postId,
  content: string,
  platforms: string[],
  platformContent: Record<string, string>,
  mediaIds: string[],
  status: 'draft' | 'scheduled' | 'published' | 'failed',
  platformStatuses: {
    platform: string,
    status: 'success' | 'failed' | 'pending',
    postId?: string,
    postUrl?: string,
    error?: string,
    publishedAt?: string
  }[],
  scheduledFor?: string,
  publishedAt?: string,
  campaign?: string,
  clicks: number,
  interactions: number,
  createdAt: string,
  updatedAt: string
}
```

---

## 9. Next Steps

### Immediate (Today):

1. Create MediaLibraryModal component
2. Implement basic media grid
3. Add upload from computer
4. Add drag & drop support

### This Week:

1. Add cloud storage integrations
2. Implement folder organization
3. Add search functionality
4. Enhance post composer UI
5. Add character counters
6. Improve preview panel

### Next Week:

1. Add posts management view
2. Implement status tabs
3. Add analytics display
4. Add bulk operations
5. Add export functionality

---

**Based on**: HubSpot Social Media Tool Screenshots
**Last Updated**: November 19, 2025
