import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/Sidebar.tsx';
import MainContent from './components/MainContent';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <MainContent />
      </div>
    </QueryClientProvider>
  );
};

export default App;