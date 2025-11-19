# 📅 Calendar Events & Social Post Suggestions Feature

> AI-powered calendar event generation and social media post suggestions aligned with your brand identity

## 🎯 Overview

This feature automatically generates business-relevant calendar events for the next 30 days and creates tailored social media post suggestions for each event. All content is aligned with your company's brand identity and ideal customer profile.

## ✨ Key Features

- **🤖 AI-Powered**: Uses Google Gemini AI for intelligent content generation
- **📊 Smart Planning**: Generates 15 events covering the next 30 days
- **🎨 Brand-Aligned**: All content matches your brand identity
- **👥 Customer-Focused**: Posts tailored to your ideal customer profile
- **📝 Draft Management**: Posts saved as drafts for review before publishing
- **🌐 Multi-Platform**: Content suitable for LinkedIn, Facebook, Twitter, Instagram

## 🚀 Quick Start

### 1. Deploy

```bash
cd sagesure-social
npm run build
vercel --prod
```

### 2. Initialize

```bash
curl https://your-app-url.vercel.app/api/init
```

### 3. Use

1. Login to dashboard
2. Click "Calendar Events"
3. Configure settings (company name, brand, customer profile)
4. Click "Generate Events & Suggestions"
5. Review events and click "View Suggested Posts"
6. Edit and publish posts from drafts

## 📋 Requirements

### Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key
AZURE_STORAGE_CONNECTION_STRING=your_azure_connection_string
```

### Dependencies

- Next.js 16+
- Google Generative AI SDK
- Azure Data Tables SDK
- React 19+

## 🏗️ Architecture

### API Routes

- `POST /api/settings` - Save company settings
- `GET /api/settings` - Retrieve settings
- `POST /api/events/generate` - Generate calendar events
- `POST /api/events/suggestions` - Generate post suggestions

### Database Tables

- **Settings**: Company name, brand identity, customer profile
- **Events**: Calendar events with dates and descriptions
- **Posts**: Social media posts (drafts and published)

### UI Pages

- `/calendar` - Calendar events dashboard
- `/dashboard?tab=drafts` - View suggested posts

## 📖 User Guide

### First Time Setup

1. **Navigate to Calendar Events**

   - From dashboard, click "Calendar Events" tab

2. **Configure Settings**

   - Click "Settings" button
   - Enter required information:
     - **Company Name** (required): Your business name
     - **Brand Identity** (optional): Your brand's voice and values
     - **Customer Profile** (optional): Your target audience description

3. **Save Settings**
   - Click "Save Settings"
   - Settings are stored for future use

### Generating Content

1. **Click Generate Button**

   - Click "Generate Events & Suggestions"
   - Wait 30-60 seconds for AI processing

2. **Review Events**

   - View table of 15 generated events
   - Each event includes:
     - Date
     - Event title
     - Category (Holiday, Industry Event, Awareness Day, Seasonal)
     - Description

3. **Access Post Suggestions**

   - Click "View Suggested Posts" button
   - Redirects to drafts tab
   - Review 15 AI-generated posts

4. **Publish Posts**
   - Edit posts as needed
   - Select platforms
   - Schedule or publish immediately

## 🎨 Example Settings

### SageSure Insurance Example

**Company Name:**

```
SageSure Insurance
```

**Brand Identity:**

```
Professional, trustworthy, and customer-focused insurance provider.
We emphasize protection, peace of mind, and personalized service.
Our tone is warm yet authoritative, approachable yet expert.
We value transparency, reliability, and proactive communication.
```

**Customer Profile:**

```
Homeowners and property owners aged 35-65 seeking comprehensive
insurance coverage. They value security, reliability, and responsive
customer service. They're looking for clear communication about their
coverage options and proactive protection for their most valuable assets.
```

## 📊 What Gets Generated

### Calendar Events (15 total)

- National holidays relevant to your industry
- Industry-specific awareness days
- Seasonal events and occasions
- Business milestones and celebrations
- Community events and observances

### Social Post Suggestions (15 total)

- One post per event
- Platform-optimized content
- Relevant hashtags included
- Call-to-action included
- Brand voice maintained
- Customer-focused messaging

## 🔧 Technical Details

### Event Generation Process

1. Check if company name is set
2. Query existing events for next 30 days
3. If < 10 events exist, generate new ones
4. Use Gemini AI with company context
5. Save events to Azure Table Storage
6. Return events array

### Post Suggestion Process

1. Take generated events as input
2. Use Gemini AI with brand context
3. Generate tailored posts for each event
4. Save posts as drafts
5. Return socialAgentUrl for viewing

### AI Prompts

- **Events**: Considers company name, brand identity, customer profile
- **Posts**: Aligns with brand voice, targets customer profile, includes hashtags

## 📁 File Structure

```
sagesure-social/
├── app/
│   ├── calendar/
│   │   └── page.tsx                    # Calendar dashboard UI
│   └── api/
│       ├── events/
│       │   ├── generate/
│       │   │   └── route.ts           # Event generation API
│       │   └── suggestions/
│       │       └── route.ts           # Post suggestions API
│       └── settings/
│           └── route.ts               # Settings management API
├── lib/
│   └── azure-storage.ts               # Database operations
└── docs/
    ├── CALENDAR_EVENTS_FEATURE.md     # Feature documentation
    ├── DEPLOY_CALENDAR_FEATURE.md     # Deployment guide
    ├── QUICK_START_CALENDAR.md        # Quick start guide
    ├── CALENDAR_FLOW_DIAGRAM.md       # Visual diagrams
    ├── TEST_CALENDAR_FEATURE.md       # Testing guide
    └── README_CALENDAR_FEATURE.md     # This file
