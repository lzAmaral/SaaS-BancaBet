-- ============================================================
-- CONTROLE DE BANCA ESPORTIVA — Supabase Database Setup
-- Execute este SQL no SQL Editor do painel do Supabase
-- ============================================================

-- Tabela: bets (apostas)
CREATE TABLE IF NOT EXISTS public.bets (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE        NOT NULL,
  description TEXT        NOT NULL,
  odd         NUMERIC(8,2)  NOT NULL CHECK (odd > 1),
  stake       NUMERIC(12,2) NOT NULL CHECK (stake > 0),
  status      TEXT        NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'green', 'red', 'refund')),
  returned    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (returned >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: settings (configurações por usuário)
CREATE TABLE IF NOT EXISTS public.settings (
  user_id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  initial_bankroll  NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (initial_bankroll >= 0),
  unit_stake        NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (unit_stake >= 0),
  monthly_goal      NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (monthly_goal >= 0),
  daily_loss_limit  NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (daily_loss_limit >= 0),
  neon_theme        BOOLEAN     NOT NULL DEFAULT true,
  confirm_result    BOOLEAN     NOT NULL DEFAULT true,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES — baseados nos padrões de query do app
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_bets_user_date    ON public.bets (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_bets_user_status  ON public.bets (user_id, status);
CREATE INDEX IF NOT EXISTS idx_bets_created_at   ON public.bets (user_id, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY — cada usuário só vê seus dados
-- ============================================================
ALTER TABLE public.bets     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Políticas para bets
CREATE POLICY "Usuário vê apenas suas apostas"
  ON public.bets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário cria apenas suas apostas"
  ON public.bets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza apenas suas apostas"
  ON public.bets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário exclui apenas suas apostas"
  ON public.bets FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para settings
CREATE POLICY "Usuário vê apenas suas configurações"
  ON public.settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário cria apenas suas configurações"
  ON public.settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza apenas suas configurações"
  ON public.settings FOR UPDATE
  USING (auth.uid() = user_id);
