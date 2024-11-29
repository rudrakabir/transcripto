"use strict";
const electron = require("electron");
var IpcChannels = /* @__PURE__ */ ((IpcChannels2) => {
  IpcChannels2["GET_SETTINGS"] = "get-settings";
  IpcChannels2["SAVE_SETTING"] = "save-setting";
  IpcChannels2["GET_AUDIO_FILES"] = "get-audio-files";
  IpcChannels2["GET_RECORDING"] = "get-recording";
  IpcChannels2["ADD_AUDIO_FILE"] = "add-audio-file";
  IpcChannels2["UPDATE_RECORDING_STATUS"] = "update-recording-status";
  IpcChannels2["START_TRANSCRIPTION"] = "start-transcription";
  IpcChannels2["CANCEL_TRANSCRIPTION"] = "cancel-transcription";
  IpcChannels2["GET_TRANSCRIPTION"] = "get-transcription";
  IpcChannels2["SAVE_TRANSCRIPTION"] = "save-transcription";
  IpcChannels2["GET_TRANSCRIPTION_STATUS"] = "get-transcription-status";
  IpcChannels2["GET_TRANSCRIPTION_PROGRESS"] = "get-transcription-progress";
  IpcChannels2["TRANSCRIPTION_PROGRESS"] = "transcription-progress";
  IpcChannels2["TRANSCRIPTION_COMPLETED"] = "transcription-completed";
  IpcChannels2["TRANSCRIPTION_ERROR"] = "transcription-error";
  return IpcChannels2;
})(IpcChannels || {});
electron.contextBridge.exposeInMainWorld("electron", {
  // Settings methods
  getSettings: () => electron.ipcRenderer.invoke(IpcChannels.GET_SETTINGS),
  saveSetting: (key, value) => electron.ipcRenderer.invoke(IpcChannels.SAVE_SETTING, key, value),
  // Audio file methods
  getAudioFiles: () => electron.ipcRenderer.invoke(IpcChannels.GET_AUDIO_FILES),
  getRecording: (id) => electron.ipcRenderer.invoke(IpcChannels.GET_RECORDING, id),
  addAudioFile: (recording) => electron.ipcRenderer.invoke(IpcChannels.ADD_AUDIO_FILE, recording),
  updateRecordingStatus: (id, status, error) => electron.ipcRenderer.invoke(IpcChannels.UPDATE_RECORDING_STATUS, id, status, error),
  // Transcription methods
  startTranscription: (request) => electron.ipcRenderer.invoke(IpcChannels.START_TRANSCRIPTION, request),
  cancelTranscription: (recordingId) => electron.ipcRenderer.invoke(IpcChannels.CANCEL_TRANSCRIPTION, recordingId),
  getTranscription: (recordingId) => electron.ipcRenderer.invoke(IpcChannels.GET_TRANSCRIPTION, recordingId),
  saveTranscription: (transcription) => electron.ipcRenderer.invoke(IpcChannels.SAVE_TRANSCRIPTION, transcription),
  getTranscriptionStatus: (recordingId) => electron.ipcRenderer.invoke(IpcChannels.GET_TRANSCRIPTION_STATUS, recordingId),
  getTranscriptionProgress: (recordingId) => electron.ipcRenderer.invoke(IpcChannels.GET_TRANSCRIPTION_PROGRESS, recordingId),
  // Event system
  on: (channel, callback) => {
    electron.ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },
  removeListener: (channel, callback) => {
    electron.ipcRenderer.removeListener(channel, callback);
  }
});
