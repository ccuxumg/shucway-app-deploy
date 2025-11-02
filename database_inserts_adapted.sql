-- Actualizar referencias a proveedor 12 a 7 (CENMA)
UPDATE orden_compra SET id_proveedor = 7 WHERE id_proveedor = 12;

-- Modificar restricción CHECK para incluir 'modificacion', 'creacion', 'eliminacion'
ALTER TABLE bitacora_ordenes_compra DROP CONSTRAINT bitacora_ordenes_compra_accion_check;
ALTER TABLE bitacora_ordenes_compra ADD CONSTRAINT bitacora_ordenes_compra_accion_check 
    CHECK (accion IN ('creacion_manual', 'creacion_automatica', 'aprobacion', 'rechazo', 'cancelacion', 'recepcion_parcial', 'recepcion_completa', 'modificacion', 'creacion', 'eliminacion'));

-- Insertar categorías de gasto
INSERT INTO "categoria_gasto" VALUES
(1, 'Materia Prima', 'Compra de insumos y materiales para producción', 'operativo', true),
(2, 'Embutidos', 'Compra de carnes, salchichas, chorizo, etc.', 'operativo', true),
(3, 'Panadería', 'Compra de pan, bollos, tortillas', 'operativo', true),
(4, 'Vegetales', 'Compra de verduras, aguacates, tomates, etc.', 'operativo', true),
(5, 'Desechables', 'Bolsas, vasos, platos, cubiertos desechables', 'operativo', true),
(6, 'Condimentos', 'Aceite, sal, salsas, especias', 'operativo', true),
(7, 'Servicios Públicos', 'Agua, luz, teléfono, internet', 'operativo', true),
(8, 'Salarios', 'Sueldos y prestaciones del personal', 'operativo', true),
(9, 'Mantenimiento', 'Reparaciones y mantenimiento de equipos', 'operativo', true),
(10, 'Alquiler', 'Renta de local comercial', 'operativo', true),
(11, 'Transporte', 'Gastos de combustible y transporte', 'operativo', true),
(12, 'Equipo y Mobiliario', 'Compra de equipo de cocina, mesas, sillas', 'inversion', true),
(13, 'Otros Gastos', 'Gastos operativos varios', 'operativo', true);

-- Insertar categorías de insumo
INSERT INTO "categoria_insumo" (id_categoria, nombre, descripcion, tipo_categoria)
SELECT * FROM (VALUES
(3, 'Lácteos', 'Quesos, leche, crema, mantequilla', 'operativo'),
(4, 'Panadería', 'Pan, tortillas, bollos y productos de panadería', 'operativo'),
(5, 'Condimentos y Salsas', 'Salsas, aderezos, especias y condimentos', 'perpetuo'),
(7, 'Desechables', 'Vasos, platos, cubiertos, servilletas desechables', 'perpetuo'),
(8, 'Limpieza', 'Productos de limpieza y desinfección', 'perpetuo'),
(9, 'Otros', 'Insumos varios no clasificados', 'perpetuo'),
(6, 'Bebida en Lata', 'Gaseosa en Lata', 'operativo'),
(10, 'Bebidas Calientes', 'Cafe', 'perpetuo'),
(2, 'Vegetales y Verduras', 'Verduras frescas, lechugas, tomates, cebollas', 'perpetuo'),
(1, 'Carnes ', 'Carnes, pollo, pescado y productos proteicos', 'operativo'),
(13, 'Embutidos', 'Salchichas, Salami, Chorizo, Tocino', 'operativo')
) AS v(id_categoria, nombre, descripcion, tipo_categoria)
ON CONFLICT (id_categoria) DO NOTHING;

-- Insertar categorías de producto
INSERT INTO categoria_producto (id_categoria, nombre_categoria, descripcion, estado) VALUES
(1, 'Shucos', 'Shucos tradicionales con diferentes tipos de carne', 'activo'),
(2, 'Hamburguesas', 'Hamburguesas de res, pollo y mixtas', 'activo'),
(3, 'Gringas', 'Tortillas de harina rellenas con carne y queso', 'activo'),
(4, 'Pollo', 'Productos de pollo frito y asado', 'activo'),
(5, 'Papas Fritas', 'Papas fritas en diferentes porciones', 'activo'),
(6, 'Salchipapas', 'Papas fritas con salchichas y aderezos', 'activo'),
(7, 'Bebidas', 'Refrescos, aguas y bebidas gaseosas', 'activo');

-- Insertar proveedores
INSERT INTO "proveedor" VALUES
(1, 'Panificadora Las Victorias', 'Departamento de Ventas', '2232-4123', 'ventas@lasvictorias.com.gt (por confirmar)', '5 Av 14-34 Z-1', true, 'Recoger en tienda', false),
(2, 'Pio Lindo', 'Departamento de Ventas', '6632 2300', NULL, '1a Calle 2-91 zona 5, Villa Nueva, C. Real, Villa Nueva', true, 'Recoger en tienda', false),
(3, 'Procasa', 'Departamento de Ventas', '2310 6066', 'meethouse@gmail.com', 'Km. 13.08 Carretera al Pacífico Z. 6, C.C. Metro Plaza, Local 9 y 9B, Villalobos', true, 'Recoger en tienda', false),
(4, 'Suplicentro', 'Departamento de Ventas', '4672-0841', 'pedidos@suplicentro.com.gt', 'Calzada Aguilar Batres 36-70 Zona 11', true, 'Recoger en tienda', false),
(5, 'Carnicería El Churrascón', 'Encargado de ventas', 'por confirmar', NULL, '8 Calle A 15-95, Villa Nueva', true, 'Recoger en tienda', false),
(6, 'Depósito Santo Thomas', 'Encargado de ventas', 'Sin contacto', NULL, '21A Avenida Villa Nueva, zona 12, Local 34', true, 'Recoger en tienda', false),
(7, 'CENMA', 'Puestos de ventas', NULL, NULL, '21A Avenida Villa Nueva, zona 12', true, 'Recoger en tienda', false);

