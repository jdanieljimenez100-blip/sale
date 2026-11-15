-- Seed de demo: 1 negocio, 1 mesero, 3 mesas abiertas.
-- `mesa` lleva dígitos porque de ahí sale numRef para pey (^ [0-9]{1,7} $).

INSERT INTO public.negocios (id, nombre, pey_bank_account_id)
VALUES ('11111111-1111-1111-1111-111111111111', 'Taquería Demo Sale', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.meseros (id, negocio_id, nombre, pey_bank_account_id)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Ana Mesera',
  NULL
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cuentas (id, negocio_id, mesero_id, mesa, estado, total_centavos) VALUES
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '1', 'pendiente', 1),
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '2', 'pendiente', 1),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '3', 'pendiente', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.partidas (cuenta_id, descripcion, cantidad, precio_centavos)
SELECT v.cuenta_id, v.descripcion, v.cantidad, v.precio_centavos
FROM (
  VALUES
    ('33333333-3333-3333-3333-333333333301'::uuid, 'Taco de prueba', 1, 1),
    ('33333333-3333-3333-3333-333333333302'::uuid, 'Agua de jamaica', 1, 1),
    ('33333333-3333-3333-3333-333333333303'::uuid, 'Taco de prueba', 1, 1),
    ('33333333-3333-3333-3333-333333333303'::uuid, 'Agua de jamaica', 1, 1)
) AS v(cuenta_id, descripcion, cantidad, precio_centavos)
WHERE NOT EXISTS (
  SELECT 1 FROM public.partidas p WHERE p.cuenta_id = v.cuenta_id
);
