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
  useToast,
  HStack,
  VStack,
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
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { RecordingStatus, type Recording } from '../../shared/types';

interface FileSelectionProps {
  onFileSelect: (recordingId: string) => void;
  selectedRecordingId: string;
}

type SortableFields = 'fileName' | 'duration' | 'size' | 'modifiedAt' | 'createdAt';

interface SortConfig {
  key: SortableFields;
  direction: 'asc' | 'desc';
}

interface FilterState {
  search: string;
  status: RecordingStatus | 'all';
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
  const [sort, setSort] = useState<SortConfig>({ key: 'fileName', direction: 'asc' });
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
  }: UseQueryResult<Recording[], Error> = useQuery({
    queryKey: ['audioFiles'],
    queryFn: async () => {
      const response = await window.electron.getAudioFiles();
      return response;
    }
  });

  // Handlers
  const handleDirectorySelect = useCallback(async () => {
    try {
      await window.electron.selectDirectory();
      await queryClient.invalidateQueries({ queryKey: ['audioFiles'] });
    } catch (err) {
      toast({
        title: 'Error selecting directory',
        description: err instanceof Error ? err.message : 'Failed to select directory',
        status: 'error',
        duration: 3000
      });
    }
  }, [queryClient, toast]);

  const handleFileSelect = useCallback(async () => {
    try {
      await window.electron.selectFile();
      await queryClient.invalidateQueries({ queryKey: ['audioFiles'] });
    } catch (err) {
      toast({
        title: 'Error selecting file',
        description: err instanceof Error ? err.message : 'Failed to select file',
        status: 'error',
        duration: 3000
      });
    }
  }, [queryClient, toast]);

  const handleSort = useCallback((key: SortableFields) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Sort and filter logic
  const sortRecordings = (a: Recording, b: Recording, key: SortableFields, direction: 'asc' | 'desc'): number => {
    const aValue = a[key];
    const bValue = b[key];
    
    // Handle undefined values
    if (aValue === undefined && bValue === undefined) return 0;
    if (aValue === undefined) return direction === 'asc' ? 1 : -1;
    if (bValue === undefined) return direction === 'asc' ? -1 : 1;
    
    // Handle dates
    if (key === 'modifiedAt' || key === 'createdAt') {
      const aTime = aValue instanceof Date ? aValue.getTime() : new Date(aValue).getTime();
      const bTime = bValue instanceof Date ? bValue.getTime() : new Date(bValue).getTime();
      return direction === 'asc' ? aTime - bTime : bTime - aTime;
    }
    
    // Handle numbers and strings
    const comparison = typeof aValue === 'string' && typeof bValue === 'string'
      ? aValue.localeCompare(bValue)
      : Number(aValue) - Number(bValue);
      
    return direction === 'asc' ? comparison : -comparison;
  };

  // Filtered and sorted files
  const filteredAndSortedFiles = React.useMemo(() => {
    if (!Array.isArray(files)) return [];
    
    return files
      .filter(file => {
        const matchesSearch = file.fileName.toLowerCase().includes(filters.search.toLowerCase());
        const matchesStatus = filters.status === 'all' || file.transcriptionStatus === filters.status;
        
        // Safe date comparison
        let matchesDateRange = true;
        if (filters.dateFrom || filters.dateTo) {
          const fileDate = file.modifiedAt instanceof Date 
            ? file.modifiedAt 
            : new Date(file.modifiedAt);
            
          if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            if (!isNaN(fromDate.getTime())) {
              matchesDateRange = matchesDateRange && fileDate >= fromDate;
            }
          }
          
          if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            if (!isNaN(toDate.getTime())) {
              matchesDateRange = matchesDateRange && fileDate <= toDate;
            }
          }
        }
          
        return matchesSearch && matchesStatus && matchesDateRange;
      })
      .sort((a, b) => sortRecordings(a, b, sort.key, sort.direction));
  }, [files, filters, sort]);

  // Render helpers
  const renderSortIcon = (key: SortableFields) => {
    if (sort.key !== key) return null;
    return sort.direction === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />;
  };

  const renderStatusBadge = (status: RecordingStatus) => {
    const statusConfig: Record<RecordingStatus, { color: string; label: string }> = {
      [RecordingStatus.UNPROCESSED]: { color: 'gray', label: 'Unprocessed' },
      [RecordingStatus.PENDING]: { color: 'blue', label: 'Queued' },
      [RecordingStatus.PROCESSING]: { color: 'yellow', label: 'Processing' },
      [RecordingStatus.COMPLETED]: { color: 'green', label: 'Completed' },
      [RecordingStatus.ERROR]: { color: 'red', label: 'Error' }
    };
    
    const config = statusConfig[status];
    return <Badge colorScheme={config.color}>{config.label}</Badge>;
  };

  if (error) {
    return (
      <Box p={4} textAlign="center">
        <Text color="red.500">
          {error instanceof Error ? error.message : 'Error loading files. Please try again.'}
        </Text>
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
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value as RecordingStatus | 'all' }))}
          >
            <option value="all">All Status</option>
            {Object.values(RecordingStatus).map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
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
                  <Th onClick={() => handleSort('fileName')} cursor="pointer">
                    <HStack spacing={2}>
                      <Text>Name</Text>
                      {renderSortIcon('fileName')}
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
                    <Td>{file.fileName}</Td>
                    <Td>{formatDuration(file.duration)}</Td>
                    <Td>{formatFileSize(file.size)}</Td>
                    <Td>{file.modifiedAt instanceof Date 
                      ? file.modifiedAt.toLocaleDateString()
                      : new Date(file.modifiedAt).toLocaleDateString()
                    }</Td>
                    <Td>{renderStatusBadge(file.transcriptionStatus)}</Td>
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