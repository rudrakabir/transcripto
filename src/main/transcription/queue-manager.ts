// src/main/transcription/queue-manager.ts
import { TranscriptionWorker, TranscriptionRequest, TranscriptionResult } from './worker';
import { FileSystemEvents, EVENT_TYPES } from '../file-system/events';
import { getDatabase } from '../database/init';
import { v4 as uuidv4 } from 'uuid';

interface QueueItem extends TranscriptionRequest {
  status: 'queued' | 'processing' | 'completed' | 'error';
  error?: string;
}

export class TranscriptionQueueManager {
  private static instance: TranscriptionQueueManager;
  private queue: QueueItem[] = [];
  private currentWorker: TranscriptionWorker | null = null;
  private events: FileSystemEvents;
  private processing: boolean = false;

  private constructor() {
    this.events = FileSystemEvents.getInstance();
    this.processQueue = this.processQueue.bind(this);
  }

  public static getInstance(): TranscriptionQueueManager {
    if (!TranscriptionQueueManager.instance) {
      TranscriptionQueueManager.instance = new TranscriptionQueueManager();
    }
    return TranscriptionQueueManager.instance;
  }

  public async addToQueue(request: TranscriptionRequest): Promise<void> {
    const db = getDatabase();
    
    // Check if already in queue or processing
    const existing = this.queue.find(item => item.recordingId === request.recordingId);
    if (existing) {
      return;
    }

    const queueItem: QueueItem = {
      ...request,
      status: 'queued'
    };

    // Add to queue
    this.queue.push(queueItem);

    // Update database status
    db.prepare(`
      UPDATE recordings 
      SET transcription_status = ?, error_message = NULL 
      WHERE id = ?
    `).run('queued', request.recordingId);

    // Emit event
    this.events.emit(EVENT_TYPES.RECORDING_CHANGED, {
      type: 'transcription_status',
      recordingId: request.recordingId,
      status: 'queued'
    });

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const item = this.queue[0];
    const db = getDatabase();

    try {
      // Update status to processing
      item.status = 'processing';
      db.prepare(`
        UPDATE recordings 
        SET transcription_status = ? 
        WHERE id = ?
      `).run('processing', item.recordingId);

      this.events.emit(EVENT_TYPES.RECORDING_CHANGED, {
        type: 'transcription_status',
        recordingId: item.recordingId,
        status: 'processing'
      });

      // Create and start worker
      this.currentWorker = new TranscriptionWorker();
      const result = await this.currentWorker.transcribe(item);

      // Save transcription result
      db.prepare(`
        INSERT INTO transcriptions (
          id, recording_id, content, segments, created_at, modified_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        item.recordingId,
        result.text,
        JSON.stringify(result.segments),
        Date.now(),
        Date.now()
      );

      // Update recording status
      db.prepare(`
        UPDATE recordings 
        SET transcription_status = ? 
        WHERE id = ?
      `).run('completed', item.recordingId);

      // Emit completion event
      this.events.emit(EVENT_TYPES.RECORDING_CHANGED, {
        type: 'transcription_status',
        recordingId: item.recordingId,
        status: 'completed'
      });

    } catch (error) {
      // Handle error
      db.prepare(`
        UPDATE recordings 
        SET transcription_status = ?, error_message = ? 
        WHERE id = ?
      `).run('error', error.message, item.recordingId);

      this.events.emit(EVENT_TYPES.RECORDING_CHANGED, {
        type: 'transcription_status',
        recordingId: item.recordingId,
        status: 'error',
        error: error.message
      });
    } finally {
      // Cleanup
      if (this.currentWorker) {
        this.currentWorker.terminate();
        this.currentWorker = null;
      }
      
      // Remove from queue
      this.queue.shift();
      this.processing = false;

      // Process next item if any
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }
  }

  public cancelTranscription(recordingId: string): void {
    const db = getDatabase();
    
    // Remove from queue if not started
    const index = this.queue.findIndex(item => item.recordingId === recordingId);
    if (index > 0) { // If not currently processing
      this.queue.splice(index, 1);
      db.prepare(`
        UPDATE recordings 
        SET transcription_status = ? 
        WHERE id = ?
      `).run('cancelled', recordingId);

      this.events.emit(EVENT_TYPES.RECORDING_CHANGED, {
        type: 'transcription_status',
        recordingId,
        status: 'cancelled'
      });
    } else if (index === 0 && this.currentWorker) {
      // Cancel current transcription
      this.currentWorker.terminate();
      this.currentWorker = null;
      this.queue.shift();
      this.processing = false;

      db.prepare(`
        UPDATE recordings 
        SET transcription_status = ? 
        WHERE id = ?
      `).run('cancelled', recordingId);

      this.events.emit(EVENT_TYPES.RECORDING_CHANGED, {
        type: 'transcription_status',
        recordingId,
        status: 'cancelled'
      });

      // Process next item if any
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }
  }

  public getStatus(recordingId: string): QueueItem | null {
    return this.queue.find(item => item.recordingId === recordingId) || null;
  }
}