import dotenv from "dotenv";
dotenv.config();

const required = ["MONGO_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];
for (const key of required) {
  if (!process.env[key] && process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.warn(`[env] Missing ${key} in environment — set it in .env`);
  }
}

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn(`[env] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET — Google Auth will not work`);
}

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.warn(`[env] Missing SMTP_HOST / SMTP_USER / SMTP_PASS — Email OTP verification will not work`);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/linkbio",
  redisUri: process.env.REDIS_URI || "redis://localhost:6379",
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d",
  },
  brevo: {
    apiKey: process.env.BREVO_API_KEY,
    senderEmail: process.env.BREVO_SENDER_EMAIL || "mahatbasant414@gmail.com",
    senderName: process.env.BREVO_SENDER_NAME || "Linkify",
  },
  smtp: {
    host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  cookieDomain: process.env.COOKIE_DOMAIN || "localhost",
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB) || 5,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  apiUrl: process.env.API_URL || "https://linkify-backend-mlao.onrender.com",
};
