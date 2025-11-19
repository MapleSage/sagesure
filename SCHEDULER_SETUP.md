# Scheduled Posts Setup

## The Problem

Scheduled posts were being saved to the database but never actually published because there was no scheduler running.

## The Solution

Created a Vercel Cron Job that runs every 5 minutes to check for scheduled posts and publish them.

## Setup Instructions

### 1. Add Environment Variable

Add this to your Vercel environment variables:

```
CRON_SECRET=your-random-secret-here-change-in-production
```

Generate a random secret:

```bash
openssl rand -base64 32
```

### 2. Deploy

The `vercel.json` file is already configured to run the cron job every 5 minutes.

### 3. Verify

After deployment, check Vercel logs to see the cron job running:

- Go to Vercel Dashboard → Your Project → Logs
- Filter by `/api/cron/publish-scheduled`
- You should see logs every 5 minutes

## How It Works

1. **Cron Schedule**: Runs every 5 minutes (`*/5 * * * *`)
2. **Checks Database**: Looks for posts with `status = 'scheduled'`
3. **Time Check**: Compares `scheduledFor` date with current time
4. **Publishes**: If time has passed, posts to the selected platforms
5. **Updates Status**: Changes post status from `scheduled` to `published`

## Testing

### Schedule a Post

1. Go to Dashboard → Create Post
2. Select "Schedule for later"
3. Pick a time 10 minutes from now
4. Click "Schedule"

### Check Status

1. Go to "Posts History" tab
2. You should see your post with status "scheduled"
3. Wait for the scheduled time + up to 5 minutes
4. Refresh the page - status should change to "published"

## Troubleshooting

### Posts Not Publishing

1. Check Vercel logs for errors
2. Verify CRON_SECRET is set correctly
3. Check that OAuth tokens are still valid
4. Verify the scheduled time is in the past

### Cron Not Running

1. Verify `vercel.json` is in the root directory
2. Check Vercel Dashboard → Settings → Crons
3. Ensure you're on a paid Vercel plan (crons require Pro)

## Important Notes

- **Vercel Crons require a Pro plan** ($20/month)
- Cron runs every 5 minutes, so posts may be delayed up to 5 minutes
- If you need more frequent checks, change the schedule in `vercel.json`
- Posts are published to all selected platforms when the time comes
- Failed platforms are logged but don't stop other platforms from publishing
