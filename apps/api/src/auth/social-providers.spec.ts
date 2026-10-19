import { BadRequestException } from '@nestjs/common';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import type { Env } from '../config/env';
import { verifyFacebook } from './social-providers';

let mockKeys: ReturnType<typeof createLocalJWKSet>;
jest.mock('jose', () => ({
  ...jest.requireActual('jose'),
  createRemoteJWKSet:
    () =>
    (...args: Parameters<typeof mockKeys>) =>
      mockKeys(...args),
}));

const env = { FACEBOOK_APP_ID: 'app-id', FACEBOOK_APP_SECRET: 'secret' } as Env;
let keys: Awaited<ReturnType<typeof generateKeyPair>>;
async function token(overrides: Record<string, unknown> = {}) {
  return new SignJWT({
    nonce: 'login-nonce',
    email: 'ada@example.com',
    iss: 'https://www.facebook.com',
    aud: 'app-id',
    sub: 'facebook-123',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 300,
    ...overrides,
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'test' })
    .sign(keys.privateKey);
}

beforeAll(async () => {
  keys = await generateKeyPair('RS256');
  mockKeys = createLocalJWKSet({
    keys: [{ ...(await exportJWK(keys.publicKey)), kid: 'test' }],
  });
});
afterEach(() => jest.restoreAllMocks());

it('verifies a Limited Login JWT without sending it to Graph API', async () => {
  const fetchSpy = jest.spyOn(globalThis, 'fetch');
  await expect(
    verifyFacebook({ token: await token(), nonce: 'login-nonce' }, env),
  ).resolves.toMatchObject({
    subject: 'facebook-123',
    email: 'ada@example.com',
  });
  expect(fetchSpy).not.toHaveBeenCalled();
});

it.each([undefined, 'wrong-nonce'])(
  'rejects missing or mismatched nonce: %s',
  async (nonce) => {
    await expect(
      verifyFacebook({ token: await token(), nonce }, env),
    ).rejects.toBeInstanceOf(BadRequestException);
  },
);

it('rejects a JWT issued for another app', async () => {
  await expect(
    verifyFacebook(
      { token: await token(), nonce: 'login-nonce' },
      {
        ...env,
        FACEBOOK_APP_ID: 'other-app',
      },
    ),
  ).rejects.toBeInstanceOf(BadRequestException);
});

it('rejects an invalid signature', async () => {
  const signed = await token();
  const parts = signed.split('.');
  parts[2] = Buffer.alloc(256).toString('base64url');
  await expect(
    verifyFacebook({ token: parts.join('.'), nonce: 'login-nonce' }, env),
  ).rejects.toBeInstanceOf(BadRequestException);
});

it('keeps Graph API verification for Android and tolerates an omitted email', async () => {
  jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            is_valid: true,
            app_id: 'app-id',
            user_id: 'facebook-123',
          },
        }),
      ),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'facebook-123', name: 'Ada' })),
    );
  await expect(
    verifyFacebook(
      { token: 'access-token', email: 'untrusted@example.com' },
      env,
    ),
  ).resolves.toMatchObject({
    subject: 'facebook-123',
    email: undefined,
    emailVerified: false,
  });
});

it('rejects a Graph profile that does not match the verified user', async () => {
  jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            is_valid: true,
            app_id: 'app-id',
            user_id: 'facebook-123',
          },
        }),
      ),
    )
    .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'other-user' })));
  await expect(
    verifyFacebook({ token: 'access-token' }, env),
  ).rejects.toBeInstanceOf(BadRequestException);
});

it.each([{ exp: 1 }, { iss: 'https://attacker.example' }, { sub: '' }])(
  'rejects invalid required claims: %j',
  async (claims) => {
    await expect(
      verifyFacebook({ token: await token(claims), nonce: 'login-nonce' }, env),
    ).rejects.toBeInstanceOf(BadRequestException);
  },
);
