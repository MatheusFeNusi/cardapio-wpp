# 🫓 Acarajé da Baiana — Versão alinhada (v3)

Esta versão substitui a anterior. **Tudo (frontend + n8n + Supabase) foi ajustado ao seu schema real**, não a um schema hipotético.

---

## ⚠️ O que mudou nessa versão

A versão anterior assumia tabelas separadas (`clientes`, `itens_pedido`, `n8n_*_acaraje`) que **não existem** no seu Supabase. Tudo foi adaptado para usar:

- **Pedido como uma só linha**: `pedidos.telefone`, `pedidos.nome_cliente`, `pedidos.itens` (jsonb), `pedidos.endereco`
- **Tabelas reais do n8n**: `n8n_status_atendimento`, `n8n_historico_conversas`, `n8n_fila_mensagens`
- **Bot envia link na MESMA mensagem** que reconhece o nome — sem 2 mensagens separadas

---

## 📁 Arquivos

| Arquivo | Pra quê |
|---|---|
| `index.html` | Cardápio do cliente — a anon key já está preenchida |
| `dashboard.html` | Painel do operador — anon key já preenchida, query adaptada ao schema simples |
| `vercel.json` | Rotas (`/dashboard`, `/admin`, `/painel`) |
| `setup-supabase.sql` | **OBRIGATÓRIO:** roda 1 vez no Supabase para criar colunas + RLS |
| `n8n/vps1-atendimento.json` | Fluxo VPS1 (Chatwoot → fila → VPS2) com tabelas reais |
| `n8n/vps2-acaraje.json` | Fluxo VPS2 (Bete + pedido site + Asaas) reescrito do zero |

---

## ✅ Roteiro de deploy (faça nesta ordem)

### 1. Rodar SQL no Supabase (3 minutos)

Abra o **SQL Editor** do Supabase e cole o conteúdo de `setup-supabase.sql`. Rode tudo de uma vez. Esse script é **idempotente** — pode rodar várias vezes sem causar problema.

O que ele faz:
- Adiciona em `pedidos` as colunas `asaas_payment_id`, `asaas_payment_link`, `asaas_status`, `pago_em`
- Cria 3 índices para acelerar consultas
- Habilita RLS nas tabelas e cria policies pra `anon` ler `pedidos` e `produtos`
- Bloqueia `anon` nas tabelas internas do n8n
- Recarrega o cache do PostgREST

No final ele mostra um SELECT com as policies criadas — confirma que `pedidos` e `produtos` aparecem com policy.

### 2. Importar os fluxos do n8n no VPS2 (5 minutos)

> ⚠️ **Antes de importar, exporte e salve os fluxos atuais**, caso precise reverter.

**No n8n VPS2 (`acarajevps-n8n.9wtaei.easypanel.host`):**

1. **Desative** o fluxo atual de pedido site (botão Active off no canto superior direito)
2. Menu **Workflows** → **Import from File** → escolha `n8n/vps2-acaraje.json`
3. Clique no nó **`⚙️ Configurações`** e preencha:
   - `SUPABASE_SERVICE_KEY` — service_role (Settings > API)
   - `WA_TOKEN` — o WhatsApp Cloud API (já vinha preenchido no fluxo antigo, é só copiar)
   - `ASAAS_API_KEY` — sandbox por enquanto
   - `CARDAPIO_URL` — depois do deploy no Vercel (etapa 4)
4. **Conecte as credenciais** (a importação não traz credenciais por segurança):
   - **OpenAI gpt-4o-mini** → escolher conta OpenAI existente
   - **🧠 Memória Postgres** → escolher conta Postgres existente
5. Clique em **Save** e **Active** o workflow

**No n8n VPS1 (`n8n.neurautomation.com`):**

1. Desative o fluxo atual de atendimento
2. Import → `n8n/vps1-atendimento.json`
3. Clique no nó **`Info`** e procure `supabase_key` — preencha com a service_role
4. Save + Active

> Dica: como você já testou bastante, pode aproveitar e rodar `/reset` no WhatsApp pra limpar estado antes de testar.

### 3. Deploy no Vercel (2 minutos)

```bash
# Na pasta do projeto:
vercel --prod
```

Anote a URL que aparece (ex: `https://acaraje-baiana.vercel.app`).

### 4. Atualizar `CARDAPIO_URL` no n8n (1 minuto)

