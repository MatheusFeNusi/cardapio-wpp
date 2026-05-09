# 🫓 Acarajé da Baiana — v4 (Completo)

> Esta versão tem tudo implementado e funcional. Supabase já está configurado.

---

## 📁 Arquivos

| Arquivo | O que faz |
|---|---|
| `index.html` | Cardápio do cliente — anon key já preenchida |
| `dashboard.html` | Painel do operador — com **autenticação por senha** |
| `admin.html` | **Gestão de produtos** — novo! ativa/oculta/edita/cria produtos |
| `vercel.json` | Rotas: `/dashboard`, `/admin`, `/painel` |
| `setup-supabase.sql` | Script de referência — Supabase **já está configurado** |
| `n8n/vps1-atendimento.json` | Fluxo VPS1 (Chatwoot → fila → VPS2) |
| `n8n/vps2-acaraje.json` | Fluxo VPS2 (Bete AI + pedido site + Asaas) |
| `n8n/notif-pronto.json` | **Novo!** Fluxo de notificação "pedido pronto" |

---

## ✅ O que foi implementado nessa versão

### Supabase (já aplicado)
- [x] `pg_net` ativado
- [x] Tabela `pedidos` com colunas `telefone`, `nome_cliente`, `itens` (jsonb), `endereco`, `precisa_troco`, `valor_troco`
- [x] Constraints corrigidas: `forma_pagamento` aceita `'dinheiro'`; `status` aceita `'pronto'`
- [x] Tabelas `n8n_status_atendimento` e `n8n_fila_mensagens` criadas
- [x] RLS + policies corretas em todas as tabelas
- [x] Trigger `trg_notificar_pronto` — quando operador marca "Pronto", Postgres chama automaticamente o n8n VPS2 que manda WhatsApp pro cliente
- [x] Senha do dashboard em `configuracoes.dashboard_senha` = `baiana@2025`

### Frontend
- [x] **dashboard.html** — tela de login com senha, botão "Produtos" para admin, filtro "Ativos" inclui aguardando_pagamento
- [x] **admin.html** — gestão completa de produtos (criar, editar, ocultar, reordenar, imagem)
- [x] Arquivo órfão `cardapio_acaraje.html` removido

### n8n
- [x] **notif-pronto.json** — workflow para notificar cliente quando pedido fica pronto

---

## 🚀 Deploy (faça nessa ordem)

### 1. Importar `notif-pronto.json` no n8n VPS2 (3 min)
1. Abra `https://acarajevps-n8n.9wtaei.easypanel.host`
2. Menu **Workflows** → **Import from File** → `n8n/notif-pronto.json`
3. No nó **`⚙️ Config WA`**, preencha `WA_TOKEN` com o token do WhatsApp Cloud API
4. **Save** + **Active**

### 2. Deploy no Vercel (2 min)
```bash
cd cardapio-wpp
vercel --prod
```
Anote a URL (ex: `https://acaraje-baiana.vercel.app`).

### 3. Atualizar CARDAPIO_URL no n8n VPS2 (1 min)
- Fluxo **VPS2 - Acarajé** → nó **`⚙️ Configurações`** → `CARDAPIO_URL` = URL do Vercel **(com `/` no final)**
- Save

### 4. Testar
1. `/reset` no WhatsApp → limpa estado
2. "Oi" → Bete pergunta nome
3. "Sou João" → Bete saúda e envia link do cardápio
4. Abra o link → adicione itens → finalize pedido
5. Dashboard (`/dashboard`, senha: `baiana@2025`) → pedido aparece
6. Clique **🔥 Iniciar** → **✅ Pronto** → cliente recebe WhatsApp automaticamente
7. Admin (`/admin`) → gerencie produtos

---

## 🔑 Trocar a senha do dashboard
No **SQL Editor** do Supabase:
```sql
UPDATE configuracoes SET valor = 'sua-nova-senha' WHERE chave = 'dashboard_senha';
```

## 🐛 Troubleshooting

**Notificação "pronto" não chega:**
- O workflow `notif-pronto.json` está importado e ativo no VPS2?
- O `WA_TOKEN` está preenchido nele?
- Veja Executions do n8n VPS2.

**"Pedido não criado" no n8n:**
- Veja Executions do nó `🌐 Criar pedido (site)` — provavelmente constraint ou coluna.
- A tabela `pedidos` tem a coluna `itens` (jsonb)? Rode o `setup-supabase.sql` por garantia.

**Dashboard não carrega pedidos:**
- Abra F12 → Network → veja a resposta da chamada `pedidos?...`
- RLS bloqueando? `SELECT * FROM pg_policies WHERE tablename='pedidos';` — tem que ter `anon_select_pedidos`.

## 🔐 Segurança — rotacione os secrets
| Onde | Como |
|---|---|
| Supabase service_role | Dashboard > Settings > API > Reset |
| OpenAI | platform.openai.com/api-keys |
| WhatsApp (Meta) | Business Manager → System Users |
| Asaas | Painel → API Keys |
