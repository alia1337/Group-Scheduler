# Google Calendar Integration Setup Guide

This guide will help you set up the "Connect Google Calendar" button to work properly with your Group Scheduler application.

## Prerequisites

1. **Google Cloud Project**: You need a Google Cloud project with the Google Calendar API enabled
2. **OAuth 2.0 Credentials**: You need to create OAuth 2.0 credentials for a web application

## Step 1: Google Cloud Console Setup

### 1.1 Create/Select a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### 1.2 Enable Google Calendar API
1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type
   - Fill in required fields (App name, User support email, Developer contact)
   - Add scopes: `https://www.googleapis.com/auth/calendar.readonly` and `https://www.googleapis.com/auth/calendar.events`
   - Add test users if in development mode
4. For the OAuth 2.0 client:
   - Application type: "Web application"
   - Name: "Group Scheduler"
   - Authorized redirect URIs: `http://localhost:8000/auth/google/callback`
5. Save and note the Client ID and Client Secret

## Step 2: Backend Configuration

### 2.1 Create Environment File
Create a `.env` file in the `backend` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=group_scheduler

# JWT Configuration
SECRET_KEY=your_jwt_secret_key_here

# Google OAuth Configuration (REPLACE WITH YOUR VALUES)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
```

### 2.2 Database Schema Update
The database schema has been updated to include Google OAuth tokens. If you haven't run the migration yet:

```bash
cd backend
python add_google_oauth_columns.py
```

This adds the following columns to the `users` table:
- `google_access_token` (TEXT)
- `google_refresh_token` (TEXT) 
- `google_calendar_connected` (BOOLEAN)

## Step 3: How It Works

### 3.1 OAuth Flow
1. User clicks "Connect Google Calendar" button
2. Frontend calls `/auth/google/login` endpoint
3. Backend generates Google OAuth URL and returns it
4. User is redirected to Google for authorization
5. Google redirects back to `/auth/google/callback` with authorization code
6. Backend exchanges code for access/refresh tokens
7. Tokens are stored in database, user is redirected to calendar page
8. Frontend detects successful connection and fetches Google Calendar events

### 3.2 API Endpoints Added

- **GET `/auth/google/login`**: Generates Google OAuth authorization URL
- **GET `/auth/google/callback`**: Handles OAuth callback and stores tokens
- **GET `/auth/google/events`**: Fetches user's Google Calendar events

### 3.3 Frontend Features

- **Connection Status**: Shows whether Google Calendar is connected
- **Event Integration**: Google Calendar events appear alongside local events
- **Visual Indicators**: Google events are marked with a blue "Google" tag
- **Disconnect Option**: Users can disconnect their Google Calendar

## Step 4: Testing the Integration

### 4.1 Start the Backend
```bash
cd backend
# Activate virtual environment first
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn main:app --reload
```

### 4.2 Start the Frontend
```bash
cd frontend
npm start
```

### 4.3 Test the Flow
1. Navigate to the calendar page (http://localhost:3000/calendar)
2. Click "Connect Google Calendar" (green button)
3. You should be redirected to Google's OAuth consent screen
4. Grant permissions for calendar access
5. You should be redirected back to your app with a success message
6. Google Calendar events should now appear in your calendar view

## Step 5: Troubleshooting

### Common Issues

1. **404 on OAuth endpoints**: Make sure backend server is running on port 8000
2. **OAuth consent screen error**: Ensure you've properly configured the consent screen in Google Cloud Console
3. **Redirect URI mismatch**: Verify the redirect URI in Google Cloud Console matches exactly: `http://localhost:8000/auth/google/callback`
4. **No events showing**: Check browser console for API errors, verify Google Calendar API is enabled
5. **Database errors**: Ensure the Google OAuth columns have been added to the users table

### Environment Variables Check
```bash
# In backend directory
python -c "
import os
from dotenv import load_dotenv
load_dotenv()
print('GOOGLE_CLIENT_ID:', os.getenv('GOOGLE_CLIENT_ID')[:20] + '...' if os.getenv('GOOGLE_CLIENT_ID') else 'NOT SET')
print('GOOGLE_CLIENT_SECRET:', 'SET' if os.getenv('GOOGLE_CLIENT_SECRET') else 'NOT SET')
print('GOOGLE_REDIRECT_URI:', os.getenv('GOOGLE_REDIRECT_URI'))
"
```

## Security Notes

1. **Environment Variables**: Never commit `.env` file to version control
2. **HTTPS in Production**: Use HTTPS URLs for redirect URIs in production
3. **Token Security**: Access tokens are stored securely in the database
4. **Scope Limitations**: Only requests calendar read/write permissions as needed

## Production Deployment

For production deployment:

1. Update OAuth redirect URI to use your production domain
2. Use HTTPS for all URLs
3. Set `OAUTHLIB_INSECURE_TRANSPORT=0` or remove it entirely
4. Review and publish your OAuth consent screen
5. Consider implementing token refresh logic for long-lived sessions

## Support

If you encounter issues:
1. Check the browser console for frontend errors
2. Check the backend logs for API errors  
3. Verify your Google Cloud Console configuration
4. Ensure all environment variables are set correctly