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

-- Menú demo: precios bajos (1–5 ¢) para pruebas reales con pey.
-- No borra el menú en reset-demo; solo seed inicial / re-seed.
INSERT INTO public.menu_items (
  id, negocio_id, nombre, categoria, precio_centavos, activo, orden
) VALUES
  (
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a101',
    '11111111-1111-1111-1111-111111111111',
    'Taco al pastor', 'Tacos', 1, true, 1
  ),
  (
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a102',
    '11111111-1111-1111-1111-111111111111',
    'Taco de asada', 'Tacos', 2, true, 2
  ),
  (
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a103',
    '11111111-1111-1111-1111-111111111111',
    'Taco de suadero', 'Tacos', 2, true, 3
  ),
  (
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a104',
    '11111111-1111-1111-1111-111111111111',
    'Agua de jamaica', 'Bebidas', 1, true, 1
  ),
  (
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a105',
    '11111111-1111-1111-1111-111111111111',
    'Refresco', 'Bebidas', 1, true, 2
  ),
  (
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a106',
    '11111111-1111-1111-1111-111111111111',
    'Cerveza', 'Bebidas', 3, true, 3
  ),
  (
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a107',
    '11111111-1111-1111-1111-111111111111',
    'Flan', 'Postres', 2, true, 1
  ),
  (
    'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a108',
    '11111111-1111-1111-1111-111111111111',
    'Chocoflan', 'Postres', 5, true, 2
  )
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  precio_centavos = EXCLUDED.precio_centavos,
  activo = EXCLUDED.activo,
  orden = EXCLUDED.orden;

-- Precios normales (comentado; descomenta y ajusta para demo con montos reales):
-- UPDATE public.menu_items SET precio_centavos = 1800 WHERE id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a101'; -- Taco al pastor $18
-- UPDATE public.menu_items SET precio_centavos = 2200 WHERE id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a102'; -- Taco de asada $22
-- UPDATE public.menu_items SET precio_centavos = 2200 WHERE id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a103'; -- Taco de suadero $22
-- UPDATE public.menu_items SET precio_centavos = 2500 WHERE id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a104'; -- Agua de jamaica $25
-- UPDATE public.menu_items SET precio_centavos = 3000 WHERE id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a105'; -- Refresco $30
-- UPDATE public.menu_items SET precio_centavos = 4500 WHERE id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a106'; -- Cerveza $45
-- UPDATE public.menu_items SET precio_centavos = 3500 WHERE id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a107'; -- Flan $35
-- UPDATE public.menu_items SET precio_centavos = 4500 WHERE id = 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a108'; -- Chocoflan $45
