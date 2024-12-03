import { render, screen } from '@testing-library/react';
import { TranscriptionPanel } from '../components/TranscriptionPanel';
import { vi, describe, it, expect } from 'vitest';
import { type Transcription } from '../shared/types';

const mockTranscription: Transcription = {
  id: '1',
  recording_id: '1',
  content: 'This is a test transcription',
  language: 'en',
  confidence: 0.95,
  segments: [
    {
      id: '1',
      start_time: 0,
      end_time: 5,
      text: 'This is a test transcription',
      confidence: 0.95
    }
  ],
  created_at: Date.now(),
  modified_at: Date.now()
};

describe('TranscriptionPanel', () => {
  it('renders transcription content correctly', () => {
    render(<TranscriptionPanel transcription={mockTranscription} />);
    expect(screen.getByText(mockTranscription.content)).toBeInTheDocument();
  });

  it('shows loading state when transcription is in progress', () => {
    render(<TranscriptionPanel transcription={null} status="processing" />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows empty state when no recording is selected', () => {
    render(<TranscriptionPanel />);
    expect(screen.getByText(/select a recording/i)).toBeInTheDocument();
  });
});