-- Insertar insumos
INSERT INTO "insumo" VALUES
(1, 'Servilletas', 7, 'unidad', 4, '500.00', '1000.00', '25.00', '2025-10-29T06:19:14.532Z', NULL, true),
(2, 'Tenedor Tami', 7, 'unidad', 4, '100.00', '200.00', '7.50', '2025-10-29T06:19:14.532Z', NULL, true),
(3, 'Tenedor normal', 7, 'unidad', 4, '50.00', '100.00', '5.50', '2025-10-29T06:19:14.532Z', NULL, true),
(4, 'Cucharita Tami', 7, 'unidad', 4, '100.00', '200.00', '7.50', '2025-10-29T06:19:14.532Z', NULL, true),
(5, 'Cucharita normal', 7, 'unidad', 4, '50.00', '100.00', '5.50', '2025-10-29T06:19:14.532Z', NULL, true),
(6, 'Platos grandes', 7, 'unidad', 4, '1000.00', '2000.00', '71.00', '2025-10-29T06:19:14.532Z', NULL, true),
(7, 'Platos medianos', 7, 'unidad', 4, '1000.00', '2000.00', '55.00', '2025-10-29T06:19:14.532Z', NULL, true),
(8, 'Platos pequeños', 7, 'unidad', 4, '1000.00', '2000.00', '55.00', '2025-10-29T06:19:14.532Z', NULL, true),
(9, 'Papel antigrasa', 7, 'unidad', 4, '1000.00', '2000.00', '200.00', '2025-10-29T06:19:14.532Z', NULL, true),
(10, 'Bolsas 9×14', 7, 'unidad', 4, '70.00', '140.00', '7.50', '2025-10-29T06:19:14.532Z', NULL, true),
(11, 'Bolsas 8×11', 7, 'unidad', 4, '70.00', '140.00', '7.50', '2025-10-29T06:19:14.532Z', NULL, true),
(12, 'Bolsas 7×10', 7, 'unidad', 4, '70.00', '140.00', '7.50', '2025-10-29T06:19:14.532Z', NULL, true),
(13, 'Bolsas de gabacha pequeñas', 7, 'unidad', 4, '70.00', '140.00', '11.00', '2025-10-29T06:19:14.532Z', NULL, true),
(14, 'Bolsas de gabacha medianas', 7, 'unidad', 4, '70.00', '140.00', '13.00', '2025-10-29T06:19:14.532Z', NULL, true),
(15, 'Bolsas para basura', 7, 'unidad', 4, '25.00', '50.00', '27.50', '2025-10-29T06:19:14.532Z', NULL, true),
(16, 'Vasos 16 oz', 7, 'unidad', 4, '25.00', '50.00', '12.50', '2025-10-29T06:19:14.532Z', NULL, true),
(17, 'Vasos 14 oz', 7, 'unidad', 4, '25.00', '50.00', '10.50', '2025-10-29T06:19:14.532Z', NULL, true),
(18, 'Vasos 12 oz', 7, 'unidad', 4, '25.00', '50.00', '8.50', '2025-10-29T06:19:14.532Z', NULL, true),
(19, 'Vasos 8 oz', 7, 'unidad', 4, '25.00', '50.00', '8.50', '2025-10-29T06:19:14.532Z', NULL, true),
(20, 'Pajillas', 7, 'unidad', 4, '50.00', '100.00', '15.00', '2025-10-29T06:19:14.532Z', NULL, true),
(21, 'Palitos mezcladores de café', 7, 'unidad', 4, '5000.00', '10000.00', '85.00', '2025-10-29T06:19:14.532Z', NULL, true),
(22, 'Ketchup', 5, 'galón', 4, '1.00', '3.00', '33.00', '2025-10-29T07:08:24.465Z', NULL, true),
(23, 'Mayonesa', 5, 'galón', 4, '1.00', '3.00', '53.00', '2025-10-29T07:08:24.465Z', NULL, true),
(24, 'Mostaza', 5, 'galón', 4, '1.00', '3.00', '66.00', '2025-10-29T07:08:24.465Z', NULL, true),
(25, 'Queso líquido para papas fritas', 5, 'galón', 4, '1.00', '2.00', '80.00', '2025-10-29T07:08:24.465Z', NULL, true),
(26, 'Aderezo picante', 5, 'galón', 4, '1.00', '2.00', '54.00', '2025-10-29T07:08:24.465Z', NULL, true),
(27, 'Paprika', 5, 'libra', 4, '1.00', '2.00', '20.00', '2025-10-29T07:08:24.465Z', NULL, true),
(28, 'Pepita', 5, 'libra', 4, '1.00', '2.00', '20.00', '2025-10-29T07:08:24.465Z', NULL, true),
(29, 'Taquín', 5, 'libra', 4, '1.00', '2.00', '20.00', '2025-10-29T07:08:24.465Z', NULL, true),
(30, 'Sal', 5, 'libra', 4, '1.00', '2.00', '3.50', '2025-10-29T07:08:24.465Z', NULL, true),
(31, 'Consomé de pollo', 5, 'libra', 4, '1.00', '2.00', '17.50', '2025-10-29T07:08:24.465Z', NULL, true),
(32, 'Sazón completo', 5, 'libra', 4, '1.00', '2.00', '17.50', '2025-10-29T07:08:24.465Z', NULL, true),
(33, 'Sal de ajo', 5, 'libra', 4, '1.00', '2.00', '17.50', '2025-10-29T07:08:24.465Z', NULL, true),
(34, 'Sal de cebolla', 5, 'libra', 4, '1.00', '2.00', '17.50', '2025-10-29T07:08:24.465Z', NULL, true),
(35, 'Orégano', 5, 'libra', 4, '1.00', '2.00', '5.00', '2025-10-29T07:08:24.465Z', NULL, true),
(36, 'Harina', 5, 'libra', 4, '1.00', '2.00', '15.00', '2025-10-29T07:08:24.465Z', NULL, true),
(37, 'Aceite', 5, 'caneca', 4, '1.00', '3.00', '230.00', '2025-10-29T07:08:24.465Z', NULL, true),
(38, 'Manteca', 5, 'libra', 4, '1.00', '3.00', '7.78', '2025-10-29T07:08:24.465Z', NULL, true),
(39, 'Sazón de chimichurri', 5, 'sobre', 4, '1.00', '2.00', '2.75', '2025-10-29T07:08:24.465Z', NULL, true),
(40, 'Cebolla', 2, 'libra', 7, '0.00', '1.00', '5.00', '2025-10-29T07:18:36.022Z', NULL, true),
(41, 'Tomate', 2, 'libra', 7, '0.00', '2.00', '5.00', '2025-10-29T07:18:36.022Z', NULL, true),
(42, 'Pimiento', 2, 'unidad', 7, '0.00', '1.00', '3.00', '2025-10-29T07:18:36.022Z', NULL, true),
(43, 'Chile jalapeño', 2, 'libra', 7, '0.00', '1.00', '3.00', '2025-10-29T07:18:36.022Z', NULL, true),
(44, 'Tomate verde', 2, 'libra', 7, '0.00', '2.00', '3.00', '2025-10-29T07:18:36.022Z', NULL, true),
(45, 'Aguacate', 2, 'unidad', 7, '0.00', '1.00', '4.17', '2025-10-29T07:18:36.022Z', NULL, true),
(46, 'Piña', 2, 'unidad', 7, '0.00', '1.00', '10.00', '2025-10-29T07:18:36.022Z', NULL, true),
(47, 'Ajo', 2, 'libra', 7, '0.00', '1.00', '5.00', '2025-10-29T07:18:36.022Z', NULL, true),
(48, 'Cilantro', 2, 'manojo', 7, '0.00', '1.00', '2.00', '2025-10-29T07:18:36.022Z', NULL, true),
(49, 'Perejil', 2, 'manojo', 7, '0.00', '1.00', '2.00', '2025-10-29T07:18:36.022Z', NULL, true),
(50, 'Limón', 2, 'unidad', 7, '0.00', '1.00', '1.00', '2025-10-29T07:18:36.022Z', NULL, true),
(51, 'Repollo', 2, 'unidad', 7, '0.00', '1.00', '8.33', '2025-10-29T07:18:36.022Z', NULL, true),
(52, 'Pan de hamburguesa', 4, 'unidad', 1, '2.00', '10.00', '1.50', '2025-10-29T07:56:23.086Z', NULL, true),
(53, 'Pan de shuco', 4, 'unidad', 1, '2.00', '10.00', '1.70', '2025-10-29T07:56:23.086Z', NULL, true),
(54, 'Tortilla de harina (para gringas)', 4, 'unidad', 1, '2.00', '6.00', '1.20', '2025-10-29T07:56:23.086Z', NULL, true),
(55, 'Tortilla normal', 4, 'unidad', 1, '0.00', '6.00', '0.60', '2025-10-29T07:56:23.086Z', NULL, true),
(56, 'Longaniza', 13, 'unidad', 3, '1.00', '4.00', '1.00', '2025-10-29T08:18:28.679Z', NULL, true),
(57, 'Longaniza criolla', 13, 'unidad', 3, '1.00', '4.00', '2.00', '2025-10-29T08:18:28.679Z', NULL, true),
(58, 'Chorizo', 13, 'unidad', 3, '1.00', '4.00', '1.00', '2025-10-29T08:18:28.679Z', NULL, true),
(59, 'Salchicha', 13, 'unidad', 3, '1.00', '4.00', '0.60', '2025-10-29T08:18:28.679Z', NULL, true),
(60, 'Salami', 13, 'paquete', 3, '1.00', '4.00', '12.00', '2025-10-29T08:18:28.679Z', NULL, true),
(61, 'Tocino', 13, 'libra', 3, '1.00', '4.00', '30.00', '2025-10-29T08:18:28.679Z', NULL, true),
(62, 'Carne de res', 1, 'libra', 3, '5.00', '20.00', '35.00', '2025-10-29T08:18:28.679Z', NULL, true),
(63, 'Carne adobada', 1, 'libra', 3, '5.00', '20.00', '23.00', '2025-10-29T08:18:28.679Z', NULL, true),
(64, 'Carne para hamburguesa', 1, 'libra', 3, '5.00', '20.00', '20.00', '2025-10-29T08:18:28.679Z', NULL, true),
(65, 'Papa frita McPatata', 9, 'libra', NULL, '1.00', '2.00', '10.00', '2025-10-29T08:18:28.679Z', NULL, true),
(66, 'Queso para hamburguesa tipo craft', 3, 'paquete', 2, '1.00', '2.00', '20.00', '2025-10-29T08:18:28.679Z', NULL, true),
(67, 'Queso mozzarella', 3, 'libra', 2, '1.00', '2.00', '20.00', '2025-10-29T08:18:28.679Z', NULL, true),
(68, 'Quesillo', 1, 'libra', 3, '1.00', '2.00', '20.00', '2025-10-29T08:18:28.679Z', NULL, true),
(69, 'Mantequilla', 1, 'libra', 2, '1.00', '2.00', '8.00', '2025-10-29T08:18:28.679Z', NULL, true),
(70, 'Café', 10, 'libra', 7, '0.00', '0.00', '70.00', '2025-10-29T08:31:38.988Z', NULL, true),
(71, 'Azúcar', 10, 'libra', 7, '0.00', '0.00', '4.00', '2025-10-29T08:31:38.988Z', NULL, true),
(72, 'Cremora', 10, 'frasco', 7, '0.00', '0.00', '30.00', '2025-10-29T08:31:38.988Z', NULL, true),
(73, 'Agua', 10, 'garrafon', 7, '0.00', '0.00', '17.50', '2025-10-29T08:31:38.988Z', NULL, true),
(74, 'Soda en lata - tipo Q5', 6, 'lata', 7, '0.00', '0.00', '3.50', '2025-10-29T08:31:38.988Z', NULL, true),
(75, 'Soda en lata - tipo Q6', 6, 'lata', 7, '0.00', '0.00', '4.50', '2025-10-29T08:31:38.988Z', NULL, true),
(76, 'Encendedores', 9, 'unidad', NULL, '1.00', '4.00', '33.33', '2025-10-29T08:43:48.296Z', NULL, true),
(77, 'Tenazas', 9, 'unidad', NULL, '1.00', '4.00', '25.00', '2025-10-29T08:43:48.296Z', NULL, true),
(78, 'Cuchillos', 9, 'unidad', NULL, '1.00', '2.00', '250.00', '2025-10-29T08:43:48.296Z', NULL, true),
(79, 'Anillos de acero para huevos', 9, 'unidad', NULL, '1.00', '3.00', '25.00', '2025-10-29T08:43:48.296Z', NULL, true),
(80, 'Sartén', 9, 'unidad', NULL, '1.00', '2.00', '250.00', '2025-10-29T08:43:48.296Z', NULL, true),
(81, 'Pollo', 1, 'libra', 3, '5.00', '20.00', '25.00', '2025-10-29T08:18:28.679Z', NULL, true);

