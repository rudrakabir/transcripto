import { useState, useCallback } from 'react';
import type { Recording, RecordingStatus } from '../shared/types';

interface NewRecording {
  path: string;
  name: string;
  size: number;
  createdAt: Date;
}

interface ProcessingQueueItem extends Recording {
  processingStatus: 'pending' | 'processing' | 'completed' | 'error';
}

export function useRecordingProcessor() {
  const [processingQueue, setProcessingQueue] = useState<ProcessingQueueItem[]>([]);

  const addRecording = useCallback(async (recording: NewRecording) => {
    try {
      const response = await window.electron.ipcRenderer.invoke('recordings:add', {
        filepath: recording.path,
        filename: recording.name,
        filesize: recording.size,
        created_at: recording.createdAt.getTime(),
      });

      setProcessingQueue(queue => [...queue, {
        ...response,
        processingStatus: 'pending'
      }]);

      // Start processing automatically
      window.electron.ipcRenderer.send('transcription:start', response.id);
    } catch (error) {
      console.error('Error adding recording:', error);
    }
  }, []);

  return {
    processingQueue,
    addRecording,
  };
}
