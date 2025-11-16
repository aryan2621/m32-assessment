import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User';
import { config } from './constants';
import { logger } from '../utils/logger';

const getCallbackURL = () => {
    const baseUrl = config.backendUrl;
    return `${baseUrl}/api/auth/google/callback`;
};

passport.use(
    new GoogleStrategy(
        {
            clientID: config.googleClientId || '',
            clientSecret: config.googleClientSecret || '',
            callbackURL: getCallbackURL(),
        },
        async (_accessToken, _refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ googleId: profile.id });

                if (user) {
                    return done(null, user);
                }

                const email = profile.emails?.[0]?.value;
                if (!email) {
                    logger.error('[GOOGLE_OAUTH] No email found in profile');
                    return done(new Error('No email found in Google profile'), undefined);
                }

                user = await User.findOne({ email });

                if (user) {
                    if (!user.googleId) {
                        user.googleId = profile.id;
                        await user.save();
                    }
                    return done(null, user);
                }

                user = await User.create({
                    name: profile.displayName || email.split('@')[0],
                    email,
                    googleId: profile.id,
                    isEmailVerified: true,
                });

                return done(null, user);
            } catch (error: any) {
                logger.error('[GOOGLE_OAUTH] Error in Google OAuth strategy', {
                    error: error.message,
                    stack: error.stack,
                });
                return done(error, undefined);
            }
        }
    )
);

passport.serializeUser((user: any, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});
