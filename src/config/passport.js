import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import Page from "../models/Page.js";
import { nanoid } from "nanoid";
import { env } from "./env.js";

const baseApiUrl = (env.apiUrl || "http://localhost:5000").replace(/\/+$/, "").replace(/\/api$/, "");

if (env.googleClientId && env.googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: `${baseApiUrl}/api/auth/google/callback`,
        proxy: true,
      },
    async (accessToken, refreshToken, profile, done) => {
      console.log("Google Strategy Profile:", profile);
      try {
        let user = await User.findOne({ email: profile.emails[0].value });
        console.log("User found:", !!user);
        if (user) {
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
        } else {
          console.log("Creating new user...");
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            isEmailVerified: true,
          });
          console.log("User created:", user._id);
          // ... rest of the logic
          let baseUsername = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_.-]/g, "");
          if (baseUsername.length < 3) baseUsername = `user-${nanoid(6)}`;
          let username = baseUsername;
          let i = 0;
          while (await Page.findOne({ username })) {
            i += 1;
            username = `${baseUsername}${i}`;
          }

          await Page.create({ owner: user._id, username, displayName: user.name });
        }

        return done(null, user);
      } catch (error) {
        console.error("Google Strategy Error:", error);
        return done(error, null);
      }
    }
  )
);
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
