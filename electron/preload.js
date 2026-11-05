// 樱花日语 - Electron 预加载脚本（安全暴露更新 API 给渲染层）
const { contextBridge, ipcRenderer } = require('electron');

const VALID_CHANNELS = ['update-available', 'update-not-available', 'download-progress', 'update-downloaded', 'error'];

contextBridge.exposeInMainWorld('sakuraUpdater', {
  check: () => ipcRenderer.invoke('updater:check'),
  download: () => ipcRenderer.invoke('updater:download'),
  install: () => ipcRenderer.invoke('updater:install'),
  getVersion: () => ipcRenderer.invoke('updater:get-version'),
  on: (channel, callback) => {
    if (!VALID_CHANNELS.includes(channel) || typeof callback !== 'function') return () => {};
    const listener = (_event, data) => callback(data);
    ipcRenderer.on(`updater:${channel}`, listener);
    return () => ipcRenderer.removeListener(`updater:${channel}`, listener);
  }
});
