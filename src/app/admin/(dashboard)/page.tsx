import prisma from "@/lib/prisma"
import Link from "next/link"
import { resolvePeriod, createdAtFilter } from "@/lib/period"

export const dynamic = 'force-dynamic';

const money = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
const APPROVED = ['PAID', 'DELIVERED', 'SHIPPED'];
const ORDEM_TAM: Record<string, number> = { PP: 1, P: 2, M: 3, G: 4, GG: 5, XG: 6 };

const PRESETS: { key: string; label: string }[] = [
  { key: 'today', label: 'Hoje' },
  { key: '7days', label: '7 dias' },
  { key: '30days', label: '30 dias' },
  { key: 'month', label: 'Este mês' },
  { key: 'all', label: 'Tudo' },
];

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Aguardando', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  PAID: { label: 'Pago', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  SHIPPED: { label: 'Enviado', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  DELIVERED: { label: 'Entregue', cls: 'bg-zinc-100 text-zinc-700 border-zinc-300' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-red-50 text-red-600 border-red-200' },
};

const dataCurta = (d: Date) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' }).format(d);

function Kpi({ titulo, valor, detalhe, href, destaque }: { titulo: string; valor: string; detalhe: string; href?: string; destaque?: boolean }) {
  const cls = `h-full p-5 rounded-xl border shadow-sm flex flex-col justify-between gap-3 transition-colors ${
    destaque ? 'bg-zinc-900 border-zinc-800 text-white hover:bg-black' : 'bg-white border-zinc-200 hover:border-zinc-400'
  }`;
  const corpo = (
    <>
      <p className={`text-[10px] uppercase tracking-widest font-bold ${destaque ? 'text-zinc-400' : 'text-zinc-500'}`}>{titulo}</p>
      <p className="text-3xl font-semibold tracking-tight">{valor}</p>
      <p className={`text-xs ${destaque ? 'text-zinc-400' : 'text-zinc-500'}`}>{detalhe}</p>
    </>
  );
  return href ? <Link href={href} className={cls}>{corpo}</Link> : <div className={cls}>{corpo}</div>;
}

