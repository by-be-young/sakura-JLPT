// 樱花日语 - Electron 主进程
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
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

// ---------------- 更新兜底（清单缺失时回退 GitHub API） ----------------
const GH_OWNER = 'by-be-young';
const GH_REPO = 'sakura-JLPT';

// 形如 "1.2.3" 的版本比较；a>b 返回 1，a<b 返回 -1，相等返回 0
function compareVersions(a, b) {
  const pa = String(a || '').replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b || '').replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

// 拉取 GitHub 最新 Release 的版本号与发布页地址（公开接口，无需鉴权）
function fetchLatestRelease() {
  return new Promise((resolve, reject) => {
    const req = https.get({
      hostname: 'api.github.com',
      path: `/repos/${GH_OWNER}/${GH_REPO}/releases/latest`,
      headers: { 'User-Agent': 'sakura-japanese-updater', Accept: 'application/vnd.github+json' },
      timeout: 15000
    }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`GitHub API 返回 HTTP ${res.statusCode}`));
        }
        try {
          const data = JSON.parse(body);
          if (!data.tag_name) return reject(new Error('GitHub API 返回缺少版本号'));
          resolve({ version: data.tag_name.replace(/^v/i, ''), url: data.html_url });
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('GitHub API 请求超时')); });
  });
}

ipcMain.handle('updater:check', async () => {
  if (!app.isPackaged) return { ok: false, reason: 'dev-mode' };
  if (!isUpdateConfigured()) return { ok: false, reason: 'not-configured' };
  try {
    const res = await autoUpdater.checkForUpdates();
    return { ok: true, result: res };
  } catch (e) {
    // 兜底：更新清单缺失/网络异常时回退到 GitHub API，仍能提示新版本并提供下载入口
    try {
      const latest = await fetchLatestRelease();
      if (compareVersions(latest.version, app.getVersion()) > 0) {
        sendStatus('update-available', {
          version: latest.version,
          name: latest.version,
          manualDownloadUrl: latest.url
        });
        return { ok: true, result: { fallback: true, version: latest.version, manualDownloadUrl: latest.url } };
      }
      sendStatus('update-not-available');
      return { ok: true, result: { fallback: true, upToDate: true } };
    } catch (e2) {
      return { ok: false, reason: String(e2 && e2.message ? e2.message : e2) };
    }
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
