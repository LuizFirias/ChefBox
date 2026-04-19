-- WEBHOOK IDEMPOTENCY TABLE
-- Armazena eventos de webhook já processados para evitar processamento duplicado
-- O Mercado Pago pode enviar o mesmo evento mais de uma vez

CREATE TABLE IF NOT EXISTS processed_webhook_events (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_key    text NOT NULL UNIQUE,  -- formato: "type:notification_id"
  event_type   text NOT NULL,
  notification_id text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Índice para lookup rápido por event_key
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_key ON processed_webhook_events(event_key);

-- Limpar eventos com mais de 30 dias (opcional, para manter a tabela pequena)
-- Pode ser executado manualmente ou via cron no Supabase
COMMENT ON TABLE processed_webhook_events IS
  'Registra webhooks já processados para garantir idempotência. Eventos com mais de 30 dias podem ser removidos com segurança.';

-- RLS: apenas service_role pode acessar
ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;
