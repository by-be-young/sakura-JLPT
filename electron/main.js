// 樱花日语 - Electron 主进程
const { app, BrowserWindow, ipcMain, shell, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { pathToFileURL } = require('url');
const { unzipSync } = require('fflate');
const { autoUpdater } = require('electron-updater');

// 拓展包自定义协议：sakura-pack://<packId>/<相对路径> 用于在应用内读取已安装的拓展包文件
// （standard + secure + fetch，才能被 <audio>/fetch/新窗口当作正常资源使用）
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'sakura-pack',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
  }
]);

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
  registerPackProtocol();
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

// ==================== 拓展包（真题包等，按需下载，走 GitHub Releases） ====================
// 安装目录：<userData>/packs/<packId>/<version>/{files/, installed.json}
const PACK_ROOT = () => path.join(app.getPath('userData'), 'packs');

function packsDir(id) {
  if (!/^[a-z0-9-]+$/i.test(id)) throw new Error('非法拓展包 id');
  return path.join(PACK_ROOT(), id);
}

// 由文件列表推导「场次 -> 文件」结构
function buildSessions(files) {
  const map = new Map();
  for (const f of files || []) {
    const i = f.indexOf('/');
    if (i === -1) continue;
    const session = f.slice(0, i);
    const name = f.slice(i + 1);
    if (!map.has(session)) map.set(session, []);
    map.get(session).push(name);
  }
  const sessions = [];
  for (const [session, names] of map.entries()) {
    sessions.push({ session, files: names.sort() });
  }
  return sessions.sort((a, b) => (a.session < b.session ? -1 : 1));
}

// 从 GitHub API 按 tag 解析拓展包资产地址（公开接口，无需鉴权）
function fetchPackAsset(tag, asset) {
  return new Promise((resolve, reject) => {
    const req = https.get({
      hostname: 'api.github.com',
      path: `/repos/${GH_OWNER}/${GH_REPO}/releases/tags/${encodeURIComponent(tag)}`,
      headers: { 'User-Agent': 'sakura-japanese-packs', Accept: 'application/vnd.github+json' },
      timeout: 15000
    }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`GitHub API 返回 HTTP ${res.statusCode}`));
        try {
          const data = JSON.parse(body);
          const a = (data.assets || []).find((x) => x.name === asset);
          if (!a || !a.browser_download_url) return reject(new Error('未找到拓展包资产'));
          resolve({ url: a.browser_download_url, size: a.size || 0, updatedAt: a.updated_at || '' });
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('GitHub API 请求超时')));
  });
}

// 带重定向跟随与进度回调的下载（GitHub Release 资产会 302 到 CDN）
function downloadFile(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const follow = (u, depth) => {
      if (depth > 6) return reject(new Error('下载重定向次数过多'));
      const req = https.get(u, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
          Accept: '*/*'
        },
        timeout: 20000
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return follow(new URL(res.headers.location, u).toString(), depth + 1);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`下载返回 HTTP ${res.statusCode}`));
        }
        const total = parseInt(res.headers['content-length'] || '0', 10) || 0;
        let received = 0;
        const ws = fs.createWriteStream(dest);
        res.on('data', (c) => {
          received += c.length;
          if (total && onProgress) onProgress(Math.min(100, Math.round((received / total) * 100)));
        });
        res.pipe(ws);
        ws.on('finish', () => ws.close(() => resolve()));
        ws.on('error', (e) => { res.destroy(); reject(e); });
        res.on('error', (e) => { ws.destroy(); reject(e); });
      });
      req.on('timeout', () => req.destroy(new Error('下载超时')));
      req.on('error', reject);
    };
    follow(url, 0);
  });
}

// 解压 zip 到目标目录（防路径穿越），返回相对文件列表
function unzipPack(zipPath, outDir) {
  let entries;
  try {
    entries = unzipSync(new Uint8Array(fs.readFileSync(zipPath)));
  } catch (e) {
    throw new Error('zip 解压失败：' + (e && e.message ? e.message : e));
  }
  const files = [];
  for (const name of Object.keys(entries)) {
    const clean = name.replace(/\\/g, '/');
    if (!clean || clean.startsWith('/')) continue;
    if (clean.split('/').some((s) => s === '..' || s === '.')) continue;
    const target = path.resolve(outDir, clean);
    if (target !== outDir && !target.startsWith(outDir + path.sep)) continue;
    if (clean.endsWith('/')) {
      fs.mkdirSync(target, { recursive: true });
      continue;
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, Buffer.from(entries[name]));
    files.push(clean);
  }
  return files;
}

