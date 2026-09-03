import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { getErrorMessage } from '@/api/errors';
import { ThemedText } from '@/components/themed-text';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { usersService } from '@/services/users.service';

export type DeleteAccountSheetRef = {
  present: () => void;
};

type DeleteAccountSheetProps = {
  /** Called once the account is actually scheduled for deletion — the
   * screen should sign the user out right after this fires. */
  onDeleted: () => void;
};

const HANDLE_COLOR = 'rgba(120, 120, 128, 0.3)';

// Mirrors `ACCOUNT_DELETION_GRACE_DAYS` in `apps/api/src/users/users.service.ts`
// — this text describes the policy, not a value the server returns before the
// deletion is actually requested, so it's kept in sync by hand.
const GRACE_PERIOD_DAYS = 30;

const DETAILS = [
  "You'll be signed out immediately.",
  `Your account and data stay untouched for ${GRACE_PERIOD_DAYS} days, then they're permanently deleted.`,
  'Log back in any time before then and the deletion is cancelled — your account picks up right where it left off.',
];

export const DeleteAccountSheet = forwardRef<
  DeleteAccountSheetRef,
  DeleteAccountSheetProps
>(function DeleteAccountSheet({ onDeleted }, ref) {
  const theme = useTheme();
  const sheetRef = useRef<TrueSheet>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    present: () => {
      setIsDeleting(false);
      setError(null);
      sheetRef.current?.present();
    },
  }));

  const handleCancel = () => {
    void sheetRef.current?.dismiss();
  };

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await usersService.requestDeletion();
      await sheetRef.current?.dismiss();
      onDeleted();
    } catch (err) {
      setError(
        getErrorMessage(err, 'Could not delete your account. Please try again.'),
      );
      setIsDeleting(false);
    }
  };

  return (
    <TrueSheet
      ref={sheetRef}
      detents={['auto']}
      dimmed
      dimmedDetentIndex={0}
      backgroundColor="transparent"
      cornerRadius={0}
      grabber={false}>
      <ScrollView
        contentContainerStyle={styles.sheetPadding}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <View style={styles.handle} />

          <ThemedText type="subtitle" style={styles.title}>
            Delete Account
          </ThemedText>

          <View style={styles.details}>
            {DETAILS.map((line) => (
              <View key={line} style={styles.detailRow}>
                <View style={[styles.bullet, { backgroundColor: theme.textSecondary }]} />
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  style={styles.detailText}>
                  {line}
                </ThemedText>
              </View>
            ))}
          </View>

          {error ? (
            <ThemedText type="small" style={styles.errorText}>
              {error}
            </ThemedText>
          ) : null}

          <PrimaryButton
            label={isDeleting ? 'Deleting…' : 'Delete Account'}
            tone="danger"
            onPress={() => void handleConfirm()}
            disabled={isDeleting}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={handleCancel}
            disabled={isDeleting}
            hitSlop={8}
            style={({ pressed }) => [styles.cancelButton, pressed && Pressed]}>
            <ThemedText type="small" fontWeight="600" themeColor="textSecondary">
              Cancel
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </TrueSheet>
  );
});

const styles = StyleSheet.create({
  sheetPadding: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  card: {
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: Spacing.four,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: HANDLE_COLOR,
    marginBottom: Spacing.three,
  },
  title: {
    textAlign: 'left',
    marginBottom: Spacing.three,
  },
  details: {
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  detailRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 8,
  },
  detailText: {
    flex: 1,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    textAlign: 'left',
    marginBottom: Spacing.three,
  },
  cancelButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.three,
  },
});
