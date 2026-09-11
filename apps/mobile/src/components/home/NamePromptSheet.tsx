import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { NameStep } from "@/components/onboarding";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useUpdateProfile } from "@/queries/users.queries";

export type NamePromptSheetRef = {
  present: () => void;
};

/**
 * A one-field sheet for the name a social sign-in didn't share (Apple never
 * does). Presented from the home screen whenever `profile.displayName` is
 * still blank — see `index.tsx`.
 */
export const NamePromptSheet = forwardRef<NamePromptSheetRef>(function NamePromptSheet(
  _props,
  ref,
) {
  const theme = useTheme();
  const sheetRef = useRef<TrueSheet>(null);
  const [displayName, setDisplayName] = useState("");
  const updateProfile = useUpdateProfile();

  useImperativeHandle(ref, () => ({
    present: () => {
      setDisplayName("");
      sheetRef.current?.present();
    },
  }));

  const canSave = displayName.trim() !== "" && !updateProfile.isPending;

  const handleSave = async () => {
    if (!canSave) return;

    try {
      await updateProfile.mutateAsync({
        profile: { displayName: displayName.trim() },
      });
      await sheetRef.current?.dismiss();
    } catch (cause) {
      Alert.alert(
        "Could not save your name",
        cause instanceof Error ? cause.message : "Please try again.",
      );
    }
  };

  return (
    <TrueSheet
      ref={sheetRef}
      detents={["auto"]}
      dimmed
      dimmedDetentIndex={0}
      backgroundColor="transparent"
      cornerRadius={0}
      grabber={false}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sheetPadding}>
            <View style={[styles.card, { backgroundColor: theme.background }]}>
              <View style={styles.handle} />

              <NameStep
                displayName={displayName}
                onChange={(data) => setDisplayName(data.displayName)}
              />

              <PrimaryButton
                label={updateProfile.isPending ? "Saving..." : "Save"}
                onPress={() => void handleSave()}
                disabled={!canSave}
                style={styles.button}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TrueSheet>
  );
});

const styles = StyleSheet.create({
  sheetPadding: {
    paddingHorizontal: Spacing.four,
  },
  card: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(120, 120, 128, 0.3)",
    marginBottom: Spacing.four,
  },
  button: {
    marginTop: Spacing.two,
  },
});
