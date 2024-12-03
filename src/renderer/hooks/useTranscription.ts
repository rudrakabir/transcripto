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
    retry: false,
  });
};

export const useTranscriptionStatus = (recordingId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.status(recordingId),
    queryFn: async () => {
      const result = await window.electron.getTranscriptionStatus(recordingId);
      if (!result) throw new Error('Failed to get transcription status');
      return result;
    },
    refetchInterval: (data) => {
      if (!data) return false;
      return [RecordingStatus.PENDING, RecordingStatus.PROCESSING].includes(data.status as RecordingStatus) 
        ? 2000 
        : false;
    },
    enabled: Boolean(recordingId),
    retry: 2,
  });
};

export const useTranscriptionProgress = (recordingId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.progress(recordingId),
    queryFn: async (): Promise<TranscriptionProgress> => {
      const result = await window.electron.getTranscriptionProgress(recordingId);
      if (!result) throw new Error('Failed to get transcription progress');
      return result;
    },
    refetchInterval: (data, query) => {
      const status = query.queryClient.getQueryData<{ status: RecordingStatus }>(
        QUERY_KEYS.status(recordingId)
      );
      return status?.status === RecordingStatus.PROCESSING ? 1000 : false;
    },
    enabled: Boolean(recordingId),
    retry: false,
  });
};

export const useStartTranscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: TranscriptionRequest) => {
      const result = await window.electron.startTranscription(request);
      if (!result.success) {
        throw new Error('Failed to start transcription');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.status(variables.recordingId)
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.progress(variables.recordingId)
      });
    },
    onError: (error: Error) => {
      console.error('Transcription start failed:', error);
    }
  });
};

export const useCancelTranscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recordingId: string) => {
      const result = await window.electron.cancelTranscription(recordingId);
      if (!result.success) {
        throw new Error('Failed to cancel transcription');
      }
      return result;
    },
    onSuccess: (_, recordingId) => {
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

    const handleProgress = (progress: TranscriptionProgress) => {
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