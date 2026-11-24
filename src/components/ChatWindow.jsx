import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

const ChatWindow = ({ conversation, onSendMessage, isLoading }) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Scroll automático para a última mensagem
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation?.messages, isLoading]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg">Nenhuma conversa selecionada</p>
          <p className="text-sm">Crie uma nova conversa para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Cabeçalho */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
          {conversation.title}
        </h2>
      </div>

      {/* Área de mensagens */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {conversation.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <p>Envie uma mensagem para iniciar a conversa</p>
          </div>
        ) : (
          conversation.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}

        {/* Indicador de digitação */}
        {isLoading && (
          <div className="flex justify-start animate-fadeIn">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-bl-none px-4 py-3 flex items-center space-x-1">
              <span className="typing-dot inline-block w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full"></span>
              <span className="typing-dot inline-block w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full"></span>
              <span className="typing-dot inline-block w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput onSendMessage={onSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default ChatWindow;