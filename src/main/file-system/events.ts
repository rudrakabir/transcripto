import { EventEmitter } from 'events';

export const EVENT_TYPES = {
    RECORDING_ADDED: 'recording-added',
    RECORDING_CHANGED: 'recording-changed',
    RECORDING_REMOVED: 'recording-removed',
    SCAN_PROGRESS: 'scan-progress',
    ERROR: 'error',
    // Add transcription events
    TRANSCRIPTION_QUEUED: 'transcription-queued',
    TRANSCRIPTION_STARTED: 'transcription-started',
    TRANSCRIPTION_PROGRESS: 'transcription-progress',
    TRANSCRIPTION_COMPLETED: 'transcription-completed',
    TRANSCRIPTION_ERROR: 'transcription-error',
    TRANSCRIPTION_CANCELLED: 'transcription-cancelled'
} as const;

export interface TranscriptionProgress {
    recordingId: string;
    progress: number;
    status: 'queued' | 'processing' | 'completed' | 'error';
    error?: string;
}

export class FileSystemEvents extends EventEmitter {
    private static instance: FileSystemEvents;

    private constructor() {
        super();
        this.setMaxListeners(100);
    }

    public static getInstance(): FileSystemEvents {
        if (!FileSystemEvents.instance) {
            FileSystemEvents.instance = new FileSystemEvents();
        }
        return FileSystemEvents.instance;
    }
}