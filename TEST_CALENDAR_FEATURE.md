# Testing the Calendar Events Feature

## Pre-Deployment Testing

### 1. Build Test

```bash
cd sagesure-social
npm run build
```

Expected: Build completes successfully with no errors

### 2. Type Check

```bash
npm run lint
```

Expected: No TypeScript or linting errors

## Post-Deployment Testing

### 1. Initialize Tables

```bash
curl https://your-app-url.vercel.app/api/init
```

Expected Response:

```json
{
  "success": true,
  "message": "Tables initialized"
}
```

### 2. Test Settings API

#### Save Settings

```bash
curl -X POST https://your-app-url.vercel.app/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "companyName": "SageSure Insurance",
    "brandIdentity": "Professional and trustworthy",
    "customerProfile": "Homeowners seeking insurance"
  }'
```

Expected Response:

```json
{
  "success": true,
  "settings": {
    "companyName": "SageSure Insurance",
    "brandIdentity": "Professional and trustworthy",
    "customerProfile": "Homeowners seeking insurance"
  }
}
```

#### Get Settings

```bash
curl https://your-app-url.vercel.app/api/settings \
  -H "x-user-id: test-user-123"
```

Expected Response:

```json
{
  "success": true,
  "settings": {
    "companyName": "SageSure Insurance",
    "brandIdentity": "Professional and trustworthy",
    "customerProfile": "Homeowners seeking insurance"
  }
}
```

### 3. Test Event Generation

```bash
curl -X POST https://your-app-url.vercel.app/api/events/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123"
  }'
```

Expected Response:

```json
{
  "success": true,
  "events": [
    {
      "id": "1234567890",
      "userId": "test-user-123",
      "title": "National Insurance Awareness Day",
      "date": "2025-11-25",
      "description": "A day to educate about insurance importance",
      "category": "Awareness Day"
    }
    // ... more events
  ],
  "message": "Generated new events"
}
```

### 4. Test Post Suggestions

```bash
curl -X POST https://your-app-url.vercel.app/api/events/suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "events": [
      {
        "title": "National Insurance Awareness Day",
        "date": "2025-11-25",
        "description": "A day to educate about insurance importance",
        "category": "Awareness Day"
      }
    ]
  }'
```

Expected Response:

```json
{
  "success": true,
  "suggestions": [
    {
      "id": "1234567891",
      "userId": "test-user-123",
      "content": "Today is National Insurance Awareness Day! 🏠 Protect what matters most...",
      "platforms": ["linkedin", "facebook", "twitter", "instagram"],
      "status": "draft"
    }
  ],
  "socialAgentUrl": "/dashboard?tab=drafts",
  "message": "Generated post suggestions"
}
```

## UI Testing Checklist

### Settings Configuration

- [ ] Navigate to `/calendar`
- [ ] Click "Settings" button
- [ ] Settings modal opens
- [ ] Enter company name
- [ ] Enter brand identity
- [ ] Enter customer profile
- [ ] Click "Save Settings"
- [ ] Success message appears
- [ ] Modal closes

### Event Generation

- [ ] Click "Generate Events & Suggestions" button
- [ ] Button shows "Generating..." state
- [ ] Wait for completion (30-60 seconds)
- [ ] Events table appears with 15 events
- [ ] Each event shows: date, title, category, description
- [ ] "View Suggested Posts" button appears
- [ ] Confirmation message shows

### Post Suggestions

- [ ] Click "View Suggested Posts" button
- [ ] Redirects to dashboard drafts tab
- [ ] 15 draft posts appear
- [ ] Each post has content and platforms
- [ ] Posts can be edited
- [ ] Posts can be published

### Error Handling

- [ ] Try generating without company name set
- [ ] Error message: "Please set your company name in settings first"
- [ ] Settings modal opens automatically
- [ ] After setting company name, generation works

## Integration Testing

### Full Flow Test

1. **Setup**

   - Deploy application
   - Initialize tables
   - Login as test user

2. **Configure Settings**

   - Go to Calendar Events page
   - Open Settings
   - Enter:
     - Company: "Test Company"
     - Brand: "Professional and innovative"
     - Customer: "Tech-savvy business owners"
   - Save settings

3. **Generate Content**

   - Click "Generate Events & Suggestions"
   - Wait for completion
   - Verify 15 events appear
   - Verify events are relevant to company/brand

4. **Review Suggestions**

   - Click "View Suggested Posts"
   - Verify redirected to drafts
   - Verify 15 drafts exist
   - Verify posts align with brand identity
   - Verify posts mention events

5. **Publish Post**
   - Select a draft
   - Edit if needed
   - Select platforms
   - Publish or schedule
   - Verify post appears in history

## Performance Testing

### Response Times

- Settings save: < 1 second
- Settings load: < 1 second
- Event generation: 20-60 seconds (AI processing)
- Post suggestions: 20-60 seconds (AI processing)

### Load Testing

- Generate events for 10 users simultaneously
- Verify all complete successfully
- Check for rate limiting issues
- Monitor API response times

## Error Scenarios

### Test Cases

1. **No company name**

   - Expected: Error message, prompt to set settings

2. **Invalid user ID**

   - Expected: 401 Unauthorized

3. **AI API failure**

   - Expected: 500 error with message

4. **Database connection failure**

   - Expected: 500 error with message

5. **Malformed request**
   - Expected: 400 Bad Request

## Monitoring

### Check Logs For

- Successful event generation
- Successful post creation
- AI API calls and responses
- Database operations
- Error messages

### Metrics to Track

- Event generation success rate
- Post suggestion success rate
- Average generation time
- User adoption rate
- Posts published from suggestions

## Rollback Plan

If issues occur:

1. Check error logs
2. Verify environment variables
3. Test API endpoints individually
4. Check database connectivity
5. Verify AI API key validity

If critical issues:

1. Disable Calendar Events link in dashboard
2. Return 503 from calendar page
3. Fix issues
4. Re-enable feature
5. Re-test

## Success Criteria

✅ All API endpoints return expected responses
✅ UI loads without errors
✅ Settings can be saved and retrieved
✅ Events are generated successfully
✅ Post suggestions are created
✅ Drafts appear in dashboard
✅ Posts can be published
✅ No console errors
✅ Build completes successfully
✅ All TypeScript types are correct
