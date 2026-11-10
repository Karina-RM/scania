// Regras puras da Edge Function: sem rede e sem Deno, para poder ser testada com Jest.

export const CATEGORY_NAMES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Lazer',
  'Educação',
  'Compras',
  'Contas',
  'Outros',
] as const;

export type CategoryName = (typeof CATEGORY_NAMES)[number];

export interface ExtractedItem {
  description: string;
  quantity: number;
  unit_price: number | null;
  total_price: number;
}

export interface ExtractedReceipt {
  merchant: string;
  purchase_date: string | null;
  total: number;
  category: CategoryName;
  payment_method: string | null;
  items: ExtractedItem[];
}

// Erro "esperado": a mensagem pode ser mostrada ao usuário.
export class ReceiptReadError extends Error {}

const round2 = (n: number) => Math.round(n * 100) / 100;

function toNumber(value: unknown): number | null {
  const n = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : null;
}

function toText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

// Aceita só datas reais no formato AAAA-MM-DD.
function toDate(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const valid =
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d;
  return valid ? value : null;
}

function normalizeItem(raw: unknown): ExtractedItem | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const description = toText(r.description, 120);
  if (!description) return null;

  const quantity = toNumber(r.quantity);
  const qty = quantity !== null && quantity > 0 ? quantity : 1;
  const unit = toNumber(r.unit_price);
  let total = toNumber(r.total_price);
  if (total === null && unit !== null) total = unit * qty;
  if (total === null) return null;

  return {
    description,
    quantity: qty,
    unit_price: unit === null ? null : round2(unit),
    total_price: round2(total),
  };
}

// Valida e limpa o que a IA devolveu. Nunca confie na resposta de um modelo sem validar.
export function normalizeReceipt(raw: unknown): ExtractedReceipt {
  if (typeof raw !== 'object' || raw === null) {
    throw new ReceiptReadError('A resposta da IA veio em formato inválido.');
  }
  const r = raw as Record<string, unknown>;

  if (r.is_receipt === false) {
    throw new ReceiptReadError('A imagem não parece ser uma nota fiscal ou recibo.');
  }

  const items = (Array.isArray(r.items) ? r.items : [])
    .slice(0, 100)
    .map(normalizeItem)
    .filter((item): item is ExtractedItem => item !== null);

  let total = toNumber(r.total);
  if (total === null && items.length > 0) {
    const cents = items.reduce((sum, i) => sum + Math.round(i.total_price * 100), 0);
    total = cents / 100;
  }
  if (total === null || total <= 0) {
    throw new ReceiptReadError('Não foi possível ler o valor total da nota.');
  }

  return {
    merchant: toText(r.merchant, 80) || 'Estabelecimento não identificado',
    purchase_date: toDate(r.purchase_date),
    total: round2(total),
    category: CATEGORY_NAMES.find((c) => c === r.category) ?? 'Outros',
    payment_method: toText(r.payment_method, 40) || null,
    items,
  };
}

// Converte bytes em base64 em blocos, para não estourar a pilha com imagens grandes.
export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

// Resposta fixa usada quando MOCK_AI=true (testar o fluxo sem gastar créditos da IA).
export const MOCK_RECEIPT: ExtractedReceipt = {
  merchant: 'Supermercado Exemplo',
  purchase_date: '2026-09-18',
  total: 87.4,
  category: 'Alimentação',
  payment_method: 'Cartão de débito',
  items: [
    { description: 'Arroz 5 kg', quantity: 1, unit_price: 29.9, total_price: 29.9 },
    { description: 'Feijão preto 1 kg', quantity: 2, unit_price: 8.5, total_price: 17 },
    {
      description: 'Leite integral 1 L',
      quantity: 6,
      unit_price: 5.25,
      total_price: 31.5,
    },
    { description: 'Sabão em pó', quantity: 1, unit_price: 9, total_price: 9 },
  ],
};
