import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X } from 'lucide-react';

const MessageInput = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Ajustar altura do textarea automaticamente
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSend = async () => {
    if ((!text.trim() && images.length === 0) || isLoading) return;
    const result = await onSendMessage(text, images);
    // Em caso de falha, preserva o texto para o usuário poder reenviar (SRS 12.1/RF026).
    if (result?.ok === false) return;
    setText('');
    setImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [];
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/jpg'];
    files.forEach(file => {
      if (allowedTypes.includes(file.type)) {
        const reader = new FileReader();
        reader.onload = (event) => {
          newImages.push(event.target.result);
          if (newImages.length === files.length) {
            setImages(prev => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        alert(`Tipo de arquivo não suportado: ${file.type}`);
      }
    });
    // Reset do input para permitir re-seleção
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-colors">
      {/* Pré-visualização das imagens */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {images.map((img, idx) => (
            <div key={idx} className="relative inline-block">
              <img
                src={img}
                alt={`Preview ${idx}`}
                className="h-16 w-16 object-cover rounded border border-gray-300 dark:border-gray-600"
              />
              <button
                onClick={() => removeImage(idx)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                aria-label="Remover imagem"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Botão de upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
          aria-label="Anexar imagem"
        >
          <ImageIcon size={22} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp"
          multiple
          onChange={handleImageChange}
          className="hidden"
        />

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            rows={1}
            className="w-full resize-none bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            disabled={isLoading}
          />
        </div>

        {/* Botão enviar */}
        <button
          onClick={handleSend}
          disabled={isLoading || (!text.trim() && images.length === 0)}
          className={`p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${
            isLoading ? 'animate-pulse' : ''
          }`}
          aria-label="Enviar mensagem"
        >
          <Send size={22} />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;