import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Stack,
  Text,
  Badge,
  IconButton,
  useToast,
  HStack,
  VStack,
  Flex,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react';
import {
  Folder,
  File,
  Search,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Types
interface AudioFile {
  id: string;
  path: string;
  name: string;
  size: number;
  duration?: number;
  modifiedAt: Date;
  status: 'unprocessed' | 'queued' | 'processing' | 'completed' | 'error';
}

interface FileSelectionProps {
  onFileSelect: (recordingId: string) => void;
  selectedRecordingId: string;
}

interface SortConfig {
  key: keyof AudioFile;
  direction: 'asc' | 'desc';
}

interface FilterState {
  search: string;
  status: AudioFile['status'] | 'all';
  dateFrom: string;
  dateTo: string;
}

// Utility functions
const formatDuration = (seconds?: number): string => {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

// Main component
export const FileSelection: React.FC<FileSelectionProps> = ({
  onFileSelect,
  selectedRecordingId
}) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [sort, setSort] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });

  // Queries
  const {
    data: files = [],
    isLoading,
    error
  } = useQuery<AudioFile[]>({
    queryKey: ['audioFiles'],
    queryFn: async () => {
      try {
        const response = await window.electron.invoke('getAudioFiles');
        return response;
      } catch (err) {
        throw new Error('Failed to fetch audio files');
      }
    }
  });

  // Handlers
  const handleDirectorySelect = useCallback(async () => {
    try {
      await window.electron.invoke('selectDirectory');
      queryClient.invalidateQueries({ queryKey: ['audioFiles'] });
    } catch (err) {
      toast({
        title: 'Error selecting directory',
        status: 'error',
        duration: 3000
      });
    }
  }, [queryClient, toast]);

  const handleFileSelect = useCallback(async () => {
    try {
      await window.electron.invoke('selectFile');
      queryClient.invalidateQueries({ queryKey: ['audioFiles'] });
    } catch (err) {
      toast({
        title: 'Error selecting file',
        status: 'error',
        duration: 3000
      });
    }
  }, [queryClient, toast]);

  const handleSort = useCallback((key: keyof AudioFile) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Filter and sort logic
  const filteredAndSortedFiles = React.useMemo(() => {
    return files
      .filter(file => {
        const matchesSearch = file.name.toLowerCase().includes(filters.search.toLowerCase());
        const matchesStatus = filters.status === 'all' || file.status === filters.status;
        const matchesDateRange = (!filters.dateFrom || new Date(file.modifiedAt) >= new Date(filters.dateFrom)) &&
          (!filters.dateTo || new Date(file.modifiedAt) <= new Date(filters.dateTo));
        return matchesSearch && matchesStatus && matchesDateRange;
      })
      .sort((a, b) => {
        const aValue = a[sort.key];
        const bValue = b[sort.key];
        const direction = sort.direction === 'asc' ? 1 : -1;
        return aValue < bValue ? -direction : direction;
      });
  }, [files, filters, sort]);

  // Render helpers
  const renderSortIcon = (key: keyof AudioFile) => {
    if (sort.key !== key) return null;
    return sort.direction === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />;
  };

  const renderStatusBadge = (status: AudioFile['status']) => {
    const statusConfig = {
      unprocessed: { color: 'gray', label: 'Unprocessed' },
      queued: { color: 'blue', label: 'Queued' },
      processing: { color: 'yellow', label: 'Processing' },
      completed: { color: 'green', label: 'Completed' },
      error: { color: 'red', label: 'Error' }
    };
    const config = statusConfig[status];
    return <Badge colorScheme={config.color}>{config.label}</Badge>;
  };

  if (error) {
    return (
      <Box p={4} textAlign="center">
        <Text color="red.500">Error loading files. Please try again.</Text>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        {/* Action buttons */}
        <HStack spacing={4}>
          <Button
            leftIcon={<Folder size={16} />}
            onClick={handleDirectorySelect}
            colorScheme="blue"
          >
            Select Directory
          </Button>
          <Button
            leftIcon={<File size={16} />}
            onClick={handleFileSelect}
            variant="outline"
          >
            Select File
          </Button>
        </HStack>

        {/* Filters */}
        <Stack direction={['column', 'row']} spacing={4}>
          <InputGroup>
            <InputLeftElement>
              <Search size={16} />
            </InputLeftElement>
            <Input
              placeholder="Search files..."
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </InputGroup>
          <Select
            value={filters.status}
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value as AudioFile['status'] | 'all' }))}
          >
            <option value="all">All Status</option>
            <option value="unprocessed">Unprocessed</option>
            <option value="queued">Queued</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="error">Error</option>
          </Select>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
          />
          <Input
            type="date"
            value={filters.dateTo}
            onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
          />
        </Stack>

        {/* File list */}
        {isLoading ? (
          <Box p={4} textAlign="center">
            <Text>Loading files...</Text>
          </Box>
        ) : filteredAndSortedFiles.length === 0 ? (
          <Box p={8} textAlign="center" bg="gray.50" borderRadius="md">
            <Text color="gray.500">No audio files found. Select a directory or file to begin.</Text>
          </Box>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th onClick={() => handleSort('name')} cursor="pointer">
                    <HStack spacing={2}>
                      <Text>Name</Text>
                      {renderSortIcon('name')}
                    </HStack>
                  </Th>
                  <Th onClick={() => handleSort('duration')} cursor="pointer">
                    <HStack spacing={2}>
                      <Text>Duration</Text>
                      {renderSortIcon('duration')}
                    </HStack>
                  </Th>
                  <Th onClick={() => handleSort('size')} cursor="pointer">
                    <HStack spacing={2}>
                      <Text>Size</Text>
                      {renderSortIcon('size')}
                    </HStack>
                  </Th>
                  <Th onClick={() => handleSort('modifiedAt')} cursor="pointer">
                    <HStack spacing={2}>
                      <Text>Modified</Text>
                      {renderSortIcon('modifiedAt')}
                    </HStack>
                  </Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredAndSortedFiles.map(file => (
                  <Tr
                    key={file.id}
                    onClick={() => onFileSelect(file.id)}
                    bg={selectedRecordingId === file.id ? 'blue.50' : undefined}
                    _hover={{ bg: 'gray.50' }}
                    cursor="pointer"
                  >
                    <Td>{file.name}</Td>
                    <Td>{formatDuration(file.duration)}</Td>
                    <Td>{formatFileSize(file.size)}</Td>
                    <Td>{new Date(file.modifiedAt).toLocaleDateString()}</Td>
                    <Td>{renderStatusBadge(file.status)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default FileSelection;