-- Insertar categorías de producto (solo si no existen)
INSERT INTO "categoria_producto" (id_categoria, nombre_categoria, descripcion, estado)
SELECT * FROM (VALUES
    (1, 'Papas Fritas', 'Productos de papa frita y acompañantes', 'activo'),
    (2, 'Pollo', 'Productos de pollo frito y asado', 'activo'),
    (3, 'Shucos', 'Tortillas con carne y acompañantes', 'activo'),
    (4, 'Salchipapas', 'Papas fritas con salchicha y queso', 'activo'),
    (5, 'Bebidas', 'Refrescos y bebidas gaseosas', 'activo'),
    (8, 'Hamburguesas', 'Hamburguesas de res, pollo y mixtas', 'activo'),
    (9, 'Gringas', 'Tortillas de harina rellenas con carne y queso', 'activo')
) AS v(id_categoria, nombre_categoria, descripcion, estado)
WHERE NOT EXISTS (
    SELECT 1 FROM categoria_producto
    WHERE categoria_producto.nombre_categoria = v.nombre_categoria
)
ON CONFLICT (id_categoria) DO NOTHING;

-- Insertar productos
INSERT INTO "producto" VALUES
(1, 'Shuco de Asada', NULL, '15.00', '9.75', 3, 'activo', NULL, '2025-10-17T04:15:17.884Z'),
(2, 'Shuco de Chorizo', NULL, '12.00', '6.08', 3, 'activo', NULL, '2025-10-17T04:15:17.884Z'),
(3, 'Shuco de Salami', NULL, '12.00', '6.08', 3, 'activo', NULL, '2025-10-17T04:15:17.884Z'),
(4, 'Shuco de Longaniza', NULL, '12.00', '6.08', 3, 'activo', NULL, '2025-10-17T04:15:17.884Z'),
(5, 'Shuco de Adobado', NULL, '15.00', '8.75', 3, 'activo', NULL, '2025-10-17T04:15:17.884Z'),
(6, 'Shuco de Salchicha', NULL, '12.00', '8.75', 3, 'activo', NULL, '2025-10-17T04:15:17.884Z'),
(7, 'Shuco Mixto', NULL, '18.00', '10.75', 3, 'activo', NULL, '2025-10-17T04:15:17.884Z'),
(8, 'McPatatas', NULL, '15.00', '10.00', 1, 'activo', NULL, '2025-10-17T04:15:17.884Z'),
(9, 'Pollo Burguer', NULL, '15.00', '8.00', 1, 'activo', NULL, '2025-10-17T04:15:17.884Z'),
(10, 'Cheesse Burger', NULL, '15.00', '8.00', 1, 'activo', NULL, '2025-10-17T04:15:17.884Z'),
(11, 'Torito', NULL, '20.00', '11.00', 1, 'activo', NULL, '2025-10-17T04:15:17.884Z'),
(12, 'Double Cheesse Burger', NULL, '20.00', '10.50', 1, 'activo', NULL, '2025-10-17T04:15:17.884Z'),
(13, 'Bacon Burger', NULL, '20.00', '13.00', 1, 'activo', NULL, '2025-10-17T04:15:17.884Z'),
(14, 'Torito Bacon Burguer', NULL, '25.00', '15.00', 1, 'activo', NULL, '2025-10-17T04:15:17.884Z'),
(15, 'Gringa Adobada', NULL, '20.00', '10.00', 3, 'activo', NULL, '2025-10-17T04:15:17.884Z'),
(16, 'Gringa Asada', NULL, '20.00', '10.00', 3, 'activo', NULL, '2025-10-17T04:15:17.884Z'),
(17, 'Gringa Mixta', NULL, '20.00', '15.00', 3, 'activo', NULL, '2025-10-17T04:15:17.884Z'),
(18, 'Salchipapas', NULL, '20.00', '14.00', 4, 'activo', NULL, '2025-10-17T04:15:17.884Z'),
(19, 'French Fries', NULL, '15.00', '9.00', 4, 'activo', NULL, '2025-10-17T04:15:17.884Z'),
(20, 'Coca Cola', NULL, '6.00', '4.30', 5, 'activo', NULL, '2025-10-17T04:15:17.884Z'),
(21, 'Pepsi Cola', NULL, '5.00', '3.80', 5, 'activo', NULL, '2025-10-17T04:15:17.884Z'),
(22, 'Cuadril de Pollo', NULL, '10.00', '6.66', 1, 'activo', NULL, '2025-10-17T04:15:17.884Z'),
(23, 'Pollo Frito con Papitas', NULL, '18.00', '9.16', 1, 'activo', NULL, '2025-10-17T04:15:17.884Z'),
(25, 'Pierna de Pollo', NULL, '9.00', '5.00', 1, 'activo', NULL, '2025-10-17T04:15:17.884Z');

