import type { Receipt } from '@/types';
import { filterByMonth, receiptDate, summarizeReceipts } from '@/utils/summary';

function make(partial: Partial<Receipt> & Pick<Receipt, 'id'>): Receipt {
  return {
    user_id: 'u1',
    image_path: 'u1/a.jpg',
    status: 'done',
    merchant: 'Loja',
    purchase_date: '2026-09-10',
    total: 10,
    category: 'Alimentação',
    payment_method: null,
    error_message: null,
    created_at: '2026-09-12T15:00:00Z',
    ...partial,
  };
}

describe('summarizeReceipts', () => {
  const list = [
    make({ id: '1', total: 0.1 }),
    make({ id: '2', total: 0.2 }),
    make({ id: '3', total: 99.7, category: 'Transporte' }),
    make({ id: '4', status: 'pending', total: null }),
    make({ id: '5', status: 'error', total: null }),
  ];

  it('soma só notas lidas, sem erro de ponto flutuante', () => {
    const s = summarizeReceipts(list);
    expect(s.total).toBe(100);
    expect(s.count).toBe(3);
    expect(s.average).toBe(33.33);
  });

  it('agrupa por categoria, da maior para a menor', () => {
    const s = summarizeReceipts(list);
    expect(s.byCategory.map((c) => c.category)).toEqual(['Transporte', 'Alimentação']);
    expect(s.byCategory[0].percent).toBeCloseTo(99.7, 1);
    expect(s.byCategory[1].count).toBe(2);
  });

  it('trata categoria desconhecida como "Outros"', () => {
    const s = summarizeReceipts([make({ id: '9', category: 'Viagens' })]);
    expect(s.byCategory[0].category).toBe('Outros');
  });

  it('funciona com lista vazia', () => {
    expect(summarizeReceipts([])).toEqual({
      total: 0,
      count: 0,
      average: 0,
      byCategory: [],
    });
  });
});

describe('datas das notas', () => {
  it('usa a data da compra e, na falta dela, a do envio', () => {
    expect(receiptDate(make({ id: '1' }))).toBe('2026-09-10');
    expect(receiptDate(make({ id: '2', purchase_date: null }))).toBe('2026-09-12');
  });

  it('filtra por mês', () => {
    const list = [
      make({ id: '1', purchase_date: '2026-08-31' }),
      make({ id: '2', purchase_date: '2026-09-01' }),
      make({ id: '3', purchase_date: '2026-09-30' }),
      make({ id: '4', purchase_date: '2026-10-01' }),
    ];
    const ids = filterByMonth(list, { year: 2026, month: 9 }).map((r) => r.id);
    expect(ids).toEqual(['2', '3']);
  });
});
