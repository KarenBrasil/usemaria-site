# Migrar a loja da Vercel para a Netlify

Repositorio: `KarenBrasil/usemaria-site` (branch `main`)
Dominio: `lojausemaria.com.br` (registrado no Registro.br)

---

## PASSO 0 - Trocar a senha do admin (faca primeiro)

A senha antiga (`Usemaria2026@`) esta escrita dentro do codigo, num repositorio
PUBLICO no GitHub. Ela esta queimada. Escolha uma senha nova agora e use ela no
passo 2. Nao reaproveite a antiga.

---

## PASSO 1 - Subir as mudancas

```bash
git add -A
git commit -m "perf+seguranca: tirar fotos base64, cachear produtos, proteger admin, configurar Netlify"
git push
```

---

## PASSO 2 - Criar o site na Netlify

1. Entre em https://app.netlify.com -> **Add new site** -> **Import an existing project**
2. Escolha **GitHub** e selecione o repositorio `usemaria-site`
3. Branch: `main`. O resto ela detecta sozinha (ja existe `netlify.toml`).
4. **NAO clique em Deploy ainda.** Abra **Add environment variables** e cadastre
   a lista do passo 3.
5. So entao: **Deploy site**

---

## PASSO 3 - Variaveis de ambiente

### Copiar da Vercel (mesmo valor)

| Variavel | Para que serve |
|---|---|
| `DATABASE_URL` | Banco (Supabase) |
| `DIRECT_URL` | Banco, conexao direta |
| `STRIPE_SECRET_KEY` | Pagamento |
| `MELHOR_ENVIO_TOKEN` | Frete |
| `NEXT_PUBLIC_SUPABASE_URL` | Storage das fotos |
| `SUPABASE_SERVICE_ROLE_KEY` | Storage das fotos |
| `META_CAPI_ACCESS_TOKEN` | Eventos do Meta |

Para ver os valores atuais: `vercel env pull` dentro da pasta do projeto.

### Criar agora (NAO existem hoje, e fazem falta)

| Variavel | Valor | Por que |
|---|---|---|
| `ADMIN_PASSWORD` | sua senha nova | Hoje o site usa a senha fixa do codigo, que e publica |
| `ADMIN_SESSION_SECRET` | texto aleatorio longo | Assina o cookie do admin |
| `RESEND_API_KEY` | sua chave Resend | **Os e-mails de pedido nao estao sendo enviados** porque isto nunca foi configurado na Vercel |
| `CRON_SECRET` | texto aleatorio longo | Protege a rota de follow-up |
| `STORE_CEP` | CEP real da loja | Hoje usa `60811660` fixo no codigo |
| `STORE_DOCUMENT` | CPF/CNPJ real da loja | Hoje usa `12345678909`, que e um documento de exemplo |

Para gerar um texto aleatorio:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Corrigir o nome

A Vercel tem `NEXT_FB_PIXEL_ID`, mas o codigo le `NEXT_PUBLIC_FB_PIXEL_ID`.
Na Netlify cadastre com o nome certo: **`NEXT_PUBLIC_FB_PIXEL_ID`**.

### Nao precisa levar

`NEXT_PUBLIC_STRIPE_PUBLIC_KEY` - nenhum arquivo do projeto usa.

---

## PASSO 4 - Conferir antes de mexer no dominio

A Netlify da um endereco tipo `algum-nome.netlify.app`. Teste nele:

- [ ] Home abre e mostra os produtos
- [ ] Clicar num produto abre a pagina dele
- [ ] `/admin` pede senha
- [ ] A senha nova funciona
- [ ] Colocar algo no carrinho e chegar no checkout

So siga adiante se tudo isso passar. Enquanto o dominio nao for movido, a loja
antiga continua como esta.

---

## PASSO 5 - Apontar o dominio

Na Netlify: **Domain settings** -> **Add a domain** -> `lojausemaria.com.br`.
Ela vai mostrar para onde apontar.

No **Registro.br** (https://registro.br -> seus dominios -> DNS):

- Troque o registro `A` que hoje aponta para `76.76.21.21` (Vercel)
  pelo IP que a Netlify indicar
- Ou, mais simples, use os nameservers da Netlify se ela oferecer

Leva de 10 minutos a algumas horas para propagar. O HTTPS a Netlify emite sozinha.

Depois que o dominio estiver respondendo pela Netlify, remova o dominio do
projeto na Vercel para nao ficarem os dois brigando.

---

## PASSO 6 - So agora: migrar as fotos do banco

**Somente depois que `lojausemaria.com.br` estiver abrindo pela Netlify.**

```bash
node scripts/migrar-imagens-base64.mjs --aplicar
```

Isso aponta os 13 produtos para os arquivos `.webp` que ja subiram junto com o
codigo. Fazer antes do site estar no ar deixaria esses produtos sem foto.

Conferir depois:
```bash
node scripts/auditar-imagens.mjs
```
Tem que dizer: `com foto em BASE64 (ruim): 0`

---

## PASSO 7 - Criar o bucket no Supabase

Senao toda foto nova que voce cadastrar volta a engordar o site.

Supabase -> **Storage** -> **New bucket** -> nome **`products`** -> marcar
**Public** -> Save.

Teste: cadastre um produto com foto no admin e rode
`node scripts/auditar-imagens.mjs`. Tem que continuar em zero.

---

## Observacoes

- `vercel.json` continua no projeto de proposito: se um dia voltar para a
  Vercel, o cron volta a funcionar. Na Netlify ele e ignorado, quem faz o
  agendamento e `netlify/functions/followup.mjs`.
- Limites do plano gratis da Netlify: 100 GB de trafego e 300 minutos de build
  por mes. Com as paginas em ~200 KB, da em torno de 500 mil visitas.
