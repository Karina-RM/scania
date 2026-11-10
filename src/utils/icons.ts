import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof Ionicons>['name'];

// Garante um ícone válido mesmo se o banco tiver um nome desconhecido.
export function safeIcon(name: string): IconName {
  return name in Ionicons.glyphMap ? (name as IconName) : 'pricetag';
}
