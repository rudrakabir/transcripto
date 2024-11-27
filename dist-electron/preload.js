"use strict";
const electron = require("electron");
var IpcChannels = /* @__PURE__ */ ((IpcChannels2) => {
  IpcChannels2["GET_SETTINGS"] = "settings:get";
  IpcChannels2["SAVE_SETTING"] = "settings:save";
  return IpcChannels2;
})(IpcChannels || {});
electron.contextBridge.exposeInMainWorld("electron", {
  getSettings: () => electron.ipcRenderer.invoke(IpcChannels.GET_SETTINGS),
  saveSetting: (key, value) => electron.ipcRenderer.invoke(IpcChannels.SAVE_SETTING, key, value)
});
