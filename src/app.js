import express from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import session from "express-session";
import passport from "passport";
import "./config/passport.js";

import { env } from "./config/env.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware.js";

import authRoutes from "./routes/auth.routes.js";
import pageRoutes from "./routes/page.routes.js";
import linkRoutes from "./routes/link.routes.js";
import productRoutes from "./routes/product.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import subscriberRoutes from "./routes/subscriber.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import reportRoutes from "./routes/report.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import themeRoutes from "./routes/theme.routes.js";
import publicThemeRoutes from "./routes/publicTheme.routes.js";
import decorationRoutes from "./routes/decoration.routes.js";
import socialLinksRoutes from "./routes/socialLinks.routes.js";

const app = express();

app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const allowedOrigins = [env.clientUrl, "http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin) || env.nodeEnv === "development") {
        callback(null, true);
      } else {
        callback(new Error("Blocked by CORS policy"));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: env.jwt.accessSecret,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(mongoSanitize());
app.use(hpp());
app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));
app.use("/api", apiLimiter);
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), {
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);
// ...

app.get("/api/health", (req, res) => res.json({ success: true, message: "OK", uptime: process.uptime() }));

app.use("/api/auth", authRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/links", linkRoutes);
app.use("/api/products", productRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/subscribers", subscriberRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/admin/themes", themeRoutes);
app.use("/api/themes", publicThemeRoutes);
app.use("/api/admin/decoration-assets", decorationRoutes);
app.use("/api/social-links", socialLinksRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