-- Insertar variantes de productos
INSERT INTO "producto_variante" VALUES
(1, 5, 'Longaniza', '1.50', '3.00', 'activo', '2025-10-17T04:15:17.884Z'),
(2, 5, 'Salami', '1.50', '3.00', 'activo', '2025-10-17T04:15:17.884Z'),
(3, 5, 'Chorizo', '1.50', '3.00', 'activo', '2025-10-17T04:15:17.884Z'),
(4, 7, 'Asada + Chorizo', '0.00', '0.00', 'activo', '2025-10-17T04:15:17.884Z'),
(5, 7, 'Adobado + Longaniza', '0.00', '0.00', 'activo', '2025-10-17T04:15:17.884Z'),
(6, 10, 'Extra Queso', '1.50', '2.00', 'activo', '2025-10-17T04:15:17.884Z'),
(7, 11, 'Extra Queso', '1.50', '2.00', 'activo', '2025-10-17T04:15:17.884Z'),
(8, 12, 'Extra Queso', '1.50', '2.00', 'activo', '2025-10-17T04:15:17.884Z');

INSERT INTO cliente (id_cliente, nombre, telefono, puntos_acumulados, ultima_compra) VALUES
(1, 'Andrea Sofia Chafolla Mendez', '87654321', 1, '2025-10-25T10:30:00Z'),
(2, 'Carmi Emileny Cuxum Gonzalez', '76543210', 2, '2025-10-24T14:20:00Z'),
(3, 'Josué Daniel Figueroa Herrera', '65432109', 7, '2025-10-23T16:45:00Z'),
(4, 'Dilan René Escobar Rodríguez', '54321098', 3, '2025-10-22T12:15:00Z'),
(5, 'Bartola Angelica Grave Barrera', '43210987', 1, '2025-10-21T18:30:00Z');

-- Insertar presentaciones de insumos (para todos los insumos)
INSERT INTO insumo_presentacion (id_presentacion, id_insumo, id_proveedor, descripcion_presentacion, unidad_compra, unidades_por_presentacion, costo_compra_unitario, es_principal, activo) VALUES
-- Desechables
(1, 1, 1, 'Paquete 500 servilletas', 'unidad', 500, 0.25, true, true),
(2, 2, 1, 'Caja 100 tenedores Tami', 'unidad', 100, 0.75, true, true),
(3, 3, 1, 'Caja 50 tenedores normales', 'unidad', 50, 0.55, true, true),
(4, 4, 1, 'Caja 100 cucharitas Tami', 'unidad', 100, 0.75, true, true),
(5, 5, 1, 'Caja 50 cucharitas normales', 'unidad', 50, 0.55, true, true),
(6, 6, 1, 'Caja 100 platos grandes', 'unidad', 100, 7.10, true, true),
(7, 7, 1, 'Caja 100 platos medianos', 'unidad', 100, 5.50, true, true),
(8, 8, 1, 'Caja 100 platos pequeños', 'unidad', 100, 5.50, true, true),
(9, 9, 1, 'Rollo papel antigrasa', 'rollo', 1, 200.00, true, true),
(10, 10, 1, 'Paquete 70 bolsas 9×14', 'unidad', 70, 0.75, true, true),
(11, 11, 1, 'Paquete 70 bolsas 8×11', 'unidad', 70, 0.75, true, true),
(12, 12, 1, 'Paquete 70 bolsas 7×10', 'unidad', 70, 0.75, true, true),
(13, 13, 1, 'Paquete 70 bolsas gabacha pequeñas', 'unidad', 70, 1.10, true, true),
(14, 14, 1, 'Paquete 70 bolsas gabacha medianas', 'unidad', 70, 1.30, true, true),
(15, 15, 1, 'Paquete 25 bolsas basura', 'unidad', 25, 2.75, true, true),
(16, 16, 1, 'Paquete 25 vasos 16 oz', 'unidad', 25, 1.25, true, true),
(17, 17, 1, 'Paquete 25 vasos 14 oz', 'unidad', 25, 1.05, true, true),
(18, 18, 1, 'Paquete 25 vasos 12 oz', 'unidad', 25, 0.85, true, true),
(19, 19, 1, 'Paquete 25 vasos 8 oz', 'unidad', 25, 0.85, true, true),
(20, 20, 1, 'Paquete 50 pajillas', 'unidad', 50, 1.50, true, true),
(21, 21, 1, 'Caja 5000 palitos mezcladores', 'unidad', 5000, 0.085, true, true),

-- Condimentos
(22, 22, 1, 'Galón ketchup', 'galón', 1, 33.00, true, true),
(23, 23, 1, 'Galón mayonesa', 'galón', 1, 53.00, true, true),
(24, 24, 1, 'Galón mostaza', 'galón', 1, 66.00, true, true),
(25, 25, 1, 'Galón queso líquido', 'galón', 1, 80.00, true, true),
(26, 26, 1, 'Galón aderezo picante', 'galón', 1, 54.00, true, true),
(27, 27, 1, 'Libra paprika', 'libra', 1, 20.00, true, true),
(28, 28, 1, 'Libra pepita', 'libra', 1, 20.00, true, true),
(29, 29, 1, 'Libra taquín', 'libra', 1, 20.00, true, true),
(30, 30, 1, 'Libra sal', 'libra', 1, 3.50, true, true),
(31, 31, 1, 'Libra consomé pollo', 'libra', 1, 17.50, true, true),
(32, 32, 1, 'Libra sazón completo', 'libra', 1, 17.50, true, true),
(33, 33, 1, 'Libra sal ajo', 'libra', 1, 17.50, true, true),
(34, 34, 1, 'Libra sal cebolla', 'libra', 1, 17.50, true, true),
(35, 35, 1, 'Libra orégano', 'libra', 1, 5.00, true, true),
(36, 36, 1, 'Libra harina', 'libra', 1, 15.00, true, true),
(37, 37, 1, 'Caneca aceite', 'caneca', 1, 230.00, true, true),
(38, 38, 1, 'Libra manteca', 'libra', 1, 7.78, true, true),
(39, 39, 1, 'Sobre sazón chimichurri', 'sobre', 1, 2.75, true, true),

-- Vegetales
(40, 40, 1, 'Libra cebolla', 'libra', 1, 5.00, true, true),
(41, 41, 1, 'Libra tomate', 'libra', 1, 5.00, true, true),
(42, 42, 1, 'Unidad pimiento', 'unidad', 1, 3.00, true, true),
(43, 43, 1, 'Libra chile jalapeño', 'libra', 1, 3.00, true, true),
(44, 44, 1, 'Libra tomate verde', 'libra', 1, 3.00, true, true),
(45, 45, 1, 'Unidad aguacate', 'unidad', 1, 4.17, true, true),
(46, 46, 1, 'Unidad piña', 'unidad', 1, 10.00, true, true),
(47, 47, 1, 'Libra ajo', 'libra', 1, 5.00, true, true),
(48, 48, 1, 'Manojo cilantro', 'manojo', 1, 2.00, true, true),
(49, 49, 1, 'Manojo perejil', 'manojo', 1, 2.00, true, true),
(50, 50, 1, 'Unidad limón', 'unidad', 1, 1.00, true, true),
(51, 51, 1, 'Unidad repollo', 'unidad', 1, 8.33, true, true),

