import {
  BadRequestException,
  Logger,
  NotImplementedException,
} from '@nestjs/common';
import { AuthProvider, type SocialProfile } from '@fitness/types';
import type { SocialLoginInput } from '@fitness/validation';
import { OAuth2Client } from 'google-auth-library';

import type { Env } from '../config/env';

const logger = new Logger('SocialProviders');

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

async function getJson(
  url: string,
  init?: RequestInit,
  context?: string,
): Promise<unknown> {
  const response = await fetch(url, init);
  if (!response.ok) {
    if (context) {
      const body = await response.text().catch(() => '');
      logger.error(
        `${context} failed: ${response.status} ${response.statusText} ${body}`,
      );
    }
    return null;
  }
  return response.json();
}

// No client secret needed: verifying an ID token only checks its signature
// against Google's published JWKS (cached and refreshed by the library).
const googleClient = new OAuth2Client();

export async function verifyGoogle(
  input: SocialLoginInput,
  env: Env,
): Promise<SocialProfile> {
  const audiences = requireConfig(env.GOOGLE_CLIENT_IDS, AuthProvider.Google)
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: input.token,
      audience: audiences,
    });
    payload = ticket.getPayload();
  } catch (error) {
    logger.error(
      `Google ID token verification failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    reject(AuthProvider.Google);
  }

  if (!payload?.sub) {
    logger.warn(
      `Google ID token verified but payload had no subject: ${JSON.stringify(payload)}`,
    );
    reject(AuthProvider.Google);
  }

  return {
    provider: AuthProvider.Google,
    subject: payload.sub,
    email: payload.email,
    displayName: payload.name,
    avatarUrl: payload.picture,
    emailVerified: payload.email_verified === true,
  };
}

export async function verifyFacebook(
  input: SocialLoginInput,
  env: Env,
): Promise<SocialProfile> {
  const appId = requireConfig(env.FACEBOOK_APP_ID, AuthProvider.Facebook);
  const appSecret = requireConfig(
    env.FACEBOOK_APP_SECRET,
    AuthProvider.Facebook,
  );
  const appToken = `${appId}|${appSecret}`;

  let debug: {
    data?: { app_id?: string; is_valid?: boolean; user_id?: string };
  } | null;
  try {
    debug = (await getJson(
      `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(input.token)}&access_token=${encodeURIComponent(appToken)}`,
      undefined,
      'Facebook debug_token request',
    )) as typeof debug;
  } catch (error) {
    logger.error(
      `Facebook debug_token request threw: ${error instanceof Error ? error.message : String(error)}`,
    );
    reject(AuthProvider.Facebook);
  }

  if (
    !debug?.data?.is_valid ||
    debug.data.app_id !== appId ||
    !debug.data.user_id
  ) {
    logger.warn(
      `Facebook token verification rejected: ${JSON.stringify(debug?.data ?? { reason: 'empty debug_token response' })}`,
    );
    reject(AuthProvider.Facebook);
  }

  let profile: {
    id?: string;
    name?: string;
    email?: string;
    picture?: { data?: { url?: string } };
  } | null;
  try {
    profile = (await getJson(
      `https://graph.facebook.com/v21.0/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(input.token)}`,
      undefined,
      'Facebook profile request',
    )) as typeof profile;
  } catch (error) {
    logger.error(
      `Facebook profile request threw: ${error instanceof Error ? error.message : String(error)}`,
    );
    reject(AuthProvider.Facebook);
  }

  if (!profile?.id) {
    logger.warn('Facebook profile request returned no id');
    reject(AuthProvider.Facebook);
  }

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
