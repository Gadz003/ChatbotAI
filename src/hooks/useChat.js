import { useState, useEffect, useCallback } from 'react';
import * as chatApi from '../services/chatService';

// `enabled` controla se o hook deve buscar dados do backend — evita chamadas
// autenticadas antes do usuário ter feito login (ver AuthContext).
export const useChat = (enabled) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setConversations([]);
      setActiveConversationId(null);
      setMessagesByConversation({});
      return;
    }

    let cancelled = false;
    setIsLoadingList(true);
    chatApi
      .listConversations()
      .then((list) => {
        if (cancelled) return;
        setConversations(list);
        if (list.length > 0) setActiveConversationId(list[0].id);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingList(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !activeConversationId || messagesByConversation[activeConversationId]) return;
    chatApi.getConversation(activeConversationId).then(({ messages }) => {
      setMessagesByConversation((prev) => ({ ...prev, [activeConversationId]: messages }));
    });
  }, [enabled, activeConversationId, messagesByConversation]);

  const getActiveConversation = useCallback(() => {
    const conv = conversations.find((c) => c.id === activeConversationId);
    if (!conv) return null;
    return { ...conv, messages: messagesByConversation[activeConversationId] || [] };
  }, [conversations, activeConversationId, messagesByConversation]);

  const createNewConversation = useCallback(async () => {
    const conv = await chatApi.createConversation();
    setConversations((prev) => [conv, ...prev]);
    setMessagesByConversation((prev) => ({ ...prev, [conv.id]: [] }));
    setActiveConversationId(conv.id);
    return conv;
  }, []);

  const deleteConversation = useCallback(
    async (id) => {
      await chatApi.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      setMessagesByConversation((prev) => {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      });
      setActiveConversationId((current) => {
        if (current !== id) return current;
        const remaining = conversations.filter((c) => c.id !== id);
        return remaining.length > 0 ? remaining[0].id : null;
      });
    },
    [conversations]
  );

  const sendUserMessage = useCallback(
    async (text, images = []) => {
      if (!text.trim() && images.length === 0) return { ok: false };

      let conversationId = activeConversationId;
      if (!conversationId) {
        const conv = await chatApi.createConversation();
        setConversations((prev) => [conv, ...prev]);
        setMessagesByConversation((prev) => ({ ...prev, [conv.id]: [] }));
        setActiveConversationId(conv.id);
        conversationId = conv.id;
      }

      const optimisticId = `pending-${Date.now()}`;
      const optimisticUserMessage = {
        id: optimisticId,
        role: 'user',
        content: text,
        images,
        status: 'PROCESSING',
        createdAt: new Date().toISOString(),
      };

      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), optimisticUserMessage],
      }));
      setIsLoading(true);

      try {
        const { userMessage, assistantMessage, conversation } = await chatApi.sendMessage(
          conversationId,
          text,
          images
        );
        setMessagesByConversation((prev) => ({
          ...prev,
          [conversationId]: [
            ...(prev[conversationId] || []).filter((m) => m.id !== optimisticId),
            userMessage,
            assistantMessage,
          ],
        }));
        setConversations((prev) => {
          const others = prev.filter((c) => c.id !== conversation.id);
          return [conversation, ...others];
        });
        return { ok: true };
      } catch (error) {
        console.error('Erro ao obter resposta da IA:', error);
        setMessagesByConversation((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).map((m) =>
            m.id === optimisticId ? { ...m, status: 'FAILED' } : m
          ),
        }));
        return { ok: false };
      } finally {
        setIsLoading(false);
      }
    },
    [activeConversationId]
  );

  return {
    conversations,
    activeConversationId,
    isLoading,
    isLoadingList,
    getActiveConversation,
    createNewConversation,
    deleteConversation,
    sendUserMessage,
    setActiveConversationId,
  };
};
