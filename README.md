# SageSure Social - Social Media Management Platform

A complete social media management platform like HubSpot Social, built with Next.js, AWS Cognito, and DynamoDB.

## Features

✅ **Multi-Platform Posting**

- LinkedIn
- Facebook
- Instagram
- X (Twitter)
- Post to multiple platforms simultaneously

✅ **Authentication**

- AWS Cognito with Managed Login UI
- Social login (Google, Facebook, Apple)
- Secure session management

✅ **Scheduling**

- Schedule posts for future publication
- Date and time picker

✅ **Live Preview**

- See how your post will look on each platform
- Real-time preview as you type

✅ **Media Support**

- Add images to posts
- Platform-specific media handling

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.local` and fill in your credentials:

- AWS Cognito credentials (already configured)
- Social media API credentials (LinkedIn, Facebook, X)
- AWS credentials for DynamoDB

### 3. Create DynamoDB Tables

```bash
# Posts table
aws dynamodb create-table \
  --table-name sagesure-social-posts \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=postId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=postId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST

# Tokens table
aws dynamodb create-table \
  --table-name sagesure-social-tokens \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=platform,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=platform,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

```bash
vercel
```

Add all environment variables in Vercel dashboard.

## Architecture

- **Frontend**: Next.js 15 with App Router
- **Authentication**: NextAuth.js with AWS Cognito
- **Database**: AWS DynamoDB
- **Hosting**: Vercel
- **APIs**: LinkedIn, Facebook Graph, Instagram Graph, X (Twitter) v2

## API Endpoints

- `POST /api/posts/create` - Create/schedule post
- `GET /api/platforms/connected` - Get connected platforms
- `GET /api/oauth/{platform}/authorize` - Start OAuth flow
- `GET /api/oauth/{platform}/callback` - OAuth callback

## Usage

1. **Sign in** with Cognito (email/password or social)
2. **Connect platforms** by clicking on platform cards
3. **Create post** with content and optional image
4. **Select platforms** to post to
5. **Publish now** or **schedule for later**
6. **View preview** in real-time

## Platform-Specific Notes

### LinkedIn

- Requires `r_liteprofile` and `w_member_social` permissions
- Supports text and image posts

### Facebook

- Posts to Facebook Pages
- Requires page management permissions

### Instagram

- Requires Instagram Business Account
- Images are required for Instagram posts

### X (Twitter)

- Uses OAuth 2.0 with PKCE
- Supports text and media

## What's Different from HubSpot

This is a simplified version focused on core posting functionality:

- ✅ Multi-platform posting
- ✅ Scheduling
- ✅ Live preview
- ✅ OAuth integration
- ❌ Advanced analytics (can be added)
- ❌ Team collaboration (can be added)
- ❌ Content calendar view (can be added)

## Next Steps

To add more features:

1. Post history page (`/app/posts/page.tsx`)
2. Analytics dashboard
3. Content calendar
4. Team management
5. Bulk scheduling
6. Post templates

## Support

For issues or questions, contact support.
