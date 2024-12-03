export interface Recording {
  id: string;
  path: string;
  name: string;
  size: number;
  createdAt: Date;
  status: 'pending' | 'transcribing' | 'completed' | 'error';
  transcription: string | null;
  error?: string;
}

export interface SortConfig {
  field: keyof Pick<Recording, 'name' | 'size' | 'createdAt'>;
  direction: 'asc' | 'desc';
}
