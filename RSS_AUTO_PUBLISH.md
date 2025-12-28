# RSS Auto-Publish to Social Media

## Overview

SageSure Social now automatically monitors your RSS feeds and publishes new blog posts to social media - just like WordPress RSS plugins!

## How It Works

1. **Automatic Monitoring**: A cron job checks your RSS feeds every 30 minutes
2. **New Post Detection**: Detects new blog posts that haven't been processed yet
3. **AI Content Generation**: Automatically generates 5 optimized social media posts from each blog
4. **Smart Scheduling**: Schedules posts at optimal times (8AM, 12PM, 2PM, 5PM, 7PM)
5. **Auto-Publishing**: Posts go live automatically at scheduled times

## Configured RSS Feeds

Currently monitoring two feeds:

1. **SageSure AI Blog**
   - URL: `https://sagesure.io/ai-you-can-be-sure/rss.xml`
   - Brand: `sagesure`

2. **MapleSage Blog**
   - URL: `https://blog.maplesage.com/rss.xml`
   - Brand: `maplesage`

## Features

✅ **Zero Manual Work** - Publish once to your blog, appears everywhere automatically
✅ **Smart AI Generation** - Creates engaging social posts from blog content
✅ **Optimal Timing** - Posts scheduled at peak engagement times
✅ **Multi-Platform** - Publishes to LinkedIn, Facebook, Twitter, Instagram
✅ **Image Handling** - Automatically downloads and includes featured images
✅ **Duplicate Prevention** - Each blog post is processed only once
✅ **Error Resilient** - Continues processing even if individual posts fail

## Workflow

```
New Blog Published
       ↓
RSS Feed Updated
       ↓
Cron Job Detects (every 30 min)
       ↓
Download Featured Image → Upload to Azure
       ↓
Save Blog to Database
       ↓
Generate 5 Social Posts with AI
       ↓
Schedule Posts (spread over 2-3 days)
       ↓
Auto-Publish at Scheduled Times
```

## Cron Schedule

- **RSS Monitor**: Daily at 11:30 AM UTC / 4:00 PM Dubai time (`30 11 * * *`)
- **Post Publisher**: Daily at midnight UTC / 4:00 AM Dubai (`0 0 * * *`)
- **Retry Failed Social Posts**: Daily at 6:00 AM UTC / 10:00 AM Dubai (`0 6 * * *`)

> **Note**: Vercel Hobby plan limits cron jobs to once per day. For more frequent checks (e.g., every 30 minutes like HubSpot), upgrade to Vercel Pro plan.

### Retry Failed Social Posts - THE ORIGINAL PURPOSE

This cron job addresses the **original purpose** of the app: **publishing posts that failed in HubSpot due to quota limits or errors since Dec 15, 2024**.

It fetches blog posts from HubSpot that have:
- Failed social media publishing attempts
- Error status or cancelled broadcasts
- Quota exceeded errors
- Not been successfully published to social platforms

The cron job then schedules these posts for automatic retry publishing to the failed platforms, ensuring **all your blog content eventually gets published to social media** even when HubSpot hits quota limits.

## Configuration

### Environment Variables Required

```bash
# Cron job authentication
CRON_SECRET=your_random_secret_key

# Application URL
NEXTAUTH_URL=https://social.sagesure.io

# Azure Storage (for images and data)
AZURE_STORAGE_CONNECTION_STRING=...

# Social Platform Tokens
LINKEDIN_ACCESS_TOKEN=...
FACEBOOK_ACCESS_TOKEN=...
TWITTER_ACCESS_TOKEN=...
INSTAGRAM_ACCESS_TOKEN=...

# AI Services (for post generation)
OPENAI_API_KEY=...
```

### Adding New RSS Feeds

Edit `/lib/rss-feeds.ts`:

```typescript
export const RSS_FEEDS = {
  sagesure: {
    url: "https://sagesure.io/ai-you-can-be-sure/rss.xml",
    name: "SageSure AI",
    brand: "sagesure",
  },
  maplesage: {
    url: "https://blog.maplesage.com/rss.xml",
    name: "MapleSage Blog",
    brand: "maplesage",
  },
  // Add new feed here:
  consulting: {
    url: "https://your-blog.com/rss.xml",
    name: "Your Blog Name",
    brand: "consulting",
  },
};
```

## Manual Trigger

You can manually trigger the RSS auto-publish process:

```bash
curl -X GET https://social.sagesure.io/api/cron/rss-auto-publish \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Monitoring

Check Vercel logs for RSS auto-publish activity:

```
[RSS Auto-Publish] Starting RSS auto-publish check
[RSS Auto-Publish] Fetched 59 total posts from RSS feeds
[RSS Auto-Publish] New post detected: Your Blog Title
[RSS Auto-Publish] Featured image uploaded
[RSS Auto-Publish] Generated 5 social posts for: Your Blog Title
[RSS Auto-Publish] ✓ Processed: Your Blog Title
[RSS Auto-Publish] Complete - New posts: 1, Social posts generated: 5
```

## Current Backlog

As of Dec 26, 2025:
- **33 pending posts** from blog.maplesage.com (since Dec 18)
- **27 pending posts** from sagesure.io/ai-you-can-be-sure (since Dec 19)

The next cron run will automatically process all these posts and schedule them for optimal publishing times.

## Posting Schedule

Posts are scheduled across multiple days to avoid flooding your social media:

- **Day 1**: Posts 1-2 (8AM, 12PM)
- **Day 2**: Posts 3-4 (2PM, 5PM)
- **Day 3**: Post 5 (7PM)

For 60 blog posts = 300 social posts scheduled over ~2 months

## Troubleshooting

### Posts Not Auto-Publishing

1. Check cron job is enabled in Vercel dashboard
2. Verify CRON_SECRET is set correctly
3. Check Vercel logs for errors
4. Ensure social platform tokens are valid

### Duplicate Posts

The system uses RSS item GUIDs to prevent duplicates. If you see duplicates:
- Check if RSS feed is providing consistent GUIDs
- Clear the database and re-sync if needed

### Missing Images

If featured images aren't appearing:
- Check image URLs in RSS feed are publicly accessible
- Verify Azure Blob Storage is configured correctly
- Check CORS settings allow image downloads

## Benefits Over Manual Posting

| Manual Process | RSS Auto-Publish |
|---------------|-----------------|
| Write blog post | Write blog post |
| Copy content | ✅ Automatic |
| Paste to LinkedIn | ✅ Automatic |
| Paste to Facebook | ✅ Automatic |
| Paste to Twitter | ✅ Automatic |
| Paste to Instagram | ✅ Automatic |
| Find/upload images | ✅ Automatic |
| Schedule optimal times | ✅ Automatic |
| **Time per blog**: ~30 min | **Time per blog**: 0 min |

## Security

- Cron endpoints protected by CRON_SECRET
- Only Vercel can trigger cron jobs
- All social platform OAuth tokens securely stored
- Images uploaded to private Azure storage

## Future Enhancements

- [ ] Customizable posting schedules per platform
- [ ] A/B testing for social post variants
- [ ] Analytics on post performance
- [ ] Custom AI prompts per brand
- [ ] Tag-based post filtering
- [ ] Multi-language support

## Support

For issues or questions about RSS auto-publishing:
1. Check Vercel logs for detailed error messages
2. Verify all environment variables are set
3. Test manual trigger to isolate issues
4. Contact support with log excerpts
