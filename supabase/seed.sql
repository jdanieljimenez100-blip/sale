-- Seed de demo: 1 negocio, 2 meseros, 3 mesas abiertas.
-- `mesa` lleva dígitos porque de ahí sale numRef para pey (^[0-9]{1,7}$).
-- Ana (2222…222) atiende mesas 1 y 2. Luis (2222…223) atiende mesa 3, sin cuenta pey.

INSERT INTO public.negocios (id, nombre, pey_bank_account_id)
VALUES ('11111111-1111-1111-1111-111111111111', 'Taquería Demo Sale', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.meseros (id, negocio_id, nombre, pey_bank_account_id)
VALUES
  (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Ana',
    NULL
  ),
  (
    '22222222-2222-2222-2222-222222222223',
    '11111111-1111-1111-1111-111111111111',
    'Luis',
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  negocio_id = EXCLUDED.negocio_id;

INSERT INTO public.cuentas (id, negocio_id, mesero_id, mesa, estado, total_centavos) VALUES
  (
    '33333333-3333-3333-3333-333333333301',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '1',
    'pendiente',
    1
  ),
  (
    '33333333-3333-3333-3333-333333333302',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '2',
    'pendiente',
    4
  ),
  (
    '33333333-3333-3333-3333-333333333303',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222223',
    '3',
    'pendiente',
    2
  )
ON CONFLICT (id) DO UPDATE SET
  mesero_id = EXCLUDED.mesero_id,
  mesa = EXCLUDED.mesa,
  estado = EXCLUDED.estado,
  total_centavos = EXCLUDED.total_centavos;

-- Partidas: limpia las de las mesas de demo y vuelve a insertar.
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
