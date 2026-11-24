import React from 'react';
import { useChat } from './hooks/useChat';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import AuthScreen from './components/auth/AuthScreen';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const {
    conversations,
    activeConversationId,
    isLoading,
    getActiveConversation,
    createNewConversation,
    deleteConversation,
    sendUserMessage,
    setActiveConversationId,
  } = useChat(Boolean(user));

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
        Carregando...
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const activeConversation = getActiveConversation();

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900 transition-colors">
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewChat={createNewConversation}
        onDeleteConversation={deleteConversation}
        userName={user.name}
        onLogout={logout}
      />
      <ChatWindow
        conversation={activeConversation}
        onSendMessage={sendUserMessage}
        isLoading={isLoading}
      />
    </div>
  );
}

export default App;