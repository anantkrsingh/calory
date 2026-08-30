import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type ColorValue,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { Brand, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import SocialButton from "@/components/welcome/SocialButton";
import { useSocialLogin } from "@/hooks/use-social-login";
import LoginSheet, { type LoginSheetRef } from "@/components/auth/LoginSheet";

const heroArt = require("../../../assets/images/arts/welcome/main.png");

export default function WelcomeScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const loginSheetRef = useRef<LoginSheetRef>(null);

  const socialLogin = useSocialLogin();

  useEffect(() => {
    if (!socialLogin.error) return;
    Alert.alert("Sign in failed", socialLogin.error, [
      { text: "OK", onPress: socialLogin.clearError },
    ]);
  }, [socialLogin.error, socialLogin.clearError]);

  const isDark = scheme === "dark";
  const heroHeight = Math.round(height * 0.62);

  const fade = (alpha: number): ColorValue =>
    isDark ? `rgba(0, 0, 0, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.hero, { height: heroHeight }]} pointerEvents="none">
        <Image
          source={heroArt}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="center"
          cachePolicy="memory-disk"
          transition={220}
        />

        <View
          style={[
            StyleSheet.absoluteFill,
            {
              experimental_backgroundImage: [
                {
                  type: "linear-gradient",
                  direction: "to bottom",
                  colorStops: [
                    { color: fade(0), positions: ["0%"] },
                    { color: fade(0.06), positions: ["38%"] },
                    { color: fade(0.45), positions: ["62%"] },
                    { color: fade(0.9), positions: ["84%"] },
                    { color: fade(1), positions: ["100%"] },
                  ],
                },
              ],
            },
          ]}
        />
      </View>

      <View
        style={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.four },
        ]}
      >
        <View style={styles.accentRule} />

        <ThemedText family="ubuntu" style={styles.headline}>
          Train hard.{"\n"}Track everything.
        </ThemedText>

        <ThemedText
          fontWeight="regular"
          style={[styles.subhead, { color: theme.textSecondary }]}
        >
          Log every session, watch your numbers move, and stay locked on the
          goals that actually matter.
        </ThemedText>

        <PrimaryButton
          label="Get started"
          onPress={() => router.push("/auth/onboarding")}
          style={[
            styles.getStartedSpacing,
            isDark && { backgroundColor: theme.backgroundElement },
          ]}
        />
        <View style={{ flexDirection: "row" ,justifyContent:"space-evenly",gap:10}}>
          <SocialButton
            onClick={() => void socialLogin.signIn("google")}
            icon={
              <Image
                style={{ width: 28, height: 28 }}
                source={require("@/assets/icons/social/google.svg")}
              />
            }
          />
          <SocialButton
            onClick={() => void socialLogin.signIn("facebook")}
            icon={
              <Image
                style={{ width: 28, height: 28 }}
                source={require("@/assets/icons/social/facebook.svg")}
              />
            }
          />
          <SocialButton
            onClick={() => void socialLogin.signIn("x")}
            icon={
              <Image
                style={{ width: 28, height: 28 }}
                source={require("@/assets/icons/social/x.svg")}
              />
            }
          />
        </View>

        <View style={styles.signInRow}>
          <ThemedText
            fontWeight="regular"
            style={[styles.signInText, { color: theme.textSecondary }]}
          >
            Already have an account?
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => loginSheetRef.current?.present()}
          >
            <ThemedText fontWeight="bold" style={styles.signInLink}>
              Sign In
            </ThemedText>
          </Pressable>
        </View>

        <ThemedText
          fontWeight="regular"
          style={[styles.legal, { color: theme.textSecondary }]}
        >
          By continuing you agree to our{" "}
          <ThemedText fontWeight="medium" style={styles.legalLink}>
            Terms
          </ThemedText>{" "}
          and{" "}
          <ThemedText fontWeight="medium" style={styles.legalLink}>
            Privacy Policy
          </ThemedText>
        </ThemedText>
      </View>

      <LoginSheet ref={loginSheetRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  hero: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  brandRow: {
    position: "absolute",
    left: Spacing.four,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.accent,
  },
  brandMarkText: {
    color: Brand.cream,
    fontSize: 15,
    lineHeight: 19,
  },
  brandName: {
    color: Brand.ink,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.6,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.four,
  },
  accentRule: {
    width: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: Brand.accent,
    marginBottom: Spacing.three,
  },
  headline: {
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.6,
  },
  subhead: {
    marginTop: Spacing.two,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 340,
  },
  featureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  getStartedSpacing: {
    marginTop: Spacing.four,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    height: 56,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.three,
  },
  googleMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  googleMarkText: {
    color: "#4285F4",
    fontSize: 13,
    lineHeight: 17,
  },
  googleButtonText: {
    fontSize: 15,
    lineHeight: 20,
  },
  signInRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: Spacing.four,
  },
  signInText: {
    fontSize: 14,
    lineHeight: 18,
  },
  signInLink: {
    color: Brand.accent,
    fontSize: 14,
    lineHeight: 18,
  },
  legal: {
    marginTop: Spacing.three,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 16,
  },
  legalLink: {
    color: Brand.accent,
    fontSize: 11,
    lineHeight: 16,
    textDecorationLine: "underline",
  },
});
