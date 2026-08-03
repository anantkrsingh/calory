import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOnboardingStore } from '@/stores/onboarding.store';

// Step components
import EmailStep from '@/components/onboarding/EmailStep';
import NameStep from '@/components/onboarding/NameStep';
import DobSexStep from '@/components/onboarding/DobSexStep';
import BodyMetricsStep from '@/components/onboarding/BodyMetricsStep';
import ActivityStep from '@/components/onboarding/ActivityStep';
import GoalsStep from '@/components/onboarding/GoalsStep';

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    currentStep,
    userData,
    nextStep,
    prevStep,
    updateUserData,
    resetOnboarding,
  } = useOnboardingStore();

  const [canContinue, setCanContinue] = useState(false);

  // Check if current step data is valid
  useEffect(() => {
    switch (currentStep) {
      case 1: // Email
        setCanContinue(userData.email.trim() !== '');
        break;
      case 2: // Name
        setCanContinue(userData.displayName.trim() !== '');
        break;
      case 3: // DOB and Sex
        setCanContinue(userData.dateOfBirth !== '' && userData.sex !== undefined);
        break;
      case 4: // Body Metrics
        setCanContinue(
          userData.heightCm !== undefined && userData.weightKg !== undefined
        );
        break;
      case 5: // Activity Level
        setCanContinue(userData.activityLevel !== undefined);
        break;
      case 6: // Goals
        setCanContinue(userData.fitnessGoals !== undefined && userData.fitnessGoals.length > 0);
        break;
      default:
        setCanContinue(false);
    }
  }, [currentStep, userData]);

  const handleNext = () => {
    if (currentStep < 6) {
      nextStep();
    } else {
      // All steps completed, navigate to verification
      router.push('/auth/verify-email');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      prevStep();
    } else {
      // Go back to welcome screen
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

  const progressPercentage = ((currentStep - 1) / 5) * 100;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
          </View>
          <ThemedText type="small">
            Step {currentStep} of 6
          </ThemedText>
        </View>

        {/* Step Content */}
        <View style={styles.content}>
          {renderStep()}
        </View>

        {/* Navigation Buttons */}
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
              {currentStep < 6 ? 'Continue' : 'Finish'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
    transition: 'width 0.3s ease',
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
