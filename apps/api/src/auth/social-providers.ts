import { BadRequestException, NotImplementedException } from '@nestjs/common';
import type { Env } from '@fitness/config/server';
import { AuthProvider, type SocialProfile } from '@fitness/types';
import type { SocialLoginInput } from '@fitness/validation';

function reject(provider: AuthProvider): never {
  throw new BadRequestException(`Could not verify your ${provider} sign-in`);
}

function requireConfig<T>(value: T | undefined, provider: AuthProvider): T {
  if (!value) {
    throw new NotImplementedException(
      `${provider} sign-in is not configured on this server`,
    );
  }
  return value;
}

async function getJson(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, init);
  if (!response.ok) return null;
  return response.json();
}

export async function verifyGoogle(
  input: SocialLoginInput,
  env: Env,
): Promise<SocialProfile> {
  const audiences = requireConfig(env.GOOGLE_CLIENT_IDS, AuthProvider.Google)
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  const data = (await getJson(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(input.token)}`,
  )) as {
    aud?: string;
    sub?: string;
    email?: string;
    email_verified?: string | boolean;
    name?: string;
    picture?: string;
  } | null;

  if (!data?.sub || !data.aud || !audiences.includes(data.aud)) {
    reject(AuthProvider.Google);
  }

  return {
    provider: AuthProvider.Google,
    subject: data.sub,
    email: data.email,
    displayName: data.name,
    avatarUrl: data.picture,
    emailVerified: data.email_verified === true || data.email_verified === 'true',
  };
}

export async function verifyFacebook(
  input: SocialLoginInput,
  env: Env,
): Promise<SocialProfile> {
  const appId = requireConfig(env.FACEBOOK_APP_ID, AuthProvider.Facebook);
  const appSecret = requireConfig(env.FACEBOOK_APP_SECRET, AuthProvider.Facebook);
  const appToken = `${appId}|${appSecret}`;

  const debug = (await getJson(
    `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(input.token)}&access_token=${encodeURIComponent(appToken)}`,
  )) as { data?: { app_id?: string; is_valid?: boolean; user_id?: string } } | null;

  if (
    !debug?.data?.is_valid ||
    debug.data.app_id !== appId ||
    !debug.data.user_id
  ) {
    reject(AuthProvider.Facebook);
  }

  const profile = (await getJson(
    `https://graph.facebook.com/v21.0/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(input.token)}`,
  )) as {
    id?: string;
    name?: string;
    email?: string;
    picture?: { data?: { url?: string } };
  } | null;

  if (!profile?.id) reject(AuthProvider.Facebook);

  return {
    provider: AuthProvider.Facebook,
    subject: profile.id,
    email: profile.email,
    displayName: profile.name,
    avatarUrl: profile.picture?.data?.url,
    emailVerified: Boolean(profile.email),
  };
}

export async function verifyX(
  input: SocialLoginInput,
  env: Env,
): Promise<SocialProfile> {
  const clientId = requireConfig(env.X_CLIENT_ID, AuthProvider.X);
  const clientSecret = requireConfig(env.X_CLIENT_SECRET, AuthProvider.X);

  if (!input.redirectUri || !input.codeVerifier) {
    throw new BadRequestException(
      'X sign-in requires redirectUri and codeVerifier',
    );
  }

  const exchange = (await getJson('https://api.x.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: input.token,
      redirect_uri: input.redirectUri,
      code_verifier: input.codeVerifier,
    }),
  })) as { access_token?: string } | null;

  if (!exchange?.access_token) reject(AuthProvider.X);

  const profile = (await getJson(
    'https://api.x.com/2/users/me?user.fields=profile_image_url,confirmed_email',
    { headers: { authorization: `Bearer ${exchange.access_token}` } },
  )) as {
    data?: {
      id?: string;
      name?: string;
      confirmed_email?: string;
      profile_image_url?: string;
    };
  } | null;

  if (!profile?.data?.id) reject(AuthProvider.X);

  return {
    provider: AuthProvider.X,
    subject: profile.data.id,
    email: profile.data.confirmed_email,
    displayName: profile.data.name,
    avatarUrl: profile.data.profile_image_url,
    emailVerified: Boolean(profile.data.confirmed_email),
  };
}

export const SOCIAL_VERIFIERS: Record<
  AuthProvider,
  (input: SocialLoginInput, env: Env) => Promise<SocialProfile>
> = {
  [AuthProvider.Google]: verifyGoogle,
  [AuthProvider.Facebook]: verifyFacebook,
  [AuthProvider.X]: verifyX,
};
