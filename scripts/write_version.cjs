// 构建辅助：把 package.json 的 version 同步到 public/version.json（供 Web/PWA/Android 读取）
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;

fs.writeFileSync(
  path.join(root, 'public', 'version.json'),
  JSON.stringify({ version }, null, 2) + '\n',
  'utf8'
);
console.log('[version] synced version.json ->', version);
