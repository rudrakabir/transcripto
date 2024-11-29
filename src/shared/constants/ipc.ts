// src/shared/constants/ipc.ts

export enum IpcChannels {
  // Settings
  GET_SETTINGS = 'get-settings',
  SAVE_SETTING = 'save-setting',
  
  // Audio files
  GET_AUDIO_FILES = 'get-audio-files',
  GET_RECORDING = 'get-recording',
  ADD_AUDIO_FILE = 'add-audio-file',
  UPDATE_RECORDING_STATUS = 'update-recording-status',
  
  // Transcriptions
  START_TRANSCRIPTION = 'start-transcription',
  CANCEL_TRANSCRIPTION = 'cancel-transcription',
  GET_TRANSCRIPTION = 'get-transcription',
  SAVE_TRANSCRIPTION = 'save-transcription',
  GET_TRANSCRIPTION_STATUS = 'get-transcription-status',
  GET_TRANSCRIPTION_PROGRESS = 'get-transcription-progress',
  
  // Events
  TRANSCRIPTION_PROGRESS = 'transcription-progress',
  TRANSCRIPTION_COMPLETED = 'transcription-completed',
  TRANSCRIPTION_ERROR = 'transcription-error'
}