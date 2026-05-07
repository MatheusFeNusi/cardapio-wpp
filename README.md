# 🫓 Acarajé da Baiana — Cardápio + Painel

Frontend estático para Vercel (cardápio do cliente + painel do operador) integrado ao Supabase e ao n8n.

---

## 📁 Arquivos deste pacote

| Arquivo | URL no Vercel | Função |
|---|---|---|
| `index.html` | `/` | Cardápio do cliente (faz pedidos) |
| `dashboard.html` | `/dashboard`, `/admin`, `/painel` | Painel do operador |
| `vercel.json` | — | Configuração de rotas e cache |
| `.gitignore` | — | Ignorar `.vercel`, `.DS_Store` etc. |

---

## ✅ DEPLOY — Passo a passo

### Etapa 1 · Pegar a `anon key` do Supabase

Abra:
```
https://supabase.com/dashboard/project/ukmbexntrxgzxgkvhpfx/settings/api
```

Copie a chave `anon` `public` (aquela com `"role":"anon"` no JWT). **Nunca** use a `service_role` no frontend.

### Etapa 2 · Preencher a chave nos 2 HTMLs

**`index.html`** — procure a linha:
```js
const SUPABASE_ANON_KEY = 'COLE_SUA_ANON_KEY_AQUI';
```
Substitua o valor.

**`dashboard.html`** — procure a linha:
```js
const SB_KEY = 'COLE_SUA_ANON_KEY_AQUI';
```
Substitua pelo **mesmo valor**.

### Etapa 3 · Confirmar bucket de imagens

No `index.html`, a linha:
```js
const PRODUTOS_BUCKET = 'produtos';
```

⚠️ **Inconsistência detectada no seu sistema:** o n8n VPS2 está com `SUPABASE_STORAGE_BUCKET = "acaraje-whatsapp"`. O cardápio espera `produtos`. **Você precisa escolher um nome só.**

Recomendação: criar/usar o bucket `produtos` (público) com as fotos. Nesse caso, **siga a Etapa 6 abaixo** para alinhar o n8n.

### Etapa 4 · Deploy no Vercel

**Opção A · CLI:**
```bash
npm i -g vercel
cd <pasta-do-projeto>
vercel --prod
```

**Opção B · Drag & drop:** vá em https://vercel.com/new, arraste a pasta inteira.

Ao final, você recebe uma URL (ex: `https://acaraje-baiana.vercel.app`). **Anote** — vai usar na próxima etapa.

### Etapa 5 · Atualizar `CARDAPIO_URL` no n8n VPS2

Esse passo é **obrigatório** — sem ele, o bot continua mandando o link do Vercel antigo.

1. Entre no n8n VPS2 (`https://acarajevps-n8n.9wtaei.easypanel.host`).
2. Abra o fluxo **VPS2 — Agente Acarajé Completo**.
3. Clique no nó **`⚙️ Edit Fields (configure aqui)`** (canto superior esquerdo).
4. Encontre a variável **`CARDAPIO_URL`** e atualize o valor para a URL nova:
   ```
   https://SUA-URL-NOVA.vercel.app/
   ```
   ⚠️ **Não esqueça da `/` no final** — o código concatena `?tel=...` direto na URL.
5. **Repita o passo no nó `⚙️ Config (Site)`** — esse fluxo tem **dois nós de config** com as mesmas variáveis. Ambos precisam ter o mesmo valor.
6. Clique em **Save** e confirme que o workflow está **Active** (toggle no topo).

### Etapa 6 · Alinhar bucket de imagens no n8n (se aplicável)

Se você decidiu padronizar em `produtos` (Etapa 3), faça também:

1. No mesmo fluxo VPS2, mesmos dois nós (`⚙️ Edit Fields (configure aqui)` e `⚙️ Config (Site)`).
2. Encontre a variável **`SUPABASE_STORAGE_BUCKET`**.
3. Mude de `acaraje-whatsapp` para `produtos`.
4. Confirme que o bucket **`produtos`** existe no Supabase Storage e está **público**.
5. Mova as imagens dos produtos para esse bucket (ou suba novas).

### Etapa 7 · Testar end-to-end

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Abrir `https://SUA-URL.vercel.app/` | Cardápio carrega com produtos do Supabase, **sem** banner amarelo de "modo local" |
| 2 | Abrir `https://SUA-URL.vercel.app/dashboard` | Painel carrega com "Nenhum pedido aqui" (ou pedidos do dia) — **sem** mensagem "Configuração pendente" |
| 3 | Mandar "Oi" pro WhatsApp da loja | Bot responde pedindo seu nome |
| 4 | Responder com seu nome (ex: "Sou João") | Bot saúda e em seguida manda link do cardápio com `?tel=+55...&nome=...` |
| 5 | Abrir o link, escolher itens, finalizar com PIX ou Dinheiro | Aparece tela "Pedido enviado!" |
| 6 | Abrir o `/dashboard` | Pedido novo aparece, com toast e beep |

Se algum passo falhar, vá pro **Troubleshooting** abaixo.

---

## 🔧 Estrutura técnica

### Fluxo de pedido pelo site

```
Cliente abre cardápio com ?tel=...
         │
         ▼
Cardápio (index.html) faz POST → n8n VPS2 webhook /acaraje-pedido-site
         │
         ▼
n8n cria registros em: clientes → pedidos → itens_pedido (Supabase)
         │
         ├── PIX  → cria cobrança no Asaas → manda link via WhatsApp
         └── Dinheiro → status "em_preparo" direto → manda confirmação WhatsApp
         │
         ▼
Painel (/dashboard) lê tabela `pedidos` direto do Supabase com a anon key
```

