import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!url || !key) {
  throw new Error(
    'Variáveis do Supabase ausentes. Confira o .env e reinicie com: npx expo start -c',
  );
}

// Sem limite de tempo, uma requisição para um servidor que sumiu (sem recusar a
// conexão) fica esperando para sempre, e a tela fica "carregando" para sempre.
// Com o limite, ela falha com "timed out", que o friendlyError traduz para
// "Sem conexão com a internet.". A Edge Function espera a IA (até 60 s do lado
// dela) e o envio da foto pode ser lento no 4G, por isso têm limites maiores.
export function timeoutFor(input: RequestInfo | URL): number {
  const target =
    typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (target.includes('/functions/v1/')) return 90_000;
  if (target.includes('/storage/v1/')) return 30_000;
  return 8_000;
}

const fetchWithTimeout: typeof fetch = (input, init) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutFor(input));
  // Respeita também um cancelamento pedido por quem chamou.
  init?.signal?.addEventListener('abort', () => controller.abort());
  return fetch(input, { ...init, signal: controller.signal })
    .catch((error: unknown) => {
      if (controller.signal.aborted && !init?.signal?.aborted) {
        throw new Error('Request timed out');
      }
      throw error;
    })
    .finally(() => clearTimeout(timer));
};

export const supabase = createClient(url, key, {
  global: { fetch: fetchWithTimeout },
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Renova o token só enquanto o app está em primeiro plano.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
