import Constants from 'expo-constants';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme';
import { friendlyError } from '@/utils/errors';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const name = String(user?.user_metadata?.full_name ?? 'Usuário');

  function confirmSignOut() {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => signOut().catch((e) => Alert.alert('Erro', friendlyError(e))),
      },
    ]);
  }

  return (
    <Screen scroll>
      <Text style={styles.title}>Perfil</Text>

      <Card>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </Card>

      <Card>
        <Text style={styles.privacyTitle}>Privacidade</Text>
        <Text style={styles.privacyText}>
          As fotos das suas notas ficam em um armazenamento privado, acessível só por
          você. Elas são enviadas a um serviço de IA apenas para a leitura.
        </Text>
      </Card>

      <Button title="Sair da conta" variant="danger" onPress={confirmSignOut} />
      <Text style={styles.version}>
        ScanIA v{Constants.expoConfig?.version ?? '1.0.0'}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  email: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 2 },
  privacyTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  privacyText: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  version: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.lg,
  },
});
