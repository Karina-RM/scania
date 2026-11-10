import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { FormInput } from '@/components/FormInput';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { loginSchema } from '@/schemas/auth';
import type { LoginData } from '@/schemas/auth';
import { colors, spacing } from '@/theme';
import { friendlyError } from '@/utils/errors';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const clearFormError = () => setFormError(null);

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    try {
      await signIn(email.trim(), password);
      // O redirecionamento acontece sozinho quando a sessão muda.
    } catch (error) {
      setFormError(friendlyError(error));
    }
  }, clearFormError); // formulário inválido: some o aviso antigo do servidor

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Ionicons name="scan" size={56} color={colors.primary} />
        <Text style={styles.title}>ScanIA</Text>
        <Text style={styles.subtitle}>Suas notas fiscais, lidas por IA</Text>
      </View>

      <FormInput
        control={control}
        name="email"
        label="E-mail"
        placeholder="voce@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <FormInput
        control={control}
        name="password"
        label="Senha"
        placeholder="Sua senha"
        secureTextEntry
        autoCapitalize="none"
      />

      {formError ? <Text style={styles.error}>{formError}</Text> : null}

      <Button title="Entrar" onPress={onSubmit} loading={isSubmitting} />

      <Link href="/register" style={styles.link}>
        Não tem conta? <Text style={styles.linkStrong}>Cadastre-se</Text>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl },
  title: { fontSize: 32, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  subtitle: { fontSize: 15, color: colors.muted, marginTop: 4 },
  error: { color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
  link: { marginTop: spacing.lg, textAlign: 'center', color: colors.muted, fontSize: 15 },
  linkStrong: { color: colors.primary, fontWeight: '700' },
});
