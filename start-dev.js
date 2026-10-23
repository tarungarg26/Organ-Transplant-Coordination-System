const { spawn } = require('child_process');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', '================================================');
console.log('\x1b[36m%s\x1b[0m', '  Starting Organ Transplant Coordination System  ');
console.log('\x1b[36m%s\x1b[0m', '================================================\n');

const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true
});

backend.on('error', (err) => {
  console.error('\x1b[31m[BACKEND ERROR]\x1b[0m', err.message);
});

frontend.on('error', (err) => {
  console.error('\x1b[31m[FRONTEND ERROR]\x1b[0m', err.message);
});

function cleanup() {
  console.log('\nStopping development servers...');
  try { backend.kill(); } catch (e) {}
  try { frontend.kill(); } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
