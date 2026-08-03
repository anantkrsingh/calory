import { forwardRef, memo } from "react";
import {
  Platform,
  Text as RNText,
  StyleSheet,
  type StyleProp,
  type TextProps as RNTextProps,
  type TextStyle,
} from "react-native";

/**
 * `ubuntu` is the UI face, loaded at runtime in the root layout from
 * `@expo-google-fonts/ubuntu`. `lucon` is the single-weight display face, embedded
 * through the expo-font config plugin.
 */
export type FontFamily = "ubuntu" | "lucon";

/** The Ubuntu cuts the package actually ships. */
type UbuntuWeight = "300" | "400" | "500" | "700";

export type FontWeight =
  | "thin"
  | "light"
  | "regular"
  | "normal"
  | "medium"
  | "semibold"
  | "bold"
  | "black"
  | "100"
  | "200"
  | "300"
  | "400"
  | "500"
  | "600"
  | "700"
  | "800"
  | "900";

/**
 * Family name → the exact string `useFonts` registered the asset under. Upright and
 * italic are separate files, so italics are a lookup rather than a synthesised slant.
 */
const UBUNTU_FAMILY: Record<UbuntuWeight, { upright: string; italic: string }> = {
  "300": { upright: "Ubuntu_300Light", italic: "Ubuntu_300Light_Italic" },
  "400": { upright: "Ubuntu_400Regular", italic: "Ubuntu_400Regular_Italic" },
  "500": { upright: "Ubuntu_500Medium", italic: "Ubuntu_500Medium_Italic" },
  "700": { upright: "Ubuntu_700Bold", italic: "Ubuntu_700Bold_Italic" },
};

/** Every accepted weight collapsed onto a shipped cut — 600 and 900 have no file of their own. */
const UBUNTU_WEIGHT: Record<FontWeight, UbuntuWeight> = {
  thin: "300",
  light: "300",
  "100": "300",
  "200": "300",
  "300": "300",
  regular: "400",
  normal: "400",
  "400": "400",
  medium: "500",
  "500": "500",
  semibold: "500",
  "600": "500",
  bold: "700",
  "700": "700",
  "800": "700",
  black: "700",
  "900": "700",
};

/** Lucida Console ships one cut only, so weight requests are ignored for it by design. */
const LUCON_FAMILY =
  Platform.select({ ios: "LucidaConsole", android: "lucon", default: "lucon" }) ??
  "lucon";

export function resolveFontFamily(
  family: FontFamily,
  fontWeight: FontWeight,
  isItalic: boolean,
): string {
  if (family === "lucon") {
    return LUCON_FAMILY;
  }

  const cut = UBUNTU_FAMILY[UBUNTU_WEIGHT[fontWeight] ?? "400"];

  return isItalic ? cut.italic : cut.upright;
}

export type TextProps = RNTextProps & {
  style?: StyleProp<TextStyle>;
  family?: FontFamily;
  isItalic?: boolean;
  fontWeight?: FontWeight;
};

const Text = memo(
  forwardRef<RNText, TextProps>(function Text(
    { style, family = "ubuntu", isItalic = false, fontWeight, ...props },
    ref,
  ) {
    // A `fontWeight` left in a style sheet still selects the right cut, so existing styles work.
    const { fontWeight: styleWeight, ...rest } = StyleSheet.flatten(style) ?? {};
    const weight = (fontWeight ?? styleWeight ?? "regular") as FontWeight;

    // `fontWeight` is deliberately dropped from the node: the weight lives in the file, and
    // leaving it on would make the platform synthesise a second layer of boldness on top.
    return (
      <RNText
        ref={ref}
        style={[
          { fontFamily: resolveFontFamily(family, weight, isItalic) },
          rest,
        ]}
        {...props}
      />
    );
  }),
);

Text.displayName = "Text";

export { Text };