-- Panadería
(52, 52, 1, 'Unidad pan hamburguesa', 'unidad', 1, 1.50, true, true),
(53, 53, 1, 'Unidad pan shuco', 'unidad', 1, 1.70, true, true),
(54, 54, 1, 'Unidad tortilla harina gringa', 'unidad', 1, 1.20, true, true),
(55, 55, 1, 'Unidad tortilla normal', 'unidad', 1, 0.60, true, true),

-- Embutidos
(56, 56, 1, 'Unidad longaniza', 'unidad', 1, 1.00, true, true),
(57, 57, 1, 'Unidad longaniza criolla', 'unidad', 1, 2.00, true, true),
(58, 58, 1, 'Unidad chorizo', 'unidad', 1, 1.00, true, true),
(59, 59, 1, 'Unidad salchicha', 'unidad', 1, 0.60, true, true),
(60, 60, 1, 'Paquete salami', 'paquete', 1, 12.00, true, true),
(61, 61, 1, 'Libra tocino', 'libra', 1, 30.00, true, true),

-- Carnes
(62, 62, 1, 'Libra carne res', 'libra', 1, 35.00, true, true),
(63, 63, 1, 'Libra carne adobada', 'libra', 1, 23.00, true, true),
(64, 64, 1, 'Libra carne hamburguesa', 'libra', 1, 20.00, true, true),

-- Otros
(65, 65, 1, 'Libra papa frita McPatata', 'libra', 1, 10.00, true, true),
(66, 66, 1, 'Paquete queso craft', 'paquete', 1, 20.00, true, true),
(67, 67, 1, 'Libra queso mozzarella', 'libra', 1, 20.00, true, true),
(68, 68, 1, 'Libra quesillo', 'libra', 1, 20.00, true, true),
(69, 69, 1, 'Libra mantequilla', 'libra', 1, 8.00, true, true),

-- Bebidas
(70, 70, 1, 'Libra café', 'libra', 1, 70.00, true, true),
(71, 71, 1, 'Libra azúcar', 'libra', 1, 4.00, true, true),
(72, 72, 1, 'Frasco cremora', 'frasco', 1, 30.00, true, true),
(73, 73, 1, 'Garrafón agua', 'garrafon', 1, 17.50, true, true),
(74, 74, 1, 'Lata soda Q5', 'lata', 1, 3.50, true, true),
(75, 75, 1, 'Lata soda Q6', 'lata', 1, 4.50, true, true),

-- Otros insumos
(76, 76, 1, 'Unidad encendedores', 'unidad', 1, 33.33, true, true),
(77, 77, 1, 'Unidad tenazas', 'unidad', 1, 25.00, true, true),
(78, 78, 1, 'Unidad cuchillos', 'unidad', 1, 250.00, true, true),
(79, 79, 1, 'Unidad anillos acero huevos', 'unidad', 1, 25.00, true, true),
(80, 80, 1, 'Unidad sartén', 'unidad', 1, 250.00, true, true);

-- Los lotes se crean automáticamente en las recepciones
-- INSERT INTO lote_insumo removido para evitar conflictos

-- Insertar productos del menú
INSERT INTO producto (id_producto, nombre_producto, descripcion, precio_venta, costo_producto, id_categoria, estado, imagen_url, fecha_creacion) VALUES
-- Shucos (categoria 3)
(26, 'Shuco de Asada', 'Delicioso shuco con carne de res asada, acompañado de cebolla, cilantro y limón', 15.00, 9.75, 3, 'activo', '/productos/shuco-de-asada.png', '2025-10-29T06:19:14.532Z'),
(27, 'Shuco de Chorizo', 'Sabroso shuco con chorizo, acompañado de cebolla, cilantro y limón', 12.00, 6.08, 3, 'activo', '/productos/shuco-de-chorizo.png', '2025-10-29T06:19:14.532Z'),
(28, 'Shuco de Salami', 'Exquisito shuco con salami, acompañado de cebolla, cilantro y limón', 12.00, 6.08, 3, 'activo', '/productos/shuco-de-salami.png', '2025-10-29T06:19:14.532Z'),
(29, 'Shuco de Longaniza', 'Tradicional shuco con longaniza, acompañado de cebolla, cilantro y limón', 12.00, 6.08, 3, 'activo', '/productos/shuco-de-longaniza.png', '2025-10-29T06:19:14.532Z'),

-- Hamburguesas (categoria 2)
(30, 'Hamburguesa Clásica', 'Hamburguesa de res con queso, lechuga, tomate y aderezos', 25.00, 12.50, 2, 'activo', '/productos/hamburguesa-clasica.png', '2025-10-29T06:19:14.532Z'),
(31, 'Hamburguesa con Queso', 'Hamburguesa de res con doble queso cheddar', 28.00, 14.00, 2, 'activo', '/productos/hamburguesa-con-queso.png', '2025-10-29T06:19:14.532Z'),
(32, 'Hamburguesa Doble', 'Hamburguesa doble con queso, lechuga, tomate y aderezos', 35.00, 17.50, 2, 'activo', '/productos/hamburguesa-doble.png', '2025-10-29T06:19:14.532Z'),

-- Gringas (categoria 3)
(33, 'Gringa de Asada', 'Tortilla de harina rellena de carne asada, queso y aderezos', 18.00, 9.00, 3, 'activo', '/productos/gringa-de-asada.png', '2025-10-29T06:19:14.532Z'),
(34, 'Gringa de Chorizo', 'Tortilla de harina rellena de chorizo, queso y aderezos', 16.00, 8.00, 3, 'activo', '/productos/gringa-de-chorizo.png', '2025-10-29T06:19:14.532Z'),
(35, 'Gringa de Pollo', 'Tortilla de harina rellena de pollo, queso y aderezos', 16.00, 8.00, 3, 'activo', '/productos/gringa-de-pollo.png', '2025-10-29T06:19:14.532Z');

-- Insertar recetas para todos los productos
INSERT INTO receta_detalle (id_receta, id_producto, id_insumo, cantidad_requerida) VALUES
-- Shuco de Asada (26): tortilla, carne res, cebolla, cilantro, limón
(1, 26, 55, 1), -- tortilla normal
(2, 26, 62, 0.25), -- carne res
(3, 26, 40, 0.05), -- cebolla
(4, 26, 48, 0.01), -- cilantro
(5, 26, 50, 0.5), -- limón

-- Shuco de Chorizo (27): tortilla, chorizo, cebolla, cilantro, limón
(6, 27, 55, 1),
(7, 27, 58, 1),
(8, 27, 40, 0.05),
(9, 27, 48, 0.01),
(10, 27, 50, 0.5),

-- Shuco de Salami (28): tortilla, salami, cebolla, cilantro, limón
(11, 28, 55, 1),
(12, 28, 60, 0.1),
(13, 28, 40, 0.05),
(14, 28, 48, 0.01),
(15, 28, 50, 0.5),

-- Shuco de Longaniza (4): tortilla, longaniza, cebolla, cilantro, limón
(16, 4, 55, 1),
(17, 4, 56, 1),
(18, 4, 40, 0.05),
(19, 4, 48, 0.01),
(20, 4, 50, 0.5),

-- Shuco de Adobado (5): tortilla, carne adobada, cebolla, cilantro, limón
(21, 5, 55, 1),
(22, 5, 63, 0.25),
(23, 5, 40, 0.05),
(24, 5, 48, 0.01),
(25, 5, 50, 0.5),

-- Shuco de Salchicha (6): tortilla, salchicha, cebolla, cilantro, limón
(26, 6, 55, 1),
(27, 6, 59, 1),
(28, 6, 40, 0.05),
(29, 6, 48, 0.01),
(30, 6, 50, 0.5),

