import ffmpeg from 'fluent-ffmpeg';
import { AudioRecordingMetadata } from './types';
import { v4 as uuidv4 } from 'uuid';

export async function extractMetadata(filepath: string): Promise<AudioRecordingMetadata> {
  const probeData = await new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filepath, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

  const stream = probeData.streams[0];
  const format = probeData.format;

  return {
    id: uuidv4(),
    filepath,
    filename: filepath.split('/').pop() || '',
    filesize: format.size,
    duration: format.duration,
    created_at: Math.floor(new Date().getTime() / 1000),
    modified_at: Math.floor(new Date().getTime() / 1000),
    format: format.format_name,
    codec: stream.codec_name,
    bitrate: format.bit_rate,
    channels: stream.channels,
    sample_rate: stream.sample_rate,
    transcription_status: 'pending',
  };
}
