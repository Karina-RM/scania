import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme';
import type { IconName } from '@/utils/icons';
import { Button } from './Button';

export function LoadingView() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.center}>
      <Ionicons name="cloud-offline" size={48} color={colors.muted} />
      <Text style={styles.title}>Algo deu errado</Text>
      <Text style={styles.text}>{message}</Text>
      <Button title="Tentar novamente" onPress={onRetry} style={styles.button} />
    </View>
  );
}

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  message: string;
}

export function EmptyState({ icon = 'wallet-outline', title, message }: EmptyStateProps) {
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={48} color={colors.muted} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  text: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  button: { marginTop: spacing.sm, alignSelf: 'stretch' },
});
