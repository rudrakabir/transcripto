// src/renderer/components/MainContent.tsx
import React from 'react';
import { useSettings } from '../hooks/useSettings';
import { 
  useTranscriptionStatus,
  useTranscriptionProgress,
  useTranscription
} from '../hooks/useTranscription';
import { FileSelection } from './FileSelection';
import { TranscriptionControls } from './TranscriptionComponents';
import { 
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Flex,
  Grid,
  GridItem,
  Icon,
  Alert,
  AlertIcon,
  AlertDescription,
  Progress,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Textarea,
  VStack,
  useColorModeValue
} from '@chakra-ui/react';
import { 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Timer 
} from "lucide-react";
import type { TranscriptionSegment } from '../../shared/types';

// Helper function for time formatting
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

interface TranscriptionPanelProps {
  recordingId: string;
}

interface StatusBadgeProps {
  status?: 'pending' | 'processing' | 'completed' | 'error';
}

interface TranscriptionOutputProps {
  recordingId: string;
}

const MainContent: React.FC = () => {
  const [selectedRecordingId, setSelectedRecordingId] = React.useState<string>('');
  
  return (
    <Box minH="100vh" bg="gray.50">
      <Box px={6} py={8}>
        <VStack align="stretch" spacing={8}>
          <Box>
            <Heading size="lg" color="gray.900">Audio Transcription</Heading>
            <Text mt={2} color="gray.600">Transform your audio files into text</Text>
          </Box>

          <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
            {/* File Management Section */}
            <Card>
              <CardHeader>
                <Flex align="center" gap={2}>
                  <Icon as={FileText} boxSize={5} />
                  <Heading size="md">File Management</Heading>
                </Flex>
              </CardHeader>
              <CardBody>
                <FileSelection
                  onFileSelect={setSelectedRecordingId}
                  selectedRecordingId={selectedRecordingId}
                />
              </CardBody>
            </Card>

            {/* Transcription Interface */}
            <VStack spacing={6}>
              {selectedRecordingId ? (
                <>
                  <TranscriptionPanel recordingId={selectedRecordingId} />
                  <TranscriptionOutput recordingId={selectedRecordingId} />
                </>
              ) : (
                <Card w="full">
                  <CardBody>
                    <VStack py={12}>
                      <Icon as={FileText} boxSize={12} color="gray.400" />
                      <Heading size="md" color="gray.900">No File Selected</Heading>
                      <Text color="gray.500">Select an audio file to begin transcription</Text>
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </Grid>
        </VStack>
      </Box>
    </Box>
  );
};

const TranscriptionPanel: React.FC<TranscriptionPanelProps> = ({ recordingId }) => {
  const { data: status } = useTranscriptionStatus(recordingId);
  const { data: progress } = useTranscriptionProgress(recordingId);
  
  return (
    <Card w="full">
      <CardHeader>
        <Flex align="center" justify="space-between">
          <Heading size="md">Transcription Status</Heading>
          <StatusBadge status={status?.status} />
        </Flex>
      </CardHeader>
      <CardBody>
        <TranscriptionControls recordingId={recordingId} />
        {status?.status === 'processing' && progress && (
          <Box mt={4}>
            <Progress value={progress.percent_complete} size="sm" />
            <Text mt={2} fontSize="sm" color="gray.600" textAlign="right">
              {progress.percent_complete}% complete
            </Text>
          </Box>
        )}
        {status?.status === 'error' && (
          <Alert status="error" mt={4}>
            <AlertIcon as={AlertCircle} />
            <AlertDescription>{status.error}</AlertDescription>
          </Alert>
        )}
      </CardBody>
    </Card>
  );
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (status?: StatusBadgeProps['status']) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle2, colorScheme: 'green' };
      case 'processing':
        return { icon: Timer, colorScheme: 'blue' };
      case 'error':
        return { icon: AlertCircle, colorScheme: 'red' };
      default:
        return { icon: FileText, colorScheme: 'gray' };
    }
  };

  const { icon: Icon, colorScheme } = getStatusConfig(status);
  
  return (
    <Badge
      display="flex"
      alignItems="center"
      px={2.5}
      py={0.5}
      borderRadius="full"
      colorScheme={colorScheme}
    >
      <Icon style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
      {status || 'Ready'}
    </Badge>
  );
};

const TranscriptionOutput: React.FC<TranscriptionOutputProps> = ({ recordingId }) => {
  const { data: transcription } = useTranscription(recordingId);
  const [editedText, setEditedText] = React.useState('');
  
  React.useEffect(() => {
    if (transcription) {
      setEditedText(transcription.content);
    }
  }, [transcription]);

  if (!transcription) return null;

  return (
    <Card w="full">
      <CardHeader>
        <Heading size="md">Transcription Output</Heading>
      </CardHeader>
      <CardBody>
        <Tabs>
          <TabList>
            <Tab>Time Segments</Tab>
            <Tab>Full Text</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <VStack 
                spacing={4} 
                maxH="96" 
                overflowY="auto"
                align="stretch"
              >
                {transcription.segments.map((segment: TranscriptionSegment) => (
                  <Flex 
                    key={segment.id} 
                    gap={4} 
                    p={2} 
                    _hover={{ bg: 'gray.50' }} 
                    borderRadius="md"
                  >
                    <Text 
                      fontFamily="mono" 
                      fontSize="sm" 
                      color="gray.500" 
                      whiteSpace="nowrap"
                    >
                      {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
                    </Text>
                    <Text color="gray.700">{segment.text}</Text>
                  </Flex>
                ))}
              </VStack>
            </TabPanel>
            <TabPanel>
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                h="96"
                p={3}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </CardBody>
    </Card>
  );
};

export default MainContent;