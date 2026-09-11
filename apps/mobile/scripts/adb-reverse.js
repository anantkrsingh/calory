#!/usr/bin/env node
/**
 * Forwards the device's :8081 to Metro on this machine, so a USB-connected
 * Android device can reach the bundler. `adb reverse` is per-connection — it
 * is wiped by a replug, a phone reboot, or a device disconnect — so this runs
 * before every `expo start`.
 *
 * Never fatal and never blocking: no adb, no device, or iOS/web-only
 * development all just skip. Every adb call is capped by a timeout, since a
 * wedged adb server otherwise hangs the dev script indefinitely.
 */
const { execFileSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { join } = require('node:path');

const PORT = process.env.RCT_METRO_PORT || '8081';
// The local API, so `EXPO_PUBLIC_API_URL=http://localhost:3000` resolves to
// this machine rather than the phone itself. Override with API_PORT.
const API_PORT = process.env.API_PORT || '3000';
const TIMEOUT_MS = 10_000;

function adbPath() {
  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (sdk) {
    const exe = join(
      sdk,
      'platform-tools',
      process.platform === 'win32' ? 'adb.exe' : 'adb',
    );
    if (existsSync(exe)) return exe;
  }
  return process.platform === 'win32' ? 'adb.exe' : 'adb';
}

function run(adb, args) {
  return execFileSync(adb, args, {
    encoding: 'utf8',
    timeout: TIMEOUT_MS,
    windowsHide: true,
    stdio: 'pipe',
  });
}

/** `adb devices`, restarting the server once if it has wedged — a common
 * flaky-USB state where the daemon stops answering and every call hangs. */
function listDevices(adb) {
  try {
    return run(adb, ['devices']);
  } catch (error) {
    if (!error || error.code !== 'ETIMEDOUT') throw error;
    console.log('[adb-reverse] adb wedged, restarting the server');
    try {
      run(adb, ['kill-server']);
    } catch {
      // A wedged daemon may not answer kill-server either; start-server below
      // still recovers it in practice.
    }
    return run(adb, ['devices']);
  }
}

try {
  const adb = adbPath();

  const serials = listDevices(adb)
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => /\tdevice$/.test(line))
    .map((line) => line.split('\t')[0]);

  if (serials.length === 0) {
    console.log('[adb-reverse] no device connected, skipping');
    process.exit(0);
  }

  for (const serial of serials) {
    for (const port of [PORT, API_PORT]) {
      try {
        run(adb, ['-s', serial, 'reverse', `tcp:${port}`, `tcp:${port}`]);
        console.log(`[adb-reverse] ${serial}: tcp:${port} -> localhost:${port}`);
      } catch {
        console.log(`[adb-reverse] ${serial}: could not forward ${port}, skipping`);
      }
    }
  }
} catch (error) {
  const reason =
    error && error.code === 'ETIMEDOUT' ? 'adb timed out' : 'adb unavailable';
  console.log(`[adb-reverse] ${reason}, skipping`);
}

process.exit(0);
