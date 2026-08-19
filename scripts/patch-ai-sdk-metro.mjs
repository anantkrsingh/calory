#!/usr/bin/env node
/**
 * Metro rejects `@ai-sdk/provider-utils`'s Node-only `import(id)`.
 * Replace it after install so Expo can bundle AI SDK client code.
 *
 * Fixed upstream in AI SDK v6+/v7; keep this while we stay on v5.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = join(process.cwd(), 'node_modules/.pnpm');
if (!existsSync(root)) {
  console.log('[patch-ai-sdk-metro] no .pnpm store, skipping');
  process.exit(0);
}

const needle = 'return import(id);';
const replacement =
  'return Promise.reject(new Error(`Node module "${id}" is unavailable in this runtime`));';

let patched = 0;

for (const entry of readdirSync(root)) {
  if (!entry.startsWith('@ai-sdk+provider-utils@')) continue;

  for (const file of ['index.mjs', 'index.js']) {
    const target = join(
      root,
      entry,
      'node_modules/@ai-sdk/provider-utils/dist',
      file,
    );
    if (!existsSync(target)) continue;

    const source = readFileSync(target, 'utf8');
    if (!source.includes(needle)) continue;

    writeFileSync(target, source.replaceAll(needle, replacement));
    patched += 1;
    console.log(`[patch-ai-sdk-metro] patched ${entry}/dist/${file}`);
  }
}

if (patched === 0) {
  console.log('[patch-ai-sdk-metro] nothing to patch');
} else {
  console.log(`[patch-ai-sdk-metro] patched ${patched} file(s)`);
}
