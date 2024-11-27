// src/renderer/hooks/useTranscription.ts
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { 
  RecordingStatus, 
  Transcription, 
  TranscriptionProgress 
} from '../../shared/types';

interface TranscriptionRequest {
  recordingId: string;
  filePath: string;
  language?: string;
}

// Query keys for caching and invalidation
const QUERY_KEYS = {
  transcription: (recordingId: string) => ['transcription', recordingId],
  status: (recordingId: string) => ['transcriptionStatus', recordingId],
  progress: (recordingId: string) => ['transcriptionProgress', recordingId],
} as const;

export const useTranscription = (recordingId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.transcription(recordingId),
    queryFn: async (): Promise<Transcription> => {
      const result = await window.electron.getTranscription(recordingId);
      if (!result) throw new Error('Transcription not found');
      return result;
    },
    staleTime: Infinity,
    enabled: Boolean(recordingId),
  });
};

export const useTranscriptionStatus = (recordingId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.status(recordingId),
    queryFn: async () => {
      return await window.electron.getTranscriptionStatus(recordingId);
    },
    refetchInterval: (data) => 
      data?.status === RecordingStatus.PENDING || 
      data?.status === RecordingStatus.PROCESSING ? 2000 : false,
    enabled: Boolean(recordingId),
  });
};

export const useTranscriptionProgress = (recordingId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.progress(recordingId),
    queryFn: async (): Promise<TranscriptionProgress> => {
      return await window.electron.getTranscriptionProgress(recordingId);
    },
    refetchInterval: (data, query) => {
      const status = query.queryClient.getQueryData<{ status: RecordingStatus }>(
        QUERY_KEYS.status(recordingId)
      );
      return status?.status === RecordingStatus.PROCESSING ? 1000 : false;
    },
    enabled: Boolean(recordingId),
  });
};

export const useStartTranscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: TranscriptionRequest) => {
      return await window.electron.startTranscription(request);
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.status(variables.recordingId)
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.progress(variables.recordingId)
      });
    },
  });
};

export const useCancelTranscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recordingId: string) => {
      return await window.electron.cancelTranscription(recordingId);
    },
    onSuccess: (_, recordingId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.status(recordingId)
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.progress(recordingId)
      });
    },
  });
};

export const useTranscriptionEvents = (recordingId: string) => {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!recordingId) return;

    const handleProgress = (_: unknown, progress: TranscriptionProgress) => {
      if (progress.recording_id !== recordingId) return;
      
      queryClient.setQueryData(
        QUERY_KEYS.progress(recordingId),
        progress
      );
    };

    window.electron.on('transcription:progress', handleProgress);
    
    return () => {
      window.electron.removeListener('transcription:progress', handleProgress);
    };
  }, [recordingId, queryClient]);
};