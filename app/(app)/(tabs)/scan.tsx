import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useScanReceipt } from '@/hooks/useReceipts';
import type { ScanStep } from '@/hooks/useReceipts';
import { pickReceiptImage, prepareForUpload } from '@/services/imagePicker';
import type { PickedImage } from '@/services/imagePicker';
import { colors, radius, spacing } from '@/theme';
import { friendlyError } from '@/utils/errors';

const STEP_LABEL: Record<ScanStep, string> = {
  upload: 'Enviando a imagem...',
  analyze: 'A IA está lendo a nota...',
};

export default function ScanScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const scan = useScanReceipt();
  const [image, setImage] = useState<PickedImage | null>(null);
  const [step, setStep] = useState<ScanStep | null>(null);

  async function pick(source: 'camera' | 'library') {
    try {
      const picked = await pickReceiptImage(source);
      if (picked) setImage(picked);
    } catch (error) {
      Alert.alert('Não foi possível abrir', friendlyError(error));
    }
  }

  async function analyze() {
    if (!image || !user) return;
    try {
      setStep('upload');
      const base64 = await prepareForUpload(image);
      const result = await scan.mutateAsync({ userId: user.id, base64, onStep: setStep });
      setImage(null);
      if (result.error) {
        Alert.alert(
          'A leitura falhou',
          `${result.error}\n\nA nota foi salva: você pode tentar de novo.`,
        );
      }
      router.push(`/receipt/${result.id}`);
    } catch (error) {
      Alert.alert('Erro ao enviar', friendlyError(error));
    } finally {
      setStep(null);
    }
  }

  const busy = step !== null;

  return (
    <Screen scroll>
      <Text style={styles.title}>Escanear nota</Text>

      {image ? (
        <View style={styles.previewBox}>
          <Image
            source={{ uri: image.uri }}
            style={styles.preview}
            resizeMode="contain"
          />
        </View>
      ) : (
        <Card style={styles.placeholder}>
          <Ionicons name="scan" size={72} color={colors.primary} />
          <Text style={styles.placeholderText}>Nenhuma foto selecionada</Text>
        </Card>
      )}

      {busy ? (
        <View style={styles.progress}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.progressText}>{step ? STEP_LABEL[step] : ''}</Text>
        </View>
      ) : image ? (
        <View style={styles.actions}>
          <Button title="Analisar com IA" onPress={analyze} />
          <Button
            title="Escolher outra foto"
            variant="ghost"
            onPress={() => setImage(null)}
          />
        </View>
      ) : (
        <View style={styles.actions}>
          <Button title="Tirar foto" onPress={() => pick('camera')} />
          <Button
            title="Escolher da galeria"
            variant="secondary"
            onPress={() => pick('library')}
          />
        </View>
      )}

      <Card style={styles.tips}>
        <Text style={styles.tipsTitle}>Dicas para uma boa leitura</Text>
        <Text style={styles.tip}>
          • Fotografe com boa luz, sem sombras sobre o papel.
        </Text>
        <Text style={styles.tip}>
          • Deixe a nota inteira e esticada, de cima para baixo.
        </Text>
        <Text style={styles.tip}>• Evite reflexos e mantenha o celular parado.</Text>
      </Card>
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
  placeholder: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  placeholderText: { color: colors.muted, fontSize: 15 },
  previewBox: {
    height: 360,
    backgroundColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  preview: { flex: 1 },
  actions: { gap: spacing.sm, marginBottom: spacing.md },
  progress: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  progressText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  tips: { gap: 4 },
  tipsTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  tip: { fontSize: 14, color: colors.muted },
});
