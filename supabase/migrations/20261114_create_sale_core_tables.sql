-- Mirror of applied remote migration create_sale_core_tables
-- Applied via Supabase MCP on project hxtsiwhanupwhrzirozh

CREATE TYPE public.estado_cuenta AS ENUM ('pendiente', 'parcial', 'pagada');
CREATE TYPE public.tipo_cobro AS ENUM ('consumo', 'propina');
CREATE TYPE public.estado_cobro AS ENUM ('pendiente', 'pagado', 'expirado');

CREATE TABLE public.negocios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  pey_bank_account_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.meseros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  pey_bank_account_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.cuentas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  mesero_id uuid NOT NULL REFERENCES public.meseros(id) ON DELETE RESTRICT,
  mesa text NOT NULL,
  estado public.estado_cuenta NOT NULL DEFAULT 'pendiente',
  total_centavos integer NOT NULL CHECK (total_centavos >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.partidas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id uuid NOT NULL REFERENCES public.cuentas(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  precio_centavos integer NOT NULL CHECK (precio_centavos >= 0)
);

CREATE TABLE public.cobros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id uuid REFERENCES public.cuentas(id) ON DELETE SET NULL,
  mesero_id uuid REFERENCES public.meseros(id) ON DELETE SET NULL,
  tipo public.tipo_cobro NOT NULL,
  monto_centavos integer NOT NULL CHECK (monto_centavos > 0),
  estado public.estado_cobro NOT NULL DEFAULT 'pendiente',
  pey_qr_id text NOT NULL,
  pey_transaction_id text,
  qr_string text NOT NULL,
  concepto text NOT NULL,
  webhook_event_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  pagado_at timestamptz,
  CONSTRAINT cobros_pey_qr_id_unique UNIQUE (pey_qr_id),
  CONSTRAINT cobros_webhook_event_id_unique UNIQUE (webhook_event_id)
);

CREATE INDEX cuentas_negocio_estado_idx ON public.cuentas (negocio_id, estado);
CREATE INDEX cobros_cuenta_tipo_estado_idx ON public.cobros (cuenta_id, tipo, estado);
CREATE INDEX cobros_mesero_tipo_estado_idx ON public.cobros (mesero_id, tipo, estado);
CREATE INDEX partidas_cuenta_id_idx ON public.partidas (cuenta_id);

ALTER TABLE public.negocios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meseros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobros ENABLE ROW LEVEL SECURITY;

CREATE POLICY cuentas_select_public ON public.cuentas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY partidas_select_public ON public.partidas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY cobros_select_public ON public.cobros FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY meseros_select_public ON public.meseros FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY negocios_select_public ON public.negocios FOR SELECT TO anon, authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.cuentas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cobros;
