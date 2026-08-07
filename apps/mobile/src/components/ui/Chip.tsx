import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import Ring from '@/components/ui/Ring';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipProps = {
  label: string;
  icon: ReactNode;
  selected: boolean;
  onPress: () => void;
  ringColor?: string;
};

export default function Chip({ label, icon, selected, onPress, ringColor }: ChipProps) {
  const theme = useTheme();

  return (
    <Ring onPress={onPress} color={ringColor}>
      <View
        style={[
          styles.fill,
          { backgroundColor: selected ? theme.backgroundSelected : theme.background },
        ]}>
        {icon}
        <ThemedText family='ubuntu' fontWeight='400' style={{ color: theme.text }}>
          {label}
        </ThemedText>
      </View>
    </Ring>
  );
}

const styles = StyleSheet.create({
  fill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
});
