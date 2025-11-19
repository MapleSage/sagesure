# New Features Guide

## 🎨 Rich Text Editor

### Features

- **Bold** and _Italic_ formatting
- Insert links
- Bullet and numbered lists
- Platform-specific formatting (LinkedIn supports markdown)

### Usage

The rich text editor is now integrated into the post composer. Use the toolbar buttons to format your text.

---

## 🎤 Voice-to-Text

### Features

- Record audio directly in the browser
- Automatic transcription using Azure OpenAI Whisper
- Append transcribed text to your post

### Setup

1. Ensure Azure OpenAI Whisper deployment is configured
2. Add to `.env`:

```
AZURE_OPENAI_WHISPER_DEPLOYMENT=whisper-1
```

### Usage

1. Click the microphone icon in the text editor
2. Allow microphone access
3. Speak your post content
4. Click stop when done
5. Text will be automatically transcribed and added

---

## 🎥 Video Support

### Features

- Upload video files (MP4, MOV, AVI)
- Link YouTube videos
- Video preview in post composer
- Platform-specific video posting

### Supported Platforms

- **LinkedIn**: Native video upload
- **Facebook**: Native video upload
- **Instagram**: Video posts (Reels)
- **Twitter/X**: Native video upload
- **YouTube**: Link sharing

### Usage

1. Click "Add Video" button
2. Choose:
   - Upload video file (max 100MB)
   - Paste YouTube URL
3. Video will be attached to your post

---

## 🎨 Image Editor Integration

### Integrated Tools

#### 1. Canva

- Easy drag-and-drop design
- Thousands of templates
- Free and Pro versions
- Best for: Quick social media graphics

#### 2. Adobe Express

- Professional templates
- Adobe Creative Cloud integration
- Free and Premium tiers
- Best for: Brand-consistent designs

#### 3. Pixlr

- Free online photo editor
- Basic and advanced editing
- No account required
- Best for: Quick photo edits

#### 4. Photopea

- Free Photoshop alternative
- PSD file support
- Advanced features
- Best for: Professional editing

### Usage

1. Click "Edit with Design Tools"
2. Choose your preferred editor
3. Create/edit your image
4. Download the image
5. Upload to media library
6. Add to your post

---

## 📱 WhatsApp Business Integration

### Features

- Send messages to WhatsApp Business
- Broadcast to multiple numbers
- Image and text messages
- Message templates

### Setup

#### 1. Create WhatsApp Business Account

1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Create a WhatsApp Business account
3. Verify your business
4. Get your phone number approved

#### 2. Get API Credentials

1. Go to [Meta Developers](https://developers.facebook.com/)
2. Create an app with WhatsApp product
3. Get your:
   - Phone Number ID
   - Access Token
   - Business Account ID

#### 3. Add to Environment Variables

```env
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_RECIPIENT_NUMBER=recipient_number_for_testing
```

#### 4. Add OAuth Flow

Create `/app/api/oauth/whatsapp/authorize/route.ts` similar to other platforms.

### Usage

1. Connect WhatsApp Business account
2. Select WhatsApp when creating a post
3. Post will be sent as WhatsApp message
4. For broadcasts, configure recipient list

### Important Notes

- WhatsApp requires business verification
- Message templates must be pre-approved
- Rate limits apply based on tier
- Free tier: 1,000 conversations/month
- Requires Meta Business verification

---

## 🔧 Technical Implementation

### Rich Text Editor Component

```tsx
import RichTextEditor from "@/app/components/RichTextEditor";

<RichTextEditor
  value={content}
  onChange={setContent}
  platform="linkedin"
  maxLength={3000}
/>;
```

### Video Uploader Component

```tsx
import VideoUploader from "@/app/components/VideoUploader";

<VideoUploader
  onVideoSelect={(url, type) => setVideoUrl(url)}
  currentVideo={videoUrl}
  onRemove={() => setVideoUrl("")}
/>;
```

### Image Editor Integration

```tsx
import ImageEditorIntegration from "@/app/components/ImageEditorIntegration";

<ImageEditorIntegration onImageCreated={(url) => setImageUrl(url)} />;
```

---

## 📋 Environment Variables Summary

Add these to your `.env` and Vercel environment variables:

```env
# WhatsApp Business
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_RECIPIENT_NUMBER=recipient_number

# Azure OpenAI Whisper (for voice-to-text)
AZURE_OPENAI_WHISPER_DEPLOYMENT=whisper-1
```

---

## 🚀 Next Steps

1. **Test Voice Input**: Try recording a post with your voice
2. **Upload a Video**: Test video upload and YouTube linking
3. **Try Design Tools**: Create an image with Canva or Adobe Express
4. **Setup WhatsApp**: Follow the WhatsApp setup guide if needed

---

## 🐛 Troubleshooting

### Voice Input Not Working

- Check microphone permissions in browser
- Verify Azure OpenAI Whisper is deployed
- Check browser console for errors

### Video Upload Fails

- Check file size (max 100MB)
- Verify file format (MP4, MOV, AVI)
- Check Vercel Blob storage configuration

### WhatsApp Not Sending

- Verify business account is approved
- Check phone number verification
- Ensure message templates are approved
- Check rate limits

### Design Tools Not Opening

- Check popup blocker settings
- Try different browser
- Clear browser cache

---

## 💡 Tips

1. **Voice Posts**: Great for quick updates on mobile
2. **Video Content**: Higher engagement than images
3. **YouTube Links**: Share existing content easily
4. **Design Tools**: Create professional graphics without design skills
5. **WhatsApp**: Direct communication with customers

---

## 📚 Additional Resources

- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Canva Design Button](https://www.canva.com/developers/docs/design-button/)
- [Adobe Express API](https://developer.adobe.com/express/)
- [Azure OpenAI Whisper](https://learn.microsoft.com/en-us/azure/ai-services/openai/whisper-quickstart)
