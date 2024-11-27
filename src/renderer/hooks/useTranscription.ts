import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TranscriptionRequest, TranscriptionResult, TranscriptionProgress } from '../../shared/types';

// Query keys for caching and invalidation
const QUERY_KEYS = {
  transcription: (recordingId: string) => ['transcription', recordingId],
  status: (recordingId: string) => ['transcriptionStatus', recordingId],
  progress: (recordingId: string) => ['transcriptionProgress', recordingId],
};

export const useTranscription = (recordingId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.transcription(recordingId),
    queryFn: async (): Promise<TranscriptionResult> => {
      const result = await window.electron.invoke('GET_TRANSCRIPTION', recordingId);
      if (!result) throw new Error('Transcription not found');
      return result;
    },
    // Don't refetch if we already have the transcription
    staleTime: Infinity,
    enabled: Boolean(recordingId),
  });
};

export const useTranscriptionStatus = (recordingId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.status(recordingId),
    queryFn: async () => {
      const status = await window.electron.invoke('GET_TRANSCRIPTION_STATUS', recordingId);
      return status;
    },
    // Refresh every 2 seconds while active
    refetchInterval: (data) => 
      data?.status === 'queued' || data?.status === 'processing' ? 2000 : false,
    enabled: Boolean(recordingId),
  });
};

export const useTranscriptionProgress = (recordingId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.progress(recordingId),
    queryFn: async (): Promise<TranscriptionProgress> => {
      const progress = await window.electron.invoke('GET_TRANSCRIPTION_PROGRESS', recordingId);
      return progress;
    },
    // Refresh every second while processing
    refetchInterval: (data) => 
      data?.status === 'processing' ? 1000 : false,
    enabled: Boolean(recordingId),
  });
};

export const useStartTranscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: TranscriptionRequest) => {
      return await window.electron.invoke('START_TRANSCRIPTION', request);
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
      return await window.electron.invoke('CANCEL_TRANSCRIPTION', recordingId);
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

// Event subscription hook for real-time updates
export const useTranscriptionEvents = (recordingId: string) => {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!recordingId) return;

    const handleProgress = (event: any, progress: TranscriptionProgress) => {
      if (progress.recordingId !== recordingId) return;
      
      queryClient.setQueryData(
        QUERY_KEYS.progress(recordingId),
        progress
      );
    };

    // Subscribe to events
    window.electron.on('TRANSCRIPTION_PROGRESS', handleProgress);
    
    return () => {
      // Cleanup subscriptions
      window.electron.removeListener('TRANSCRIPTION_PROGRESS', handleProgress);
    };
  }, [recordingId, queryClient]);
};