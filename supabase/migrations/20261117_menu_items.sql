-- Menú del negocio + notas/menu_item_id en partidas.
-- Reemplaza sale_agregar_partida con snapshot desde menú.
-- RLS activo, sin policies: solo service_role.

CREATE TABLE IF NOT EXISTS public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id uuid NOT NULL REFERENCES public.negocios(id),
  nombre text NOT NULL CHECK (
    char_length(trim(nombre)) >= 1 AND char_length(nombre) <= 60
  ),
  categoria text NOT NULL CHECK (
    char_length(trim(categoria)) >= 1 AND char_length(categoria) <= 30
  ),
  precio_centavos integer NOT NULL CHECK (precio_centavos > 0),
  activo boolean NOT NULL DEFAULT true,
  orden smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS menu_items_negocio_activo_orden_idx
  ON public.menu_items (negocio_id, activo, categoria, orden, nombre);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.partidas
  ADD COLUMN IF NOT EXISTS notas text NULL
    CHECK (notas IS NULL OR char_length(notas) <= 120);

ALTER TABLE public.partidas
  ADD COLUMN IF NOT EXISTS menu_item_id uuid NULL
    REFERENCES public.menu_items(id) ON DELETE SET NULL;

DROP FUNCTION IF EXISTS public.sale_agregar_partida(uuid, text, integer, integer);

CREATE OR REPLACE FUNCTION public.sale_agregar_partida(
  p_cuenta_id uuid,
  p_descripcion text,
  p_cantidad integer,
  p_precio_centavos integer,
  p_notas text DEFAULT NULL,
  p_menu_item_id uuid DEFAULT NULL
)
RETURNS public.cuentas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  c public.cuentas;
  v_descripcion text;
  v_precio integer;
  v_notas text;
  v_menu_nombre text;
  v_menu_precio integer;
BEGIN
  SELECT * INTO c FROM public.cuentas WHERE id = p_cuenta_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'cuenta no encontrada';
  END IF;
  IF c.cerrada_at IS NOT NULL THEN
    RAISE EXCEPTION 'mesa cerrada';
  END IF;
  IF c.estado = 'pagada' THEN
    RAISE EXCEPTION 'mesa pagada';
  END IF;
  IF p_cantidad IS NULL OR p_cantidad < 1 OR p_cantidad > 99 THEN
    RAISE EXCEPTION 'cantidad inválida';
  END IF;

  v_notas := NULLIF(btrim(COALESCE(p_notas, '')), '');
  IF v_notas IS NOT NULL AND char_length(v_notas) > 120 THEN
    RAISE EXCEPTION 'notas inválidas';
  END IF;

  IF p_menu_item_id IS NOT NULL THEN
    SELECT mi.nombre, mi.precio_centavos
      INTO v_menu_nombre, v_menu_precio
    FROM public.menu_items mi
    WHERE mi.id = p_menu_item_id
      AND mi.activo = true
      AND mi.negocio_id = c.negocio_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'platillo no disponible';
    END IF;
    v_descripcion := v_menu_nombre;
    v_precio := v_menu_precio;
  ELSE
    IF p_descripcion IS NULL OR char_length(trim(p_descripcion)) < 1
       OR char_length(trim(p_descripcion)) > 80 THEN
      RAISE EXCEPTION 'descripción inválida';
    END IF;
    IF p_precio_centavos IS NULL OR p_precio_centavos < 0 THEN
      RAISE EXCEPTION 'precio inválido';
    END IF;
    v_descripcion := trim(p_descripcion);
    v_precio := p_precio_centavos;
  END IF;

  UPDATE public.cobros
  SET estado = 'expirado'
  WHERE cuenta_id = p_cuenta_id
    AND tipo = 'consumo'
    AND estado = 'pendiente';

  INSERT INTO public.partidas (
    cuenta_id, descripcion, cantidad, precio_centavos, notas, menu_item_id
  )
  VALUES (
    p_cuenta_id,
    v_descripcion,
    p_cantidad,
    v_precio,
    v_notas,
    p_menu_item_id
  );

  RETURN public.sale_recalc_cuenta(p_cuenta_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.sale_agregar_partida(uuid, text, integer, integer, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sale_agregar_partida(uuid, text, integer, integer, text, uuid)
  TO service_role;
