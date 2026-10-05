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
const contentBackend = process.env.CMS_CONTENT_BACKEND || (isVercelDeployment ? '' : 'sheets');
if (!['sheets', 'neon'].includes(contentBackend)) {
  throw new Error('Set CMS_CONTENT_BACKEND to "neon" for every Vercel deployment.');
}
if (isVercelDeployment && contentBackend !== 'neon') {
  throw new Error('Vercel deployments must use Neon for public catalogue and site content.');
}
if (contentBackend === 'neon') {
  if (!process.env.NEON_DATABASE_URL || !['preview', 'production'].includes(process.env.CMS_DATABASE_ENV)) {
    throw new Error('Neon content builds require NEON_DATABASE_URL and CMS_DATABASE_ENV.');
  }
  if (process.env.VERCEL_ENV && process.env.CMS_DATABASE_ENV !== process.env.VERCEL_ENV) {
    throw new Error('CMS_DATABASE_ENV must match the Vercel deployment environment.');
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
