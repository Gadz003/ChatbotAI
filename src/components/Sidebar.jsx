import React, { useState } from 'react';
import { Plus, Trash2, Search, Sun, Moon, MessageSquare, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Sidebar = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  userName,
  onLogout,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (sqliteUtcString) => {
    if (!sqliteUtcString) return '';
    // SQLite devolve "YYYY-MM-DD HH:MM:SS" em UTC sem sufixo; normaliza para ISO antes de parsear.
    const date = new Date(sqliteUtcString.replace(' ', 'T') + 'Z');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <aside className="w-72 h-screen flex flex-col bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-colors duration-200">
      {/* Cabeçalho */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <MessageSquare size={20} className="text-blue-500" />
          AI Chat
        </h1>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Alternar tema"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Botão Novo Chat */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <Plus size={18} />
          Novo Chat
        </button>
      </div>

      {/* Pesquisa */}
      <div className="px-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Pesquisar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Lista de conversas */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-6">
            {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                activeId === conv.id
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              onClick={() => onSelectConversation(conv.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{conv.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(conv.updatedAt)}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Tem certeza que deseja excluir esta conversa?')) {
                    onDeleteConversation(conv.id);
                  }
                }}
                className="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Excluir conversa"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Rodapé */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{userName}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {conversations.length} conversa{conversations.length !== 1 && 's'}
          </div>
        </div>
        <button
          onClick={onLogout}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors flex-shrink-0"
          aria-label="Sair"
          title="Sair"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;