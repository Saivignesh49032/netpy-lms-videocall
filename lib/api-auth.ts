import { NextResponse } from 'next/server';

// Simple in-memory rate limiter
// Map of API Key -> Array of timestamps
const rateLimitCache = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;

export function validateApiKey(request: Request): { valid: boolean; response?: NextResponse } {
  const key = request.headers.get('x-api-key');
  const configuredSecret = process.env.LMS_API_SECRET;

  if (!key || !configuredSecret || key !== configuredSecret) {
    return { valid: false, response: unauthorizedResponse() };
  }

  // Rate Limiting Logic
  const now = Date.now();
  const timestamps = rateLimitCache.get(key) || [];
  
  // Clean up old timestamps
  const validTimestamps = timestamps.filter(time => now - time < RATE_LIMIT_WINDOW_MS);
  
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return { 
      valid: false, 
      response: NextResponse.json({ 
        success: false, 
        error: 'Rate limit exceeded. Try again in 60 seconds.' 
      }, { status: 429 }) 
    };
  }

  validTimestamps.push(now);
  rateLimitCache.set(key, validTimestamps);

  // Periodically clean cache to prevent memory leak
  if (rateLimitCache.size > 1000) {
      rateLimitCache.clear();
  }

  return { valid: true };
}

export const unauthorizedResponse = () =>
  NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

export const badRequestResponse = (error: string) =>
  NextResponse.json({ success: false, error }, { status: 400 });

export const notFoundResponse = (error: string) =>
  NextResponse.json({ success: false, error }, { status: 404 });

export const forbiddenResponse = (error: string = 'Forbidden') =>
  NextResponse.json({ success: false, error }, { status: 403 });
