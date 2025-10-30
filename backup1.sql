-- Backup generado automáticamente
-- Fecha: 2025-10-29T03:44:23.219Z

DROP TABLE IF EXISTS "arqueo_caja" CASCADE;
CREATE TABLE "arqueo_caja" (
  "id_arqueo" integer NOT NULL DEFAULT nextval('arqueo_caja_id_arqueo_seq'::regclass),
  "fecha_arqueo" date DEFAULT CURRENT_DATE,
  "id_cajero" integer,
  "billetes_100" integer DEFAULT 0,
  "billetes_50" integer DEFAULT 0,
  "billetes_20" integer DEFAULT 0,
  "billetes_10" integer DEFAULT 0,
  "billetes_5" integer DEFAULT 0,
  "monedas_1" integer DEFAULT 0,
  "monedas_050" integer DEFAULT 0,
  "monedas_025" integer DEFAULT 0,
  "total_billetes_100" numeric,
  "total_billetes_50" numeric,
  "total_billetes_20" numeric,
  "total_billetes_10" numeric,
  "total_billetes_5" numeric,
  "total_monedas_1" numeric,
  "total_monedas_050" numeric,
  "total_monedas_025" numeric,
  "total_contado" numeric,
  "total_sistema" numeric NOT NULL,
  "diferencia" numeric,
  "observaciones" text,
  "estado" character varying DEFAULT 'abierto'::character varying
);

DROP TABLE IF EXISTS "bitacora_insumo" CASCADE;
CREATE TABLE "bitacora_insumo" (
  "id_bitacora" integer NOT NULL DEFAULT nextval('bitacora_insumo_id_bitacora_seq'::regclass),
  "id_insumo" integer NOT NULL,
  "accion" text NOT NULL,
  "fecha" timestamp with time zone NOT NULL DEFAULT now()
);

INSERT INTO "bitacora_insumo" VALUES
(1, 1, 'INSERT', '2025-10-29T00:19:14.532Z'),
(2, 2, 'INSERT', '2025-10-29T00:19:14.532Z'),
(3, 3, 'INSERT', '2025-10-29T00:19:14.532Z'),
(4, 4, 'INSERT', '2025-10-29T00:19:14.532Z'),
(5, 5, 'INSERT', '2025-10-29T00:19:14.532Z'),
(6, 6, 'INSERT', '2025-10-29T00:19:14.532Z'),
(7, 7, 'INSERT', '2025-10-29T00:19:14.532Z'),
(8, 8, 'INSERT', '2025-10-29T00:19:14.532Z'),
(9, 9, 'INSERT', '2025-10-29T00:19:14.532Z'),
(10, 10, 'INSERT', '2025-10-29T00:19:14.532Z'),
(11, 11, 'INSERT', '2025-10-29T00:19:14.532Z'),
(12, 12, 'INSERT', '2025-10-29T00:19:14.532Z'),
(13, 13, 'INSERT', '2025-10-29T00:19:14.532Z'),
(14, 14, 'INSERT', '2025-10-29T00:19:14.532Z'),
(15, 15, 'INSERT', '2025-10-29T00:19:14.532Z'),
(16, 16, 'INSERT', '2025-10-29T00:19:14.532Z'),
(17, 17, 'INSERT', '2025-10-29T00:19:14.532Z'),
(18, 18, 'INSERT', '2025-10-29T00:19:14.532Z'),
(19, 19, 'INSERT', '2025-10-29T00:19:14.532Z'),
(20, 20, 'INSERT', '2025-10-29T00:19:14.532Z'),
(21, 21, 'INSERT', '2025-10-29T00:19:14.532Z'),
(22, 22, 'INSERT', '2025-10-29T01:08:24.465Z'),
(23, 23, 'INSERT', '2025-10-29T01:08:24.465Z'),
(24, 24, 'INSERT', '2025-10-29T01:08:24.465Z'),
(25, 25, 'INSERT', '2025-10-29T01:08:24.465Z'),
(26, 26, 'INSERT', '2025-10-29T01:08:24.465Z'),
(27, 27, 'INSERT', '2025-10-29T01:08:24.465Z'),
(28, 28, 'INSERT', '2025-10-29T01:08:24.465Z'),
(29, 29, 'INSERT', '2025-10-29T01:08:24.465Z'),
(30, 30, 'INSERT', '2025-10-29T01:08:24.465Z'),
(31, 31, 'INSERT', '2025-10-29T01:08:24.465Z'),
(32, 32, 'INSERT', '2025-10-29T01:08:24.465Z'),
(33, 33, 'INSERT', '2025-10-29T01:08:24.465Z'),
(34, 34, 'INSERT', '2025-10-29T01:08:24.465Z'),
(35, 35, 'INSERT', '2025-10-29T01:08:24.465Z'),
(36, 36, 'INSERT', '2025-10-29T01:08:24.465Z'),
(37, 37, 'INSERT', '2025-10-29T01:08:24.465Z'),
(38, 38, 'INSERT', '2025-10-29T01:08:24.465Z'),
(39, 39, 'INSERT', '2025-10-29T01:08:24.465Z'),
(40, 40, 'INSERT', '2025-10-29T01:18:36.022Z'),
(41, 41, 'INSERT', '2025-10-29T01:18:36.022Z'),
(42, 42, 'INSERT', '2025-10-29T01:18:36.022Z'),
(43, 43, 'INSERT', '2025-10-29T01:18:36.022Z'),
(44, 44, 'INSERT', '2025-10-29T01:18:36.022Z'),
(45, 45, 'INSERT', '2025-10-29T01:18:36.022Z'),
(46, 46, 'INSERT', '2025-10-29T01:18:36.022Z'),
(47, 47, 'INSERT', '2025-10-29T01:18:36.022Z'),
(48, 48, 'INSERT', '2025-10-29T01:18:36.022Z'),
(49, 49, 'INSERT', '2025-10-29T01:18:36.022Z'),
(50, 50, 'INSERT', '2025-10-29T01:18:36.022Z'),
(51, 51, 'INSERT', '2025-10-29T01:18:36.022Z'),
(52, 40, 'UPDATE', '2025-10-29T01:28:59.893Z'),
(53, 41, 'UPDATE', '2025-10-29T01:28:59.893Z'),
(54, 42, 'UPDATE', '2025-10-29T01:28:59.893Z'),
(55, 43, 'UPDATE', '2025-10-29T01:28:59.893Z'),
(56, 44, 'UPDATE', '2025-10-29T01:28:59.893Z'),
(57, 45, 'UPDATE', '2025-10-29T01:28:59.893Z'),
(58, 46, 'UPDATE', '2025-10-29T01:28:59.893Z'),
(59, 47, 'UPDATE', '2025-10-29T01:28:59.893Z'),
(60, 48, 'UPDATE', '2025-10-29T01:28:59.893Z'),
(61, 49, 'UPDATE', '2025-10-29T01:28:59.893Z'),
(62, 50, 'UPDATE', '2025-10-29T01:28:59.893Z'),
(63, 51, 'UPDATE', '2025-10-29T01:28:59.893Z'),
(64, 52, 'INSERT', '2025-10-29T01:56:23.086Z'),
(65, 53, 'INSERT', '2025-10-29T01:56:23.086Z'),
(66, 54, 'INSERT', '2025-10-29T01:56:23.086Z'),
(67, 55, 'INSERT', '2025-10-29T01:56:23.086Z'),
(68, 56, 'INSERT', '2025-10-29T02:18:28.679Z'),
(69, 57, 'INSERT', '2025-10-29T02:18:28.679Z'),
(70, 58, 'INSERT', '2025-10-29T02:18:28.679Z'),
(71, 59, 'INSERT', '2025-10-29T02:18:28.679Z'),
(72, 60, 'INSERT', '2025-10-29T02:18:28.679Z'),
(73, 61, 'INSERT', '2025-10-29T02:18:28.679Z'),
(74, 62, 'INSERT', '2025-10-29T02:18:28.679Z'),
(75, 63, 'INSERT', '2025-10-29T02:18:28.679Z'),
(76, 64, 'INSERT', '2025-10-29T02:18:28.679Z'),
(77, 65, 'INSERT', '2025-10-29T02:18:28.679Z'),
(78, 66, 'INSERT', '2025-10-29T02:18:28.679Z'),
(79, 67, 'INSERT', '2025-10-29T02:18:28.679Z'),
(80, 68, 'INSERT', '2025-10-29T02:18:28.679Z'),
(81, 69, 'INSERT', '2025-10-29T02:18:28.679Z'),
(82, 70, 'INSERT', '2025-10-29T02:31:38.988Z'),
(83, 71, 'INSERT', '2025-10-29T02:31:38.988Z'),
(84, 72, 'INSERT', '2025-10-29T02:31:38.988Z'),
(85, 73, 'INSERT', '2025-10-29T02:31:38.988Z'),
(86, 74, 'INSERT', '2025-10-29T02:31:38.988Z'),
(87, 75, 'INSERT', '2025-10-29T02:31:38.988Z'),
(88, 76, 'INSERT', '2025-10-29T02:43:48.296Z'),
(89, 77, 'INSERT', '2025-10-29T02:43:48.296Z'),
(90, 78, 'INSERT', '2025-10-29T02:43:48.296Z'),
(91, 79, 'INSERT', '2025-10-29T02:43:48.296Z'),
(92, 80, 'INSERT', '2025-10-29T02:43:48.296Z');

