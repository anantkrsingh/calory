import { useRouter } from 'expo-router';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

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

  const canContinue = isStepComplete(currentStep, userData);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      nextStep();
    } else {
      router.push('/auth/verify-email');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      prevStep();
    } else {
      resetOnboarding();
      router.push('/auth/welcome');
    }
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
          </View>
          <ThemedText type="small">
            Step {currentStep} of {totalSteps}
          </ThemedText>
        </View>

        <View style={styles.content}>
          {renderStep()}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.backgroundElement }]}
            onPress={handleBack}>
            <ThemedText type="smallBold" style={styles.backButtonText}>
              {currentStep > 1 ? 'Back' : 'Cancel'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.nextButton,
              { 
                backgroundColor: canContinue ? '#208AEF' : theme.backgroundElement,
                opacity: canContinue ? 1 : 0.5,
              },
            ]}
            onPress={handleNext}
            disabled={!canContinue}>
            <ThemedText type="smallBold" style={styles.nextButtonText}>
              {currentStep < totalSteps ? 'Continue' : 'Finish'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  progressContainer: {
    width: '100%',
    marginBottom: Spacing.four,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  backButton: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
  },
  nextButton: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 14,
  },
});
