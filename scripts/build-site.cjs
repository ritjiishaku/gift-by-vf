const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'public');
const cmsBuild = path.join(root, 'cms', 'dist');

if (path.basename(output) !== 'public' || path.dirname(output) !== root) {
  throw new Error('Refusing to write outside the expected public build directory.');
}
if (!fs.existsSync(path.join(cmsBuild, 'index.html'))) {
  throw new Error('CMS build is missing. Run the CMS production build first.');
}

const isVercelDeployment = Boolean(process.env.VERCEL_ENV);
const contentBackend = process.env.CMS_CONTENT_BACKEND || (isVercelDeployment ? 'neon' : 'sheets');

if (contentBackend === 'neon') {
  if (!process.env.NEON_DATABASE_URL) {
    console.warn('Notice: NEON_DATABASE_URL is not set at build time.');
  }
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const entry of ['index.html', 'reps.html', 'admin.html', 'css', 'js']) {
  fs.cpSync(path.join(root, entry), path.join(output, entry), { recursive: true });
}
fs.cpSync(cmsBuild, path.join(output, 'cms'), { recursive: true });

fs.writeFileSync(
  path.join(output, 'js', 'content-config.js'),
  `window.VF_CONTENT_BACKEND = ${JSON.stringify(contentBackend)};\n`,
);
