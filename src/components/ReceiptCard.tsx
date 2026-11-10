import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryInfo } from '@/constants/categories';
import { colors, radius, spacing } from '@/theme';
import type { Receipt } from '@/types';
import { isoToBr } from '@/utils/date';
import { safeIcon } from '@/utils/icons';
import { formatMoney } from '@/utils/money';
import { receiptDate } from '@/utils/summary';
import { StatusBadge } from './StatusBadge';

interface ReceiptCardProps {
  receipt: Receipt;
  onPress: () => void;
}

export function ReceiptCard({ receipt, onPress }: ReceiptCardProps) {
  const info = categoryInfo(receipt.category);
  const done = receipt.status === 'done';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: `${info.color}22` }]}>
        <Ionicons
          name={done ? safeIcon(info.icon) : 'receipt-outline'}
          size={22}
          color={done ? info.color : colors.muted}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.merchant} numberOfLines={1}>
          {receipt.merchant ?? 'Nota enviada'}
        </Text>
        {done ? (
          <Text style={styles.meta}>
            {isoToBr(receiptDate(receipt))} · {info.name}
          </Text>
        ) : (
          <StatusBadge status={receipt.status} />
        )}
      </View>

      {done && receipt.total !== null ? (
        <Text style={styles.total}>{formatMoney(receipt.total)}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  pressed: { opacity: 0.8 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 4 },
  merchant: { fontSize: 16, fontWeight: '600', color: colors.text },
  meta: { fontSize: 13, color: colors.muted },
  total: { fontSize: 15, fontWeight: '700', color: colors.text },
});
