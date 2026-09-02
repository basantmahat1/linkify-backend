import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAccessToken(payload) {
  return jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpires });
}
export function signRefreshToken(payload) {
  return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpires });
}
export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}
export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

export function setAuthCookies(res, { accessToken, refreshToken }) {
  const isCrossSite =
    process.env.NODE_ENV === "production" ||
    (env.clientUrl && !env.clientUrl.includes("localhost") && !env.clientUrl.includes("127.0.0.1"));

  // Production/Cross-site: secure=true + sameSite=none required for Vercel ↔ Render cookies
  // Development/Localhost: secure=false + sameSite=lax for HTTP localhost
  const base = { 
    httpOnly: true, 
    secure: isCrossSite,
    sameSite: isCrossSite ? "none" : "lax",
    path: "/"
  };
  res.cookie("accessToken", accessToken, { ...base, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...base, maxAge: 7 * 24 * 60 * 60 * 1000 });
}
export function clearAuthCookies(res) {
  const isCrossSite =
    process.env.NODE_ENV === "production" ||
    (env.clientUrl && !env.clientUrl.includes("localhost") && !env.clientUrl.includes("127.0.0.1"));

  const base = {
    httpOnly: true,
    secure: isCrossSite,
    sameSite: isCrossSite ? "none" : "lax",
    path: "/",
  };
  res.clearCookie("accessToken", base);
  res.clearCookie("refreshToken", base);
}
