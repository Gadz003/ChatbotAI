import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getUserById } from '../services/auth.service.js';
import { Errors } from '../errors.js';

export const meRouter = Router();

meRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getUserById(req.user!.id);
    if (!user) throw Errors.unauthenticated();
    res.json({ user });
  })
);
