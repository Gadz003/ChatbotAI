import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
        }`}
      >
        {/* Imagens */}
        {message.images && message.images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.images.map((imgSrc, idx) => (
              <img
                key={idx}
                src={imgSrc}
                alt={`Imagem anexada ${idx + 1}`}
                className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-gray-300 dark:border-gray-600"
              />
            ))}
          </div>
        )}

        {/* Conteúdo texto com Markdown (apenas para assistente) */}
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none break-words">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {message.status === 'FAILED' && (
          <p className="mt-2 text-xs text-red-300 dark:text-red-400">
            Falha ao obter resposta. Edite e reenvie a mensagem.
          </p>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;