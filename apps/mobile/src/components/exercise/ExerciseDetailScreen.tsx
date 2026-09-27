import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Award,
  Calendar,
  ChevronRight,
  Crown,
  Dumbbell,
  Heart,
  History,
  Sparkles,
  Timer,
  Trophy,
  Zap,
} from "lucide-react-native";
import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getErrorMessage } from "@/api/errors";
import { ScreenAppBar } from "@/components/screen-app-bar";
import { TabScreen } from "@/components/tab-screen";
import { ThemedText } from "@/components/themed-text";
import RetryButton from "@/components/ui/RetryButton";
import { BottomTabInset, Brand, Pressed, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { muscleGroupLabel } from "@/lib/muscle-groups";
import {
  useExercise,
  useExerciseRepsHistory,
  useToggleExerciseFavorite,
} from "@/queries/exercises.queries";

import { StartStopButton } from "./StartStopButton";

const HAIRLINE = StyleSheet.hairlineWidth || 1;
// Keeps the last bit of scroll content clear of the floating Start button.
const START_BUTTON_CLEARANCE = 76;

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (now.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) /
      (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatDuration(seconds?: number): string | null {
  if (!seconds || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s > 0 ? `${s}s` : ""}`;
}

export function ExerciseDetailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [activeTab, setActiveTab] = useState<"guide" | "history">("guide");

  const {
    data: exercise,
    isLoading,
    isError,
    error,
    refetch,
  } = useExercise(id);
  const {
    data: repsHistory,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useExerciseRepsHistory(id);

  const toggleFavorite = useToggleExerciseFavorite();

  const totalSetsCount = repsHistory?.totalSets ?? 0;

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
            {getErrorMessage(error, "Check your connection and try again.")}
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
            { paddingBottom: Spacing.four + insets.bottom + START_BUTTON_CLEARANCE },
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
            <View style={styles.titleRow}>
              <ThemedText fontWeight="700" style={styles.name}>
                {exercise.name}
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  exercise.isFavorite
                    ? "Remove from favourites"
                    : "Add to favourites"
                }
                accessibilityState={{ selected: exercise.isFavorite }}
                hitSlop={8}
                disabled={toggleFavorite.isPending}
                onPress={() => toggleFavorite.mutate(exercise)}
                style={({ pressed }) => [
                  styles.favoriteButton,
                  pressed && Pressed,
                ]}>
                {toggleFavorite.isPending ? (
                  <ActivityIndicator
                    color={exercise.isFavorite ? Brand.accent : theme.textSecondary}
                    size="small"
                  />
                ) : (
                  <Heart
                    color={exercise.isFavorite ? Brand.accent : theme.textSecondary}
                    fill={exercise.isFavorite ? Brand.accent : "transparent"}
                    size={22}
                    strokeWidth={2}
                  />
                )}
              </Pressable>
            </View>
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

          {/* Segmented Control Tabs */}
          <View
            style={[
              styles.tabSelector,
              { backgroundColor: theme.backgroundElement },
            ]}>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "guide" }}
              onPress={() => setActiveTab("guide")}
              style={[
                styles.tabOption,
                activeTab === "guide" && [
                  styles.tabOptionActive,
                  { backgroundColor: theme.surface },
                ],
              ]}>
              <ThemedText
                fontWeight={activeTab === "guide" ? "700" : "500"}
                style={[
                  styles.tabText,
                  activeTab === "guide" && { color: Brand.accent },
                ]}>
                Guide & Steps
              </ThemedText>
            </Pressable>

            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "history" }}
              onPress={() => setActiveTab("history")}
              style={[
                styles.tabOption,
                activeTab === "history" && [
                  styles.tabOptionActive,
                  { backgroundColor: theme.surface },
                ],
              ]}>
              <View style={styles.tabOptionWithBadge}>
                <ThemedText
                  fontWeight={activeTab === "history" ? "700" : "500"}
                  style={[
                    styles.tabText,
                    activeTab === "history" && { color: Brand.accent },
                  ]}>
                  Reps History
                </ThemedText>
                {totalSetsCount > 0 ? (
                  <View
                    style={[
                      styles.tabCountBadge,
                      { backgroundColor: Brand.accent },
                    ]}>
                    <ThemedText style={styles.tabCountText}>
                      {totalSetsCount}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            </Pressable>
          </View>

          {/* Tab Content: Guide */}
          {activeTab === "guide" ? (
            <>
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
                            <View style={styles.stepImageWrap}>
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
            </>
          ) : (
            /* Tab Content: Reps History */
            <View style={styles.historyContainer}>
              {/* Highlights & Personal Records Card */}
              {repsHistory?.personalRecord ? (
                <View
                  style={[
                    styles.recordsCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}>
                  <View style={styles.recordsHeader}>
                    <Trophy size={18} color={Brand.accent} />
                    <ThemedText fontWeight="700" style={styles.recordsTitle}>
                      Personal Records & Best Sets
                    </ThemedText>
                  </View>

                  <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                      <ThemedText themeColor="textSecondary" style={styles.statLabel}>
                        Max Weight
                      </ThemedText>
                      <ThemedText fontWeight="700" style={styles.statValue}>
                        {repsHistory.personalRecord.bestWeightKg != null
                          ? `${repsHistory.personalRecord.bestWeightKg} kg`
                          : "—"}
                      </ThemedText>
                    </View>

                    <View style={styles.statBox}>
                      <ThemedText themeColor="textSecondary" style={styles.statLabel}>
                        Max Reps
                      </ThemedText>
                      <ThemedText fontWeight="700" style={styles.statValue}>
                        {repsHistory.personalRecord.bestReps != null
                          ? `${repsHistory.personalRecord.bestReps}`
                          : "—"}
                      </ThemedText>
                    </View>

                    <View style={styles.statBox}>
                      <ThemedText themeColor="textSecondary" style={styles.statLabel}>
                        Est. 1RM
                      </ThemedText>
                      <ThemedText fontWeight="700" style={styles.statValue}>
                        {repsHistory.personalRecord.bestEstimatedOneRepMaxKg != null
                          ? `${repsHistory.personalRecord.bestEstimatedOneRepMaxKg} kg`
                          : "—"}
                      </ThemedText>
                    </View>

                    <View style={styles.statBox}>
                      <ThemedText themeColor="textSecondary" style={styles.statLabel}>
                        Total Sets
                      </ThemedText>
                      <ThemedText fontWeight="700" style={styles.statValue}>
                        {repsHistory.totalSets}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              ) : null}

              {/* Plan Limitation Banner */}
              {repsHistory?.isLimitedByPlan ? (
                <Pressable
                  onPress={() => router.push("/premium")}
                  style={[
                    styles.planLimitBanner,
                    { backgroundColor: "rgba(239, 90, 36, 0.08)" },
                  ]}>
                  <Crown size={18} color={Brand.accent} />
                  <View style={styles.planLimitText}>
                    <ThemedText fontWeight="700" style={styles.planLimitTitle}>
                      Showing past {repsHistory.historyLimitDays} days of reps history
                    </ThemedText>
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      style={styles.planLimitSubtitle}>
                      Upgrade to Calory Pro for lifetime history & PR analytics
                    </ThemedText>
                  </View>
                  <ChevronRight size={18} color={Brand.accent} />
                </Pressable>
              ) : null}

              {/* Sessions List */}
              {isLoadingHistory ? (
                <View style={styles.historyLoading}>
                  <ActivityIndicator color={Brand.accent} />
                  <ThemedText themeColor="textSecondary" style={styles.loadingText}>
                    Loading reps history…
                  </ThemedText>
                </View>
              ) : repsHistory && repsHistory.sessions.length > 0 ? (
                <View style={styles.sessionsList}>
                  {repsHistory.sessions.map((session) => (
                    <View
                      key={session.workoutId}
                      style={[
                        styles.sessionCard,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ]}>
                      <View style={styles.sessionHeader}>
                        <View style={styles.sessionDateRow}>
                          <Calendar size={14} color={Brand.accent} />
                          <ThemedText fontWeight="700" style={styles.sessionDate}>
                            {formatDate(session.date)}
                          </ThemedText>
                          <ThemedText themeColor="textSecondary" style={styles.sessionWorkoutName}>
                            · {session.workoutName}
                          </ThemedText>
                        </View>
                        {formatDuration(session.durationSec) ? (
                          <View style={styles.sessionDuration}>
                            <Timer size={12} color={theme.textSecondary} />
                            <ThemedText type="small" themeColor="textSecondary">
                              {formatDuration(session.durationSec)}
                            </ThemedText>
                          </View>
                        ) : null}
                      </View>

                      {/* Sets list */}
                      <View style={styles.setsTable}>
                        {session.sets.map((set, sIdx) => (
                          <View
                            key={set.setId}
                            style={[
                              styles.setRow,
                              sIdx > 0 && {
                                borderTopWidth: HAIRLINE,
                                borderTopColor: theme.border,
                              },
                            ]}>
                            <View style={styles.setNumberCol}>
                              <ThemedText
                                fontWeight="600"
                                style={styles.setNumber}>
                                Set {sIdx + 1}
                              </ThemedText>
                              {set.type !== "working" ? (
                                <ThemedText
                                  type="small"
                                  themeColor="textSecondary"
                                  style={styles.setType}>
                                  {set.type}
                                </ThemedText>
                              ) : null}
                            </View>

                            <View style={styles.setDetailsCol}>
                              <ThemedText fontWeight="700" style={styles.setMetrics}>
                                {set.reps != null ? `${set.reps} reps` : ""}
                                {set.weightKg != null
                                  ? `${set.reps != null ? " @ " : ""}${set.weightKg} kg`
                                  : ""}
                                {set.distanceM != null
                                  ? ` · ${set.distanceM} m`
                                  : ""}
                              </ThemedText>

                              {set.volumeKg != null || set.estimatedOneRepMaxKg != null ? (
                                <ThemedText
                                  type="small"
                                  themeColor="textSecondary"
                                  style={styles.setSubMetrics}>
                                  {set.volumeKg != null ? `Vol: ${set.volumeKg} kg` : ""}
                                  {set.estimatedOneRepMaxKg != null
                                    ? ` · Est. 1RM: ${set.estimatedOneRepMaxKg} kg`
                                    : ""}
                                </ThemedText>
                              ) : null}
                            </View>

                            {set.isPersonalRecord ? (
                              <View style={styles.prBadge}>
                                <Trophy size={11} color="#B45309" />
                                <ThemedText style={styles.prBadgeText}>PR</ThemedText>
                              </View>
                            ) : null}
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyHistory}>
                  <View
                    style={[
                      styles.emptyIconWrap,
                      { backgroundColor: theme.backgroundElement },
                    ]}>
                    <History size={36} color={theme.textSecondary} />
                  </View>
                  <ThemedText fontWeight="700" style={styles.emptyTitle}>
                    No reps logged yet
                  </ThemedText>
                  <ThemedText
                    themeColor="textSecondary"
                    style={styles.emptySubtitle}>
                    Press Start below to record your reps, weight, and track your
                    strength progression!
                  </ThemedText>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      ) : null}

      {!isLoading && !isError && exercise ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.startButtonWrap,
            // Matches GlobalTimerBar's own offset exactly — this screen has
            // no tab bar to clear, but pressing Start hands off to that
            // globally-mounted bar, and if the two sat at different heights
            // the button would visibly jump the moment it does.
            { bottom: insets.bottom + BottomTabInset + Spacing.three },
          ]}
        >
          <StartStopButton exercise={exercise} />
        </View>
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
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.two,
  },
  favoriteButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32,
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
    flex: 1,
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
  // Not centered — StartStopButton right-aligns itself and grows leftward,
  // so this just needs to give it full width and an edge to hug.
  startButtonWrap: {
    left: 0,
    paddingHorizontal: Spacing.four,
    position: "absolute",
    right: 0,
  },
  tabSelector: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 3,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  tabOption: {
    flex: 1,
    paddingVertical: Spacing.two,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
  },
  tabOptionActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabOptionWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tabText: {
    fontSize: 14,
  },
  tabCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
  },
  tabCountText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  historyContainer: {
    gap: Spacing.three,
  },
  recordsCard: {
    borderRadius: 16,
    borderWidth: HAIRLINE,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  recordsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  recordsTitle: {
    fontSize: 15,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  statBox: {
    flex: 1,
    padding: Spacing.two,
    borderRadius: 10,
    backgroundColor: "rgba(150, 150, 150, 0.08)",
    alignItems: "center",
    gap: 2,
  },
  statLabel: {
    fontSize: 11,
  },
  statValue: {
    fontSize: 14,
  },
  planLimitBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.three,
    borderRadius: 14,
    gap: Spacing.two,
  },
  planLimitText: {
    flex: 1,
    gap: 2,
  },
  planLimitTitle: {
    fontSize: 13,
  },
  planLimitSubtitle: {
    fontSize: 12,
  },
  historyLoading: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.six,
    gap: Spacing.two,
  },
  loadingText: {
    fontSize: 14,
  },
  sessionsList: {
    gap: Spacing.three,
  },
  sessionCard: {
    borderRadius: 16,
    borderWidth: HAIRLINE,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: Spacing.one,
  },
  sessionDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  sessionDate: {
    fontSize: 14,
  },
  sessionWorkoutName: {
    fontSize: 13,
    flex: 1,
  },
  sessionDuration: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  setsTable: {
    gap: 0,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  setNumberCol: {
    width: 60,
  },
  setNumber: {
    fontSize: 13,
  },
  setType: {
    fontSize: 11,
    textTransform: "capitalize",
  },
  setDetailsCol: {
    flex: 1,
    gap: 2,
  },
  setMetrics: {
    fontSize: 14,
  },
  setSubMetrics: {
    fontSize: 11,
  },
  prBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  prBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#B45309",
  },
  emptyHistory: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.two,
  },
  emptyTitle: {
    fontSize: 17,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
