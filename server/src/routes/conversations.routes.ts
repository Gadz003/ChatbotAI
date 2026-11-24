import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { messageRateLimiter } from '../middleware/rateLimit.js';
import {
  listConversations,
  createConversation,
  getOwnedConversationOrThrow,
  renameConversation,
  deleteConversation,
  listMessages,
  sendMessage,
} from '../services/conversation.service.js';
import { Errors } from '../errors.js';

export const conversationsRouter = Router();
conversationsRouter.use(requireAuth);

conversationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ conversations: listConversations(req.user!.id) });
  })
);

conversationsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    res.status(201).json({ conversation: createConversation(req.user!.id) });
  })
);

conversationsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const conversation = getOwnedConversationOrThrow(req.user!.id, req.params.id);
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const before = req.query.before ? Number(req.query.before) : undefined;
    const messages = listMessages(req.user!.id, req.params.id, limit, before);
    res.json({ conversation, messages });
  })
);

conversationsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { title } = req.body ?? {};
    res.json({ conversation: renameConversation(req.user!.id, req.params.id, title) });
  })
);

conversationsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    deleteConversation(req.user!.id, req.params.id);
    res.status(204).end();
  })
);

conversationsRouter.get(
  '/:id/messages',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const before = req.query.before ? Number(req.query.before) : undefined;
    res.json({ messages: listMessages(req.user!.id, req.params.id, limit, before) });
  })
);

conversationsRouter.post(
  '/:id/messages',
  messageRateLimiter,
  asyncHandler(async (req, res) => {
    const { content, images } = req.body ?? {};
    if (images !== undefined && !Array.isArray(images)) {
      throw Errors.validation('Campo images deve ser uma lista.');
    }
    const idempotencyKey = req.header('Idempotency-Key') || undefined;
    const result = await sendMessage(req.user!.id, req.params.id, content, images ?? [], idempotencyKey);
    res.status(201).json(result);
  })
);
