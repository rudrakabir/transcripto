// src/shared/constants/ipc.ts
export enum IpcChannels {
  GET_SETTINGS = 'settings:get',
  SAVE_SETTING = 'settings:save',
  // Add transcription channels
  START_TRANSCRIPTION = 'transcription:start',
  CANCEL_TRANSCRIPTION = 'transcription:cancel',
  GET_TRANSCRIPTION_STATUS = 'transcription:status',
  GET_TRANSCRIPTION = 'transcription:get',
  GET_TRANSCRIPTION_PROGRESS = 'transcription:progress'
}