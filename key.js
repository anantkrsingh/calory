import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// Resolve the dependency from the API workspace where it is installed.
const require = createRequire(new URL('./apps/api/package.json', import.meta.url));
const { importPKCS8, SignJWT } = require('jose');

const teamId = process.env.APPLE_TEAM_ID || 'MYVKDBYKHV';
const bundleId = process.env.APPLE_BUNDLE_ID || 'com.fitness.calory.ai';
if (!teamId || !bundleId) {
  console.error('Set APPLE_TEAM_ID and APPLE_BUNDLE_ID before running node key.js');
  process.exit(1);
}

const privateKey = await importPKCS8(
  readFileSync('/Volumes/Crucial/projects/fitness-tracker/AuthKey_C745B6B4K3.p8', 'utf8'),
  'ES256',
);

const secret = await new SignJWT({})
  .setProtectedHeader({ alg: 'ES256', kid: 'C745B6B4K3' })
  .setIssuer(teamId)
  .setSubject(bundleId)
  .setAudience('https://appleid.apple.com')
  .setIssuedAt()
  .setExpirationTime('180d')
  .sign(privateKey);

console.log(secret);