Volte no n8n VPS2 → fluxo **VPS2 - Acarajé** → nó **`⚙️ Configurações`** → preencha `CARDAPIO_URL` com a URL nova **(com `/` no final)**.

Save + workflow já está active.

### 5. Testar end-to-end

1. Mande **"/reset"** no WhatsApp da loja (limpa estado).
2. Mande **"Oi"** → bot pergunta o nome.
3. Mande **"Sou Matheus"** → bot **NA MESMA mensagem** confirma o nome E avisa que está enviando o cardápio. Em seguida, em mensagem separada, chega o link do cardápio.
4. Abra o link → cardápio carrega.
5. Adicione itens, escolha **Dinheiro**, finalize.
6. Cardápio mostra "✅ Pedido enviado!"
7. ~5s depois, no WhatsApp, chega: `✅ Pedido #0001 de Matheus anotado! 🫓 ...`
8. Em `/dashboard` o pedido aparece com beep.

---

## 🐛 Troubleshooting

### "Pedidos não aparecem no dashboard"
- Rodou o `setup-supabase.sql`? Confira no SQL Editor: `SELECT * FROM pg_policies WHERE tablename = 'pedidos';` → tem que ter pelo menos `anon_select_pedidos`.
- Se sim, abra o Console do navegador (F12) no `/dashboard` e veja qual erro aparece na requisição `pedidos?...`.

### "Bot manda link antigo (project-5l88s)"
- Você pulou a etapa 4. Ou esqueceu da `/` no final da URL.
- Confira no nó `⚙️ Configurações` do VPS2.

### "Imagem dos produtos não aparece"
- Bucket `produtos` existe e é público?
- A coluna `imagem_url` em `produtos` tem o nome do arquivo (ex: `acaraje.jpg`) ou URL completa?

### "Pedido falha — erro 'pedido não criado'"
- Veja Executions do nó `🌐 Criar pedido (site)` — provavelmente RLS ou coluna inexistente.
- Roda novamente o `setup-supabase.sql` por garantia.

### "Bete pede o nome mas não envia o cardápio depois"
- Veja Executions do `📤 Processar resposta`. Olha o output do nó:
  - Se `nome_cliente` está vazio → o gpt-4o-mini não extraiu. Mande algo mais explícito como "Sou João"
  - Se `cardapio_enviado` está `false` → veja se `cfg.WA_TOKEN` está preenchido
  - Se `cardapio_enviado` está `true` mas o cliente não recebeu → veja resposta da Meta: provavelmente o número está com 24h de janela expirada, ou o token expirou.

### "RLS está chato, quero desligar"

```sql
ALTER TABLE pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE produtos DISABLE ROW LEVEL SECURITY;
NOTIFY pgrst, 'reload schema';
```

> ⚠️ Mas aí qualquer um com a anon key acessa tudo. Não recomendo em produção.

---

## 🔐 Lembrete de segurança

Os secrets que estão nos JSONs antigos (service_role, WA_TOKEN, OPENAI_API_KEY, ASAAS_API_KEY) foram **expostos em chat aberto**. Quando puder, rotacione todos eles:

| Onde | Como |
|---|---|
| Supabase service_role | Dashboard > Settings > API > Reset |
| OpenAI | platform.openai.com/api-keys |
| WhatsApp (Meta) | Business Manager → System Users |
| Asaas | Painel Asaas → API Keys |

E atualize os valores no nó `⚙️ Configurações` dos dois fluxos.

---

## 🤖 Sobre o pedido "envia cardápio logo após o nome"

Foi implementado assim:

1. Cliente: "Oi"
2. Bete: "Oi! Sou a Bete 🫓 Como posso te chamar?"
3. Cliente: "Sou Matheus"
4. Bete: "Que bom te conhecer, Matheus! 😍 Já estou te enviando nosso cardápio aqui ⬇️" *(esta mensagem vai pelo Chatwoot)*
5. **Imediatamente em seguida** (na mesma execução do n8n) chega outra mensagem com o link do cardápio *(esta vai direto pela API Meta)*

São duas mensagens visualmente, mas vêm em sequência (~1 segundo de diferença) e o link já está formatado com `?tel=...&nome=...` pronto pra usar.

> Se você quiser **uma mensagem só** (com texto + link), me avisa que adapto — mas a separação atual deixa o link mais clicável no WhatsApp e evita que a Bete repita "aqui está o cardápio: URL", o que sai meio robótico.