// 读取某个拓展包已安装的最新版本信息
function readInstalledPack(id) {
  const base = packsDir(id);
  if (!fs.existsSync(base)) return null;
  let installed = null;
  let entries = [];
  try { entries = fs.readdirSync(base, { withFileTypes: true }); } catch (e) { return null; }
  for (const d of entries) {
    if (!d.isDirectory()) continue;
    const metaFile = path.join(base, d.name, 'installed.json');
    if (!fs.existsSync(metaFile)) continue;
    try {
      const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
      if (!installed || compareVersions(meta.version, installed.version) > 0) installed = meta;
    } catch (e) { /* 跳过损坏的安装记录 */ }
  }
  return installed;
}

// 注册 sakura-pack:// 协议：只允许读取 <userData>/packs/<id>/files/ 内的文件
function registerPackProtocol() {
  protocol.handle('sakura-pack', (req) => {
    try {
      const u = new URL(req.url);
      const id = u.hostname;
      if (!/^[a-z0-9-]+$/i.test(id)) return new Response('forbidden', { status: 403 });
      const rel = decodeURIComponent(u.pathname.replace(/^\/+/, ''));
      const base = path.join(PACK_ROOT(), id, 'files');
      const target = path.resolve(base, rel);
      if (target !== base && !target.startsWith(base + path.sep)) {
        return new Response('forbidden', { status: 403 });
      }
      if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
        return new Response('not found', { status: 404 });
      }
      return net.fetch(pathToFileURL(target).toString());
    } catch (e) {
      return new Response('bad request', { status: 400 });
    }
  });
}

// 查询拓展包安装状态
ipcMain.handle('pack:status', async (e, id) => {
  try {
    const installed = readInstalledPack(id);
    if (!installed) return { ok: true, installed: false };
    return {
      ok: true,
      installed: true,
      version: installed.version,
      files: installed.files || [],
      sessions: buildSessions(installed.files)
    };
  } catch (err) {
    return { ok: false, reason: String(err && err.message ? err.message : err) };
  }
});

// 下载并安装拓展包（从 GitHub Releases 解析资产 -> 下载 -> 解压 -> 写入安装记录）
ipcMain.handle('pack:download', async (e, { id, tag, asset, version }) => {
  try {
    if (!/^[a-z0-9-]+$/i.test(id)) return { ok: false, reason: '非法拓展包 id' };
    const info = await fetchPackAsset(tag, asset);
    const base = packsDir(id);
    fs.mkdirSync(base, { recursive: true });
    const zipPath = path.join(base, `${id}-${version}.zip`);
    await downloadFile(info.url, zipPath, (pct) => {
      sendStatus('pack-progress', { id, phase: 'download', progress: pct });
    });
    const outDir = path.join(base, version, 'files');
    fs.mkdirSync(outDir, { recursive: true });
    sendStatus('pack-progress', { id, phase: 'unzip', progress: 100 });
    const files = unzipPack(zipPath, outDir);
    fs.unlinkSync(zipPath);
    fs.writeFileSync(
      path.join(base, version, 'installed.json'),
      JSON.stringify({ id, version, files, installedAt: new Date().toISOString() }, null, 2)
    );
    sendStatus('pack-progress', { id, phase: 'done', progress: 100 });
    return { ok: true, id, version, files, sessions: buildSessions(files) };
  } catch (err) {
    sendStatus('pack-progress', { id, phase: 'error', progress: 0, message: String(err && err.message ? err.message : err) });
    return { ok: false, reason: String(err && err.message ? err.message : err) };
  }
});

// 在新窗口打开拓展包内的 PDF（Electron 内置 PDF 阅读器渲染 sakura-pack:// 资源）
ipcMain.handle('pack:view', (e, { id, rel }) => {
  try {
    const base = path.join(packsDir(id), 'files');
    const target = path.resolve(base, String(rel || ''));
    if (target !== base && !target.startsWith(base + path.sep)) return { ok: false, reason: 'forbidden' };
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) return { ok: false, reason: '文件不存在' };
    const win = new BrowserWindow({
      width: 1080,
      height: 840,
      minWidth: 720,
      minHeight: 480,
      title: path.basename(target),
      icon: path.join(__dirname, '..', 'build', 'icon.ico'),
      autoHideMenuBar: true,
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
    });
    win.setMenuBarVisibility(false);
    const relEncoded = String(rel).split('/').map((s) => encodeURIComponent(s)).join('/');
    win.loadURL(`sakura-pack://${encodeURIComponent(id)}/${relEncoded}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: String(err && err.message ? err.message : err) };
  }
});