-- Shuco Mixto (7): tortilla, carne res, chorizo, cebolla, cilantro, limón
(31, 7, 55, 1),
(32, 7, 62, 0.125),
(33, 7, 58, 0.5),
(34, 7, 40, 0.05),
(35, 7, 48, 0.01),
(36, 7, 50, 0.5),

-- McPatatas (8): papa, aceite, sal
(37, 8, 65, 0.5),
(38, 8, 37, 0.05),
(39, 8, 30, 0.01),

-- Pollo Burguer (9): pan hamburguesa, pollo, queso, mayonesa
(40, 9, 52, 1),
(41, 9, 81, 0.2),
(42, 9, 67, 0.05),
(43, 9, 23, 0.02),

-- Cheesse Burger (10): pan hamburguesa, carne hamburguesa, queso, ketchup, mostaza
(44, 10, 52, 1),
(45, 10, 64, 0.2),
(46, 10, 67, 0.05),
(47, 10, 22, 0.01),
(48, 10, 24, 0.01),

-- Torito (11): pan hamburguesa, carne hamburguesa, queso, tocino, mayonesa
(49, 11, 52, 1),
(50, 11, 64, 0.25),
(51, 11, 67, 0.05),
(52, 11, 61, 0.05),
(53, 11, 23, 0.02),

-- Double Cheesse Burger (12): pan hamburguesa, carne hamburguesa x2, queso x2, ketchup, mostaza
(54, 12, 52, 1),
(55, 12, 64, 0.4),
(56, 12, 67, 0.1),
(57, 12, 22, 0.01),
(58, 12, 24, 0.01),

-- Bacon Burger (13): pan hamburguesa, carne hamburguesa, queso, tocino, ketchup, mostaza
(59, 13, 52, 1),
(60, 13, 64, 0.2),
(61, 13, 67, 0.05),
(62, 13, 61, 0.05),
(63, 13, 22, 0.01),
(64, 13, 24, 0.01),

-- Torito Bacon Burguer (14): pan hamburguesa, carne hamburguesa, queso, tocino x2, mayonesa
(65, 14, 52, 1),
(66, 14, 64, 0.25),
(67, 14, 67, 0.05),
(68, 14, 61, 0.1),
(69, 14, 23, 0.02),

-- Gringa Adobada (15): tortilla harina, carne adobada, cebolla, cilantro, queso
(70, 15, 54, 1),
(71, 15, 63, 0.25),
(72, 15, 40, 0.05),
(73, 15, 48, 0.01),
(74, 15, 67, 0.05),

-- Gringa Asada (16): tortilla harina, carne res, cebolla, cilantro, queso
(75, 16, 54, 1),
(76, 16, 62, 0.25),
(77, 16, 40, 0.05),
(78, 16, 48, 0.01),
(79, 16, 67, 0.05),

-- Gringa Mixta (17): tortilla harina, carne res, chorizo, cebolla, cilantro, queso
(80, 17, 54, 1),
(81, 17, 62, 0.125),
(82, 17, 58, 0.5),
(83, 17, 40, 0.05),
(84, 17, 48, 0.01),
(85, 17, 67, 0.05),

-- Salchipapas (18): papa, salchicha, queso líquido, aceite
(86, 18, 65, 0.5),
(87, 18, 59, 2),
(88, 18, 25, 0.05),
(89, 18, 37, 0.05),

-- French Fries (19): papa, aceite, sal
(90, 19, 65, 0.5),
(91, 19, 37, 0.05),
(92, 19, 30, 0.01),

-- Coca Cola (20): lata soda Q5
(93, 20, 74, 1),

-- Pepsi Cola (21): lata soda Q6
(94, 21, 75, 1),

-- Cuadril de Pollo (22): pollo, aceite
(95, 22, 81, 0.2),
(96, 22, 37, 0.02),

-- Pollo Frito con Papitas (23): pollo, papa, aceite, sal
(97, 23, 81, 0.3),
(98, 23, 65, 0.3),
(99, 23, 37, 0.05),
(100, 23, 30, 0.01),

-- Pierna de Pollo (25): pollo, aceite
(101, 25, 81, 0.15),
(102, 25, 37, 0.02);

-- Insertar orden de compra 1: Desechables y Limpieza (Proveedor 4 - Suplicentro)
INSERT INTO orden_compra (id_orden, fecha_orden, tipo_orden, estado, id_proveedor, creado_por, aprobado_por, motivo_generacion, fecha_aprobacion, fecha_entrega_estimada) VALUES
(1, CURRENT_TIMESTAMP - INTERVAL '7 days', 'manual', 'aprobada', 7, 1, 1, 'Compra inicial de insumos', CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_DATE + INTERVAL '3 days');

INSERT INTO detalle_orden_compra (id_detalle, id_orden, id_presentacion, cantidad, precio_unitario) VALUES
(1, 1, 1, 5, 0.50), -- servilletas
(2, 1, 2, 20, 1.00), -- tenedores tami
(3, 1, 3, 30, 1.00), -- tenedores normales
(4, 1, 4, 20, 1.00), -- cucharitas tami
(5, 1, 5, 30, 1.00), -- cucharitas normales
(6, 1, 6, 15, 10.00), -- platos grandes
(7, 1, 7, 15, 10.00), -- platos medianos
(8, 1, 8, 15, 10.00), -- platos pequeños
(9, 1, 9, 2, 200.00), -- papel antigrasa
(10, 1, 10, 20, 1.00), -- bolsas 9x14
(11, 1, 11, 20, 1.00), -- bolsas 8x11
(12, 1, 12, 20, 1.00), -- bolsas 7x10
(13, 1, 13, 20, 1.00), -- bolsas gabacha pequeñas
(14, 1, 14, 20, 1.00), -- bolsas gabacha medianas
(15, 1, 15, 5, 1.00), -- bolsas basura
(16, 1, 16, 50, 1.00), -- vasos 16oz
(17, 1, 17, 50, 1.00), -- vasos 14oz
(18, 1, 18, 50, 1.00), -- vasos 12oz
(19, 1, 19, 50, 1.00), -- vasos 8oz
(20, 1, 20, 30, 1.00), -- pajillas
(21, 1, 21, 1, 0.017); -- palitos mezcladores

-- Recepción completa para OC 1
INSERT INTO recepcion_mercaderia (id_recepcion, id_orden, fecha_recepcion, id_perfil, numero_factura) VALUES
(1, 1, CURRENT_TIMESTAMP - INTERVAL '6 days', 1, 'FAC-001-2025');

INSERT INTO detalle_recepcion_mercaderia (id_detalle, id_recepcion, id_detalle_orden, cantidad_recibida, cantidad_aceptada, id_lote, id_presentacion) VALUES
(1, 1, 1, 5, 5, NULL, 1), (2, 1, 2, 20, 20, NULL, 2), (3, 1, 3, 30, 30, NULL, 3), (4, 1, 4, 20, 20, NULL, 4),
(5, 1, 5, 30, 30, NULL, 5), (6, 1, 6, 15, 15, NULL, 6), (7, 1, 7, 15, 15, NULL, 7), (8, 1, 8, 15, 15, NULL, 8),
(9, 1, 9, 2, 2, NULL, 9), (10, 1, 10, 20, 20, NULL, 10), (11, 1, 11, 20, 20, NULL, 11), (12, 1, 12, 20, 20, NULL, 12),
(13, 1, 13, 20, 20, NULL, 13), (14, 1, 14, 20, 20, NULL, 14), (15, 1, 15, 5, 5, NULL, 15), (16, 1, 16, 50, 50, NULL, 16),
(17, 1, 17, 50, 50, NULL, 17), (18, 1, 18, 50, 50, NULL, 18), (19, 1, 19, 50, 50, NULL, 19), (20, 1, 20, 30, 30, NULL, 20),
(21, 1, 21, 1, 1, NULL, 21);

