# Calendar Events & Social Post Suggestions Feature

## Overview

This feature creates a dashboard that displays upcoming business-relevant calendar events and provides AI-generated social post suggestions for those events, ensuring all content aligns with the company's brand identity and ideal customer profile.

## How It Works

### 1. Settings Configuration

Users must first configure their portal settings:

- **Company Name** (required): The name of the business
- **Brand Identity** (optional): Description of brand voice, values, and personality
- **Ideal Customer Profile** (optional): Description of target audience, their needs, and interests

### 2. Event Generation

When the user clicks "Generate Events & Suggestions":

1. **Check Settings**: Verifies that company name is set
2. **Check Existing Events**: Looks for events in the next 30 days
3. **Generate New Events** (if needed): Uses Gemini AI to generate 15 business-relevant calendar events based on:
   - Company name
   - Brand identity
   - Customer profile
4. **Save Events**: Stores events in Azure Table Storage

### 3. Post Suggestions Generation

After events are generated:

1. **Generate Suggestions**: Uses Gemini AI to create social media post suggestions for each event
2. **Align with Brand**: Ensures posts match brand identity and target customer
3. **Save as Drafts**: Stores suggestions as draft posts in the database
4. **Provide Link**: Returns a URL to view the suggested posts in the drafts tab

## Dashboard Output

The calendar dashboard displays:

1. **View Suggested Posts Button**: Clickable CTA linking to the drafts page
2. **Events Generated Section**: Table showing:
   - Date
   - Event title
   - Category (Holiday, Industry Event, Awareness Day, Seasonal)
   - Description
3. **Post Suggestions Generated Section**: Confirmation message that posts were created and saved

## API Routes

### `/api/settings`

- **GET**: Retrieve user settings
- **POST**: Save user settings (company name, brand identity, customer profile)

### `/api/events/generate`

- **POST**: Generate calendar events for the next 30 days
- Checks for existing events first
- Uses Gemini AI to generate new events if needed
- Returns array of events

### `/api/events/suggestions`

- **POST**: Generate social post suggestions for events
- Takes array of events as input
- Uses Gemini AI to create tailored posts
- Saves posts as drafts
- Returns socialAgentUrl for viewing drafts

## Database Schema

### Settings Table

- `partitionKey`: userId
- `rowKey`: "settings"
- `companyName`: string
- `brandIdentity`: string
- `customerProfile`: string
- `updatedAt`: ISO timestamp

### Events Table

- `partitionKey`: userId
- `rowKey`: eventId (timestamp)
- `title`: string
- `date`: ISO date string
- `description`: string
- `category`: string
- `createdAt`: ISO timestamp

## Usage Flow

1. User navigates to Dashboard → Calendar Events
2. If first time, user clicks Settings and enters:
   - Company name (required)
   - Brand identity (optional but recommended)
   - Customer profile (optional but recommended)
3. User clicks "Generate Events & Suggestions"
4. System generates 15 calendar events for next 30 days
5. System generates social post suggestions for each event
6. User sees:
   - Table of generated events
   - "View Suggested Posts" button
   - Confirmation that posts were created
7. User clicks "View Suggested Posts" to see drafts
8. User can edit and publish posts from the drafts tab

## AI Prompts

### Event Generation Prompt

Asks Gemini to generate 15 business-relevant calendar events considering:

- Company name
- Brand identity
- Target customer profile
- Next 30 days timeframe
- Various categories (holidays, industry events, awareness days, seasonal)

### Post Suggestions Prompt

Asks Gemini to create social media posts that:

- Align with brand identity
- Resonate with target customer profile
- Are engaging and actionable
- Include relevant hashtags
- Are suitable for LinkedIn, Facebook, Twitter, and Instagram

## Files Created/Modified

### New Files

- `app/calendar/page.tsx` - Calendar events dashboard UI
- `app/api/events/generate/route.ts` - Event generation API
- `app/api/events/suggestions/route.ts` - Post suggestions API
- `app/api/settings/route.ts` - Settings management API

### Modified Files

- `lib/azure-storage.ts` - Added events and settings tables/operations
- `app/dashboard/page.tsx` - Added Calendar Events navigation link

## Environment Variables Required

- `GEMINI_API_KEY` - Google Gemini AI API key
- `AZURE_STORAGE_CONNECTION_STRING` - Azure Storage connection string

## Testing

1. Initialize tables: `GET /api/init`
2. Set up settings via the Calendar Events page
3. Generate events and suggestions
4. Verify events appear in the table
5. Click "View Suggested Posts" and verify drafts were created
6. Edit and publish posts from drafts tab

## Future Enhancements

- Allow manual event creation/editing
- Support recurring events
- Add event categories filtering
- Enable bulk post scheduling
- Add analytics for event-based posts
- Support custom event templates
