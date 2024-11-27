"use strict";
const electron = require("electron");
var IpcChannels = /* @__PURE__ */ ((IpcChannels2) => {
  IpcChannels2["GET_SETTINGS"] = "settings:get";
  IpcChannels2["SAVE_SETTING"] = "settings:save";
  IpcChannels2["START_TRANSCRIPTION"] = "transcription:start";
  IpcChannels2["CANCEL_TRANSCRIPTION"] = "transcription:cancel";
  IpcChannels2["GET_TRANSCRIPTION_STATUS"] = "transcription:status";
  IpcChannels2["GET_TRANSCRIPTION"] = "transcription:get";
  IpcChannels2["GET_TRANSCRIPTION_PROGRESS"] = "transcription:progress";
  IpcChannels2["GET_AUDIO_FILES"] = "audio:get-files";
  IpcChannels2["ADD_AUDIO_FILE"] = "audio:add-file";
  return IpcChannels2;
})(IpcChannels || {});
electron.contextBridge.exposeInMainWorld("electron", {
  // Settings methods
  getSettings: () => electron.ipcRenderer.invoke(IpcChannels.GET_SETTINGS),
  saveSetting: (key, value) => electron.ipcRenderer.invoke(IpcChannels.SAVE_SETTING, key, value),
  // Audio file methods
  getAudioFiles: () => electron.ipcRenderer.invoke(IpcChannels.GET_AUDIO_FILES),
  addAudioFile: (filePath) => electron.ipcRenderer.invoke(IpcChannels.ADD_AUDIO_FILE, filePath),
  // Transcription methods
  startTranscription: (request) => electron.ipcRenderer.invoke(IpcChannels.START_TRANSCRIPTION, request),
  cancelTranscription: (recordingId) => electron.ipcRenderer.invoke(IpcChannels.CANCEL_TRANSCRIPTION, recordingId),
  getTranscriptionStatus: (recordingId) => electron.ipcRenderer.invoke(IpcChannels.GET_TRANSCRIPTION_STATUS, recordingId),
  getTranscription: (recordingId) => electron.ipcRenderer.invoke(IpcChannels.GET_TRANSCRIPTION, recordingId),
  getTranscriptionProgress: (recordingId) => electron.ipcRenderer.invoke(IpcChannels.GET_TRANSCRIPTION_PROGRESS, recordingId),
  // Event system
  on: (channel, callback) => {
    electron.ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },
  removeListener: (channel, callback) => {
    electron.ipcRenderer.removeListener(channel, callback);
  }
});
