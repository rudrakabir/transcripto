// src/renderer/components/Sidebar.tsx
import React from 'react';
import { 
  Box, 
  VStack, 
  Heading, 
  List, 
  ListItem,
  useColorModeValue 
} from '@chakra-ui/react';

const Sidebar: React.FC = () => {
  const bgColor = useColorModeValue('gray.800', 'gray.900');
  const hoverBgColor = useColorModeValue('gray.700', 'gray.800');

  return (
    <Box bg={bgColor} color="white" h="full" w="64">
      <Box p={4}>
        <Heading size="lg">App Name</Heading>
      </Box>
      <List mt={4}>
        <ListItem
          px={4}
          py={2}
          cursor="pointer"
          transition="background-color 0.2s"
          _hover={{ bg: hoverBgColor }}
        >
          Dashboard
        </ListItem>
        <ListItem
          px={4}
          py={2}
          cursor="pointer"
          transition="background-color 0.2s"
          _hover={{ bg: hoverBgColor }}
        >
          Settings
        </ListItem>
      </List>
    </Box>
  );
};

export default Sidebar;