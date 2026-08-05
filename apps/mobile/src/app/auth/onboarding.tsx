import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight } from 'react-native-reanimated';

import CircleArrowButton from '@/components/ui/CircleArrowButton';
import CloseButton from '@/components/ui/CloseButton';
import {
  ActivityStep,
  BodyMetricsStep,
  DobSexStep,
  EmailStep,
  GoalsStep,
  NameStep,
} from '@/components/onboarding';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
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

  const canContinue = isStepComplete(currentStep, userData);

  const handleNext = () => {
    setDirection('forward');

    if (currentStep < totalSteps) {
      nextStep();
    } else {
      router.push('/auth/verify-email');
    }
  };

  // Step 1 has no Back button — the close button in the top bar exits the flow instead.
  const handleBack = () => {
    setDirection('backward');
    prevStep();
  };

  const handleClose = () => {
    resetOnboarding();
    router.dismissTo('/auth/welcome');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <EmailStep email={userData.email} onChange={updateUserData} />;
      case 2:
        return <NameStep displayName={userData.displayName} onChange={updateUserData} />;
      case 3:
        return (
          <DobSexStep
            dateOfBirth={userData.dateOfBirth}
            sex={userData.sex}
            onChange={updateUserData}
          />
        );
      case 4:
        return (
          <BodyMetricsStep
            heightCm={userData.heightCm}
            weightKg={userData.weightKg}
            unitSystem={userData.unitSystem ?? 'metric'}
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
        return (
          <GoalsStep
            fitnessGoals={userData.fitnessGoals}
            onChange={updateUserData}
          />
        );
      default:
        return null;
    }
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <CloseButton onPress={handleClose} accessibilityLabel="Cancel sign up" />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
        </View>
        <ThemedText type="small" style={styles.progressLabel}>
          Step {currentStep} of {totalSteps}
        </ThemedText>
      </View>

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bottomOffset={Spacing.four}>
        <Animated.View
          key={currentStep}
          entering={direction === 'forward' ? SlideInRight.duration(260) : SlideInLeft.duration(260)}
          exiting={direction === 'forward' ? SlideOutLeft.duration(260) : SlideOutRight.duration(260)}
          style={styles.content}>
          {renderStep()}
        </Animated.View>
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
            activeColor="#208AEF"
            inactiveColor={theme.backgroundElement}
          />
        </View>
      </KeyboardStickyView>
    </SafeAreaView>
  );
}

type OnboardingUserData = ReturnType<typeof useOnboardingStore.getState>['userData'];

function isStepComplete(step: number, userData: OnboardingUserData): boolean {
  switch (step) {
    case 1:
      return userData.email.trim() !== '';
    case 2:
      return userData.displayName.trim() !== '';
    case 3:
      return (userData.dateOfBirth ?? '').trim() !== '' && userData.sex !== undefined;
    case 4:
      return userData.heightCm !== undefined && userData.weightKg !== undefined;
    case 5:
      return userData.activityLevel !== undefined;
    case 6:
      return (userData.fitnessGoals?.length ?? 0) > 0;
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
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
  },
  progressLabel: {
    textAlign: 'left',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.two,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#208AEF',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
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
