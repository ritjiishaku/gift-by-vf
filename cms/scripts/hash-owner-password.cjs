const crypto = require('node:crypto');
const readline = require('node:readline');

if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
  console.error('Run this script in an interactive terminal so the passphrase is not echoed or saved in shell history.');
  process.exit(1);
}

const input = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
let password = '';

process.stdout.write('Enter a random owner passphrase (at least 32 characters): ');
process.stdin.setRawMode(true);
process.stdin.setEncoding('utf8');
process.stdin.resume();

process.stdin.on('data', (chunk) => {
  for (const character of chunk) {
    if (character === '\u0003') {
      process.stdout.write('\nCancelled.\n');
      process.exit(130);
    }
    if (character === '\r' || character === '\n') {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      input.close();
      if (Buffer.byteLength(password, 'utf8') < 32) {
        process.stderr.write('\nPassphrase must be at least 32 bytes. Nothing was generated.\n');
        process.exit(1);
      }
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString('hex');
      password = '';
      process.stdout.write(`\nCMS_OWNER_PASSWORD_HASH=scrypt$${salt}$${hash}\n`);
      process.exit(0);
    }
    if (character === '\u007f' || character === '\b') {
      if (password.length) {
        password = password.slice(0, -1);
        process.stdout.write('\b \b');
      }
      continue;
    }
    password += character;
    process.stdout.write('*');
  }
});
