import type { AuthProvider } from "@fitness/types";
import type { SocialLoginInput } from "@fitness/validation";
import {
  AuthRequest,
  CodeChallengeMethod,
  ResponseType,
  makeRedirectUri,
  type AuthRequestConfig,
  type DiscoveryDocument,
} from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export class SocialAuthCancelledError extends Error {
  constructor() {
    super("Sign-in was cancelled");
    this.name = "SocialAuthCancelledError";
  }
}

export class SocialAuthUnavailableError extends Error {
  constructor(provider: AuthProvider) {
    super(`${provider} sign-in is not configured in this build`);
    this.name = "SocialAuthUnavailableError";
  }
}

const X_DISCOVERY: DiscoveryDocument = {
  authorizationEndpoint: "https://x.com/i/oauth2/authorize",
  tokenEndpoint: "https://api.x.com/2/oauth2/token",
};

const CLIENT_IDS: Record<AuthProvider, string | undefined> = {
  google: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  facebook: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
  x: process.env.EXPO_PUBLIC_X_CLIENT_ID,
  // Sign in with Apple needs no client id here — it's tied to the app's
  // bundle id via the native entitlement, not a configured OAuth client.
  apple: undefined,
};

const redirectUri = (): string => makeRedirectUri({ scheme: "mobile" });

function clientId(provider: AuthProvider): string {
  const id = CLIENT_IDS[provider];
  if (!id) throw new SocialAuthUnavailableError(provider);
  return id;
}

export async function authorizeGoogle(): Promise<SocialLoginInput> {
  const { GoogleSignin, isCancelledResponse, isSuccessResponse } =
    await import("@react-native-google-signin/google-signin");

  GoogleSignin.configure({
    webClientId: clientId("google"),
    scopes: ["profile", "email"],
  });

  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();

  if (isCancelledResponse(response)) throw new SocialAuthCancelledError();

  if (!isSuccessResponse(response)) {
    throw new Error(
      `Google sign-in did not complete: ${JSON.stringify(response)}`,
    );
  }

  const idToken = response.data.idToken;
  if (!idToken) throw new SocialAuthUnavailableError("google");

  return { token: idToken };
}

export async function authorizeFacebook(): Promise<SocialLoginInput> {
  const appId = clientId("facebook");

  const { AccessToken, LoginManager, Settings } =
    await import("react-native-fbsdk-next");

  Settings.setAppID(appId);
  Settings.initializeSDK();

  const result = await LoginManager.logInWithPermissions([
    "public_profile",
    "email",
  ]);

  if (result.isCancelled) throw new SocialAuthCancelledError();

  const token = await AccessToken.getCurrentAccessToken();
  if (!token) throw new SocialAuthCancelledError();

  return { token: token.accessToken };
}

export async function authorizeX(): Promise<SocialLoginInput> {
  const uri = redirectUri();

  const request = new AuthRequest({
    clientId: clientId("x"),
    redirectUri: uri,
    responseType: ResponseType.Code,
    scopes: ["users.read", "tweet.read", "offline.access"],
    codeChallengeMethod: CodeChallengeMethod.S256,
  } satisfies AuthRequestConfig);

  const result = await request.promptAsync(X_DISCOVERY);

  if (result.type !== "success") throw new SocialAuthCancelledError();

  const code = result.params.code;
  if (!code || !request.codeVerifier) throw new SocialAuthCancelledError();

  return { token: code, redirectUri: uri, codeVerifier: request.codeVerifier };
}

export async function authorizeApple(): Promise<SocialLoginInput> {
  if (Platform.OS !== "ios") throw new SocialAuthUnavailableError("apple");

  const AppleAuthentication = await import("expo-apple-authentication");

  if (!(await AppleAuthentication.isAvailableAsync())) {
    throw new SocialAuthUnavailableError("apple");
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) throw new SocialAuthUnavailableError("apple");

    return { token: credential.identityToken };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ERR_REQUEST_CANCELED"
    ) {
      throw new SocialAuthCancelledError();
    }
    throw error;
  }
}

export const SOCIAL_AUTHORIZERS: Record<
  AuthProvider,
  () => Promise<SocialLoginInput>
> = {
  google: authorizeGoogle,
  facebook: authorizeFacebook,
  x: authorizeX,
  apple: authorizeApple,
};
