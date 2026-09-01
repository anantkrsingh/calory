import type { Exercise } from '@fitness/types';
import { useRouter } from 'expo-router';
import { Search, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage, isApiError } from '@/api/errors';
import { ExerciseRow } from '@/components/exercise/ExerciseRow';
import { TabScreen } from '@/components/tab-screen';
import { ThemedText } from '@/components/themed-text';
import RetryButton from '@/components/ui/RetryButton';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { muscleGroupLabel } from '@/lib/muscle-groups';
import { useExercisesByMuscle } from '@/queries/exercises.queries';

const SEARCH_DEBOUNCE_MS = 300;

type ExerciseSection = { title: string; data: Exercise[] };

export function BuildScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Debounce so we don't fire a request on every keystroke.
  useEffect(() => {
    const handle = setTimeout(
      () => setSearch(searchInput.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(handle);
  }, [searchInput]);

  const { data, isLoading, isError, error, refetch, isRefetching } =
    useExercisesByMuscle(search ? { search } : {});

  const sections = useMemo<ExerciseSection[]>(() => {
    const groupSections = (data?.groups ?? []).map((group) => ({
      title: muscleGroupLabel(group.muscle),
      data: group.exercises,
    }));

    return data?.favorites.length
      ? [{ title: 'Favourites', data: data.favorites }, ...groupSections]
      : groupSections;
  }, [data]);

  const totalExercises = (data?.groups ?? []).reduce(
    (sum, group) => sum + group.exercises.length,
    0,
  );

  const openExercise = useCallback(
    (exercise: Exercise) => {
      router.push({ pathname: '/exercise/[id]', params: { id: exercise.id } });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <ExerciseRow exercise={item} onPress={openExercise} />
    ),
    [openExercise],
  );

  return (
    <TabScreen contentStyle={styles.content}>
      <View
        style={[
          styles.searchBar,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        <Search color={theme.textSecondary} size={18} />
        <TextInput
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search by exercise or muscle"
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text }]}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel="Search exercises"
        />
        {searchInput.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={8}
            onPress={() => setSearchInput('')}>
            <X color={theme.textSecondary} size={16} />
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Brand.accent} />
        </View>
      ) : null}

      {isError ? (
        <View style={styles.centered}>
          <ThemedText fontWeight="700" style={styles.stateTitle}>
            Couldn’t load exercises
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.stateBody}>
            {isApiError(error)
              ? error.message
              : getErrorMessage(error, 'Check your connection and try again.')}
          </ThemedText>
          <RetryButton onPress={() => void refetch()} style={styles.stateButton} />
        </View>
      ) : null}

      {!isLoading && !isError && totalExercises === 0 ? (
        <View style={styles.centered}>
          <ThemedText fontWeight="700" style={styles.stateTitle}>
            No exercises found
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.stateBody}>
            {search
              ? `Nothing matches "${search}". Try a different muscle or exercise name.`
              : 'The exercise catalogue is empty.'}
          </ThemedText>
        </View>
      ) : null}

      {!isLoading && !isError && totalExercises > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <View
              style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
              <ThemedText fontWeight="700" style={styles.sectionTitle}>
                {section.title}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.sectionCount}>
                {section.data.length}
              </ThemedText>
            </View>
          )}
          ItemSeparatorComponent={ListSeparator}
          stickySectionHeadersEnabled
          style={styles.list}
          contentContainerStyle={{
            paddingBottom: BottomTabInset + insets.bottom,
          }}
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      ) : null}
    </TabScreen>
  );
}

function ListSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.three,
  },
  searchBar: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth || 1,
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  list: {
    flex: 1,
    marginTop: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.two,
    paddingTop: Spacing.three,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 22,
  },
  sectionCount: {
    fontSize: 13,
    lineHeight: 18,
  },
  separator: {
    height: Spacing.two,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.three,
    justifyContent: 'center',
  },
  stateTitle: {
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
  },
  stateBody: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  stateButton: {
    marginTop: Spacing.two,
  },
});
