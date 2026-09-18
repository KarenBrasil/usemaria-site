// Filtro de período para o painel admin.
// Datas sempre no fuso de Brasília (o servidor da Vercel roda em UTC).
const TZ_OFFSET = '-03:00';

export type PeriodKey = 'today' | '7days' | '30days' | 'month' | 'all' | 'custom';

export type Period = {
  key: PeriodKey;
  label: string;
  from?: Date;
  to?: Date;
  fromStr?: string; // YYYY-MM-DD (para preencher os inputs)
  toStr?: string;
};

// Data de hoje no formato YYYY-MM-DD em Brasília
function todayStr(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

function shiftDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00${TZ_OFFSET}`);
  d.setUTCDate(d.getUTCDate() + days);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d);
}

const startOfDay = (s: string) => new Date(`${s}T00:00:00.000${TZ_OFFSET}`);
const endOfDay = (s: string) => new Date(`${s}T23:59:59.999${TZ_OFFSET}`);
const isDateStr = (s?: string): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

export function resolvePeriod(params: { period?: string; from?: string; to?: string }): Period {
  const today = todayStr();

  if (isDateStr(params.from) || isDateStr(params.to)) {
    const fromStr = isDateStr(params.from) ? params.from : undefined;
    const toStr = isDateStr(params.to) ? params.to : undefined;
    const fmt = (s: string) => s.split('-').reverse().join('/');
    const label = fromStr && toStr ? `${fmt(fromStr)} a ${fmt(toStr)}`
      : fromStr ? `a partir de ${fmt(fromStr)}`
      : `até ${fmt(toStr!)}`;
    return {
      key: 'custom', label,
      from: fromStr ? startOfDay(fromStr) : undefined,
      to: toStr ? endOfDay(toStr) : undefined,
      fromStr, toStr,
    };
  }

  switch (params.period) {
    case 'today':
      return { key: 'today', label: 'Hoje', from: startOfDay(today), fromStr: today, toStr: today };
    case '7days': {
      const s = shiftDays(today, -6);
      return { key: '7days', label: 'Últimos 7 dias', from: startOfDay(s), fromStr: s, toStr: today };
    }
    case 'month': {
      const s = today.slice(0, 8) + '01';
      return { key: 'month', label: 'Este mês', from: startOfDay(s), fromStr: s, toStr: today };
    }
    case 'all':
      return { key: 'all', label: 'Todo o período' };
    case '30days':
    default: {
      const s = shiftDays(today, -29);
      return { key: '30days', label: 'Últimos 30 dias', from: startOfDay(s), fromStr: s, toStr: today };
    }
  }
}

// Cláusula Prisma pronta para usar em `where: { createdAt: ... }`
export function createdAtFilter(p: Period): { gte?: Date; lte?: Date } | undefined {
  if (!p.from && !p.to) return undefined;
  return { ...(p.from ? { gte: p.from } : {}), ...(p.to ? { lte: p.to } : {}) };
}
