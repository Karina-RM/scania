export type ReceiptStatus = 'pending' | 'done' | 'error';

export interface ReceiptItem {
  id: string;
  receipt_id: string;
  description: string;
  quantity: number;
  unit_price: number | null;
  total_price: number;
}

export interface Receipt {
  id: string;
  user_id: string;
  image_path: string;
  status: ReceiptStatus;
  merchant: string | null;
  purchase_date: string | null; // AAAA-MM-DD
  total: number | null;
  category: string | null;
  payment_method: string | null;
  error_message: string | null;
  created_at: string;
  items?: ReceiptItem[];
}

// Campos que o usuário pode corrigir depois da leitura da IA.
export interface ReceiptUpdate {
  merchant: string;
  purchase_date: string | null;
  total: number;
  category: string;
}
