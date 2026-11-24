import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { registerUser, authenticateUser } from '../services/auth.service.js';
import { signSession, SESSION_COOKIE, sessionCookieOptions } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimit.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body ?? {};
    const user = await registerUser(name, email, password);
    const token = signSession({ sub: user.id, role: user.role });
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions);
    res.status(201).json({ user });
  })
);

authRouter.post(
  '/login',
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};
    const user = await authenticateUser(email, password);
    const token = signSession({ sub: user.id, role: user.role });
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions);
    res.json({ user });
  })
);

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions, maxAge: 0 });
  res.status(204).end();
});
