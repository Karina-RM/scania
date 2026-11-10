import type { IconName } from '@/utils/icons';

export const CATEGORIES = [
  { name: 'Alimentação', icon: 'restaurant', color: '#F97316' },
  { name: 'Transporte', icon: 'bus', color: '#3B82F6' },
  { name: 'Moradia', icon: 'home', color: '#8B5CF6' },
  { name: 'Saúde', icon: 'medkit', color: '#EF4444' },
  { name: 'Lazer', icon: 'game-controller', color: '#EC4899' },
  { name: 'Educação', icon: 'school', color: '#0EA5E9' },
  { name: 'Compras', icon: 'cart', color: '#F59E0B' },
  { name: 'Contas', icon: 'receipt', color: '#64748B' },
  { name: 'Outros', icon: 'ellipsis-horizontal', color: '#94A3B8' },
] as const satisfies readonly { name: string; icon: IconName; color: string }[];

export type CategoryName = (typeof CATEGORIES)[number]['name'];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name) as [
  CategoryName,
  ...CategoryName[],
];

const FALLBACK = CATEGORIES[CATEGORIES.length - 1];

// Devolve ícone e cor da categoria; nomes desconhecidos caem em "Outros".
export function categoryInfo(name: string | null | undefined) {
  return CATEGORIES.find((c) => c.name === name) ?? FALLBACK;
}
