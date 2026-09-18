// Busca tolerante: ignora acentos, maiúsculas/minúsculas e pontuação.
// "sao miguel" encontra "SÃO MIGUEL", "fatima" encontra "N.S DE FÁTIMA", etc.
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')          // remove acentos
    .toLowerCase()
    .replace(/\b([a-z])\.([a-z])\b/g, '$1$2')  // abreviações: "n.s" -> "ns"
    .replace(/[^a-z0-9\s]/g, ' ')              // demais pontuações viram espaço
    .replace(/\s+/g, ' ')
    .trim();
}

// Todas as palavras digitadas precisam aparecer no texto (em qualquer ordem).
export function matchesSearch(text: string, query: string): boolean {
  const words = normalizeText(query).split(' ').filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalizeText(text);
  return words.every(word => haystack.includes(word));
}
