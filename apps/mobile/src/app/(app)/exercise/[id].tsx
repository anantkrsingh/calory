import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { Dumbbell } from "lucide-react-native";
import type { ReactNode } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getErrorMessage, isApiError } from "@/api/errors";
import { ScreenAppBar } from "@/components/screen-app-bar";
import { TabScreen } from "@/components/tab-screen";
import { ThemedText } from "@/components/themed-text";
import RetryButton from "@/components/ui/RetryButton";
import { Brand, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { muscleGroupLabel } from "@/lib/muscle-groups";
import { useExercise } from "@/queries/exercises.queries";

const HAIRLINE = StyleSheet.hairlineWidth || 1;

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function ExerciseDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const {
    data: exercise,
    isLoading,
    isError,
    error,
    refetch,
  } = useExercise(id);

  return (
    <TabScreen
      appBar={false}
      header={<ScreenAppBar title={exercise?.name ?? "Exercise"} />}
      contentStyle={styles.content}
    >
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Brand.accent} />
        </View>
      ) : null}

      {isError ? (
        <View style={styles.centered}>
          <ThemedText fontWeight="700" style={styles.stateTitle}>
            Couldn’t load exercise
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.stateBody}>
            {isApiError(error)
              ? error.message
              : getErrorMessage(error, "Check your connection and try again.")}
          </ThemedText>
          <RetryButton
            onPress={() => void refetch()}
            style={styles.stateButton}
          />
        </View>
      ) : null}

      {!isLoading && !isError && exercise ? (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: Spacing.four + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.thumbWrap,
              { backgroundColor: theme.backgroundElement },
            ]}
          >
            {exercise.thumbnail ? (
              <Image
                source={{ uri: exercise.thumbnail }}
                style={styles.thumb}
                contentFit="contain"
                transition={150}
              />
            ) : (
              <Dumbbell
                color={theme.textSecondary}
                size={40}
                strokeWidth={1.5}
              />
            )}
          </View>

          <View style={styles.titleBlock}>
            <ThemedText fontWeight="700" style={styles.name}>
              {exercise.name}
            </ThemedText>
            {exercise.instructions ? (
              <ThemedText
                themeColor="textSecondary"
                fontWeight="400"
                style={styles.instructions}>
                {exercise.instructions}
              </ThemedText>
            ) : null}
          </View>

          <View style={styles.badgeRow}>
            <Badge label={capitalize(exercise.category)} />
            <Badge label={capitalize(exercise.equipment)} />
          </View>

          {exercise.images.length > 0 ? (
            <Section title="Gallery">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.galleryScroll}
                contentContainerStyle={styles.galleryRow}
              >
                {exercise.images.map((uri, index) => (
                  <View
                    key={`${uri}-${index}`}
                    style={[
                      styles.galleryItem,
                      { backgroundColor: theme.backgroundElement },
                    ]}
                  >
                    <Image
                      source={{ uri }}
                      style={styles.galleryImage}
                      contentFit="cover"
                      transition={150}
                    />
                  </View>
                ))}
              </ScrollView>
            </Section>
          ) : null}

          <Section title="Primary muscles">
            <View style={styles.badgeRow}>
              {exercise.primaryMuscles.map((muscle) => (
                <Badge key={muscle} label={muscleGroupLabel(muscle)} emphasis />
              ))}
            </View>
          </Section>

          {exercise.secondaryMuscles.length > 0 ? (
            <Section title="Secondary muscles">
              <View style={styles.badgeRow}>
                {exercise.secondaryMuscles.map((muscle) => (
                  <Badge key={muscle} label={muscleGroupLabel(muscle)} />
                ))}
              </View>
            </Section>
          ) : null}

          {exercise.instructionSteps.length > 0 ? (
            <Section title="Steps">
              <View style={styles.stepsList}>
                {exercise.instructionSteps.map((step, index) => (
                  <View key={step.id} style={styles.step}>
                    <View
                      style={[
                        styles.stepBadge,
                        { backgroundColor: "rgba(239, 90, 36, 0.12)" },
                      ]}
                    >
                      <ThemedText
                        fontWeight="700"
                        style={[styles.stepBadgeLabel, { color: Brand.accent }]}
                      >
                        {index + 1}
                      </ThemedText>
                    </View>
                    <View style={styles.stepBody}>
                      <ThemedText style={styles.stepText}>
                        {step.text}
                      </ThemedText>
                      {step.image ? (
                        <View
                          style={[
                            styles.stepImageWrap,
                            // { backgroundColor: theme.backgroundElement },
                          ]}
                        >
                          <Image
                            source={{ uri: step.image }}
                            style={styles.stepImage}
                            contentFit="contain"
                            transition={150}
                          />
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            </Section>
          ) : null}
        </ScrollView>
      ) : null}
    </TabScreen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText fontWeight="700" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

function Badge({
  label,
  emphasis = false,
}: {
  label: string;
  emphasis?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: emphasis
            ? "rgba(239, 90, 36, 0.12)"
            : theme.backgroundElement,
          borderColor: emphasis ? Brand.accent : theme.border,
        },
      ]}
    >
      <ThemedText
        fontWeight="700"
        style={[styles.badgeLabel, emphasis && { color: Brand.accent }]}
      >
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
  },
  scroll: {
    gap: Spacing.four,
    padding: Spacing.four,
  },
  titleBlock: {
    gap: Spacing.one,
  },
  thumbWrap: {
    alignItems: "center",
    aspectRatio: 16 / 10,
    borderCurve: "continuous",
    borderRadius: 20,
    justifyContent: "center",
    overflow: "hidden",
    width: "100%",
  },
  thumb: {
    height: "100%",
    width: "100%",
  },
  name: {
    fontSize: 24,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  galleryScroll: {
    marginHorizontal: -Spacing.four,
  },
  galleryRow: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  galleryItem: {
    borderCurve: "continuous",
    borderRadius: 16,
    height: 140,
    overflow: "hidden",
    width: 200,
  },
  galleryImage: {
    height: "100%",
    width: "100%",
  },
  stepsList: {
    gap: Spacing.three,
  },
  step: {
    flexDirection: "row",
    gap: Spacing.three,
  },
  stepBadge: {
    alignItems: "center",
    borderRadius: 13,
    height: 26,
    justifyContent: "center",
    marginTop: 2,
    width: 26,
  },
  stepBadgeLabel: {
    fontSize: 13,
    lineHeight: 16,
  },
  stepBody: {
    flex: 1,
    gap: Spacing.two,
  },
  stepText: {
    fontSize: 15,
    lineHeight: 22,
  },
  stepImageWrap: {
    alignItems: "center",
    aspectRatio: 16 / 9,
    borderCurve: "continuous",
    borderRadius: 14,
    justifyContent: "center",
    overflow: "hidden",
    width: "100%",
  },
  stepImage: {
    height: "100%",
    width: "100%",
    borderRadius: 14,
  },
  badge: {
    borderCurve: "continuous",
    borderRadius: 999,
    borderWidth: HAIRLINE,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
  },
  badgeLabel: {
    fontSize: 13,
    lineHeight: 16,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  instructions: {
    fontSize: 15,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    gap: Spacing.three,
    justifyContent: "center",
    padding: Spacing.four,
  },
  stateTitle: {
    fontSize: 20,
    lineHeight: 26,
    textAlign: "center",
  },
  stateBody: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  stateButton: {
    marginTop: Spacing.two,
  },
});
