// App.tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Box, Flex } from '@chakra-ui/react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Flex h="100vh" bg="gray.100">
        <Flex flex="1" overflow="hidden">
          <Box w="64" flexShrink={0} borderRight="1px" borderColor="gray.200" bg="white">
            <Sidebar />
          </Box>
          <Box flex="1" overflow="auto">
            <MainContent />
          </Box>
        </Flex>
      </Flex>
    </QueryClientProvider>
  );
};

export default App;