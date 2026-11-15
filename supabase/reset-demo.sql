-- Reset de demo (NO se ejecuta solo). Corre a mano en el SQL Editor de Supabase.
-- Borra cobros/reseñas y cuentas que no sean del seed.
-- NO toca pin_hash, rol ni pey_bank_account_id de meseros.

BEGIN;

DELETE FROM public.resenas;
DELETE FROM public.tickets;
DELETE FROM public.cobros;

DELETE FROM public.partidas
WHERE cuenta_id NOT IN (
  '33333333-3333-3333-3333-333333333301',
  '33333333-3333-3333-3333-333333333302',
  '33333333-3333-3333-3333-333333333303'
);

DELETE FROM public.cuentas
WHERE id NOT IN (
  '33333333-3333-3333-3333-333333333301',
  '33333333-3333-3333-3333-333333333302',
  '33333333-3333-3333-3333-333333333303'
);

INSERT INTO public.negocios (id, nombre, pey_bank_account_id)
VALUES ('11111111-1111-1111-1111-111111111111', 'Taquería Demo Sale', NULL)
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;

INSERT INTO public.meseros (id, negocio_id, nombre)
VALUES
  (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Ana'
  ),
  (
    '22222222-2222-2222-2222-222222222223',
    '11111111-1111-1111-1111-111111111111',
    'Luis'
  )
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  negocio_id = EXCLUDED.negocio_id;
  -- No tocar pin_hash, rol, pey_bank_account_id ni activo.

INSERT INTO public.cuentas (
  id, negocio_id, mesero_id, mesa, estado, total_centavos, cerrada_at
) VALUES
  (
    '33333333-3333-3333-3333-333333333301',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '1',
    'pendiente',
    1,
    NULL
  ),
  (
    '33333333-3333-3333-3333-333333333302',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '2',
    'pendiente',
    4,
    NULL
  ),
  (
    '33333333-3333-3333-3333-333333333303',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222223',
    '3',
    'pendiente',
    2,
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  mesero_id = EXCLUDED.mesero_id,
  mesa = EXCLUDED.mesa,
  estado = 'pendiente',
  total_centavos = EXCLUDED.total_centavos,
  cerrada_at = NULL;

DELETE FROM public.partidas
WHERE cuenta_id IN (
  '33333333-3333-3333-3333-333333333301',
  '33333333-3333-3333-3333-333333333302',
  '33333333-3333-3333-3333-333333333303'
);

INSERT INTO public.partidas (cuenta_id, descripcion, cantidad, precio_centavos)
VALUES
  ('33333333-3333-3333-3333-333333333301', 'Taco de prueba', 1, 1),
  ('33333333-3333-3333-3333-333333333302', 'Taco 1', 1, 1),
  ('33333333-3333-3333-3333-333333333302', 'Taco 2', 1, 1),
  ('33333333-3333-3333-3333-333333333302', 'Agua', 1, 1),
  ('33333333-3333-3333-3333-333333333302', 'Refresco', 1, 1),
  ('33333333-3333-3333-3333-333333333303', 'Taco de prueba', 1, 1),
  ('33333333-3333-3333-3333-333333333303', 'Agua de jamaica', 1, 1);

COMMIT;
