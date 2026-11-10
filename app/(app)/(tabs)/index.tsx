import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { ReceiptCard } from '@/components/ReceiptCard';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { useReceipts } from '@/hooks/useReceipts';
import { colors, spacing } from '@/theme';
import { friendlyError } from '@/utils/errors';

export default function ReceiptsScreen() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } = useReceipts();

  if (isLoading) return <LoadingView />;
  if (isError) return <ErrorState message={friendlyError(error)} onRetry={refetch} />;

  return (
    <Screen>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<Text style={styles.title}>Minhas notas</Text>}
        ListEmptyComponent={
          <View style={styles.empty}>
            <EmptyState
              icon="camera-outline"
              title="Nenhuma nota ainda"
              message="Fotografe uma nota fiscal e deixe a IA fazer a leitura."
            />
            <Button title="Escanear primeira nota" onPress={() => router.push('/scan')} />
          </View>
        }
        renderItem={({ item }) => (
          <ReceiptCard
            receipt={item}
            onPress={() => router.push(`/receipt/${item.id}`)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, flexGrow: 1 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  empty: { flex: 1, justifyContent: 'center', gap: spacing.md },
});
