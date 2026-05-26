-- ════════════════════════════════════════════════════════════════════
-- SETUP SUPABASE — Acarajé da Baiana
-- Execute 1x no SQL Editor do Supabase.
-- Este script é IDEMPOTENTE — pode rodar várias vezes sem problema.
-- ════════════════════════════════════════════════════════════════════

-- 1. pg_net (notificações HTTP assíncronas a partir de triggers)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Corrigir constraint de forma_pagamento (adicionar 'dinheiro')
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_forma_pagamento_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_forma_pagamento_check
  CHECK (forma_pagamento = ANY (ARRAY['pix','entrega','dinheiro']));

-- 3. Corrigir constraint de status (adicionar 'pronto')
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_status_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_status_check
  CHECK (status = ANY (ARRAY['aguardando_pagamento','pago','em_preparo','pronto','saiu_entrega','entregue','cancelado']));

-- 4. Colunas necessárias em pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS telefone      text;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS nome_cliente  text;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS itens         jsonb DEFAULT '[]'::jsonb;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS endereco      text;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS precisa_troco boolean DEFAULT false;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS valor_troco   numeric DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS taxa_entrega   numeric DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS distancia_km  numeric DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS motoboy_telefone text;

-- 5. Índices
CREATE INDEX IF NOT EXISTS idx_pedidos_telefone   ON pedidos(telefone);
CREATE INDEX IF NOT EXISTS idx_pedidos_status     ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_asaas_id   ON pedidos(asaas_payment_id);

-- 6. Tabela n8n_status_atendimento
CREATE TABLE IF NOT EXISTS n8n_status_atendimento (
  session_id    text PRIMARY KEY,
  lock_conversa boolean DEFAULT false,
  nome_cliente  text,
  etapa_funil   text DEFAULT 'inicio',
  updated_at    timestamptz DEFAULT now()
);

-- 7. Tabela n8n_fila_mensagens
CREATE TABLE IF NOT EXISTS n8n_fila_mensagens (
  id          serial PRIMARY KEY,
  telefone    text NOT NULL,
  mensagem    text,
  id_mensagem text,
  timestamp   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fila_telefone  ON n8n_fila_mensagens(telefone);
CREATE INDEX IF NOT EXISTS idx_fila_timestamp ON n8n_fila_mensagens(timestamp);

-- 8. RLS
ALTER TABLE n8n_status_atendimento    ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_fila_mensagens        ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_chat_histories_acaraje ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_historico_conversas   ENABLE ROW LEVEL SECURITY;

-- 9. Políticas anon para produtos e pedidos
DROP POLICY IF EXISTS anon_select_produtos       ON produtos;
DROP POLICY IF EXISTS anon_select_pedidos        ON pedidos;
DROP POLICY IF EXISTS anon_insert_pedidos        ON pedidos;
DROP POLICY IF EXISTS anon_update_pedidos_status ON pedidos;
DROP POLICY IF EXISTS anon_delete_pedidos        ON pedidos;
DROP POLICY IF EXISTS anon_select_configuracoes  ON configuracoes;
DROP POLICY IF EXISTS anon_update_configuracoes  ON configuracoes;
DROP POLICY IF EXISTS anon_insert_configuracoes  ON configuracoes;

CREATE POLICY anon_select_produtos       ON produtos       FOR SELECT TO anon USING (true);
CREATE POLICY anon_select_pedidos        ON pedidos        FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_pedidos        ON pedidos        FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_pedidos_status ON pedidos        FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY anon_delete_pedidos        ON pedidos        FOR DELETE TO anon USING (true);
CREATE POLICY anon_select_configuracoes  ON configuracoes  FOR SELECT TO anon USING (true);
CREATE POLICY anon_update_configuracoes  ON configuracoes  FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY anon_insert_configuracoes  ON configuracoes  FOR INSERT TO anon WITH CHECK (true);

-- 10. Senha padrão do dashboard (mude depois)
INSERT INTO configuracoes (chave, valor, descricao)
VALUES ('dashboard_senha', 'baiana@2025', 'Senha de acesso ao painel do operador')
ON CONFLICT (chave) DO NOTHING;

INSERT INTO configuracoes (chave, valor, descricao)
VALUES ('motoboy_telefone', '5511954803405', 'Número do WhatsApp do motoboy ativo')
ON CONFLICT (chave) DO NOTHING;

-- 11. Trigger: notifica WhatsApp quando pedido muda de status relevante
CREATE OR REPLACE FUNCTION fn_notificar_status_update()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_url     TEXT;
  v_secret  TEXT;
BEGIN
  -- Dispara webhook apenas se o status mudou para um dos status monitorados
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('em_preparo', 'pago', 'pronto', 'saiu_entrega', 'entregue', 'cancelado') THEN
    SELECT valor INTO v_url    FROM configuracoes WHERE chave = 'n8n_notif_url';
    SELECT valor INTO v_secret FROM configuracoes WHERE chave = 'n8n_notif_secret';

    IF v_url IS NOT NULL AND v_url <> '' THEN
      PERFORM net.http_post(
        url     := v_url::text,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-secret',     COALESCE(v_secret, '')
        ),
        body    := jsonb_build_object(
          'status',          CASE 
                               WHEN NEW.status IN ('em_preparo', 'pago') AND NEW.forma_pagamento = 'pix' THEN 'pix_confirmado'
                               ELSE NEW.status
                             END,
          'pedido_id',       NEW.id,
          'telefone',        NEW.telefone,
          'nome_cliente',    COALESCE(NEW.nome_cliente, NEW.nome_cliente_pedido, ''),
          'total',           NEW.total,
          'tipo_entrega',    NEW.tipo_entrega,
          'endereco',        COALESCE(NEW.endereco, NEW.endereco_entrega, ''),
          'forma_pagamento', NEW.forma_pagamento,
          'motoboy_telefone', COALESCE(NEW.motoboy_telefone, '')
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


-- Remover triggers antigas duplicadas
DROP TRIGGER IF EXISTS trg_notificar_pronto ON pedidos;
DROP TRIGGER IF EXISTS trg_pedido_status_change ON pedidos;
DROP TRIGGER IF EXISTS trg_notificar_status ON pedidos;

-- Adicionar a nova trigger unificada de atualização de status
CREATE TRIGGER trg_notificar_status
  AFTER UPDATE OF status ON pedidos
  FOR EACH ROW EXECUTE FUNCTION fn_notificar_status_update();

-- 12. Recarregar PostgREST
NOTIFY pgrst, 'reload schema';

-- Verificação final
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('pedidos','produtos','configuracoes')
ORDER BY tablename, policyname;
