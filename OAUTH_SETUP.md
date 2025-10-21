# OAuth 2.0 Setup Guide for EezyCourt

## Overview

EezyCourt now uses Google OAuth 2.0 for authentication. Users must log in with their Google account before they can upload documents or analyze disputes.

## Setting Up Google OAuth

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Name it "EezyCourt" or similar

### 2. Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click **Enable**

### 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - User Type: **External**
   - App name: **EezyCourt**
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add `email` and `profile`
   - Test users: Add your email (for testing)

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **EezyCourt Web Client**
   - Authorized JavaScript origins:
     - `https://eezycourt.services`
     - `http://localhost:3000` (for development)
   - Authorized redirect URIs:
     - `https://eezycourt.services/auth/google/callback`
     - `http://localhost:3000/auth/google/callback` (for development)

5. Click **Create**

6. Copy the **Client ID** and **Client Secret**

### 4. Update Environment Variables

Add these to your `.env` file on the server:

```bash
# OAuth 2.0 Configuration (Google)
GOOGLE_CLIENT_ID=your_actual_google_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here
GOOGLE_CALLBACK_URL=https://eezycourt.services/auth/google/callback

# Session Configuration
SESSION_SECRET=generate_a_random_secret_here
NODE_ENV=production
```

**Generate a session secret:**
```bash
# On Linux/Mac
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 5. Restart the Server

After updating the `.env` file on your server, restart PM2:

```bash
pm2 restart eezycourt
```

## How It Works

### Authentication Flow

1. User visits `https://eezycourt.services`
2. If not logged in, they see a "Login with Google" button
3. Clicking the button redirects to Google OAuth consent screen
4. After approval, Google redirects back to `/auth/google/callback`
5. User is logged in and can use the application
6. Session lasts for 24 hours

### Protected Routes

These routes now require authentication:

- `POST /api/upload` - Upload documents
- `POST /api/analyze/:caseId` - Analyze case

### Public Routes

These routes remain public:

- `GET /` - Home page (shows login prompt if not authenticated)
- `GET /api/health` - Health check
- `GET /healthz` - Health check
- `GET /auth/user` - Check authentication status
- `GET /auth/google` - Start OAuth flow
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/logout` - Logout

## Development vs Production

### Development (localhost)

```env
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
NODE_ENV=development
```

### Production (Hetzner)

```env
GOOGLE_CALLBACK_URL=https://eezycourt.services/auth/google/callback
NODE_ENV=production
```

## Security Notes

1. **SESSION_SECRET** - Must be a long, random string in production
2. **Cookies** - Set to `secure: true` in production (HTTPS only)
3. **CORS** - Configured to accept credentials from same origin
4. **Never commit** your `.env` file with real credentials

## Troubleshooting

### "Error: Unauthorized" when uploading

- Make sure you're logged in
- Check browser console for errors
- Verify session cookie is being sent

### OAuth redirect fails

- Verify redirect URI in Google Cloud Console matches exactly
- Check GOOGLE_CALLBACK_URL in .env
- Ensure HTTPS is working on production

### Session not persisting

- Check SESSION_SECRET is set
- Verify cookie settings
- Check browser is accepting cookies

## Testing

1. Visit your site
2. Click "Login with Google"
3. Authorize the application
4. You should be redirected back and see your name in top-right
5. Try uploading a document
6. Click "Logout" to test logout functionality

## Next Steps

For production use, consider:

1. **Database** - Store sessions in Redis or database instead of memory
2. **User management** - Store user data in database
3. **Email restrictions** - Limit to specific domains (e.g., only @yourcompany.com)
4. **Audit logging** - Track who uploaded what documents
5. **Rate limiting** - Prevent API abuse
