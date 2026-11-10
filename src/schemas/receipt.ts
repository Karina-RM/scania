import { z } from 'zod';
import { CATEGORY_NAMES } from '@/constants/categories';
import { brToISO } from '@/utils/date';
import { parseMoney } from '@/utils/money';

export const receiptSchema = z.object({
  merchant: z
    .string()
    .trim()
    .min(2, 'Informe o estabelecimento')
    .max(80, 'Máximo de 80 caracteres'),
  date: z
    .string()
    .refine((v) => v === '' || brToISO(v) !== null, 'Data inválida (DD/MM/AAAA)'),
  total: z
    .string()
    .min(1, 'Informe o valor total')
    .refine((v) => {
      const n = parseMoney(v);
      return !Number.isNaN(n) && n > 0;
    }, 'Valor inválido')
    .refine((v) => parseMoney(v) <= 9_999_999, 'Valor muito alto'),
  category: z.enum(CATEGORY_NAMES, 'Escolha uma categoria'),
});

export type ReceiptFormData = z.infer<typeof receiptSchema>;
