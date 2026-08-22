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
  // Always set secure: false for development to ensure cookies are set on HTTP localhost
  const isProd = process.env.NODE_ENV === "production";
  const base = { 
    httpOnly: true, 
    secure: isProd, // Should be false in development
    sameSite: "lax", // Lax is usually sufficient for localhost
    path: "/"
  };
  res.cookie("accessToken", accessToken, { ...base, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...base, maxAge: 7 * 24 * 60 * 60 * 1000 });
}
export function clearAuthCookies(res) {
  const isProd = process.env.NODE_ENV === "production";
  const base = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  };
  res.clearCookie("accessToken", base);
  res.clearCookie("refreshToken", base);
}
