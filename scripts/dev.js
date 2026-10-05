const { spawn } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const rootDir = path.resolve(__dirname, '..');

console.log('\x1b[36m%s\x1b[0m', '==================================================');
console.log('\x1b[36m%s\x1b[0m', '🚀 Starting NIRIKSHAN Platform (API + Admin Web)...');
console.log('\x1b[36m%s\x1b[0m', '   - API Server:  http://localhost:5000');
console.log('\x1b[36m%s\x1b[0m', '   - Admin Web:   http://localhost:5173');
console.log('\x1b[36m%s\x1b[0m', '==================================================\n');

function runService(name, command, args, color) {
  const child = spawn(command, args, {
    cwd: rootDir,
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        process.stdout.write(`${color}[${name}]\x1b[0m ${line}\n`);
      }
    }
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        process.stderr.write(`${color}[${name}]\x1b[0m ${line}\n`);
      }
    }
  });

  child.on('close', (code) => {
    console.log(`${color}[${name}]\x1b[0m Process exited with code ${code}`);
  });

  return child;
}

const apiProcess = runService(
  'API',
  'node',
  ['./node_modules/tsx/dist/cli.mjs', 'watch', 'apps/api/src/server.ts'],
  '\x1b[34m' // Blue
);

const webProcess = runService(
  'WEB',
  'node',
  ['./node_modules/vite/bin/vite.js', 'apps/admin-web'],
  '\x1b[32m' // Green
);

function cleanup() {
  console.log('\n\x1b[33m%s\x1b[0m', 'Shutting down NIRIKSHAN development servers...');
  if (isWindows) {
    if (apiProcess.pid) spawn('taskkill', ['/pid', apiProcess.pid, '/f', '/t']);
    if (webProcess.pid) spawn('taskkill', ['/pid', webProcess.pid, '/f', '/t']);
  } else {
    apiProcess.kill('SIGTERM');
    webProcess.kill('SIGTERM');
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
