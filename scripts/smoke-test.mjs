// Automated smoke test: boots the server on a test port and checks that
// every page and the health endpoint respond, plus the WebSocket contract
// (hello payload, unknown-role rejection). No OBS or internet required.
// Run with: npm test

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import WebSocket from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const PORT = process.env.SMOKE_TEST_PORT || '4599';
const BASE = `http://127.0.0.1:${PORT}`;

// The booted server uses the real config.json — respect a configured PIN
// so the test passes on a production-hardened install.
let PIN = '';
try {
  PIN = JSON.parse(readFileSync(path.join(rootDir, 'config.json'), 'utf8')).remotePin || '';
} catch {
  // no config — server would fail to boot anyway and the checks will say so
}
const pinParam = PIN ? `&pin=${encodeURIComponent(PIN)}` : '';

const checks = [
  { path: '/api/health', expect: (body) => JSON.parse(body).ok === true },
  { path: '/control', expect: (body) => body.includes('<') },
  { path: '/overlay', expect: (body) => body.includes('<') },
  { path: '/remote', expect: (body) => body.includes('<') },
  { path: '/stage', expect: (body) => body.includes('<') },
  { path: '/api/history', expect: (body) => JSON.parse(body).ok === true },
  { path: '/api/favorites', expect: (body) => JSON.parse(body).ok === true },
  { path: '/api/service-plan', expect: (body) => JSON.parse(body).ok === true },
  { path: '/api/qr', expect: (body) => JSON.parse(body).ok === true },
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Connect a WebSocket and resolve with the first message (or close code)
function wsProbe(url, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const timer = setTimeout(() => {
      socket.terminate();
      reject(new Error('WS probe timeout'));
    }, timeoutMs);
    socket.on('message', (data) => {
      clearTimeout(timer);
      const msg = JSON.parse(data.toString());
      socket.close();
      resolve({ kind: 'message', msg });
    });
    socket.on('close', (code) => {
      clearTimeout(timer);
      resolve({ kind: 'close', code });
    });
    socket.on('error', () => {}); // close event carries the outcome
  });
}

async function runWsChecks() {
  let failed = 0;

  // hello contract: control client gets state the UI depends on
  try {
    const res = await wsProbe(`ws://127.0.0.1:${PORT}/?role=control${pinParam}`);
    const ok = res.kind === 'message'
      && res.msg.type === 'hello'
      && typeof res.msg.obsConnected === 'boolean'
      && Array.isArray(res.msg.history)
      && Array.isArray(res.msg.config?.translations)
      && 'currentLive' in res.msg;
    console.log(`[smoke] ${ok ? 'PASS' : 'FAIL'} WS hello contract (role=control)`);
    if (!ok) failed++;
  } catch (e) {
    console.log(`[smoke] FAIL WS hello contract: ${e.message}`);
    failed++;
  }

  // Unknown roles must be rejected, not given their own broadcast room
  try {
    const res = await wsProbe(`ws://127.0.0.1:${PORT}/?role=hacker${pinParam}`);
    const ok = res.kind === 'close' && res.code === 4003;
    console.log(`[smoke] ${ok ? 'PASS' : 'FAIL'} WS unknown role rejected (got ${res.kind} ${res.code ?? ''})`);
    if (!ok) failed++;
  } catch (e) {
    console.log(`[smoke] FAIL WS unknown role check: ${e.message}`);
    failed++;
  }

  return failed;
}

async function waitForServer(timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await wait(250);
  }
  throw new Error(`Server did not become ready on port ${PORT} within ${timeoutMs}ms`);
}

async function main() {
  console.log(`[smoke] Starting server on port ${PORT}...`);
  const server = spawn(process.execPath, ['server.js'], {
    cwd: rootDir,
    env: { ...process.env, PORT },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverOutput = '';
  server.stdout.on('data', (d) => { serverOutput += d; });
  server.stderr.on('data', (d) => { serverOutput += d; });

  let failed = 0;
  try {
    await waitForServer();

    for (const check of checks) {
      const res = await fetch(BASE + check.path);
      const body = await res.text();
      let ok = false;
      try {
        ok = res.status === 200 && check.expect(body);
      } catch {
        ok = false;
      }
      console.log(`[smoke] ${ok ? 'PASS' : 'FAIL'} GET ${check.path} (${res.status})`);
      if (!ok) failed++;
    }

    failed += await runWsChecks();
  } catch (e) {
    console.error(`[smoke] ${e.message}`);
    if (serverOutput) console.error('[smoke] Server output:\n' + serverOutput);
    failed++;
  } finally {
    server.kill();
  }

  if (failed > 0) {
    console.error(`[smoke] ${failed} check(s) failed`);
    process.exit(1);
  }
  console.log(`[smoke] All ${checks.length + 2} checks passed`);
}

main();
