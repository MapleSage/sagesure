# Quick Start: Calendar Events Feature

## 🚀 Get Started in 3 Steps

### Step 1: Deploy

```bash
cd sagesure-social
npm run build
vercel --prod
```

### Step 2: Initialize Tables

```bash
curl https://your-app-url.vercel.app/api/init
```

### Step 3: Use the Feature

1. **Go to Calendar Events**

   - Login to your dashboard
   - Click "Calendar Events" in the navigation

2. **Configure Settings** (First Time Only)

   - Click "Settings" button
   - Enter your company name (required)
   - Add brand identity (optional but recommended)
   - Add customer profile (optional but recommended)
   - Click "Save Settings"

3. **Generate Content**

   - Click "Generate Events & Suggestions"
   - Wait 30-60 seconds for AI to work
   - Review the 15 generated events in the table
   - Click "View Suggested Posts" to see drafts

4. **Publish Posts**
   - Review and edit suggested posts in drafts tab
   - Schedule or publish posts to your social platforms

## 📋 What You Get

- **15 calendar events** for the next 30 days
- **15 social post suggestions** (one per event)
- All content aligned with your brand
- Posts ready to publish or schedule

## 🎯 Example Settings

**Company Name:** SageSure Insurance

**Brand Identity:**
"Professional, trustworthy, and customer-focused insurance provider. We emphasize protection, peace of mind, and personalized service. Our tone is warm yet authoritative, approachable yet expert."

**Customer Profile:**
"Homeowners and property owners aged 35-65 seeking comprehensive insurance coverage. They value security, reliability, and responsive customer service. They're looking for clear communication and proactive protection."

## 💡 Tips

- More detailed settings = better AI-generated content
- Review and customize posts before publishing
- Events are saved and can be regenerated anytime
- Posts are saved as drafts for your review

## 🔧 Troubleshooting

**"Company name not set"**
→ Go to Settings and enter your company name

**No events showing**
→ Check browser console for errors
→ Verify Gemini API key is set

**Posts not in drafts**
→ Wait for generation to complete
→ Refresh the drafts page

## 📞 Need Help?

Check the detailed documentation:

- `CALENDAR_EVENTS_FEATURE.md` - Full feature docs
- `DEPLOY_CALENDAR_FEATURE.md` - Deployment guide
- `IMPLEMENTATION_SUMMARY.md` - Technical overview
