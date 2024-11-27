// src/renderer/components/FileSelection.tsx
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Box, 
  Button, 
  Text, 
  VStack, 
  Divider, 
  Flex, 
  Badge,
  Input,
  useColorModeValue
} from '@chakra-ui/react';
import type { Recording } from '../../shared/types';

interface FileSelectionProps {
  onFileSelect: (recordingId: string) => void;
  selectedRecordingId?: string;
}

export const FileSelection: React.FC<FileSelectionProps> = ({ 
  onFileSelect, 
  selectedRecordingId 
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: files = [], isLoading } = useQuery<Recording[]>({
    queryKey: ['audioFiles'],
    queryFn: () => window.electron.getAudioFiles()
  });

  const addFile = useMutation({
    mutationFn: (filePath: string) => window.electron.addAudioFile(filePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audioFiles'] });
    }
  });

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const audioFiles = files.filter(file => 
      file.type.startsWith('audio/') || file.name.endsWith('.wav')
    );

    for (const file of audioFiles) {
      await addFile.mutateAsync(file.path);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await addFile.mutateAsync(file.path);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const getBadgeProps = (status: string) => {
    switch(status) {
      case 'completed':
        return { colorScheme: 'green' };
      case 'error':
        return { colorScheme: 'red' };
      case 'processing':
        return { colorScheme: 'blue' };
      default:
        return { colorScheme: 'gray' };
    }
  };

  return (
    <VStack spacing={4}>
      <Box
        w="full"
        borderWidth={2}
        borderStyle="dashed"
        borderRadius="lg"
        p={8}
        textAlign="center"
        transition="all 0.2s"
        bg={isDragging ? 'blue.50' : 'transparent'}
        borderColor={isDragging ? 'blue.500' : 'gray.300'}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <VStack spacing={2}>
          <Text color="gray.600">Drag and drop audio files here</Text>
          <Text color="gray.400">or</Text>
          <Button
            onClick={handleBrowseClick}
            colorScheme="blue"
          >
            Browse Files
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.wav"
            display="none"
            multiple
            onChange={handleFileInputChange}
          />
        </VStack>
      </Box>

      <Box w="full" borderWidth={1} borderRadius="lg" overflow="hidden">
        <Box bg="gray.50" px={4} py={2} borderBottomWidth={1}>
          <Text fontWeight="medium">Audio Files</Text>
        </Box>
        {isLoading ? (
          <Box p={4} textAlign="center" color="gray.500">Loading files...</Box>
        ) : files.length === 0 ? (
          <Box p={4} textAlign="center" color="gray.500">No audio files yet</Box>
        ) : (
          <VStack divider={<Divider />} spacing={0}>
            {files.map((file) => (
              <Button
                key={file.id}
                onClick={() => onFileSelect(file.id)}
                w="full"
                px={4}
                py={3}
                h="auto"
                justifyContent="flex-start"
                bg={selectedRecordingId === file.id ? 'blue.50' : 'white'}
                _hover={{ bg: selectedRecordingId === file.id ? 'blue.100' : 'gray.50' }}
                variant="ghost"
              >
                <Flex w="full" justify="space-between" align="center">
                  <Box>
                    <Text fontWeight="medium">{file.filename}</Text>
                    <Text fontSize="sm" color="gray.500">
                      Added {new Date(file.created_at).toLocaleDateString()}
                    </Text>
                  </Box>
                  {file.status && (
                    <Badge {...getBadgeProps(file.status)}>
                      {file.status}
                    </Badge>
                  )}
                </Flex>
              </Button>
            ))}
          </VStack>
        )}
      </Box>
    </VStack>
  );
};