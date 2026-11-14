interface RateRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateRecord>();

// Cleanup stale records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    record.timestamps = record.timestamps.filter(t => now - t < 3600 * 1000);
    if (record.timestamps.length === 0) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 1000);

export function checkRateLimit(key: string, limit: number, windowSeconds: number): { success: boolean; remaining: number } {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  let record = rateLimitMap.get(key);

  if (!record) {
    record = { timestamps: [] };
    rateLimitMap.set(key, record);
  }

  // Remove timestamps outside current window
  record.timestamps = record.timestamps.filter(t => now - t < windowMs);

  if (record.timestamps.length >= limit) {
    return { success: false, remaining: 0 };
  }

  record.timestamps.push(now);
  return { success: true, remaining: limit - record.timestamps.length };
}

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}