### Endpoints já configurados (não precisam mudar)

| Variável | Valor | Onde |
|---|---|---|
| `SUPABASE_URL` | `https://ukmbexntrxgzxgkvhpfx.supabase.co` | index.html, dashboard.html |
| `N8N_WEBHOOK` | `https://acarajevps-n8n.9wtaei.easypanel.host/webhook/acaraje-pedido-site` | index.html |

---

## 🐛 Troubleshooting

### "Painel mostra **Configuração pendente**"
→ `SB_KEY` no `dashboard.html` ainda é `COLE_SUA_ANON_KEY_AQUI` ou tem menos de 50 chars. Volta na Etapa 2.

### "Cardápio mostra produtos genéricos com banner amarelo de modo local"
→ `SUPABASE_ANON_KEY` no `index.html` faltando ou inválida. Volta na Etapa 2.

### "`/dashboard` retorna o cardápio em vez do painel"
→ `vercel.json` antigo (com rewrite catch-all). Confirme que está usando o `vercel.json` deste pacote. O atual permite `/dashboard`, `/admin`, `/painel`.

### "Pedido não chega no painel"
1. Veja a aba **Network** do navegador no momento do pedido — o `POST` para `/acaraje-pedido-site` retornou 200?
2. No n8n, abra o fluxo **VPS2 — Agente Acarajé Completo** e veja a aba **Executions**. Tem execução recente? Falhou em algum nó?
3. Confirme que o workflow está **Active**.
4. Verifique se a tabela `pedidos` tem RLS configurada para permitir leitura com a anon key (ver seção Segurança).

### "Imagens dos produtos não aparecem"
1. Bucket existe e está **público** no Supabase Storage?
2. Nome do bucket bate entre `PRODUTOS_BUCKET` (frontend) e `SUPABASE_STORAGE_BUCKET` (n8n)?
3. Coluna `imagem_url` na tabela `produtos` tem valor? Pode ser caminho relativo (`acaraje.jpg`) ou URL completa.

### "Bot manda o link do Vercel antigo"
→ Você esqueceu da Etapa 5. Lembre que tem **dois nós** de config com `CARDAPIO_URL` no fluxo VPS2.

### "Cliente abre o link mas o bot não envia novamente"
→ É esperado: a flag `cardapio_enviado=true` é gravada na tabela `n8n_status_acaraje` na primeira vez. Para forçar reenvio em testes, mande **`/reset`** no WhatsApp (esse comando está implementado no fluxo VPS1).

---

## 🔒 Segurança e RLS

A `anon key` do Supabase **pode** ir no frontend (é desenhada pra isso), **mas** depende da Row Level Security (RLS) das tabelas para não vazar dados.

Verifique em `Supabase > Authentication > Policies`:

| Tabela | Política mínima sugerida |
|---|---|
| `produtos` | SELECT permitido para `anon` (cardápio precisa ler) |
| `pedidos` | SELECT permitido para `anon` (painel precisa ler). INSERT/UPDATE **só pelo n8n** (que usa service_role) |
| `clientes` | SELECT permitido para `anon` (painel mostra nome/telefone). INSERT/UPDATE só pelo n8n |
| `itens_pedido` | SELECT permitido para `anon` (painel lista itens). INSERT só pelo n8n |
| `n8n_status_acaraje`, `n8n_chat_histories_acaraje`, `n8n_fila_acaraje` | **Bloquear** acesso `anon` totalmente — só o n8n usa essas tabelas |

> ⚠️ Se você quer esconder dados sensíveis (telefone, CPF) do painel público, restrinja a leitura de `clientes` e crie um esquema mais granular. Hoje qualquer pessoa com a anon key consegue listar pedidos do dia.

### 🚨 Atenção crítica: secrets expostos

Os JSONs de fluxo do n8n que você está movimentando contêm **valores de produção** em texto plano:

- `SUPABASE_SERVICE_KEY` (service_role — acesso TOTAL ao banco)
- `OPENAI_API_KEY`
- `WA_TOKEN` (Meta WhatsApp)
- `ASAAS_API_KEY` (sandbox por enquanto)
- `token_chatwoot`

**Não comite esses JSONs em repositórios públicos** (GitHub, etc) e **não os anexe em chats abertos**. Se foram expostos:

1. Rotacione no Supabase: `Settings > API > "Reset service_role key"`.
2. Rotacione no OpenAI: `https://platform.openai.com/api-keys` → revogue e gere nova.
3. Rotacione no Meta Business Manager (WhatsApp Cloud API).
4. No Asaas: gere nova API key no painel.
5. Rotacione token do Chatwoot.

Depois, atualize os valores nos nós `⚙️ Edit Fields (configure aqui)` e `⚙️ Config (Site)` do n8n VPS2.

---

## 📝 Notas finais

- **Fluxo geral**: WhatsApp → bot Bete (n8n VPS2) → cliente recebe link → cliente abre cardápio com `?tel=` → POST para webhook do n8n → n8n cria pedido no Supabase → painel exibe.
- **Cardápio tem dois fallbacks**: produtos hardcoded (se Supabase fora do ar) e WhatsApp direto (se webhook do n8n fora do ar ou se cliente entrou sem `?tel=`).
- **Painel atualiza sozinho** a cada 30 segundos e toca beep em pedidos novos. Há um toggle de som no header.
- **Comando `/reset`** no WhatsApp: limpa status do cliente (apaga histórico + flags). Útil em testes.
