import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-gray-100">
        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-white">
            <Sidebar />
          </div>
          <div className="flex-1 overflow-auto">
            <MainContent />
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default App;