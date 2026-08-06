import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight } from 'react-native-reanimated';

import CircleArrowButton from '@/components/ui/CircleArrowButton';
import CloseButton from '@/components/ui/CloseButton';
import DateOfBirthPicker, { type DateOfBirthPickerRef } from '@/components/ui/DateOfBirthPicker';
import {
  ActivityStep,
  BodyMetricsStep,
  DobSexStep,
  EmailStep,
  GoalsStep,
  NameStep,
  SegmentedProgressBar,
} from '@/components/onboarding';
import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOnboardingStore } from '@/stores/onboarding.store';

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const currentStep = useOnboardingStore((state) => state.currentStep);
  const totalSteps = useOnboardingStore((state) => state.totalSteps);
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
    goToStep('forward', () => {
      if (currentStep < totalSteps) {
        nextStep();
      } else {
        router.push('/auth/verify-email');
      }
    });
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
        return (
          <DobSexStep
            dateOfBirth={userData.dateOfBirth}
            sex={userData.sex}
            onChange={updateUserData}
            onOpenDatePicker={() => dobPickerRef.current?.present()}
          />
        );
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
          <ActivityStep
            activityLevel={userData.activityLevel}
            onChange={updateUserData}
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
        return <EmailStep email={userData.email} onChange={updateUserData} />;
      case 6:
        return <NameStep displayName={userData.displayName} onChange={updateUserData} />;
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

      <SegmentedProgressBar currentStep={currentStep} totalSteps={totalSteps} />

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

      {/* Pinned outside the scroll view so it tracks the keyboard instead of scrolling with content. */}
      <KeyboardStickyView offset={{ closed: 0, opened: Spacing.two }}>
        <View style={styles.buttonContainer}>
          {currentStep > 1 ? (
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.backgroundElement }]}
              onPress={handleBack}>
              <ThemedText type="smallBold" style={styles.backButtonText}>
                Back
              </ThemedText>
            </TouchableOpacity>
          ) : null}

          <CircleArrowButton
            onPress={handleNext}
            disabled={!canContinue}
            accessibilityLabel={currentStep < totalSteps ? 'Continue' : 'Finish'}
            activeColor={Brand.accent}
            inactiveColor={theme.backgroundElement}
          />
        </View>
      </KeyboardStickyView>

      {/* Rendered here, outside the animated/absolute step viewport, so the native
          sheet's auto-height measurement isn't broken by flex/overflow ancestors —
          see https://sheet.lodev09.com/troubleshooting ("Weird Layout Render"). */}
      <DateOfBirthPicker
        ref={dobPickerRef}
        value={userData.dateOfBirth}
        onChange={(isoDate) => updateUserData({ dateOfBirth: isoDate })}
      />
    </SafeAreaView>
  );
}

type OnboardingUserData = ReturnType<typeof useOnboardingStore.getState>['userData'];

function isStepComplete(step: number, userData: OnboardingUserData): boolean {
  switch (step) {
    case 1:
      return (userData.dateOfBirth ?? '').trim() !== '' && userData.sex !== undefined;
    case 2:
      return userData.heightCm !== undefined && userData.weightKg !== undefined;
    case 3:
      return userData.activityLevel !== undefined;
    case 4:
      return (userData.fitnessGoals?.length ?? 0) > 0;
    case 5:
      return userData.email.trim() !== '';
    case 6:
      return userData.displayName.trim() !== '';
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
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
  },
});
