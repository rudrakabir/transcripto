import { EventEmitter } from 'events';

export const EVENT_TYPES = {
  RECORDING_ADDED: 'recording-added',
  RECORDING_CHANGED: 'recording-changed',
  RECORDING_REMOVED: 'recording-removed',
  SCAN_PROGRESS: 'scan-progress',
  ERROR: 'error'
} as const;

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