```

## 🧪 Testing

### Manual Testing

1. Configure settings
2. Generate events
3. Verify events appear
4. Check post suggestions
5. Publish a post

### API Testing

```bash
# Test settings
curl -X POST https://your-app/api/settings \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","companyName":"Test Co"}'

# Test event generation
curl -X POST https://your-app/api/events/generate \
  -H "Content-Type: application/json" \
  -d '{"userId":"test"}'
```

See `TEST_CALENDAR_FEATURE.md` for comprehensive testing guide.

## 🐛 Troubleshooting

### "Company name not set" error

**Solution**: Go to Settings and enter your company name

### Events not generating

**Possible causes**:

- Invalid Gemini API key
- Network connectivity issues
- Azure Storage connection issues

**Solution**: Check environment variables and logs

### Posts not appearing in drafts

**Possible causes**:

- Event generation failed
- Suggestions API error

**Solution**: Check browser console and API logs

### Slow generation

**Expected**: AI processing takes 30-60 seconds
**If longer**: Check API rate limits and network speed

## 📈 Best Practices

### Settings Configuration

- Be specific with brand identity
- Detail your customer profile
- Update settings as brand evolves

### Content Review

- Always review AI-generated posts
- Customize for your specific audience
- Add personal touches
- Verify dates and details

### Scheduling

- Schedule posts in advance
- Spread posts throughout the month
- Align with your content calendar
- Monitor engagement and adjust

## 🔐 Security

- User authentication required
- Settings stored per user
- Events isolated by user ID
- API endpoints protected
- Environment variables secured

## 🚀 Performance

- Event generation: 30-60 seconds
- Post suggestions: 30-60 seconds
- Settings save: < 1 second
- Page load: < 2 seconds

## 📞 Support

### Documentation

- `CALENDAR_EVENTS_FEATURE.md` - Full feature docs
- `DEPLOY_CALENDAR_FEATURE.md` - Deployment guide
- `QUICK_START_CALENDAR.md` - Quick start
- `CALENDAR_FLOW_DIAGRAM.md` - Visual diagrams
- `TEST_CALENDAR_FEATURE.md` - Testing guide

### Common Issues

See troubleshooting section above

## 🎉 Success Metrics

Track these metrics to measure success:

- Number of events generated
- Number of posts created
- Posts published from suggestions
- User engagement with posts
- Time saved on content planning

## 🔄 Future Enhancements

Potential improvements:

- Manual event creation/editing
- Recurring events support
- Event categories filtering
- Bulk post scheduling
- Analytics for event-based posts
- Custom event templates
- Multi-language support
- Image generation for posts

## 📝 License

Part of SageSure Social platform

## 🙏 Credits

- Built with Next.js and React
- Powered by Google Gemini AI
- Stored in Azure Table Storage
- UI components from React Icons

---

**Ready to get started?** Follow the Quick Start guide above! 🚀