-- Los movimientos se generan automáticamente con los triggers
-- UPDATE orden_compra removido, se hace automáticamente

-- Recalcular subtotal e IVA en detalle_orden_compra si no están calculados
UPDATE detalle_orden_compra SET precio_unitario = precio_unitario WHERE subtotal IS NULL OR iva IS NULL;

-- Insertar orden de compra 2: Condimentos y Salsas (Proveedor 3 - Procasa)
INSERT INTO orden_compra (id_orden, fecha_orden, tipo_orden, estado, id_proveedor, creado_por, aprobado_por, motivo_generacion, fecha_aprobacion, fecha_entrega_estimada) VALUES
(2, CURRENT_TIMESTAMP - INTERVAL '6 days', 'manual', 'aprobada', 7, 1, 1, 'Compra de condimentos', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_DATE + INTERVAL '2 days');

INSERT INTO detalle_orden_compra (id_detalle, id_orden, id_presentacion, cantidad, precio_unitario) VALUES
(22, 2, 22, 3, 33.00), -- ketchup
(23, 2, 23, 2, 53.00), -- mayonesa
(24, 2, 24, 2, 66.00), -- mostaza
(25, 2, 25, 2, 80.00), -- queso líquido
(26, 2, 26, 2, 54.00), -- aderezo picante
(27, 2, 27, 10, 20.00), -- paprika
(28, 2, 28, 10, 20.00), -- pepita
(29, 2, 29, 10, 20.00), -- taquín
(30, 2, 30, 10, 3.50), -- sal
(31, 2, 31, 5, 17.50), -- consomé pollo
(32, 2, 32, 5, 17.50), -- sazón completo
(33, 2, 33, 5, 17.50), -- sal ajo
(34, 2, 34, 5, 17.50), -- sal cebolla
(35, 2, 35, 5, 5.00), -- orégano
(36, 2, 36, 10, 15.00), -- harina
(37, 2, 37, 2, 230.00), -- aceite
(38, 2, 38, 15, 7.78), -- manteca
(39, 2, 39, 10, 2.75); -- sazón chimichurri

-- Recepción completa para OC 2
INSERT INTO recepcion_mercaderia (id_recepcion, id_orden, fecha_recepcion, id_perfil, numero_factura) VALUES
(2, 2, CURRENT_TIMESTAMP - INTERVAL '5 days', 1, 'FAC-002-2025');

INSERT INTO detalle_recepcion_mercaderia (id_detalle, id_recepcion, id_detalle_orden, cantidad_recibida, cantidad_aceptada, id_lote, id_presentacion) VALUES
(22, 2, 22, 3, 3, NULL, 22), (23, 2, 23, 2, 2, NULL, 23), (24, 2, 24, 2, 2, NULL, 24), (25, 2, 25, 2, 2, NULL, 25),
(26, 2, 26, 2, 2, NULL, 26), (27, 2, 27, 10, 10, NULL, 27), (28, 2, 28, 10, 10, NULL, 28), (29, 2, 29, 10, 10, NULL, 29),
(30, 2, 30, 10, 10, NULL, 30), (31, 2, 31, 5, 5, NULL, 31), (32, 2, 32, 5, 5, NULL, 32), (33, 2, 33, 5, 5, NULL, 33),
(34, 2, 34, 5, 5, NULL, 34), (35, 2, 35, 5, 5, NULL, 35), (36, 2, 36, 10, 10, NULL, 36), (37, 2, 37, 2, 2, NULL, 37),
(38, 2, 38, 15, 15, NULL, 38), (39, 2, 39, 10, 10, NULL, 39);

-- Insertar orden de compra 3: Vegetales (Proveedor 12 - CENMA)
INSERT INTO orden_compra (id_orden, fecha_orden, tipo_orden, estado, id_proveedor, creado_por, aprobado_por, motivo_generacion, fecha_aprobacion, fecha_entrega_estimada) VALUES
(3, CURRENT_TIMESTAMP - INTERVAL '5 days', 'manual', 'aprobada', 7, 1, 1, 'Compra de vegetales', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_DATE + INTERVAL '1 day');

INSERT INTO detalle_orden_compra (id_detalle, id_orden, id_presentacion, cantidad, precio_unitario) VALUES
(40, 3, 40, 30, 5.00), -- cebolla
(41, 3, 41, 25, 5.00), -- tomate
(42, 3, 42, 20, 3.00), -- pimiento
(43, 3, 43, 15, 3.00), -- chile jalapeño
(44, 3, 44, 20, 3.00), -- tomate verde
(45, 3, 45, 50, 4.17), -- aguacate
(46, 3, 46, 20, 10.00), -- piña
(47, 3, 47, 15, 5.00), -- ajo
(48, 3, 48, 80, 2.00), -- cilantro
(49, 3, 49, 80, 2.00), -- perejil
(50, 3, 50, 150, 1.00), -- limón
(51, 3, 51, 30, 8.33); -- repollo

-- Recepción completa para OC 3
INSERT INTO recepcion_mercaderia (id_recepcion, id_orden, fecha_recepcion, id_perfil, numero_factura) VALUES
(3, 3, CURRENT_TIMESTAMP - INTERVAL '4 days', 1, 'FAC-003-2025');

INSERT INTO detalle_recepcion_mercaderia (id_detalle, id_recepcion, id_detalle_orden, cantidad_recibida, cantidad_aceptada, id_lote, id_presentacion) VALUES
(40, 3, 40, 30, 30, NULL, 40), (41, 3, 41, 25, 25, NULL, 41), (42, 3, 42, 20, 20, NULL, 42), (43, 3, 43, 15, 15, NULL, 43),
(44, 3, 44, 20, 20, NULL, 44), (45, 3, 45, 50, 50, NULL, 45), (46, 3, 46, 20, 20, NULL, 46), (47, 3, 47, 15, 15, NULL, 47),
(48, 3, 48, 80, 80, NULL, 48), (49, 3, 49, 80, 80, NULL, 49), (50, 3, 50, 150, 150, NULL, 50), (51, 3, 51, 30, 30, NULL, 51);

-- Insertar orden de compra 4: Panadería (Proveedor 1 - Panificadora Las Victorias)
INSERT INTO orden_compra (id_orden, fecha_orden, tipo_orden, estado, id_proveedor, creado_por, aprobado_por, motivo_generacion, fecha_aprobacion, fecha_entrega_estimada) VALUES
(4, CURRENT_TIMESTAMP - INTERVAL '4 days', 'manual', 'aprobada', 1, 1, 1, 'Compra de panadería', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_DATE + INTERVAL '2 days');

INSERT INTO detalle_orden_compra (id_detalle, id_orden, id_presentacion, cantidad, precio_unitario) VALUES
(52, 4, 52, 300, 1.50), -- pan hamburguesa
(53, 4, 53, 300, 1.70), -- pan shuco
(54, 4, 54, 150, 1.20), -- tortilla harina gringa
(55, 4, 55, 800, 0.60); -- tortilla normal

-- Recepción completa para OC 4
INSERT INTO recepcion_mercaderia (id_recepcion, id_orden, fecha_recepcion, id_perfil, numero_factura) VALUES
(4, 4, CURRENT_TIMESTAMP - INTERVAL '3 days', 1, 'FAC-004-2025');

INSERT INTO detalle_recepcion_mercaderia (id_detalle, id_recepcion, id_detalle_orden, cantidad_recibida, cantidad_aceptada, id_lote, id_presentacion) VALUES
(52, 4, 52, 300, 300, NULL, 52), (53, 4, 53, 300, 300, NULL, 53), (54, 4, 54, 150, 150, NULL, 54), (55, 4, 55, 800, 800, NULL, 55);

