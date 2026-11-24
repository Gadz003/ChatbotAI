import { randomUUID } from 'node:crypto';
import { db } from '../db/client.js';
import { Errors } from '../errors.js';
import { env } from '../env.js';
import { sendToLangflow } from './langflow.service.js';

interface ConversationRow {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  images_json: string | null;
  status: string;
  sequence: number;
  error_code: string | null;
  created_at: string;
}

function serializeMessage(row: MessageRow) {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    images: row.images_json ? JSON.parse(row.images_json) : [],
    status: row.status,
    sequence: row.sequence,
    errorCode: row.error_code,
    createdAt: row.created_at,
  };
}

function serializeConversation(row: ConversationRow) {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessageAt: row.last_message_at,
  };
}

function getConversationRow(userId: string, conversationId: string): ConversationRow | undefined {
  return db
    .prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?')
    .get(conversationId, userId) as unknown as ConversationRow | undefined;
}

export function listConversations(userId: string) {
  const rows = db
    .prepare('SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC')
    .all(userId) as unknown as ConversationRow[];
  return rows.map(serializeConversation);
}

export function createConversation(userId: string) {
  const id = randomUUID();
  db.prepare('INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)').run(id, userId, 'Nova conversa');
  return getOwnedConversationOrThrow(userId, id);
}

// Lança 404 (não 403) de propósito quando a conversa não pertence ao usuário,
// para não revelar a um usuário que o ID pertence a outra pessoa (ver 14.1 do SRS).
export function getOwnedConversationOrThrow(userId: string, conversationId: string) {
  const row = getConversationRow(userId, conversationId);
  if (!row) {
    throw Errors.notFound('Conversa não encontrada.');
  }
  return serializeConversation(row);
}

export function renameConversation(userId: string, conversationId: string, title: unknown) {
  if (typeof title !== 'string' || title.trim().length === 0) {
    throw Errors.validation('Título inválido.');
  }
  getOwnedConversationOrThrow(userId, conversationId);
  db.prepare("UPDATE conversations SET title = ?, updated_at = datetime('now') WHERE id = ?").run(
    title.trim().slice(0, 100),
    conversationId
  );
  return getOwnedConversationOrThrow(userId, conversationId);
}

export function deleteConversation(userId: string, conversationId: string) {
  getOwnedConversationOrThrow(userId, conversationId);
  db.prepare('DELETE FROM conversations WHERE id = ?').run(conversationId);
}

export function listMessages(userId: string, conversationId: string, limit = 50, beforeSequence?: number) {
  getOwnedConversationOrThrow(userId, conversationId);

  const rows = beforeSequence
    ? (db
        .prepare('SELECT * FROM messages WHERE conversation_id = ? AND sequence < ? ORDER BY sequence DESC LIMIT ?')
        .all(conversationId, beforeSequence, limit) as unknown as MessageRow[])
    : (db
        .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY sequence DESC LIMIT ?')
        .all(conversationId, limit) as unknown as MessageRow[]);

  return rows.reverse().map(serializeMessage);
}

export async function sendMessage(
  userId: string,
  conversationId: string,
  content: unknown,
  images: unknown,
  idempotencyKey?: string
) {
  getOwnedConversationOrThrow(userId, conversationId);

  const trimmed = typeof content === 'string' ? content.trim() : '';
  const imageList = Array.isArray(images) ? (images as string[]) : [];

  if (trimmed.length === 0 && imageList.length === 0) {
    throw Errors.validation('Mensagem vazia.');
  }
  if (trimmed.length > env.maxMessageLength) {
    throw Errors.validation(`Mensagem excede o limite de ${env.maxMessageLength} caracteres.`);
  }
  if (imageList.length > env.maxImagesPerMessage) {
    throw Errors.validation(`Máximo de ${env.maxImagesPerMessage} imagens por mensagem.`);
  }

  if (idempotencyKey) {
    const cached = db
      .prepare('SELECT response_json FROM idempotency_keys WHERE key = ? AND conversation_id = ?')
      .get(idempotencyKey, conversationId) as { response_json: string } | undefined;
    if (cached) {
      return JSON.parse(cached.response_json);
    }
  }

  const { maxSeq } = db
    .prepare('SELECT COALESCE(MAX(sequence), 0) AS maxSeq FROM messages WHERE conversation_id = ?')
    .get(conversationId) as { maxSeq: number };
  const userSequence = maxSeq + 1;

  const userMessageId = randomUUID();
  const imagesJson = imageList.length ? JSON.stringify(imageList) : null;
  db.prepare(
    `INSERT INTO messages (id, conversation_id, role, content, images_json, status, sequence)
     VALUES (?, ?, 'user', ?, ?, 'COMPLETED', ?)`
  ).run(userMessageId, conversationId, trimmed, imagesJson, userSequence);

  const conversation = getConversationRow(userId, conversationId)!;
  if (conversation.title === 'Nova conversa' && trimmed.length > 0) {
    const generatedTitle = trimmed.slice(0, 40) + (trimmed.length > 40 ? '…' : '');
    db.prepare('UPDATE conversations SET title = ? WHERE id = ?').run(generatedTitle, conversationId);
  }

  const assistantMessageId = randomUUID();
  const assistantSequence = userSequence + 1;
  let assistantMessage: ReturnType<typeof serializeMessage>;

  try {
    const text = await sendToLangflow({ message: trimmed, sessionId: conversationId, images: imageList });
    db.prepare(
      `INSERT INTO messages (id, conversation_id, role, content, status, sequence)
       VALUES (?, ?, 'assistant', ?, 'COMPLETED', ?)`
    ).run(assistantMessageId, conversationId, text, assistantSequence);
    assistantMessage = serializeMessage({
      id: assistantMessageId,
      conversation_id: conversationId,
      role: 'assistant',
      content: text,
      images_json: null,
      status: 'COMPLETED',
      sequence: assistantSequence,
      error_code: null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // A falha do provedor não apaga a mensagem do usuário já persistida (RN11).
    const errorCode = err instanceof Error && 'code' in err ? String((err as any).code) : 'AI_PROVIDER_ERROR';
    db.prepare(
      `INSERT INTO messages (id, conversation_id, role, content, status, sequence, error_code)
       VALUES (?, ?, 'assistant', '', 'FAILED', ?, ?)`
    ).run(assistantMessageId, conversationId, assistantSequence, errorCode);
    db.prepare(
      "UPDATE conversations SET updated_at = datetime('now'), last_message_at = datetime('now') WHERE id = ?"
    ).run(conversationId);
    throw err;
  }

  db.prepare(
    "UPDATE conversations SET updated_at = datetime('now'), last_message_at = datetime('now') WHERE id = ?"
  ).run(conversationId);

  const result = {
    userMessage: serializeMessage({
      id: userMessageId,
      conversation_id: conversationId,
      role: 'user',
      content: trimmed,
      images_json: imagesJson,
      status: 'COMPLETED',
      sequence: userSequence,
      error_code: null,
      created_at: new Date().toISOString(),
    }),
    assistantMessage,
    conversation: getOwnedConversationOrThrow(userId, conversationId),
  };

  if (idempotencyKey) {
    db.prepare(
      'INSERT OR REPLACE INTO idempotency_keys (key, user_id, conversation_id, response_json) VALUES (?, ?, ?, ?)'
    ).run(idempotencyKey, userId, conversationId, JSON.stringify(result));
  }

  return result;
}
