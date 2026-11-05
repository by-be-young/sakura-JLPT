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

// 拓展包（真题包等）：查询 / 下载安装 / 打开 PDF / 下载进度
contextBridge.exposeInMainWorld('sakuraPacks', {
  status: (id) => ipcRenderer.invoke('pack:status', id),
  download: (id, tag, asset, version) => ipcRenderer.invoke('pack:download', { id, tag, asset, version }),
  viewFile: (id, rel) => ipcRenderer.invoke('pack:view', { id, rel }),
  on: (channel, callback) => {
    if (channel !== 'progress' || typeof callback !== 'function') return () => {};
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('pack-progress', listener);
    return () => ipcRenderer.removeListener('pack-progress', listener);
  }
});
