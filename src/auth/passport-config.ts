import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

// User type for session
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export function configurePassport() {
  // Configure Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
      },
      (accessToken, refreshToken, profile, done) => {
        // Extract user info from Google profile
        const user: User = {
          id: profile.id,
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName,
          picture: profile.photos?.[0]?.value,
        };
        return done(null, user);
      }
    )
  );

  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });
}

// Middleware to check if user is authenticated
export function ensureAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({
    error: 'Unauthorized',
    message: 'Please login to access this resource',
  });
}
