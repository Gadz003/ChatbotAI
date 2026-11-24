import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../env.js';
import { Errors } from '../errors.js';

interface SessionPayload {
  sub: string;
  role: string;
}

export const SESSION_COOKIE = 'session';

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.nodeEnv === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, env.sessionSecret, { expiresIn: '7d' });
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) {
    next(Errors.unauthenticated());
    return;
  }
  try {
    const payload = jwt.verify(token, env.sessionSecret) as SessionPayload;
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(Errors.unauthenticated());
  }
}
