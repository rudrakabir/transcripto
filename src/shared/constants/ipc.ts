export enum IpcChannels {
  // Settings
  GET_SETTINGS = 'settings:get',
  SAVE_SETTING = 'settings:save',
  
  // Audio Files
  GET_AUDIO_FILES = 'audio:get-files',
  ADD_AUDIO_FILE = 'audio:add-file',
  
  // Transcription
  START_TRANSCRIPTION = 'transcription:start',
  CANCEL_TRANSCRIPTION = 'transcription:cancel',
  GET_TRANSCRIPTION_STATUS = 'transcription:get-status',
  GET_TRANSCRIPTION = 'transcription:get',
  GET_TRANSCRIPTION_PROGRESS = 'transcription:get-progress',
  
  // Events
  TRANSCRIPTION_PROGRESS = 'transcription:progress',
  TRANSCRIPTION_COMPLETED = 'transcription:completed',
  TRANSCRIPTION_ERROR = 'transcription:error'
}