DROP TABLE IF EXISTS "bitacora_inventario" CASCADE;
CREATE TABLE "bitacora_inventario" (
  "id_bitacora_inventario" integer NOT NULL DEFAULT nextval('bitacora_inventario_id_bitacora_inventario_seq'::regclass),
  "id_insumo" integer,
  "accion" character varying,
  "campo_modificado" character varying,
  "valor_anterior" text,
  "valor_nuevo" text,
  "id_perfil" integer,
  "fecha_accion" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "ip_address" character varying,
  "descripcion" text
);

DROP TABLE IF EXISTS "bitacora_ordenes_compra" CASCADE;
CREATE TABLE "bitacora_ordenes_compra" (
  "id_bitacora_orden" integer NOT NULL DEFAULT nextval('bitacora_ordenes_compra_id_bitacora_orden_seq'::regclass),
  "id_orden" integer,
  "accion" character varying,
  "estado_anterior" character varying,
  "estado_nuevo" character varying,
  "id_perfil" integer,
  "fecha_accion" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "ip_address" character varying,
  "descripcion" text,
  "datos_adicionales" jsonb
);

DROP TABLE IF EXISTS "bitacora_productos" CASCADE;
CREATE TABLE "bitacora_productos" (
  "id_bitacora_producto" integer NOT NULL DEFAULT nextval('bitacora_productos_id_bitacora_producto_seq'::regclass),
  "id_producto" integer,
  "accion" character varying,
  "campo_modificado" character varying,
  "valor_anterior" text,
  "valor_nuevo" text,
  "id_perfil" integer,
  "fecha_accion" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "descripcion" text
);

