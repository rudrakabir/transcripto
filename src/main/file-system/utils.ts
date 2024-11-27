import path from 'path';

export const isValidAudioExtension = (filepath: string): boolean => {
  const validExtensions = new Set(['.mp3', '.wav', '.m4a', '.ogg', '.flac']);
  return validExtensions.has(path.extname(filepath).toLowerCase());
};
