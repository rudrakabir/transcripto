import React from 'react';
import { Box, Button } from '@chakra-ui/react';

export const TranscriptionControls: React.FC<{
  recordingId: string;
}> = ({ recordingId }) => {
  return (
    <Box>
      <Button>Start Transcription</Button>
    </Box>
  );
};