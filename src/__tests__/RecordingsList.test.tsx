import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecordingsList } from '../components/RecordingsList';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { type Recording, RecordingStatus } from '../shared/types';

const mockRecordings: Recording[] = [
  {
    id: '1',
    filepath: '/path/to/recording1.mp3',
    filename: 'recording1.mp3',
    filesize: 1024,
    duration: 120,
    created_at: Date.now(),
    modified_at: Date.now(),
    status: RecordingStatus.COMPLETED,
    metadata: {
      format: 'mp3',
      bitrate: 128000,
      channels: 2,
      sample_rate: 44100,
      codec: 'mp3'
    }
  },
  {
    id: '2',
    filepath: '/path/to/recording2.mp3',
    filename: 'recording2.mp3',
    filesize: 2048,
    duration: 180,
    created_at: Date.now(),
    modified_at: Date.now(),
    status: RecordingStatus.PENDING,
    metadata: {
      format: 'mp3',
      bitrate: 128000,
      channels: 2,
      sample_rate: 44100,
      codec: 'mp3'
    }
  }
];

vi.mock('../hooks/useRecordings', () => ({
  useRecordings: () => ({
    recordings: mockRecordings,
    isLoading: false,
    error: null
  })
}));

describe('RecordingsList', () => {
  const queryClient = new QueryClient();

  beforeEach(() => {
    render(
      <QueryClientProvider client={queryClient}>
        <RecordingsList />
      </QueryClientProvider>
    );
  });

  it('renders recordings list', () => {
    expect(screen.getByText('recording1.mp3')).toBeInTheDocument();
    expect(screen.getByText('recording2.mp3')).toBeInTheDocument();
  });
});