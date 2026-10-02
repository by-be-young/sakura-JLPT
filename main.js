// 樱花日语 - Electron 主进程
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

// 不自动下载，由用户点击确认后下载
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// 检测更新源是否已配置（未配置/占位符时完全静默，不打扰用户）
function isUpdateConfigured() {
  if (!app.isPackaged) return false;
  try {
    const yml = fs.readFileSync(path.join(process.resourcesPath, 'app-update.yml'), 'utf8');
    if (/YOUR_GITHUB|YOUR_REPO|placeholder/i.test(yml)) return false;
    return /provider:\s*github/i.test(yml);
  } catch (e) {
    return false;
  }
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 940,
    minHeight: 620,
    title: '樱花日语',
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  });
  mainWindow.setMenuBarVisibility(false);

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // 外部链接一律交给系统浏览器
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ---------------- 更新相关 IPC ----------------
const sendStatus = (channel, data) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(`updater:${channel}`, data);
  }
};

ipcMain.handle('updater:check', async () => {
  if (!app.isPackaged) return { ok: false, reason: 'dev-mode' };
  if (!isUpdateConfigured()) return { ok: false, reason: 'not-configured' };
  try {
    const res = await autoUpdater.checkForUpdates();
    return { ok: true, result: res };
  } catch (e) {
    return { ok: false, reason: String(e && e.message ? e.message : e) };
  }
});

ipcMain.handle('updater:download', async () => {
  if (!app.isPackaged) return { ok: false, reason: 'dev-mode' };
  if (!isUpdateConfigured()) return { ok: false, reason: 'not-configured' };
  try {
    await autoUpdater.downloadUpdate();
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: String(e && e.message ? e.message : e) };
  }
});

ipcMain.handle('updater:install', () => {
  if (app.isPackaged) {
    autoUpdater.quitAndInstall();
    return { ok: true };
  }
  return { ok: false, reason: 'dev-mode' };
});

ipcMain.handle('updater:get-version', () => app.getVersion());

autoUpdater.on('update-available', (info) => sendStatus('update-available', info));
autoUpdater.on('update-not-available', () => sendStatus('update-not-available'));
autoUpdater.on('download-progress', (p) => sendStatus('download-progress', p));
autoUpdater.on('update-downloaded', (info) => sendStatus('update-downloaded', info));
autoUpdater.on('error', (err) => sendStatus('error', { message: String(err && err.message ? err.message : err) }));
