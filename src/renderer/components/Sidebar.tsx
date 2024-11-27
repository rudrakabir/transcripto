// src/renderer/components/Sidebar.tsx
import React from 'react';
import { 
  Box, 
  VStack, 
  Heading, 
  List, 
  ListItem,
  Flex,
  Icon,
  Text,
  useColorModeValue 
} from '@chakra-ui/react';
import {
  Home,
  FileAudio,
  History,
  Settings,
  FolderOpen
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: typeof Home;
}

const navigationItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'recordings', label: 'Recordings', icon: FileAudio },
  { id: 'recent', label: 'Recent', icon: History },
  { id: 'folders', label: 'Folders', icon: FolderOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const Sidebar: React.FC = () => {
  const [activeItem, setActiveItem] = React.useState('dashboard');
  
  const bgColor = useColorModeValue('gray.800', 'gray.900');
  const hoverBgColor = useColorModeValue('gray.700', 'gray.800');
  const activeBgColor = useColorModeValue('gray.600', 'gray.700');

  return (
    <Box bg={bgColor} color="white" h="full" w="64" py={6}>
      <VStack spacing={8} align="stretch">
        {/* App Header */}
        <Box px={6}>
          <Heading size="lg">Transcriber</Heading>
        </Box>

        {/* Navigation */}
        <List spacing={1}>
          {navigationItems.map((item) => (
            <ListItem key={item.id}>
              <Flex
                px={6}
                py={3}
                cursor="pointer"
                align="center"
                transition="all 0.2s"
                bg={activeItem === item.id ? activeBgColor : 'transparent'}
                _hover={{ bg: activeItem === item.id ? activeBgColor : hoverBgColor }}
                onClick={() => setActiveItem(item.id)}
              >
                <Icon as={item.icon} mr={3} boxSize={5} />
                <Text fontWeight="medium">{item.label}</Text>
              </Flex>
            </ListItem>
          ))}
        </List>
      </VStack>
    </Box>
  );
};

export default Sidebar;