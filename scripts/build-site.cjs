const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'public');

if (path.basename(output) !== 'public' || path.dirname(output) !== root) {
  throw new Error('Refusing to write outside the expected public build directory.');
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const entry of ['index.html', 'reps.html', 'admin.html', 'css', 'js']) {
  fs.cpSync(path.join(root, entry), path.join(output, entry), { recursive: true });
}