INSERT INTO "bitacora_productos" VALUES
(1, 1, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: Shuco de Asada'),
(2, 2, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: Shuco de Chorizo'),
(3, 3, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: Shuco de Salami'),
(4, 4, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: Shuco de Longaniza'),
(5, 5, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: Shuco de Adobado'),
(6, 6, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: Shuco de Salchicha'),
(7, 7, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: Shuco Mixto'),
(8, 8, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: McPatatas'),
(9, 9, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: Pollo Burguer'),
(10, 10, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: Cheesse Burger'),
(11, 11, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: Torito'),
(12, 12, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: Double Cheesse Burger'),
(13, 13, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: Bacon Burger'),
(14, 14, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: Torito Bacon Burguer'),
(15, 15, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: Gringa Adobada'),
(16, 16, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: Gringa Asada'),
(17, 17, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: Gringa Mixta'),
(18, 18, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: Salchipapas'),
(19, 19, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: French Fries'),
(20, 20, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: Coca Cola'),
(21, 21, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: Pepsi Cola'),
(22, 22, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: Cuadril de Pollo'),
(23, 23, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: Pollo Frito con Papitas'),
(24, 24, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: 2 Pollo Frito Con Papitas Fritas'),
(25, 25, 'creacion', NULL, NULL, NULL, NULL, '2025-10-17T04:15:17.884Z', 'Producto creado: Pierna de Pollo');

DROP TABLE IF EXISTS "bitacora_seguridad" CASCADE;
CREATE TABLE "bitacora_seguridad" (
  "id_bitacora_seguridad" integer NOT NULL DEFAULT nextval('bitacora_seguridad_id_bitacora_seguridad_seq'::regclass),
  "id_perfil" integer NOT NULL,
  "intentos_fallidos" integer DEFAULT 0,
  "ultimo_intento_fallido" timestamp without time zone,
  "bloqueado_hasta" timestamp without time zone,
  "token_recuperacion" character varying,
  "token_expiracion" timestamp without time zone,
  "tipo_evento" character varying,
  "ip_address" character varying,
  "user_agent" text,
  "descripcion" text,
  "fecha_evento" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "bitacora_seguridad" VALUES
(1, 1, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-20T07:54:39.660Z'),
(36, 1, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-20T08:42:08.053Z'),
(37, 1, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-20T08:42:26.661Z'),
(38, 1, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-20T09:07:57.618Z'),
(39, 1, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-20T10:31:46.605Z'),
(43, 4, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-27T05:30:01.784Z'),
(44, 1, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-27T05:30:34.345Z'),
(45, 1, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-27T05:30:51.260Z'),
(46, 4, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-27T06:06:15.443Z'),
(47, 4, 0, NULL, NULL, NULL, NULL, 'cambio_password', NULL, NULL, 'Contraseña modificada exitosamente.', '2025-10-27T07:15:23.761Z'),
(48, 2, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-27T07:17:12.464Z'),
(49, 7, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-27T07:17:19.793Z'),
(50, 7, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-27T07:17:35.892Z'),
(51, 7, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-27T07:30:04.446Z'),
(52, 7, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-27T07:30:09.832Z'),
(53, 7, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-27T19:19:21.967Z'),
(54, 7, 0, NULL, NULL, NULL, NULL, 'cambio_password', NULL, NULL, 'Contraseña modificada exitosamente.', '2025-10-27T19:19:42.887Z'),
(55, 7, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-27T19:37:41.783Z'),
(56, 2, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-27T19:37:53.790Z'),
(57, 2, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-27T19:38:04.043Z'),
(58, 4, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-28T03:04:46.199Z'),
(59, 4, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-28T05:20:26.570Z'),
(60, 1, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-29T02:19:24.240Z'),
(61, 1, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-29T02:20:01.501Z'),
(62, 1, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-29T02:21:46.027Z'),
(63, 2, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-29T02:24:35.421Z'),
(64, 1, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-29T02:27:36.360Z'),
(65, 7, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-29T02:27:47.394Z'),
(66, 7, 0, NULL, NULL, NULL, NULL, 'actualizacion_perfil', NULL, NULL, 'Usuario actualizado. Cambios realizados en perfil.', '2025-10-29T02:28:01.047Z'),
(67, 2, 0, NULL, NULL, NULL, NULL, 'cambio_password', NULL, NULL, 'Contraseña modificada exitosamente.', '2025-10-29T04:02:48.993Z');

DROP TABLE IF EXISTS "bitacora_ventas" CASCADE;
CREATE TABLE "bitacora_ventas" (
  "id_bitacora_venta" integer NOT NULL DEFAULT nextval('bitacora_ventas_id_bitacora_venta_seq'::regclass),
  "id_venta" integer,
  "accion" character varying,
  "estado_anterior" character varying,
  "estado_nuevo" character varying,
  "id_perfil" integer,
  "fecha_accion" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "ip_address" character varying,
  "descripcion" text,
  "datos_adicionales" jsonb
);

DROP TABLE IF EXISTS "categoria_gasto" CASCADE;
CREATE TABLE "categoria_gasto" (
  "id_categoria" integer NOT NULL DEFAULT nextval('categoria_gasto_id_categoria_seq'::regclass),
  "nombre" character varying NOT NULL,
  "descripcion" text,
  "tipo_gasto" character varying DEFAULT 'operativo'::character varying,
  "activo" boolean DEFAULT true
);

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

DROP TABLE IF EXISTS "categoria_insumo" CASCADE;
CREATE TABLE "categoria_insumo" (
  "id_categoria" integer NOT NULL DEFAULT nextval('categoria_insumo_id_categoria_seq'::regclass),
  "nombre" character varying NOT NULL,
  "descripcion" text,
  "tipo_categoria" character varying DEFAULT 'operativo'::character varying
);

INSERT INTO "categoria_insumo" VALUES
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
(13, 'Embutidos', 'Salchichas, Salami, Chorizo, Tocino', 'operativo');

DROP TABLE IF EXISTS "categoria_producto" CASCADE;
CREATE TABLE "categoria_producto" (
  "id_categoria" integer NOT NULL DEFAULT nextval('categoria_producto_id_categoria_seq'::regclass),
  "nombre_categoria" character varying NOT NULL,
  "descripcion" text,
  "estado" character varying DEFAULT 'activo'::character varying
);

INSERT INTO "categoria_producto" VALUES
(1, 'Hamburguesas', 'Hamburguesas de res, pollo y mixtas', 'activo'),
(3, 'Shucos', 'Shucos tradicionales guatemaltecos', 'activo'),
(4, 'Acompañamientos', 'Papas fritas, aros de cebolla, ensaladas', 'activo'),
(5, 'Bebidas', 'Refrescos, jugos, aguas y bebidas calientes', 'activo'),
(6, 'Postres', 'Helados, pasteles y postres variados', 'activo'),
(7, 'Combos', 'Combos y paquetes promocionales', 'activo'),
(9, 'Perritos', 'perros', 'desactivado');

DROP TABLE IF EXISTS "cliente" CASCADE;
CREATE TABLE "cliente" (
  "id_cliente" integer NOT NULL DEFAULT nextval('cliente_id_cliente_seq'::regclass),
  "nombre" character varying NOT NULL,
  "telefono" character varying,
  "puntos_acumulados" integer DEFAULT 0,
  "fecha_registro" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "ultima_compra" timestamp without time zone,
  "direccion" character varying
);

DROP TABLE IF EXISTS "deposito_banco" CASCADE;
CREATE TABLE "deposito_banco" (
  "id_deposito" integer NOT NULL DEFAULT nextval('deposito_banco_id_deposito_seq'::regclass),
  "fecha_deposito" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "descripcion" text NOT NULL,
  "tipo_pago" character varying NOT NULL,
  "monto" numeric NOT NULL,
  "id_perfil" integer,
  "comprobante_url" character varying,
  "notas" text
);

DROP TABLE IF EXISTS "detalle_orden_compra" CASCADE;
CREATE TABLE "detalle_orden_compra" (
  "id_detalle" integer NOT NULL DEFAULT nextval('detalle_orden_compra_id_detalle_seq'::regclass),
  "id_orden" integer,
  "id_insumo" integer,
  "cantidad" numeric NOT NULL,
  "precio_unitario" numeric NOT NULL,
  "subtotal" numeric,
  "iva" numeric DEFAULT 0,
  "cantidad_recibida" numeric DEFAULT 0
);

DROP TABLE IF EXISTS "detalle_recepcion_mercaderia" CASCADE;
CREATE TABLE "detalle_recepcion_mercaderia" (
  "id_detalle" integer NOT NULL DEFAULT nextval('detalle_recepcion_mercaderia_id_detalle_seq'::regclass),
  "id_recepcion" integer,
  "id_detalle_orden" integer,
  "cantidad_recibida" numeric NOT NULL,
  "cantidad_aceptada" numeric NOT NULL,
  "cantidad_rechazada" numeric DEFAULT 0,
  "motivo_rechazo" text,
  "id_lote" integer
);

DROP TABLE IF EXISTS "detalle_venta" CASCADE;
CREATE TABLE "detalle_venta" (
  "id_detalle" integer NOT NULL DEFAULT nextval('detalle_venta_id_detalle_seq'::regclass),
  "id_venta" integer,
  "id_producto" integer,
  "id_variante" integer,
  "cantidad" numeric NOT NULL,
  "precio_unitario" numeric NOT NULL,
  "costo_unitario" numeric NOT NULL,
  "subtotal" numeric,
  "costo_total" numeric,
  "ganancia" numeric,
  "descuento" numeric DEFAULT 0,
  "es_canje_puntos" boolean DEFAULT false,
  "puntos_canjeados" integer DEFAULT 0
);

DROP TABLE IF EXISTS "gasto_operativo" CASCADE;
CREATE TABLE "gasto_operativo" (
  "id_gasto" integer NOT NULL DEFAULT nextval('gasto_operativo_id_gasto_seq'::regclass),
  "numero_gasto" character varying,
  "fecha_gasto" date DEFAULT CURRENT_DATE,
  "id_categoria" integer,
  "detalle" text NOT NULL,
  "monto" numeric NOT NULL,
  "id_perfil" integer,
  "id_proveedor" integer,
  "comprobante_url" character varying,
  "tipo_movimiento" character varying DEFAULT 'compra'::character varying
);

DROP TABLE IF EXISTS "historial_puntos" CASCADE;
CREATE TABLE "historial_puntos" (
  "id_historial" integer NOT NULL DEFAULT nextval('historial_puntos_id_historial_seq'::regclass),
  "id_cliente" integer NOT NULL,
  "id_venta" integer,
  "tipo_movimiento" character varying NOT NULL,
  "puntos_anterior" integer NOT NULL,
  "puntos_movimiento" integer NOT NULL,
  "puntos_nuevo" integer NOT NULL,
  "descripcion" text,
  "fecha_movimiento" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "id_cajero" integer
);

DROP TABLE IF EXISTS "insumo" CASCADE;
CREATE TABLE "insumo" (
  "id_insumo" integer NOT NULL DEFAULT nextval('insumo_id_insumo_seq'::regclass),
  "nombre_insumo" character varying NOT NULL,
  "id_categoria" integer NOT NULL,
  "id_proveedor_principal" integer,
  "stock_minimo" numeric DEFAULT 0.00,
  "stock_maximo" numeric DEFAULT 0.00,
  "costo_promedio" numeric DEFAULT 0,
  "fecha_registro" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "activo" boolean DEFAULT true,
  "tipo_categoria" character varying DEFAULT 'operativo'::character varying,
  "unidad_base" text NOT NULL DEFAULT 'unidad'::text,
  "unidad_compra" text NOT NULL DEFAULT 'unidad'::text,
  "unidades_por_presentacion" numeric NOT NULL DEFAULT 1,
  "presentacion_detalle" text
);

INSERT INTO "insumo" VALUES
(1, 'Servilletas', 7, 4, '500.00', '1000.00', '25.00', '2025-10-29T06:19:14.532Z', true, 'perpetuo', 'unidad', 'paquete', '500.000000', 'Paquete 500 unidades'),
(2, 'Tenedor Tami', 7, 4, '100.00', '200.00', '7.50', '2025-10-29T06:19:14.532Z', true, 'perpetuo', 'unidad', 'paquete', '100.000000', 'Paquete 100 unidades'),
(3, 'Tenedor normal', 7, 4, '50.00', '100.00', '5.50', '2025-10-29T06:19:14.532Z', true, 'perpetuo', 'unidad', 'paquete', '50.000000', 'Paquete 50 unidades'),
(4, 'Cucharita Tami', 7, 4, '100.00', '200.00', '7.50', '2025-10-29T06:19:14.532Z', true, 'perpetuo', 'unidad', 'paquete', '100.000000', 'Paquete 100 unidades'),
(5, 'Cucharita normal', 7, 4, '50.00', '100.00', '5.50', '2025-10-29T06:19:14.532Z', true, 'perpetuo', 'unidad', 'paquete', '50.000000', 'Paquete 50 unidades'),
(6, 'Platos grandes', 7, 4, '1000.00', '2000.00', '71.00', '2025-10-29T06:19:14.532Z', true, 'perpetuo', 'unidad', 'millar', '1000.000000', 'Millar'),
(7, 'Platos medianos', 7, 4, '1000.00', '2000.00', '55.00', '2025-10-29T06:19:14.532Z', true, 'perpetuo', 'unidad', 'millar', '1000.000000', 'Millar'),
(8, 'Platos pequeños', 7, 4, '1000.00', '2000.00', '55.00', '2025-10-29T06:19:14.532Z', true, 'perpetuo', 'unidad', 'millar', '1000.000000', 'Millar'),
(9, 'Papel antigrasa', 7, 4, '1000.00', '2000.00', '200.00', '2025-10-29T06:19:14.532Z', true, 'perpetuo', 'unidad', 'millar', '1000.000000', 'Millar'),
(10, 'Bolsas 9×14', 7, 4, '70.00', '140.00', '7.50', '2025-10-29T06:19:14.532Z', true, 'perpetuo', 'unidad', 'paquete', '70.000000', 'Paquete 70 unidades'),
(11, 'Bolsas 8×11', 7, 4, '70.00', '140.00', '7.50', '2025-10-29T06:19:14.532Z', true, 'perpetuo', 'unidad', 'paquete', '70.000000', 'Paquete 70 unidades'),
(12, 'Bolsas 7×10', 7, 4, '70.00', '140.00', '7.50', '2025-10-29T06:19:14.532Z', true, 'perpetuo', 'unidad', 'paquete', '70.000000', 'Paquete 70 unidades'),
(13, 'Bolsas de gabacha pequeñas', 7, 4, '70.00', '140.00', '11.00', '2025-10-29T06:19:14.532Z', true, 'perpetuo', 'unidad', 'paquete', '70.000000', 'Paquete 70 unidades'),
(14, 'Bolsas de gabacha medianas', 7, 4, '70.00', '140.00', '13.00', '2025-10-29T06:19:14.532Z', true, 'perpetuo', 'unidad', 'paquete', '70.000000', 'Paquete 70 unidades'),
(15, 'Bolsas para basura', 7, 4, '25.00', '50.00', '27.50', '2025-10-29T06:19:14.532Z', true, 'perpetuo', 'unidad', 'rollo', '25.000000', 'Rollo 25 unidades'),
(16, 'Vasos 16 oz', 7, 4, '25.00', '50.00', '12.50', '2025-10-29T06:19:14.532Z', true, 'perpetuo', 'unidad', 'bolsa', '25.000000', 'Bolsa 25 unidades'),
(17, 'Vasos 14 oz', 7, 4, '25.00', '50.00', '10.50', '2025-10-29T06:19:14.532Z', true, 'perpetuo', 'unidad', 'bolsa', '25.000000', 'Bolsa 25 unidades'),
(18, 'Vasos 12 oz', 7, 4, '25.00', '50.00', '8.50', '2025-10-29T06:19:14.532Z', true, 'perpetuo', 'unidad', 'bolsa', '25.000000', 'Bolsa 25 unidades'),
(19, 'Vasos 8 oz', 7, 4, '25.00', '50.00', '8.50', '2025-10-29T06:19:14.532Z', true, 'perpetuo', 'unidad', 'bolsa', '25.000000', 'Bolsa 25 unidades'),
(20, 'Pajillas', 7, 4, '50.00', '100.00', '15.00', '2025-10-29T06:19:14.532Z', true, 'perpetuo', 'unidad', 'bolsa', '50.000000', 'Bolsa 50 unidades'),
(21, 'Palitos mezcladores de café', 7, 4, '5000.00', '10000.00', '85.00', '2025-10-29T06:19:14.532Z', true, 'perpetuo', 'unidad', 'paquete', '5000.000000', 'Paquete 5000 unidades'),
(22, 'Ketchup', 5, 12, '1.00', '3.00', '33.00', '2025-10-29T07:08:24.465Z', true, 'perpetuo', 'galón', 'galón', '1.000000', 'Galón'),
(23, 'Mayonesa', 5, 12, '1.00', '3.00', '53.00', '2025-10-29T07:08:24.465Z', true, 'perpetuo', 'galón', 'galón', '1.000000', 'Galón'),
(24, 'Mostaza', 5, 12, '1.00', '3.00', '66.00', '2025-10-29T07:08:24.465Z', true, 'perpetuo', 'galón', 'galón', '0.500000', '1/2 galón'),
(25, 'Queso líquido para papas fritas', 5, 12, '1.00', '2.00', '80.00', '2025-10-29T07:08:24.465Z', true, 'perpetuo', 'galón', 'galón', '0.250000', '1/4 galón'),
(26, 'Aderezo picante', 5, 12, '1.00', '2.00', '54.00', '2025-10-29T07:08:24.465Z', true, 'perpetuo', 'galón', 'galón', '0.500000', '1/2 galón'),
(27, 'Paprika', 5, 12, '1.00', '2.00', '20.00', '2025-10-29T07:08:24.465Z', true, 'perpetuo', 'libra', 'libra', '1.000000', 'Libra'),
(28, 'Pepita', 5, 12, '1.00', '2.00', '20.00', '2025-10-29T07:08:24.465Z', true, 'perpetuo', 'libra', 'libra', '1.000000', 'Libra'),
(29, 'Taquín', 5, 12, '1.00', '2.00', '20.00', '2025-10-29T07:08:24.465Z', true, 'perpetuo', 'libra', 'libra', '1.000000', 'Libra'),
(30, 'Sal', 5, 12, '1.00', '2.00', '3.50', '2025-10-29T07:08:24.465Z', true, 'perpetuo', 'libra', 'libra', '1.000000', 'Libra'),
(31, 'Consomé de pollo', 5, 12, '1.00', '2.00', '17.50', '2025-10-29T07:08:24.465Z', true, 'perpetuo', 'libra', 'libra', '1.000000', 'Libra'),
(32, 'Sazón completo', 5, 12, '1.00', '2.00', '17.50', '2025-10-29T07:08:24.465Z', true, 'perpetuo', 'libra', 'libra', '1.000000', 'Libra'),
(33, 'Sal de ajo', 5, 12, '1.00', '2.00', '17.50', '2025-10-29T07:08:24.465Z', true, 'perpetuo', 'libra', 'libra', '1.000000', 'Libra'),
(34, 'Sal de cebolla', 5, 12, '1.00', '2.00', '17.50', '2025-10-29T07:08:24.465Z', true, 'perpetuo', 'libra', 'libra', '1.000000', 'Libra'),
(35, 'Orégano', 5, 12, '1.00', '2.00', '5.00', '2025-10-29T07:08:24.465Z', true, 'perpetuo', 'libra', 'libra', '1.000000', 'Para salsa → Libra'),
(36, 'Harina', 5, 6, '1.00', '2.00', '15.00', '2025-10-29T07:08:24.465Z', true, 'perpetuo', 'libra', 'libra', '1.000000', 'Libra'),
(37, 'Aceite', 5, 6, '1.00', '3.00', '230.00', '2025-10-29T07:08:24.465Z', true, 'perpetuo', 'caneca', 'caneca', '1.000000', 'Caneca'),
(38, 'Manteca', 5, 6, '1.00', '3.00', '7.78', '2025-10-29T07:08:24.465Z', true, 'perpetuo', 'libra', 'caja', '27.000000', 'Caja 27 libras'),
(39, 'Sazón de chimichurri', 5, 12, '1.00', '2.00', '2.75', '2025-10-29T07:08:24.465Z', true, 'perpetuo', 'sobre', 'paquete', '12.000000', 'Paquete 12 sobres'),
(40, 'Cebolla', 2, 12, '0.00', '1.00', '5.00', '2025-10-29T07:18:36.022Z', true, 'perpetuo', 'libra', 'libra', '1.000000', 'Libra'),
(41, 'Tomate', 2, 12, '0.00', '2.00', '5.00', '2025-10-29T07:18:36.022Z', true, 'perpetuo', 'libra', 'libra', '1.000000', 'Libra'),
(42, 'Pimiento', 2, 12, '0.00', '1.00', '3.00', '2025-10-29T07:18:36.022Z', true, 'perpetuo', 'unidad', 'unidad', '1.000000', 'Unidad'),
(43, 'Chile jalapeño', 2, 12, '0.00', '1.00', '3.00', '2025-10-29T07:18:36.022Z', true, 'perpetuo', 'libra', 'libra', '1.000000', 'Libra'),
(44, 'Tomate verde', 2, 12, '0.00', '2.00', '3.00', '2025-10-29T07:18:36.022Z', true, 'perpetuo', 'libra', 'libra', '1.000000', 'Libra'),
(45, 'Aguacate', 2, 12, '0.00', '1.00', '4.17', '2025-10-29T07:18:36.022Z', true, 'perpetuo', 'unidad', 'caja', '60.000000', 'Caja 60 unidades'),
(46, 'Piña', 2, 12, '0.00', '1.00', '10.00', '2025-10-29T07:18:36.022Z', true, 'perpetuo', 'unidad', 'unidad', '1.000000', 'Unidad'),
(47, 'Ajo', 2, 12, '0.00', '1.00', '5.00', '2025-10-29T07:18:36.022Z', true, 'perpetuo', 'libra', 'libra', '1.000000', 'Libra'),
(48, 'Cilantro', 2, 12, '0.00', '1.00', '2.00', '2025-10-29T07:18:36.022Z', true, 'perpetuo', 'manojo', 'manojo', '1.000000', 'Manojo'),
(49, 'Perejil', 2, 12, '0.00', '1.00', '2.00', '2025-10-29T07:18:36.022Z', true, 'perpetuo', 'manojo', 'manojo', '1.000000', 'Manojo'),
(50, 'Limón', 2, 12, '0.00', '1.00', '1.00', '2025-10-29T07:18:36.022Z', true, 'perpetuo', 'unidad', 'ciento', '100.000000', 'Ciento 100 unidades'),
(51, 'Repollo', 2, 12, '0.00', '1.00', '8.33', '2025-10-29T07:18:36.022Z', true, 'perpetuo', 'unidad', 'docena', '12.000000', 'Docena 12 unidades'),
(52, 'Pan de hamburguesa', 4, 1, '2.00', '10.00', '1.50', '2025-10-29T07:56:23.086Z', true, 'operativo', 'unidad', 'bolsa', '5.000000', 'Bolsa 5 unidades'),
(53, 'Pan de chuco', 4, 1, '2.00', '10.00', '1.70', '2025-10-29T07:56:23.086Z', true, 'operativo', 'unidad', 'bolsa', '10.000000', 'Bolsa 10 unidades'),
(54, 'Tortilla de harina (para gringas)', 4, 6, '2.00', '6.00', '1.20', '2025-10-29T07:56:23.086Z', true, 'operativo', 'unidad', 'bolsa', '10.000000', 'Bolsa 10 unidades'),
(55, 'Tortilla normal', 4, 6, '0.00', '6.00', '0.60', '2025-10-29T07:56:23.086Z', true, 'operativo', 'unidad', 'bolsa', '20.000000', 'Bolsa 20 unidades'),
(56, 'Longaniza', 13, 2, '1.00', '4.00', '1.00', '2025-10-29T08:18:28.679Z', true, 'operativo', 'unidad', 'paquete', '6.000000', 'Paquete 6 unidades'),
(57, 'Longaniza criolla', 13, 2, '1.00', '4.00', '2.00', '2025-10-29T08:18:28.679Z', true, 'operativo', 'unidad', 'unidad', '1.000000', 'Unidad'),
(58, 'Chorizo', 13, 2, '1.00', '4.00', '1.00', '2025-10-29T08:18:28.679Z', true, 'operativo', 'unidad', 'paquete', '6.000000', 'Paquete 6 unidades'),
(59, 'Salchicha', 13, 2, '1.00', '4.00', '0.60', '2025-10-29T08:18:28.679Z', true, 'operativo', 'unidad', 'caja', '50.000000', 'Caja 50 unidades'),
(60, 'Salami', 13, 2, '1.00', '4.00', '12.00', '2025-10-29T08:18:28.679Z', true, 'operativo', 'paquete', 'paquete', '1.000000', 'Paquete'),
(61, 'Tocino', 13, 2, '1.00', '4.00', '30.00', '2025-10-29T08:18:28.679Z', true, 'operativo', 'libra', 'libra', '1.000000', 'Libra'),
(62, 'Carne de res', 1, 5, '5.00', '20.00', '35.00', '2025-10-29T08:18:28.679Z', true, 'operativo', 'libra', 'libra', '1.000000', 'Libra'),
(63, 'Carne adobada', 1, 5, '5.00', '20.00', '23.00', '2025-10-29T08:18:28.679Z', true, 'operativo', 'libra', 'libra', '1.000000', 'Libra'),
(64, 'Carne para hamburguesa', 1, 3, '5.00', '20.00', '20.00', '2025-10-29T08:18:28.679Z', true, 'operativo', 'libra', 'libra', '1.000000', 'Libra'),
(65, 'Papa frita McPatata', 9, 2, '1.00', '2.00', '10.00', '2025-10-29T08:18:28.679Z', true, 'perpetuo', 'libra', 'bolsa', '5.500000', 'Bolsa 5.5 libras'),
(66, 'Queso para hamburguesa tipo crack', 3, 6, '1.00', '2.00', '20.00', '2025-10-29T08:18:28.679Z', true, 'operativo', 'paquete', 'paquete', '1.000000', 'Paquete'),
(67, 'Queso mozzarella', 3, 6, '1.00', '2.00', '20.00', '2025-10-29T08:18:28.679Z', true, 'operativo', 'libra', 'libra', '1.000000', 'Libra'),
(68, 'Quesillo', 1, 6, '1.00', '2.00', '20.00', '2025-10-29T08:18:28.679Z', true, 'operativo', 'libra', 'libra', '1.000000', 'Libra'),
(69, 'Mantequilla', 1, 6, '1.00', '2.00', '8.00', '2025-10-29T08:18:28.679Z', true, 'operativo', 'libra', 'libra', '1.000000', 'Libra'),
(70, 'Café', 6, 3, '0.00', '0.00', '70.00', '2025-10-29T08:31:38.988Z', true, 'operativo', 'libra', 'libra', '1.000000', 'Libra o bolsa'),
(71, 'Azúcar', 6, 3, '0.00', '0.00', '4.00', '2025-10-29T08:31:38.988Z', true, 'operativo', 'libra', 'arroba', '25.000000', 'Arroba 25 lb (Q100/25 = Q4 por libra)'),
(72, 'Cremora', 6, 3, '0.00', '0.00', '30.00', '2025-10-29T08:31:38.988Z', true, 'operativo', 'frasco', 'frasco', '1.000000', 'Frasco'),
(73, 'Agua', 6, NULL, '0.00', '0.00', '17.50', '2025-10-29T08:31:38.988Z', true, 'operativo', 'garrafon', 'garrafon', '1.000000', 'Garrafón'),
(74, 'Soda en lata - tipo Q5', 6, NULL, '0.00', '0.00', '3.50', '2025-10-29T08:31:38.988Z', true, 'operativo', 'lata', 'docena', '12.000000', 'Caja / docena 12 latas'),
(75, 'Soda en lata - tipo Q6', 6, NULL, '0.00', '0.00', '4.50', '2025-10-29T08:31:38.988Z', true, 'operativo', 'lata', 'docena', '12.000000', 'Caja / docena 12 latas'),
(76, 'Encendedores', 9, 4, '1.00', '4.00', '33.33', '2025-10-29T08:43:48.296Z', true, 'perpetuo', 'unidad', 'paquete', '3.000000', 'Paquete 3 unidades'),
(77, 'Tenazas', 9, 4, '1.00', '4.00', '25.00', '2025-10-29T08:43:48.296Z', true, 'perpetuo', 'unidad', 'unidad', '1.000000', 'Unidad'),
(78, 'Cuchillos', 9, 12, '1.00', '2.00', '250.00', '2025-10-29T08:43:48.296Z', true, 'perpetuo', 'unidad', 'unidad', '1.000000', 'Unidad'),
(79, 'Anillos de acero para huevos', 9, 12, '1.00', '3.00', '25.00', '2025-10-29T08:43:48.296Z', true, 'perpetuo', 'unidad', 'unidad', '1.000000', 'Unidad'),
(80, 'Sartén / utensilios varios', 9, 12, '1.00', '2.00', '250.00', '2025-10-29T08:43:48.296Z', true, 'perpetuo', 'unidad', 'unidad', '1.000000', 'Unidad');

DROP TABLE IF EXISTS "lote_insumo" CASCADE;
CREATE TABLE "lote_insumo" (
  "id_lote" integer NOT NULL DEFAULT nextval('lote_insumo_id_lote_seq'::regclass),
  "id_insumo" integer,
  "fecha_vencimiento" date,
  "cantidad_inicial" numeric NOT NULL,
  "cantidad_actual" numeric NOT NULL,
  "costo_unitario" numeric,
  "ubicacion" character varying
);

DROP TABLE IF EXISTS "movimiento_inventario" CASCADE;
CREATE TABLE "movimiento_inventario" (
  "id_movimiento" integer NOT NULL DEFAULT nextval('movimiento_inventario_id_movimiento_seq'::regclass),
  "id_insumo" integer,
  "id_lote" integer,
  "tipo_movimiento" character varying,
  "cantidad" numeric,
  "fecha_movimiento" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "id_perfil" integer,
  "id_referencia" integer,
  "descripcion" text,
  "costo_unitario_momento" numeric DEFAULT 0,
  "costo_total" numeric,
  "cantidad_registrada" numeric,
  "unidad_registrada" text,
  "factor_usado" numeric NOT NULL DEFAULT 1,
  "cantidad_base" numeric,
  "costo_unit_compra" numeric,
  "costo_unit_base" numeric
);

DROP TABLE IF EXISTS "orden_compra" CASCADE;
CREATE TABLE "orden_compra" (
  "id_orden" integer NOT NULL DEFAULT nextval('orden_compra_id_orden_seq'::regclass),
  "fecha_orden" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "id_proveedor" integer,
  "estado" character varying DEFAULT 'pendiente'::character varying,
  "tipo_orden" character varying DEFAULT 'manual'::character varying,
  "motivo_generacion" text,
  "fecha_aprobacion" timestamp without time zone,
  "subtotal" numeric DEFAULT 0,
  "iva" numeric DEFAULT 0,
  "tipo_pago" character varying DEFAULT 'credito'::character varying,
  "fecha_entrega_estimada" date,
  "creado_por" integer,
  "aprobado_por" integer
);

DROP TABLE IF EXISTS "perfil_usuario" CASCADE;
CREATE TABLE "perfil_usuario" (
  "id_perfil" integer NOT NULL DEFAULT nextval('perfil_usuario_id_perfil_seq'::regclass),
  "email" character varying NOT NULL,
  "password_hash" character varying NOT NULL,
  "primer_nombre" character varying NOT NULL,
  "segundo_nombre" character varying,
  "primer_apellido" character varying NOT NULL,
  "segundo_apellido" character varying,
  "telefono" character varying,
  "direccion" text,
  "fecha_nacimiento" date,
  "username" character varying,
  "avatar_url" character varying,
  "id_rol" integer NOT NULL,
  "estado" character varying DEFAULT 'activo'::character varying,
  "fecha_registro" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "ultimo_acceso" timestamp without time zone
);

INSERT INTO "perfil_usuario" VALUES
(2, 'ximenaflores@shucway.com', '$2b$12$KOHig/HE7AxOvB8pxcdJpuLj5lOvZ2LR/NJYHuwE1zV1qYCllAKmq', 'Ximena', NULL, 'Flores', NULL, '87654321', 'Guatemala', '2005-08-20T06:00:00.000Z', 'xiflores', '', 3, 'activo', '2025-10-17T10:26:08.545Z', '2025-10-29T05:00:32.377Z'),
(5, 'andrea@shucway.com', '$2b$12$BPTwo6qajwTm7kpMTkW8cuH6YNZe4250lDGAk4JSrctGGLzrPthb2', 'Andrea', NULL, 'Sofia', NULL, '56252922', '1 calle 51-06, Res.Naciones Unidas 2', '2002-12-02T06:00:00.000Z', 'andrea', NULL, 2, 'activo', '2025-10-21T08:51:05.051Z', '2025-10-21T08:52:13.659Z'),
(4, 'daniel@shucway.com', '$2b$12$NTUIGCk4nSKRJsHj5hriaOvXFs4V7TFQcCIpfLyLWN0UL.G9Hq39W', 'Josue', 'Daniel', 'Figueroa', 'Herrera', '56252922', '1 calle 51-06, Res.Naciones Unidas 2', '2002-12-02T06:00:00.000Z', 'josu', 'https://cdrzomyyxyfhazkzuwou.supabase.co/storage/v1/object/public/user-img/avatars/4/1761625793711-elmartillo.jpg', 1, 'activo', '2025-10-21T08:49:57.306Z', '2025-10-29T06:42:27.401Z'),
(7, 'rene@gmail.com', '$2b$12$xAOQp7pdpBoa7LUBtDli2.uyGOdaNDbBxNohs3Ewul9e/W4k5E4Gi', 'Rene', NULL, 'Escobar', NULL, '12345678', NULL, '2002-08-25T06:00:00.000Z', 'drer', '', 1, 'eliminado', '2025-10-24T06:54:53.157Z', '2025-10-24T20:41:50.805Z'),
(1, 'luisflores@shucway.com', '$2b$10$hCljzIPohqZGf4RTc9vd2eBwL3DZXKzTpJMOmIBa4gMJRDJ2Rsq4q', 'Luis', 'Rene', 'Flores', 'Pivaral', '555123456', 'Zona 1, Guatemala', '1980-01-15T06:00:00.000Z', 'lrflores', '', 1, 'activo', '2025-10-17T10:26:08.545Z', '2025-10-29T02:19:35.277Z');

DROP TABLE IF EXISTS "producto" CASCADE;
CREATE TABLE "producto" (
  "id_producto" integer NOT NULL DEFAULT nextval('producto_id_producto_seq'::regclass),
  "nombre_producto" character varying NOT NULL,
  "descripcion" text,
  "precio_venta" numeric NOT NULL,
  "costo_producto" numeric DEFAULT 0,
  "id_categoria" integer,
  "estado" character varying DEFAULT 'activo'::character varying,
  "imagen_url" character varying,
  "fecha_creacion" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

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
(24, '2 Pollo Frito Con Papitas Fritas', NULL, '27.00', '15.00', 1, 'activo', NULL, '2025-10-17T04:15:17.884Z'),
(25, 'Pierna de Pollo', NULL, '9.00', '5.00', 1, 'activo', NULL, '2025-10-17T04:15:17.884Z');

DROP TABLE IF EXISTS "producto_variante" CASCADE;
CREATE TABLE "producto_variante" (
  "id_variante" integer NOT NULL DEFAULT nextval('producto_variante_id_variante_seq'::regclass),
  "id_producto" integer NOT NULL,
  "nombre_variante" character varying NOT NULL,
  "costo_adicional" numeric DEFAULT 0,
  "precio_adicional" numeric DEFAULT 0,
  "estado" character varying DEFAULT 'activo'::character varying,
  "fecha_creacion" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "producto_variante" VALUES
(1, 5, 'Longaniza', '1.50', '3.00', 'activo', '2025-10-17T04:15:17.884Z'),
(2, 5, 'Salami', '1.50', '3.00', 'activo', '2025-10-17T04:15:17.884Z'),
(3, 5, 'Chorizo', '1.50', '3.00', 'activo', '2025-10-17T04:15:17.884Z'),
(4, 7, 'Asada + Chorizo', '0.00', '0.00', 'activo', '2025-10-17T04:15:17.884Z'),
(5, 7, 'Adobado + Longaniza', '0.00', '0.00', 'activo', '2025-10-17T04:15:17.884Z'),
(6, 10, 'Extra Queso', '1.50', '2.00', 'activo', '2025-10-17T04:15:17.884Z'),
(7, 11, 'Extra Queso', '1.50', '2.00', 'activo', '2025-10-17T04:15:17.884Z'),
(8, 12, 'Extra Queso', '1.50', '2.00', 'activo', '2025-10-17T04:15:17.884Z');

DROP TABLE IF EXISTS "proveedor" CASCADE;
CREATE TABLE "proveedor" (
  "id_proveedor" integer NOT NULL DEFAULT nextval('proveedor_id_proveedor_seq'::regclass),
  "nombre_empresa" character varying NOT NULL,
  "nombre_contacto" character varying,
  "telefono" character varying,
  "correo" character varying,
  "direccion" text,
  "estado" boolean DEFAULT true,
  "metodo_entrega" character varying,
  "es_preferido" boolean DEFAULT false
);

INSERT INTO "proveedor" VALUES
(1, 'Panificadora Las Victorias', 'Departamento de Ventas', '2232-4123', 'ventas@lasvictorias.com.gt (por confirmar)', '5 Av 14-34 Z-1', true, 'Recoger en tienda', false),
(2, 'Pio Lindo', 'Departamento de Ventas', '6632 2300', NULL, '1a Calle 2-91 zona 5, Villa Nueva, C. Real, Villa Nueva', true, 'Recoger en tienda', false),
(3, 'Procasa', 'Departamento de Ventas', '2310 6066', 'meethouse@gmail.com', 'Km. 13.08 Carretera al Pacífico Z. 6, C.C. Metro Plaza, Local 9 y 9B, Villalobos', true, 'Recoger en tienda', false),
(4, 'Suplicentro', 'Departamento de Ventas', '4672-0841', 'pedidos@suplicentro.com.gt', 'Calzada Aguilar Batres 36-70 Zona 11', true, 'Recoger en tienda', false),
(5, 'Carnicería El Churrascón', 'Encargado de ventas', 'por confirmar', NULL, '8 Calle A 15-95, Villa Nueva', true, 'Recoger en tienda', false),
(6, 'Depósito Santo Thomas', 'Encargado de ventas', 'Sin contacto', NULL, '21A Avenida Villa Nueva, zona 12, Local 34', true, 'Recoger en tienda', false),
(12, 'CENMA', 'Puestos de ventas', NULL, NULL, '21A Avenida Villa Nueva, zona 12', true, 'Recoger en tienda', false);

DROP TABLE IF EXISTS "recepcion_mercaderia" CASCADE;
CREATE TABLE "recepcion_mercaderia" (
  "id_recepcion" integer NOT NULL DEFAULT nextval('recepcion_mercaderia_id_recepcion_seq'::regclass),
  "id_orden" integer,
  "fecha_recepcion" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "id_perfil" integer,
  "numero_factura" character varying,
  "observaciones" text,
  "estado" character varying DEFAULT 'completada'::character varying
);

DROP TABLE IF EXISTS "receta_detalle" CASCADE;
CREATE TABLE "receta_detalle" (
  "id_receta" integer NOT NULL DEFAULT nextval('receta_detalle_id_receta_seq'::regclass),
  "id_producto" integer NOT NULL,
  "id_insumo" integer NOT NULL,
  "cantidad" numeric NOT NULL,
  "es_obligatorio" boolean DEFAULT true,
  "fecha_creacion" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS "rol_usuario" CASCADE;
CREATE TABLE "rol_usuario" (
  "id_rol" integer NOT NULL DEFAULT nextval('rol_usuario_id_rol_seq'::regclass),
  "nombre_rol" character varying NOT NULL,
  "descripcion" text,
  "nivel_permisos" integer DEFAULT 0,
  "permisos" jsonb DEFAULT '{}'::jsonb,
  "activo" boolean DEFAULT true,
  "fecha_creacion" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "rol_usuario" VALUES
(2, 'administrador', 'Gestión completa del negocio - Gerente general', 80, [object Object], true, '2025-10-17T04:15:17.884Z'),
(3, 'cajero', 'Operación de ventas y atención al cliente', 30, [object Object], true, '2025-10-17T04:15:17.884Z'),
(1, 'propietario', 'Acceso total al sistema - Dueño del negocio', 100, '{"all":true}', true, '2025-10-17T04:15:17.884Z'),
(4, 'cliente', 'Cliente del sistema - Acceso limitado', 10, '"\"\\\"\\\\\\\"\\\\\\\\\\\\\\\"{\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"pedidos\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\":{\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"ver\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\":true,\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"crear\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\":true},\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"productos\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\":{\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"ver\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\":true}}\\\\\\\\\\\\\\\"\\\\\\\"\\\"\""', true, '2025-10-17T04:15:17.884Z');

DROP TABLE IF EXISTS "venta" CASCADE;
CREATE TABLE "venta" (
  "id_venta" integer NOT NULL DEFAULT nextval('venta_id_venta_seq'::regclass),
  "fecha_venta" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "id_cliente" integer,
  "estado" character varying DEFAULT 'confirmada'::character varying,
  "tipo_pago" character varying DEFAULT 'Cash'::character varying,
  "total_venta" numeric DEFAULT 0,
  "total_costo" numeric DEFAULT 0,
  "ganancia" numeric,
  "id_cajero" integer,
  "notas" text
);

