import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { AskQuestionPayload } from '@fitness/types';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type QuestionCardProps = {
  question: AskQuestionPayload;
  /** Tappable only for the live, unanswered question — history renders read-only. */
  interactive: boolean;
  /** For history: the option(s) the user actually picked, if it can be told
   * from their reply, so the answered card highlights the right chip. */
  chosen?: string[];
  onSubmit: (selected: string[]) => void;
};

/** The multiple-choice question the coach asks via the `askQuestion` tool —
 * plain question text plus tappable option chips, Claude-style. */
export function QuestionCard({
  question,
  interactive,
  chosen,
  onSubmit,
}: QuestionCardProps) {
  const theme = useTheme();
  const [selected, setSelected] = useState<string[]>([]);
  const allowMultiple = question.allowMultiple ?? false;

  const toggle = (option: string) => {
    if (!interactive) return;
    if (!allowMultiple) {
      onSubmit([option]);
      return;
    }
    setSelected((prev) =>
      prev.includes(option)
        ? prev.filter((entry) => entry !== option)
        : [...prev, option],
    );
  };

  return (
    <View style={styles.wrap}>
      <ThemedText style={styles.question}>{question.question}</ThemedText>
      <View style={styles.options}>
        {question.options.map((option: string) => {
          const isChosen = interactive
            ? selected.includes(option)
            : (chosen?.includes(option) ?? false);
          const dimmed = !interactive && !isChosen;

          return (
            <Pressable
              key={option}
              disabled={!interactive}
              accessibilityRole="button"
              accessibilityState={{ disabled: !interactive, selected: isChosen }}
              onPress={() => toggle(option)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: isChosen ? Brand.accent : theme.surface,
                  borderColor: isChosen ? Brand.accent : theme.border,
                  opacity: dimmed ? 0.55 : pressed ? 0.85 : 1,
                },
              ]}>
              <ThemedText
                style={[styles.optionText, isChosen && styles.optionTextChosen]}>
                {option}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      {interactive && allowMultiple ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send answer"
          disabled={selected.length === 0}
          onPress={() => onSubmit(selected)}
          style={({ pressed }) => [
            styles.send,
            {
              backgroundColor: selected.length
                ? Brand.accent
                : theme.backgroundSelected,
              opacity: pressed && selected.length ? 0.85 : 1,
            },
          ]}>
          <ThemedText style={styles.sendText}>Send</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two + 2,
  },
  question: {
    fontSize: 16,
    lineHeight: 22,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  option: {
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth || 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionTextChosen: {
    color: '#FFFFFF',
  },
  send: {
    alignSelf: 'flex-start',
    borderCurve: 'continuous',
    borderRadius: 999,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
