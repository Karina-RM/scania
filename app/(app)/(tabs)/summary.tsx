import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { DonutChart } from '@/components/DonutChart';
import { MonthSwitcher } from '@/components/MonthSwitcher';
import { Screen } from '@/components/Screen';
import { ErrorState, LoadingView } from '@/components/StateViews';
import { useReceipts } from '@/hooks/useReceipts';
import { colors, radius, spacing } from '@/theme';
import { currentYearMonth } from '@/utils/date';
import type { YearMonth } from '@/utils/date';
import { friendlyError } from '@/utils/errors';
import { formatMoney } from '@/utils/money';
import { filterByMonth, summarizeReceipts } from '@/utils/summary';

export default function SummaryScreen() {
  const [month, setMonth] = useState<YearMonth>(currentYearMonth());
  const { data, isLoading, isError, error, refetch } = useReceipts();

  const summary = useMemo(
    () => summarizeReceipts(filterByMonth(data ?? [], month)),
    [data, month],
  );

  if (isLoading) return <LoadingView />;
  if (isError) return <ErrorState message={friendlyError(error)} onRetry={refetch} />;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Resumo</Text>
        <MonthSwitcher value={month} onChange={setMonth} />

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Total gasto no mês</Text>
          <Text style={styles.heroValue}>{formatMoney(summary.total)}</Text>
          <Text style={styles.heroMeta}>
            {summary.count} {summary.count === 1 ? 'nota' : 'notas'} · média de{' '}
            {formatMoney(summary.average)}
          </Text>
        </View>

        <Card>
          <Text style={styles.cardTitle}>Gastos por categoria</Text>
          {summary.byCategory.length === 0 ? (
            <Text style={styles.empty}>Nenhuma nota lida neste mês.</Text>
          ) : (
            <>
              <View style={styles.chart}>
                <DonutChart
                  data={summary.byCategory.map((c) => ({
                    value: c.total,
                    color: c.color,
                  }))}
                >
                  <Text style={styles.centerLabel}>Total</Text>
                  <Text style={styles.centerValue}>{formatMoney(summary.total)}</Text>
                </DonutChart>
              </View>
              {summary.byCategory.map((c) => (
                <View key={c.category} style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: c.color }]} />
                  <Text style={styles.legendName}>{c.category}</Text>
                  <Text style={styles.legendValue}>{formatMoney(c.total)}</Text>
                  <Text style={styles.legendPercent}>{Math.round(c.percent)}%</Text>
                </View>
              ))}
            </>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroLabel: { color: '#E0E7FF', fontSize: 14, fontWeight: '600' },
  heroValue: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', marginTop: 4 },
  heroMeta: { color: '#E0E7FF', fontSize: 13, marginTop: 4 },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  empty: { color: colors.muted, fontSize: 14, paddingVertical: spacing.sm },
  chart: { alignItems: 'center', marginVertical: spacing.md },
  centerLabel: { fontSize: 12, color: colors.muted },
  centerValue: { fontSize: 15, fontWeight: '800', color: colors.text },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { flex: 1, fontSize: 14, color: colors.text },
  legendValue: { fontSize: 14, color: colors.text },
  legendPercent: {
    width: 40,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
  },
});
