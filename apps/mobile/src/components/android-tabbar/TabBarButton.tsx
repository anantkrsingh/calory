import {
  Dumbbell,
  House,
  MessageCircle,
  UserRound,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';
import {
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ICONS: Record<string, LucideIcon> = {
  index: House,
  build: Dumbbell,
  chat: MessageCircle,
  diets: UtensilsCrossed,
  profile: UserRound,
};

type TabBarButtonProps = {
  onPress: (event: GestureResponderEvent) => void;
  onLongPress: (event: GestureResponderEvent) => void;
  isFocused: boolean;
  routeName: string;
  label: string;
  style?: StyleProp<ViewStyle>;
};

export function TabBarButton({
  onPress,
  onLongPress,
  isFocused,
  routeName,
  label,
  style,
}: TabBarButtonProps) {
  const theme = useTheme();
  const Icon = ICONS[routeName] ?? House;
  const color = isFocused ? Brand.accent : theme.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.item, style]}>
      <Icon size={22} color={color} strokeWidth={isFocused ? 2.4 : 2} />
      <ThemedText
        type="small"
        numberOfLines={1}
        style={[styles.label, { color }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.half,
    height: '100%',
    zIndex: 1,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
  },
});
