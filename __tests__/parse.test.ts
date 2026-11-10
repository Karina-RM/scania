import { CATEGORY_NAMES as APP_CATEGORIES } from '@/constants/categories';
import {
  CATEGORY_NAMES,
  MOCK_RECEIPT,
  ReceiptReadError,
  normalizeReceipt,
  toBase64,
} from '../supabase/functions/scan-receipt/parse';

const valid = {
  is_receipt: true,
  merchant: ' Padaria Central ',
  purchase_date: '2026-09-18',
  total: 42.5,
  category: 'Alimentação',
  payment_method: 'Pix',
  items: [
    { description: 'Pão francês', quantity: 10, unit_price: 0.75, total_price: 7.5 },
    { description: 'Café', quantity: 1, unit_price: 35, total_price: 35 },
  ],
};

describe('normalizeReceipt', () => {
  it('aceita uma resposta válida e limpa os textos', () => {
    const r = normalizeReceipt(valid);
    expect(r.merchant).toBe('Padaria Central');
    expect(r.total).toBe(42.5);
    expect(r.items).toHaveLength(2);
  });

  it('converte números que vieram como texto com vírgula', () => {
    const r = normalizeReceipt({ ...valid, total: '42,50' });
    expect(r.total).toBe(42.5);
  });

  it('troca categoria desconhecida por "Outros"', () => {
    expect(normalizeReceipt({ ...valid, category: 'Viagens' }).category).toBe('Outros');
  });

  it('descarta datas inexistentes ou em outro formato', () => {
    expect(
      normalizeReceipt({ ...valid, purchase_date: '2026-02-31' }).purchase_date,
    ).toBeNull();
    expect(
      normalizeReceipt({ ...valid, purchase_date: '18/09/2026' }).purchase_date,
    ).toBeNull();
  });

  it('soma os itens (em centavos) quando o total não vem', () => {
    const r = normalizeReceipt({
      ...valid,
      total: undefined,
      items: [
        { description: 'A', total_price: 0.1 },
        { description: 'B', total_price: 0.2 },
      ],
    });
    expect(r.total).toBe(0.3);
  });

  it('calcula o total do item a partir do preço unitário', () => {
    const r = normalizeReceipt({
      ...valid,
      items: [{ description: 'Água', quantity: 3, unit_price: 2 }],
    });
    expect(r.items[0].total_price).toBe(6);
  });

  it('ignora itens inválidos', () => {
    const r = normalizeReceipt({ ...valid, items: [{ description: '' }, 'lixo', null] });
    expect(r.items).toEqual([]);
  });

  it('usa um nome padrão quando o estabelecimento não é lido', () => {
    expect(normalizeReceipt({ ...valid, merchant: '' }).merchant).toBe(
      'Estabelecimento não identificado',
    );
  });

  it('rejeita imagens que não são notas', () => {
    expect(() => normalizeReceipt({ is_receipt: false })).toThrow(ReceiptReadError);
  });

  it('rejeita resposta sem total e sem itens', () => {
    expect(() => normalizeReceipt({ ...valid, total: null, items: [] })).toThrow(
      'valor total',
    );
  });

  it('rejeita respostas que não são objetos', () => {
    expect(() => normalizeReceipt('texto')).toThrow(ReceiptReadError);
    expect(() => normalizeReceipt(null)).toThrow(ReceiptReadError);
  });

  it('a resposta simulada (MOCK_RECEIPT) passa na própria validação', () => {
    expect(normalizeReceipt(MOCK_RECEIPT).total).toBe(87.4);
  });
});

describe('toBase64', () => {
  it('codifica um texto conhecido', () => {
    expect(toBase64(new TextEncoder().encode('ScanIA'))).toBe('U2NhbklB');
  });

  it('não perde bytes em imagens grandes (vários blocos)', () => {
    const bytes = new Uint8Array(100_000).map((_, i) => i % 256);
    const decoded = atob(toBase64(bytes));
    expect(decoded).toHaveLength(bytes.length);
    expect(decoded.charCodeAt(99_999)).toBe(99_999 % 256);
  });
});

describe('categorias', () => {
  it('a lista do app e a da Edge Function são idênticas', () => {
    expect([...APP_CATEGORIES]).toEqual([...CATEGORY_NAMES]);
  });
});