function Painel({ titulo, acao, children }: { titulo: string; acao?: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col h-full overflow-hidden">
      <header className="flex justify-between items-center px-5 py-4 border-b border-zinc-100">
        <h3 className="text-sm font-bold tracking-tight text-zinc-900">{titulo}</h3>
        {acao && (
          <Link href={acao.href} className="text-[10px] text-zinc-500 hover:text-black uppercase font-bold tracking-widest transition-colors">
            {acao.label}
          </Link>
        )}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}

const Vazio = ({ texto }: { texto: string }) => (
  <p className="p-8 text-sm text-zinc-400 text-center">{texto}</p>
);

export default async function AdminOverview({ searchParams }: { searchParams: Promise<{ period?: string, from?: string, to?: string }> }) {
  const params = await searchParams;
  const period = resolvePeriod(params);
  const createdAt = createdAtFilter(period);
  const inPeriod = createdAt ? { createdAt } : {};

  const [orders, produtos] = await Promise.all([
    prisma.order.findMany({
      where: inPeriod,
      include: { customer: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.product.findMany({
      select: { id: true, name: true, isDraft: true, isWholesale: true, image: true, sizes: { select: { size: true, color: true, stock: true } } },
      orderBy: { name: 'asc' }
    }),
  ]);

  // ---------- Vendas do período ----------
  const approvedOrders = orders.filter(o => APPROVED.includes(o.status));
  const pendentes = orders.filter(o => o.status === 'PENDING');
  const cancelados = orders.filter(o => o.status === 'CANCELLED');
  const revenue = approvedOrders.reduce((acc, o) => acc + o.total, 0);
  const ticket = approvedOrders.length > 0 ? revenue / approvedOrders.length : 0;
  const itemsSold = approvedOrders.reduce((acc, o) => acc + o.items.reduce((a, i) => a + i.quantity, 0), 0);
  const valorPendente = pendentes.reduce((acc, o) => acc + o.total, 0);
  const taxaAprovacao = orders.length > 0 ? Math.round((approvedOrders.length / orders.length) * 100) : 0;
  const recentOrders = orders.slice(0, 6);

  const salesByProduct = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of approvedOrders) {
    for (const i of o.items) {
      const key = i.productId || i.id;
      const entry = salesByProduct.get(key) || { name: i.product?.name || 'Produto removido', qty: 0, revenue: 0 };
      entry.qty += i.quantity;
      entry.revenue += i.price * i.quantity;
      salesByProduct.set(key, entry);
    }
  }
  const topProducts = [...salesByProduct.values()].sort((a, b) => b.qty - a.qty).slice(0, 6);

  // ---------- Catálogo e estoque (não depende do período) ----------
  const ativos = produtos.filter(p => !p.isDraft);
  const totalDe = (p: typeof produtos[number]) => p.sizes.reduce((acc, s) => acc + s.stock, 0);
  const esgotadas = ativos.filter(p => totalDe(p) <= 0);
  // Última unidade: a peça inteira tem só 1 unidade (o estoque da loja é
  // pequeno por tamanho, então "1 ou 2 num tamanho" pegava quase tudo).
  const baixoEstoque = ativos
    .filter(p => totalDe(p) === 1)
    .map(p => ({
      ...p,
      tamanhos: p.sizes
        .filter(s => s.stock > 0)
        .sort((a, b) => (ORDEM_TAM[a.size] || 99) - (ORDEM_TAM[b.size] || 99)),
    }));
  const semFoto = ativos.filter(p => !p.image).length;
  const rascunhos = produtos.length - ativos.length;
  const unidadesEmEstoque = ativos.reduce((acc, p) => acc + totalDe(p), 0);

  const alertas = [
    pendentes.length > 0 && { href: '/admin/vendas?status=PENDING', cls: 'bg-amber-50 border-amber-200 text-amber-800', texto: `${pendentes.length} ${pendentes.length === 1 ? 'pedido aguardando' : 'pedidos aguardando'} pagamento (${money(valorPendente)})` },
    esgotadas.length > 0 && { href: '/admin/produtos?filter=esgotados', cls: 'bg-red-50 border-red-200 text-red-700', texto: `${esgotadas.length} ${esgotadas.length === 1 ? 'peça esgotada' : 'peças esgotadas'}` },
    baixoEstoque.length > 0 && { href: '/admin/produtos?filter=baixo_estoque', cls: 'bg-orange-50 border-orange-200 text-orange-800', texto: `${baixoEstoque.length} ${baixoEstoque.length === 1 ? 'peça' : 'peças'} na última unidade` },
    semFoto > 0 && { href: '/admin/produtos', cls: 'bg-zinc-50 border-zinc-200 text-zinc-700', texto: `${semFoto} ${semFoto === 1 ? 'peça' : 'peças'} sem foto` },
  ].filter(Boolean) as { href: string; cls: string; texto: string }[];

  return (
    <div className="max-w-[1200px] flex flex-col gap-6">
      {/* CABEÇALHO + PERÍODO */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Visão Geral</h2>
            <p className="text-sm text-zinc-500 mt-1">Período: <span className="font-semibold text-zinc-800">{period.label}</span></p>
          </div>
          <Link
            href="/admin/relatorios"
            title="Exportar Relatórios"
            className="bg-black text-white p-3 rounded-lg hover:bg-zinc-800 transition-colors shadow-sm flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {PRESETS.map(p => (
              <Link
                key={p.key}
                href={`/admin?period=${p.key}`}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${period.key === p.key ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
              >
                {p.label}
              </Link>
            ))}
          </div>
          <form action="/admin" method="GET" className="flex items-center gap-2 flex-wrap">
            <input type="date" name="from" aria-label="De" defaultValue={period.fromStr || ''} className="border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-900 focus:outline-none focus:border-black" />
            <span className="text-xs text-zinc-400">até</span>
            <input type="date" name="to" aria-label="Até" defaultValue={period.toStr || ''} className="border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-900 focus:outline-none focus:border-black" />
            <button type="submit" className="bg-zinc-900 text-white px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-black transition-colors">
              Aplicar
            </button>
          </form>
        </div>
      </div>

      {/* INDICADORES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi destaque titulo="Faturamento" valor={money(revenue)} detalhe={`${itemsSold} ${itemsSold === 1 ? 'peça vendida' : 'peças vendidas'}`} href="/admin/vendas?status=PAID" />
        <Kpi titulo="Vendas aprovadas" valor={String(approvedOrders.length)} detalhe={`de ${orders.length} pedidos · ${taxaAprovacao}% aprovados`} href="/admin/vendas" />
        <Kpi titulo="Ticket médio" valor={money(ticket)} detalhe="por venda aprovada" />
        <Kpi titulo="Não concluídos" valor={String(pendentes.length + cancelados.length)} detalhe={`${pendentes.length} aguardando · ${cancelados.length} cancelados`} href="/admin/vendas?status=CANCELLED" />
      </div>

      {/* PRECISA DE ATENÇÃO */}
      {alertas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alertas.map(a => (
            <Link key={a.texto} href={a.href} className={`text-xs font-semibold border rounded-full px-4 py-2 hover:shadow-sm transition-shadow ${a.cls}`}>
              {a.texto} →
            </Link>
          ))}
        </div>
      )}

      {/* PEDIDOS + MAIS VENDIDOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <Painel titulo="Últimos pedidos" acao={{ href: '/admin/vendas', label: 'Ver todos' }}>
          {recentOrders.length === 0 ? <Vazio texto="Nenhum pedido no período." /> : (
            <ul className="divide-y divide-zinc-100">
              {recentOrders.map(order => {
                const st = STATUS[order.status] || STATUS.CANCELLED;
                return (
                  <li key={order.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{order.customer?.name || 'Cliente'}</p>
                      <p className="text-[11px] text-zinc-400">#{order.id.slice(-6).toUpperCase()} · {dataCurta(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded border ${st.cls}`}>{st.label}</span>
                      <span className="text-sm font-semibold text-zinc-900 w-24 text-right">{money(order.total)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Painel>

        <Painel titulo="Mais vendidos no período">
          {topProducts.length === 0 ? <Vazio texto="Nenhuma venda aprovada no período." /> : (
            <ul className="divide-y divide-zinc-100">
              {topProducts.map((p, i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 shrink-0 rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-600 flex items-center justify-center">{i + 1}</span>
                    <p className="text-sm font-medium text-zinc-900 truncate">{p.name}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-sm">
                    <span className="text-zinc-500">{p.qty} un</span>
                    <span className="font-semibold text-zinc-900 w-24 text-right">{money(p.revenue)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Painel>
      </div>

      {/* ESTOQUE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <Painel titulo={`Esgotadas (${esgotadas.length})`} acao={{ href: '/admin/produtos?filter=esgotados', label: 'Ver todas' }}>
          {esgotadas.length === 0 ? <Vazio texto="Nenhuma peça esgotada." /> : (
            <ul className="divide-y divide-zinc-100">
              {esgotadas.slice(0, 6).map(p => (
                <li key={p.id}>
                  <Link href={`/admin/produtos/${p.id}/editar`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-zinc-50">
                    <p className="text-sm font-medium text-zinc-900 truncate">{p.name}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 shrink-0">
                      {p.sizes.length === 0 ? 'sem tamanho' : p.isWholesale ? 'encomenda' : 'repor'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Painel>

        <Painel titulo={`Última unidade (${baixoEstoque.length})`} acao={{ href: '/admin/produtos?filter=baixo_estoque', label: 'Ver todas' }}>
          {baixoEstoque.length === 0 ? <Vazio texto="Nenhuma peça na última unidade." /> : (
            <ul className="divide-y divide-zinc-100">
              {baixoEstoque.slice(0, 6).map(p => (
                <li key={p.id}>
                  <Link href={`/admin/produtos/${p.id}/editar`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-zinc-50">
                    <p className="text-sm font-medium text-zinc-900 truncate">{p.name}</p>
                    <div className="flex gap-1 shrink-0">
                      {p.tamanhos.slice(0, 4).map((s, i) => (
                        <span key={i} className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-100 rounded px-1.5 py-0.5">
                          {s.size}{s.color && s.color !== 'Padrão' ? ` ${s.color}` : ''}
                        </span>
                      ))}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Painel>
      </div>

      <p className="text-[11px] text-zinc-400">
        Catálogo: {ativos.length} peças na loja · {rascunhos} {rascunhos === 1 ? 'rascunho' : 'rascunhos'} · {unidadesEmEstoque} unidades em estoque
      </p>
    </div>
  )
}
