# Use Maria Store - Regras e Diretrizes Base (STORE_RULES)

Este documento centraliza as diretrizes vitais de design, negócio e arquitetura da loja "Use Maria". **Sob nenhuma circunstância estas regras devem ser alteradas ou ignoradas sem o pedido explícito da administradora.**

## 1. Diretrizes de Design & UI/UX
- **Minimalismo Extremo (Estilo Uber/iFood):** A loja deve manter um aspecto "premium", limpo, com amplo espaço em branco (white space), utilizando principalmente as cores preto (`zinc-900`), branco, e cinzas (`zinc-500`, `zinc-400`).
- **Fontes:** Utilizar fontes limpas e modernas sem serifa para interface (sans-serif) e fontes elegantes com serifa (serif) apenas para títulos principais ou logotipos, conferindo um tom maduro e sofisticado.
- **Micro-interações:** Toda ação do usuário deve ter feedback visual sutil, mas sem carregar a tela de animações desnecessárias. Use transições rápidas (duration-200 ou 300).

## 2. Regras de Exibição de Produtos e Preços
- **Preço de Varejo:** É o foco principal. Deve sempre estar em destaque.
- **Preço de Atacado:** Deve ser extremamente **sutil e discreto**. Na tela do produto (`/product/[id]`), o preço de atacado deve seguir o mesmo estilo (fonte/cor) do preço normal, porém um pouco menor, e vir acompanhado do ícone de caixa/atacado (svg discreto) e texto "no atacado".
- **Aviso Mínimo Atacado:** O texto de "Pedidos de atacado requerem no mínimo 10 peças variadas no total" deve ser colocado logo **acima do botão "Adicionar ao Carrinho"**, de forma discreta, intuitiva e longe do preço principal para não poluir o layout. (Regra estabelecida para manter a beleza do UI).
- **Sem poluição na home:** Na tela inicial e no catálogo de coleções gerais, ocultamos o aviso de atacado grande para dar mais foco à foto da peça.

## 3. Gestão e Relatórios (Admin)
- **Cards e Filtros Visuais:** A área administrativa prioriza o uso de "Cards" com números grandes no topo (ex: "Total de Peças", "Esgotados", "Baixo Estoque") que funcionam como botões interativos para filtrar o conteúdo abaixo em tempo real.
- **Métricas Conectadas:** Se houver subfiltros (como Tamanho), os cards principais devem recalcular seus valores *apenas para o filtro ativo*.
- **Baixo Estoque:** A regra de baixo estoque atual considera qualquer peça com variação `< 3` (ou seja, 1 ou 2 peças). Zero é considerado "Esgotado".

## 4. Pagamentos e Checkout
- **PIX:** A loja trabalha com aprovação via WhatsApp (Envio de Comprovante) no caso do PIX, visto que não há webhook configurado de banco para baixa automática nesta versão. A mensagem deve ser curta, sem prometer aprovação automática imediata.
- **Cartão (Stripe):** A loja possui integração Stripe. Apenas pagamentos efetivamente aprovados devem contar na receita dos relatórios financeiros. Pedidos com status "PENDING" (aguardando) não entram na conta de lucro no Dashboard.

## 5. Armazenamento de Arquivos
- **Supabase Storage:** Para garantir estabilidade total e eterna, todos os uploads de imagens (produtos, banners) utilizam o Supabase Storage no bucket `products`. O serviço antigo Vercel Blob foi descontinuado devido a falhas de token na produção.

## 6. Organização de Categorias
- **Catálogo Dinâmico:** As categorias da loja (Camisetas, Pijamas, etc) ficam lado a lado no Menu Superior (`Header.tsx`), juntamente com as seções especiais ("Novidades", "Atacado", "Promoção").
- Toda nova categoria criada no Admin vai automaticamente aparecer no menu principal para o cliente acessar.