-- Insertar orden de compra 5: Carnes y Embutidos (Proveedor 5 - Carnicería El Churrascón)
INSERT INTO orden_compra (id_orden, fecha_orden, tipo_orden, estado, id_proveedor, creado_por, aprobado_por, motivo_generacion, fecha_aprobacion, fecha_entrega_estimada) VALUES
(5, CURRENT_TIMESTAMP - INTERVAL '3 days', 'manual', 'aprobada', 5, 1, 1, 'Compra de embutidos', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_DATE + INTERVAL '1 day');

INSERT INTO detalle_orden_compra (id_detalle, id_orden, id_presentacion, cantidad, precio_unitario) VALUES
(56, 5, 56, 80, 1.00), -- longaniza
(57, 5, 57, 80, 2.00), -- longaniza criolla
(58, 5, 58, 80, 1.00), -- chorizo
(59, 5, 59, 300, 0.60), -- salchicha
(60, 5, 60, 8, 12.00), -- salami
(61, 5, 61, 8, 30.00), -- tocino
(62, 5, 62, 30, 35.00), -- carne res
(63, 5, 63, 25, 23.00), -- carne adobada
(64, 5, 64, 40, 20.00); -- carne hamburguesa

-- Recepción completa para OC 5
INSERT INTO recepcion_mercaderia (id_recepcion, id_orden, fecha_recepcion, id_perfil, numero_factura) VALUES
(5, 5, CURRENT_TIMESTAMP - INTERVAL '2 days', 1, 'FAC-005-2025');

INSERT INTO detalle_recepcion_mercaderia (id_detalle, id_recepcion, id_detalle_orden, cantidad_recibida, cantidad_aceptada, id_lote, id_presentacion) VALUES
(56, 5, 56, 80, 80, NULL, 56), (57, 5, 57, 80, 80, NULL, 57), (58, 5, 58, 80, 80, NULL, 58), (59, 5, 59, 300, 300, NULL, 59),
(60, 5, 60, 8, 8, NULL, 60), (61, 5, 61, 8, 8, NULL, 61), (62, 5, 62, 30, 30, NULL, 62), (63, 5, 63, 25, 25, NULL, 63),
(64, 5, 64, 40, 40, NULL, 64);

-- Insertar orden de compra 6: Lácteos y Otros (Proveedor 2 - Pio Lindo)
INSERT INTO orden_compra (id_orden, fecha_orden, tipo_orden, estado, id_proveedor, creado_por, aprobado_por, motivo_generacion, fecha_aprobacion, fecha_entrega_estimada) VALUES
(6, CURRENT_TIMESTAMP - INTERVAL '2 days', 'manual', 'aprobada', 2, 1, 1, 'Compra de otros insumos', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_DATE + INTERVAL '3 days');

INSERT INTO detalle_orden_compra (id_detalle, id_orden, id_presentacion, cantidad, precio_unitario) VALUES
(65, 6, 65, 80, 10.00), -- papa
(66, 6, 66, 15, 20.00), -- queso craft
(67, 6, 67, 15, 20.00), -- queso mozzarella
(68, 6, 68, 10, 20.00), -- quesillo
(69, 6, 69, 10, 8.00), -- mantequilla
(70, 6, 70, 5, 70.00), -- café
(71, 6, 71, 10, 4.00), -- azúcar
(72, 6, 72, 5, 30.00), -- cremora
(73, 6, 73, 10, 17.50), -- agua
(74, 6, 74, 300, 3.50), -- soda Q5
(75, 6, 75, 300, 4.50); -- soda Q6

-- Recepción completa para OC 6
INSERT INTO recepcion_mercaderia (id_recepcion, id_orden, fecha_recepcion, id_perfil, numero_factura) VALUES
(6, 6, CURRENT_TIMESTAMP - INTERVAL '1 day', 1, 'FAC-006-2025');

INSERT INTO detalle_recepcion_mercaderia (id_detalle, id_recepcion, id_detalle_orden, cantidad_recibida, cantidad_aceptada, id_lote, id_presentacion) VALUES
(65, 6, 65, 80, 80, NULL, 65), (66, 6, 66, 15, 15, NULL, 66), (67, 6, 67, 15, 15, NULL, 67), (68, 6, 68, 10, 10, NULL, 68),
(69, 6, 69, 10, 10, NULL, 69), (70, 6, 70, 5, 5, NULL, 70), (71, 6, 71, 10, 10, NULL, 71), (72, 6, 72, 5, 5, NULL, 72),
(73, 6, 73, 10, 10, NULL, 73), (74, 6, 74, 300, 300, NULL, 74), (75, 6, 75, 300, 300, NULL, 75);

-- Insertar arqueo de caja inicial
INSERT INTO arqueo_caja (id_arqueo, fecha_arqueo, id_cajero, total_sistema, estado) VALUES
(1, CURRENT_DATE, 1, 100.00, 'abierto');

-- Insertar algunas ventas de ejemplo (completas)
INSERT INTO venta (id_venta, fecha_venta, id_cliente, tipo_pago, id_cajero) VALUES
(1, CURRENT_TIMESTAMP, 1, 'Cash', 1),
(2, CURRENT_TIMESTAMP, 2, 'Cash', 1),
(3, CURRENT_TIMESTAMP, 3, 'Transferencia', 1);

-- Insertar detalles de venta (se calcularán precios automáticamente)
INSERT INTO detalle_venta (id_detalle, id_venta, id_producto, cantidad, precio_unitario) VALUES
(1, 1, 1, 1, 15.00), -- Shuco de Asada
(2, 1, 8, 1, 15.00), -- McPatatas
(3, 1, 20, 1, 6.00), -- Coca Cola
(4, 2, 10, 1, 15.00), -- Cheesse Burger
(5, 2, 19, 1, 15.00), -- French Fries
(6, 3, 7, 1, 18.00), -- Shuco Mixto
(7, 3, 21, 2, 5.00); -- Pepsi Cola

-- Cerrar arqueo (con cálculos automáticos)
UPDATE arqueo_caja SET 
    billetes_100 = 1,
    estado = 'cerrado'
WHERE id_arqueo = 1;

-- Insertar roles de usuario
INSERT INTO rol_usuario (id_rol, nombre_rol, descripcion, nivel_permisos, permisos, activo) VALUES
(1, 'cliente', 'Usuario cliente con permisos básicos', 10, '{"ver_productos": true, "comprar": true}'::jsonb, true),
(2, 'cajero', 'Usuario cajero para ventas y arqueos', 50, '{"ver_productos": true, "comprar": true, "vender": true, "arqueo_caja": true}'::jsonb, true),
(3, 'administrador', 'Usuario administrador con permisos completos', 90, '{"ver_productos": true, "comprar": true, "vender": true, "arqueo_caja": true, "gestionar_inventario": true, "gestionar_usuarios": true, "gestionar_proveedores": true}'::jsonb, true),
(4, 'propietario', 'Usuario propietario con permisos totales', 100, '{"ver_productos": true, "comprar": true, "vender": true, "arqueo_caja": true, "gestionar_inventario": true, "gestionar_usuarios": true, "gestionar_proveedores": true, "gestionar_finanzas": true}'::jsonb, true);

-- Insertar usuarios de ejemplo
INSERT INTO perfil_usuario (id_perfil, email, password_hash, primer_nombre, primer_apellido, username, id_rol, estado) VALUES
(1, 'admin@shucway.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'Sistema', 'admin', 3, 'activo'), -- password: password
(2, 'cajero@shucway.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Juan', 'Pérez', 'cajero1', 2, 'activo'), -- password: password
(3, 'cliente@shucway.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'María', 'García', 'cliente1', 1, 'activo'); -- password: password
