import React from 'react';
import type { Transcription } from '../shared/types';
import { RecordingStatus } from '../shared/types';

interface TranscriptionPanelProps {
  transcription?: Transcription | null;
  status?: RecordingStatus;
}

export const TranscriptionPanel: React.FC<TranscriptionPanelProps> = ({ transcription, status }) => {
  if (status === RecordingStatus.PROCESSING) {
    return <div data-testid="loading-spinner">Processing transcription...</div>;
  }

  if (!transcription && !status) {
    return <div>Please select a recording</div>;
  }

  return <div>{transcription?.content}</div>;
};