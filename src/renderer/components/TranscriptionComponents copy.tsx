// src/renderer/components/TranscriptionComponents.tsx
import React from 'react';
import { 
  useStartTranscription,
  useCancelTranscription,
  useTranscriptionStatus,
  useTranscriptionProgress,
  useTranscription,
  useTranscriptionEvents
} from '../hooks/useTranscription';
import { RecordingStatus, type TranscriptionSegment } from '../../shared/types';
import {
  Box,
  Button,
  Flex,
  Select,
  Text,
  Progress,
  VStack,
  Heading,
  Textarea,
  useColorModeValue
} from '@chakra-ui/react';

interface TranscriptionControlsProps {
  recordingId: string;
}

export const TranscriptionControls: React.FC<TranscriptionControlsProps> = ({ recordingId }) => {
  const [language, setLanguage] = React.useState('en');
  const startTranscription = useStartTranscription();
  const cancelTranscription = useCancelTranscription();
  const { data: status } = useTranscriptionStatus(recordingId);

  const handleStart = async () => {
    await startTranscription.mutateAsync({
      recordingId,
      language,
      filePath: `recordings/${recordingId}.wav`
    });
  };

  const handleCancel = async () => {
    await cancelTranscription.mutateAsync(recordingId);
  };

  return (
    <Flex gap={4} p={4} borderBottomWidth="1px">
      <Select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        isDisabled={status?.status === RecordingStatus.PROCESSING}
        w="auto"
      >
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
      </Select>

      {(!status || status.status === RecordingStatus.ERROR) && (
        <Button
          onClick={handleStart}
          colorScheme="blue"
        >
          Start Transcription
        </Button>
      )}

      {(status?.status === RecordingStatus.PENDING || status?.status === RecordingStatus.PROCESSING) && (
        <Button
          onClick={handleCancel}
          colorScheme="red"
        >
          Cancel
        </Button>
      )}
    </Flex>
  );
};

interface TranscriptionProgressProps {
  recordingId: string;
}

export const TranscriptionProgress: React.FC<TranscriptionProgressProps> = ({ recordingId }) => {
  const { data: progress } = useTranscriptionProgress(recordingId);
  const { data: status } = useTranscriptionStatus(recordingId);
  useTranscriptionEvents(recordingId);

  if (!progress || !status) return null;

  return (
    <Box p={4} borderBottomWidth="1px">
      <Text mb={2}>
        Status: <Text as="span" fontWeight="medium">{status.status}</Text>
      </Text>
      
      {status.status === RecordingStatus.PROCESSING && (
        <Progress 
          value={progress.percent_complete} 
          size="sm"
          borderRadius="full"
          colorScheme="blue"
        />
      )}

      {status.status === RecordingStatus.ERROR && (
        <Text color="red.500">
          Error: {status.error}
        </Text>
      )}
    </Box>
  );
};

interface TranscriptionViewProps {
  recordingId: string;
}

export const TranscriptionView: React.FC<TranscriptionViewProps> = ({ recordingId }) => {
  const { data: transcription } = useTranscription(recordingId);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedText, setEditedText] = React.useState('');

  React.useEffect(() => {
    if (transcription) {
      setEditedText(transcription.content);
    }
  }, [transcription]);

  if (!transcription) return null;

  return (
    <Box p={4}>
      <Flex justify="space-between" mb={4}>
        <Heading size="lg">Transcription</Heading>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant="link"
          colorScheme="blue"
        >
          {isEditing ? 'Save' : 'Edit'}
        </Button>
      </Flex>

      {isEditing ? (
        <Textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          h="64"
          p={2}
        />
      ) : (
        <VStack spacing={4} align="stretch">
          {transcription.segments.map((segment: TranscriptionSegment) => (
            <Flex key={segment.id} gap={4}>
              <Text color="gray.500" w="20" flexShrink={0}>
                {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
              </Text>
              <Text>{segment.text}</Text>
            </Flex>
          ))}
        </VStack>
      )}
    </Box>
  );
};

// Helper function to format time
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};