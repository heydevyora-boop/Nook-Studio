import rateLimit from 'express-rate-limit'
import { env } from '../config/env'

/** Generous, global API rate limit — a basic abuse backstop. */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
})

/** Stricter limiter for the public inquiry form, to deter spam submissions. */
export const inquiryRateLimiter = rateLimit({
  windowMs: env.INQUIRY_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  limit: env.INQUIRY_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Too many inquiries submitted. Please try again later.',
  },
})

/** Tighter limiter for the login route, to slow down credential-stuffing attempts. */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Too many login attempts. Please try again later.',
  },
})
