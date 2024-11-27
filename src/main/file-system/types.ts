export interface AudioRecordingMetadata {
  id: string;
  filepath: string;
  filename: string;
  filesize: number;
  duration: number;
  created_at: number;
  modified_at: number;
  format: string;
  codec: string;
  bitrate: number;
  channels: number;
  sample_rate: number;
  transcription_status: 'pending' | 'processing' | 'completed' | 'error';
  error_message?: string;
}

export interface FileSystemManager {
  // Directory Management
  watchDirectory(path: string): Promise<void>;
  unwatchDirectory(path: string): Promise<void>;
  getWatchedDirectories(): string[];
  
  // File Operations
  scanDirectory(path: string): Promise<AudioRecordingMetadata[]>;
  getRecordingMetadata(filepath: string): Promise<AudioRecordingMetadata>;
  isValidRecording(filepath: string): boolean;
  
  // Event Handling
  onRecordingAdded(callback: (file: AudioRecordingMetadata) => void): void;
  onRecordingChanged(callback: (file: AudioRecordingMetadata) => void): void;
  onRecordingRemoved(callback: (filepath: string) => void): void;
}
