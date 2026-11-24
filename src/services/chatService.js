// Todas as chamadas vão para o backend próprio (/api/v1/*), que é quem fala
// com o Langflow usando a chave de API guardada no servidor. O navegador nunca
// recebe segredos de IA (ver SRS seção 3.3 e RNF001).
import { api } from './api';

export const listConversations = () => api.get('/conversations').then((r) => r.conversations);

export const createConversation = () => api.post('/conversations').then((r) => r.conversation);

export const getConversation = (id, { before, limit = 50 } = {}) => {
  const params = new URLSearchParams();
  if (before) params.set('before', before);
  if (limit) params.set('limit', limit);
  const query = params.toString() ? `?${params.toString()}` : '';
  return api.get(`/conversations/${id}${query}`);
};

export const renameConversation = (id, title) =>
  api.patch(`/conversations/${id}`, { title }).then((r) => r.conversation);

export const deleteConversation = (id) => api.del(`/conversations/${id}`);

export const sendMessage = (conversationId, content, images = []) => {
  const idempotencyKey = crypto.randomUUID();
  return api.post(
    `/conversations/${conversationId}/messages`,
    { content, images },
    { 'Idempotency-Key': idempotencyKey }
  );
};
