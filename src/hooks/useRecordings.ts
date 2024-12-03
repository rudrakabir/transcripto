import { useQuery } from '@tanstack/react-query';
import type { Recording } from '../shared/types';

async function fetchRecordings(): Promise<Recording[]> {
  const response = await window.electron.ipcRenderer.invoke('recordings:getAll');
  return response;
}

export function useRecordings() {
  const { data: recordings = [], isLoading, error } = useQuery<Recording[], Error>({
    queryKey: ['recordings'],
    queryFn: fetchRecordings,
  });

  return {
    recordings,
    isLoading,
    error,
  };
}