import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChakraProvider } from '@chakra-ui/react';
import { FileList } from './components/FileList';
import { TranscriptionPanel } from './components/TranscriptionPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { Cog, Folder } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchInterval: 5000, // Refetch every 5 seconds to update transcription status
    },
  },
});

export const App: React.FC = () => {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider>
        <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Folder className="w-6 h-6 text-blue-500" />
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Transcripto
                </h1>
              </div>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Settings"
              >
                <Cog className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </header>

          {/* Main content */}
          <div className="flex-1 flex overflow-hidden">
            <div className="w-1/2 overflow-auto border-r border-gray-200 dark:border-gray-700">
              <FileList
                selectedFileId={selectedFileId}
                onFileSelect={setSelectedFileId}
              />
            </div>
            <div className="w-1/2 overflow-auto">
              <TranscriptionPanel fileId={selectedFileId} />
            </div>
          </div>
        </div>

        {/* Settings Modal */}
        {isSettingsOpen && (
          <SettingsPanel onClose={() => setIsSettingsOpen(false)} />
        )}
      </ChakraProvider>
    </QueryClientProvider>
  );
};

export default App;