import { z } from 'zod';

export const AudioFileSchema = z.object({
  id: z.string().uuid(),
  path: z.string(),
  fileName: z.string(),
  size: z.number(),
  duration: z.number().optional(),
  createdAt: z.date(),
  modifiedAt: z.date(),
  transcriptionStatus: z.enum(['pending', 'processing', 'completed', 'error']),
  transcriptionError: z.string().optional(),
  transcription: z.string().optional(),
  watchFolder: z.string(),
});

export const SettingsSchema = z.object({
  watchFolders: z.array(z.string()),
  whisperModel: z.enum(['tiny', 'base', 'small', 'medium', 'large']),
  autoTranscribe: z.boolean(),
  language: z.string().optional(),
  maxConcurrentTranscriptions: z.number().min(1).max(4),
});

export type AudioFile = z.infer<typeof AudioFileSchema>;
export type Settings = z.infer<typeof SettingsSchema>;