import { Response } from "express";

const COOKIE_NAME = "sdp_refresh_token";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const isProd = process.env.NODE_ENV === "production";
const sameSite = isProd ? "none" : "strict";

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite,
    secure: isProd,
    path: "/",
    maxAge: SEVEN_DAYS_MS,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite,
    secure: isProd,
    path: "/",
  });
}

export function getRefreshCookieName(): string {
  return COOKIE_NAME;
}
