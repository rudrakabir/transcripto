import { useQuery } from '@tanstack/react-query';

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => window.electron.getSettings()
  });
};