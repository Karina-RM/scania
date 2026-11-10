import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  analyzeReceipt,
  createReceiptRecord,
  deleteReceipt,
  getImageUrl,
  getReceipt,
  listReceipts,
  updateReceipt,
  uploadReceiptImage,
} from '@/services/receipts';
import type { Receipt, ReceiptUpdate } from '@/types';
import { friendlyError } from '@/utils/errors';

export function useReceipts() {
  return useQuery({ queryKey: ['receipts', 'list'], queryFn: listReceipts });
}

export function useReceipt(id: string | undefined) {
  return useQuery({
    queryKey: ['receipts', 'detail', id],
    queryFn: () => getReceipt(id as string),
    enabled: Boolean(id),
  });
}

// O link assinado vale 1 hora; guardamos em cache por 50 minutos.
export function useReceiptImageUrl(path: string | undefined) {
  return useQuery({
    queryKey: ['receipts', 'image', path],
    queryFn: () => getImageUrl(path as string),
    enabled: Boolean(path),
    staleTime: 50 * 60 * 1000,
  });
}

export type ScanStep = 'upload' | 'analyze';

interface ScanVariables {
  userId: string;
  base64: string;
  onStep: (step: ScanStep) => void;
}

export interface ScanResult {
  id: string;
  error: string | null; // preenchido se a IA falhou (a nota fica salva para tentar de novo)
}

export function useScanReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      base64,
      onStep,
    }: ScanVariables): Promise<ScanResult> => {
      onStep('upload');
      const path = await uploadReceiptImage(userId, base64);
      const id = await createReceiptRecord(path);

      onStep('analyze');
      try {
        await analyzeReceipt(id);
        return { id, error: null };
      } catch (error) {
        return { id, error: friendlyError(error) };
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['receipts'] }),
  });
}

export function useReanalyzeReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => analyzeReceipt(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['receipts'] }),
  });
}

export function useUpdateReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReceiptUpdate }) =>
      updateReceipt(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['receipts'] }),
  });
}

export function useDeleteReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (receipt: Pick<Receipt, 'id' | 'image_path'>) => deleteReceipt(receipt),
    // Atualiza tudo, menos o detalhe da nota que acabou de ser apagada: buscá-la
    // de novo falharia e a tela mostraria "Algo deu errado" antes de voltar.
    onSuccess: (_data, receipt) =>
      queryClient.invalidateQueries({
        queryKey: ['receipts'],
        predicate: (query) => query.queryKey[2] !== receipt.id,
      }),
  });
}
