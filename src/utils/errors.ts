// Traduz mensagens comuns do Supabase e da rede para português.
export function friendlyError(error: unknown): string {
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error);

  if (message.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (message.includes('User already registered')) {
    return 'Este e-mail já está cadastrado.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar.';
  }
  // "fetch failed: ..." vem do expo/fetch, que o Expo instala como fetch global.
  if (
    // As três últimas são as mensagens do iOS para servidor fora do ar,
    // conexão que caiu no meio e tempo esgotado.
    /network request failed|failed to fetch|fetch failed|appears to be offline|could not connect to the server|network connection was lost|timed out/i.test(
      message,
    )
  ) {
    return 'Sem conexão com a internet.';
  }
  if (/rate limit/i.test(message)) {
    return 'Muitas tentativas. Aguarde um instante e tente de novo.';
  }
  return message;
}
