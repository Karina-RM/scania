import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { monthLabel, shiftMonth } from '@/utils/date';
import type { YearMonth } from '@/utils/date';

interface MonthSwitcherProps {
  value: YearMonth;
  onChange: (next: YearMonth) => void;
}

export function MonthSwitcher({ value, onChange }: MonthSwitcherProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel="Mês anterior"
        hitSlop={12}
        onPress={() => onChange(shiftMonth(value, -1))}
      >
        <Ionicons name="chevron-back" size={24} color={colors.primary} />
      </Pressable>
      <Text style={styles.label}>{monthLabel(value)}</Text>
      <Pressable
        accessibilityLabel="Próximo mês"
        hitSlop={12}
        onPress={() => onChange(shiftMonth(value, 1))}
      >
        <Ionicons name="chevron-forward" size={24} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  label: { fontSize: 18, fontWeight: '700', color: colors.text },
});
