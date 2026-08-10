import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight } from 'react-native-reanimated';

import VerifyEmailSheet, { type VerifyEmailSheetRef } from '@/components/auth/VerifyEmailSheet';
import CircleArrowButton from '@/components/ui/CircleArrowButton';
import CloseButton from '@/components/ui/CloseButton';
import DateOfBirthPicker, { type DateOfBirthPickerRef } from '@/components/ui/DateOfBirthPicker';
import {
  ActivityStep,
  BodyMetricsStep,
  DobStep,
  EmailStep,
  GoalsStep,
  NameStep,
  SegmentedProgressBar,
  SexStep,
} from '@/components/onboarding';
import { Brand, Pressed, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCreateMeasurement, useSendOtp, useUpdateProfile } from '@/queries';
import { selectUser, useAuthStore } from '@/stores/auth.store';
import { useOnboardingStore } from '@/stores/onboarding.store';

const STEPS_WITH_ACCOUNT = 5; // Sex, BodyMetrics, Dob, Goals, Activity — skips Email/Name.

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const currentUser = useAuthStore(selectUser);
  const isLoggedIn = currentUser !== null;
  const currentStep = useOnboardingStore((state) => state.currentStep);
  const totalSteps = useOnboardingStore((state) => state.totalSteps);
  const effectiveTotalSteps = isLoggedIn ? STEPS_WITH_ACCOUNT : totalSteps;
  const userData = useOnboardingStore((state) => state.userData);
  const nextStep = useOnboardingStore((state) => state.nextStep);
  const prevStep = useOnboardingStore((state) => state.prevStep);
  const updateUserData = useOnboardingStore((state) => state.updateUserData);
  const resetOnboarding = useOnboardingStore((state) => state.resetOnboarding);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  // Tracks the incoming step's measured height so the (position: absolute)
  // step frame below has real height to scroll — see stepViewport/stepContent.
  const [stepHeight, setStepHeight] = useState<number | undefined>(undefined);
  const dobPickerRef = useRef<DateOfBirthPickerRef>(null);
  const verifyEmailSheetRef = useRef<VerifyEmailSheetRef>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const sendOtp = useSendOtp();
  const updateProfile = useUpdateProfile();
  const createMeasurement = useCreateMeasurement();
  const isSavingProfile = updateProfile.isPending || createMeasurement.isPending;

  const canContinue = isStepComplete(currentStep, userData);

  // Reanimated bakes the outgoing step's `exiting` animation into its last-rendered
  // props. Changing `direction` and `currentStep` in the same tick (React batches
  // them) means the step being removed still carries the *previous* click's exiting
  // animation — so reversing direction right after would exit and enter on the same
  // side and collide. Committing the direction flip on its own frame first lets the
  // still-mounted current step re-render with the correct exiting animation before
  // the step index changes and actually removes it.
  const goToStep = (nextDirection: 'forward' | 'backward', advance: () => void) => {
    setDirection(nextDirection);
    requestAnimationFrame(advance);
  };

  const handleNext = () => {
    if (currentStep < effectiveTotalSteps) {
      goToStep('forward', nextStep);
      return;
    }

    if (isLoggedIn) {
      if (isSavingProfile) return;
      void finishForLoggedInUser();
      return;
    }

    setEmailError(null);
    sendOtp.mutate(
      { email: userData.email },
      {
        onSuccess: () => verifyEmailSheetRef.current?.present(),
        onError: () => setEmailError('Failed to send verification code. Please try again.'),
      },
    );
  };

  // Already has a verified account — persists the fitness profile collected
  // here directly, instead of the email-OTP path new signups go through.
  const finishForLoggedInUser = async () => {
    try {
      await updateProfile.mutateAsync({
        profile: {
          sex: userData.sex,
          dateOfBirth: userData.dateOfBirth,
          heightCm: userData.heightCm,
          activityLevel: userData.activityLevel,
          fitnessGoals: userData.fitnessGoals,
        },
      });

      if (userData.weightKg != null) {
        await createMeasurement.mutateAsync({
          weightKg: userData.weightKg,
          measurements: {},
          photoUrls: [],
        });
      }

      resetOnboarding();
      router.replace('/');
    } catch (cause) {
      Alert.alert(
        'Could not save your profile',
        cause instanceof Error ? cause.message : 'Please try again.',
      );
    }
  };

  // Step 1 has no Back button — the close button in the top bar exits the flow instead.
  const handleBack = () => {
    goToStep('backward', prevStep);
  };

  const handleClose = () => {
    resetOnboarding();
    router.dismissTo('/auth/welcome');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <SexStep sex={userData.sex} onChange={updateUserData} />;
      case 2:
        return (
          <BodyMetricsStep
            heightCm={userData.heightCm}
            weightKg={userData.weightKg}
            unitSystem={userData.unitSystem ?? 'metric'}
            onChange={updateUserData}
          />
        );
      case 3:
        return (
          <DobStep
            dateOfBirth={userData.dateOfBirth}
            onOpenDatePicker={() => dobPickerRef.current?.present()}
          />
        );
      case 4:
        return (
          <GoalsStep
            fitnessGoals={userData.fitnessGoals}
            onChange={updateUserData}
          />
        );
      case 5:
        return (
          <ActivityStep
            activityLevel={userData.activityLevel}
            onChange={updateUserData}
          />
        );
      case 6:
        return <NameStep displayName={userData.displayName} onChange={updateUserData} />;
      case 7:
        return (
          <EmailStep
            email={userData.email}
            onChange={updateUserData}
            submitError={emailError}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <CloseButton onPress={handleClose} accessibilityLabel="Cancel sign up" />
      </View>

      <SegmentedProgressBar currentStep={currentStep} totalSteps={effectiveTotalSteps} />

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bottomOffset={Spacing.four}>
        {/* relative frame — outgoing/incoming steps overlay it absolutely instead of
            sharing normal flow, so one slides fully off left while the other slides
            in from the right in the same spot, with no stacking/collision between them. */}
        <View style={[styles.stepViewport, { minHeight: stepHeight }]}>
          <Animated.View
            key={currentStep}
            entering={direction === 'forward' ? SlideInRight.duration(280) : SlideInLeft.duration(280)}
            exiting={direction === 'forward' ? SlideOutLeft.duration(280) : SlideOutRight.duration(280)}
            onLayout={(event) => setStepHeight(event.nativeEvent.layout.height)}
            style={styles.content}>
            {renderStep()}
          </Animated.View>
        </View>
      </KeyboardAwareScrollView>

      {/* Kept outside the scroll view but not keyboard-sticky, so it stays fixed at the
          bottom instead of tracking the keyboard up over the input fields. */}
      <View style={styles.buttonContainer}>
        {currentStep > 1 ? (
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: theme.backgroundElement },
              pressed && Pressed,
            ]}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Back">
            <SymbolView
              name="arrow.left"
              size={20}
              weight="semibold"
              tintColor={theme.text}
              fallback={<Text style={[styles.backButtonFallback, { color: theme.text }]}>←</Text>}
            />
          </Pressable>
        ) : null}

        <CircleArrowButton
          onPress={handleNext}
          disabled={!canContinue}
          loading={sendOtp.isPending || isSavingProfile}
          accessibilityLabel={currentStep < effectiveTotalSteps ? 'Continue' : 'Finish'}
          activeColor={Brand.accent}
          inactiveColor={theme.backgroundElement}
        />
      </View>

      {/* Rendered here, outside the animated/absolute step viewport, so the native
          sheet's auto-height measurement isn't broken by flex/overflow ancestors —
          see https://sheet.lodev09.com/troubleshooting ("Weird Layout Render"). */}
      <DateOfBirthPicker
        ref={dobPickerRef}
        value={userData.dateOfBirth}
        onChange={(isoDate) => updateUserData({ dateOfBirth: isoDate })}
      />

      {!isLoggedIn ? <VerifyEmailSheet ref={verifyEmailSheetRef} /> : null}
    </SafeAreaView>
  );
}

type OnboardingUserData = ReturnType<typeof useOnboardingStore.getState>['userData'];

function isStepComplete(step: number, userData: OnboardingUserData): boolean {
  switch (step) {
    case 1:
      return userData.sex !== undefined;
    case 2:
      return userData.heightCm !== undefined && userData.weightKg !== undefined;
    case 3:
      return (userData.dateOfBirth ?? '').trim() !== '';
    case 4:
      return (userData.fitnessGoals?.length ?? 0) > 0;
    case 5:
      return userData.activityLevel !== undefined;
    case 6:
      return userData.displayName.trim() !== '';
    case 7:
      return userData.email.trim() !== '';
    default:
      return false;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
  },
  topBar: {
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
  stepViewport: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'flex-start',
    paddingBottom: Spacing.four,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  backButton: {
    marginRight: 'auto',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonFallback: {
    fontSize: 22,
    fontWeight: '600',
  },
});
