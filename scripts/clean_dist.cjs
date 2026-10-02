// 构建辅助：打包前清空 dist/
//
// 背景：electron-builder 是直接把整个 dist/ 打进 app.asar 的。如果 dist/ 里残留上一版
// 带 hash 的 index-*.js，安装包就会同时带上新旧两份 bundle（白胖 ~2MB，也容易误判
// 线上跑的是哪份代码）。Vite 的 emptyOutDir 依赖 Node 的递归删除，在个别环境
// （沙箱/杀软/文件被占用）下可能**返回成功却没有真正删除**，所以这里显式清理，
// 并在删除后校验；必要时回退到 cmd / PowerShell，仍失败则中断构建。
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const target = path.resolve(__dirname, '..', 'dist');

function tryNodeRm() {
  try {
    fs.rmSync(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  } catch (e) {
    /* 交给下面的校验与回退处理 */
  }
}

function tryCmdRm() {
  if (process.platform !== 'win32') return;
  spawnSync('cmd', ['/c', 'rmdir', '/s', '/q', target], { stdio: 'ignore' });
}

function tryPowerShellRm() {
  if (process.platform !== 'win32') return;
  const escaped = target.replace(/'/g, "''");
  spawnSync(
    'powershell',
    ['-NoProfile', '-NonInteractive', '-Command', `Remove-Item -LiteralPath '${escaped}' -Recurse -Force -ErrorAction SilentlyContinue`],
    { stdio: 'ignore' }
  );
}

if (!fs.existsSync(target)) {
  console.log('[clean] dist/ 不存在，跳过');
  process.exit(0);
}

tryNodeRm();
if (fs.existsSync(target)) tryCmdRm();
if (fs.existsSync(target)) tryPowerShellRm();

if (fs.existsSync(target)) {
  console.error('[clean] ❌ 无法清空 dist/：' + target);
  console.error('[clean]    可能有程序正在占用（正在运行的 Electron 应用 / 杀软扫描 / 资源管理器）。');
  console.error('[clean]    请关闭后重新构建 —— 不要打进夹带旧 bundle 的安装包。');
  process.exit(1);
}

console.log('[clean] removed ' + target);
