import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CATEGORIES } from '@/constants/categories';
import { receiptSchema } from '@/schemas/receipt';
import type { ReceiptFormData } from '@/schemas/receipt';
import { colors, radius, spacing } from '@/theme';
import type { Receipt, ReceiptUpdate } from '@/types';
import { brToISO, isoToBr, maskBrDate } from '@/utils/date';
import { safeIcon } from '@/utils/icons';
import { parseMoney, roundMoney, toInputMoney } from '@/utils/money';
import { Button } from './Button';
import { FormInput } from './FormInput';

interface ReceiptFormProps {
  receipt: Receipt;
  submitting: boolean;
  onSubmit: (input: ReceiptUpdate) => void;
}

// Revisão humana: a IA sugere, o usuário confirma ou corrige.
export function ReceiptForm({ receipt, submitting, onSubmit }: ReceiptFormProps) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      merchant: receipt.merchant ?? '',
      date: receipt.purchase_date ? isoToBr(receipt.purchase_date) : '',
      total: receipt.total !== null ? toInputMoney(receipt.total) : '',
      category: (receipt.category ?? 'Outros') as ReceiptFormData['category'],
    },
  });

  const category = watch('category');

  const submit = handleSubmit((values) => {
    onSubmit({
      merchant: values.merchant.trim(),
      purchase_date: values.date ? brToISO(values.date) : null,
      total: roundMoney(parseMoney(values.total)),
      category: values.category,
    });
  });

  return (
    <View>
      <FormInput
        control={control}
        name="merchant"
        label="Estabelecimento"
        maxLength={80}
      />
      <FormInput
        control={control}
        name="date"
        label="Data da compra"
        placeholder="DD/MM/AAAA"
        keyboardType="number-pad"
        mask={maskBrDate}
      />
      <FormInput
        control={control}
        name="total"
        label="Valor total (R$)"
        placeholder="0,00"
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Categoria</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((item) => {
          const selected = item.name === category;
          return (
            <Pressable
              key={item.name}
              onPress={() => setValue('category', item.name, { shouldValidate: true })}
              style={[
                styles.chip,
                selected && { backgroundColor: item.color, borderColor: item.color },
              ]}
            >
              <Ionicons
                name={safeIcon(item.icon)}
                size={16}
                color={selected ? '#FFFFFF' : item.color}
              />
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {item.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {errors.category ? (
        <Text style={styles.error}>{errors.category.message}</Text>
      ) : null}

      <Button title="Confirmar e salvar" onPress={submit} loading={submitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipText: { fontSize: 14, color: colors.text },
  chipTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing.sm },
});
