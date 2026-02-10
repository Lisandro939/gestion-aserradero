import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Tabla de usuarios
export const users = sqliteTable("users", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	email: text("email").notNull().unique(),
	name: text("name").notNull(),
	password: text("password").notNull(), // Hasheada con bcrypt
	role: text("role", { enum: ["admin", "user"] })
		.notNull()
		.default("user"),
	mustChangePassword: integer("must_change_password", { mode: "boolean" })
		.notNull()
		.default(false),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

// Tabla de clientes
export const clientes = sqliteTable("clientes", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	nombre: text("nombre").notNull(),
	email: text("email").notNull(),
	telefono: text("telefono").notNull(),
	direccion: text("direccion").notNull(),
	cuit: text("cuit").notNull().unique(),
	saldoActual: integer("saldo_actual").notNull().default(0), // En centavos
	limiteCredito: integer("limite_credito").notNull().default(0), // En centavos
	estado: text("estado", { enum: ["activo", "inactivo", "moroso"] })
		.notNull()
		.default("activo"),
	fechaAlta: integer("fecha_alta", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	ultimaCompra: integer("ultima_compra", { mode: "timestamp" }),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

// Tabla de transacciones (historial de compras y pagos de clientes)
export const transacciones = sqliteTable("transacciones", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	clienteId: integer("cliente_id")
		.notNull()
		.references(() => clientes.id, { onDelete: "cascade" }),
	tipo: text("tipo", { enum: ["compra", "pago"] }).notNull(),
	fecha: integer("fecha", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	concepto: text("concepto").notNull(),
	monto: integer("monto").notNull(), // En centavos, negativo para compras, positivo para pagos
	saldo: integer("saldo").notNull(), // Saldo después de la transacción, en centavos
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

// Tabla de inventario
export const inventario = sqliteTable("inventario", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	nombre: text("nombre").notNull(),
	descripcion: text("descripcion"),
	categoria: text("categoria").notNull(),
	unidad: text("unidad").notNull(), // m3, unidad, kg, etc.
	stock: integer("stock").notNull().default(0),
	stockMinimo: integer("stock_minimo").notNull().default(0),
	precioUnitario: integer("precio_unitario").notNull(), // En centavos
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

// Tabla de remitos
export const remitos = sqliteTable("remitos", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	numero: text("numero").notNull().unique(),
	clienteId: integer("cliente_id")
		.notNull()
		.references(() => clientes.id),
	fecha: integer("fecha", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	estado: text("estado", { enum: ["pendiente", "entregado", "cancelado"] })
		.notNull()
		.default("pendiente"),
	total: integer("total").notNull(), // En centavos
	observaciones: text("observaciones"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

// Tabla de items de remitos
export const remitoItems = sqliteTable("remito_items", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	remitoId: integer("remito_id")
		.notNull()
		.references(() => remitos.id, { onDelete: "cascade" }),
	productoId: integer("producto_id")
		.notNull()
		.references(() => inventario.id),
	cantidad: integer("cantidad").notNull(),
	precioUnitario: integer("precio_unitario").notNull(), // En centavos
	subtotal: integer("subtotal").notNull(), // En centavos
});

// Tipos TypeScript inferidos
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Cliente = typeof clientes.$inferSelect;
export type NewCliente = typeof clientes.$inferInsert;

export type Transaccion = typeof transacciones.$inferSelect;
export type NewTransaccion = typeof transacciones.$inferInsert;

export type Inventario = typeof inventario.$inferSelect;
export type NewInventario = typeof inventario.$inferInsert;

export type Remito = typeof remitos.$inferSelect;
export type NewRemito = typeof remitos.$inferInsert;

export type RemitoItem = typeof remitoItems.$inferSelect;
export type NewRemitoItem = typeof remitoItems.$inferInsert;

// Tabla de facturas
export const facturas = sqliteTable("facturas", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	presupuesto: text("presupuesto"),
	fecha: integer("fecha", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	cliente: text("cliente").notNull(), // Nombre del cliente (texto libre o copiado)
	clienteId: integer("cliente_id").references(() => clientes.id), // Opcional, si se selecciona de la lista
	domicilio: text("domicilio"),
	localidad: text("localidad"),
	telefono: text("telefono"),
	mov: text("mov"),
	vendedor: text("vendedor"),
	observaciones: text("observaciones"),
	total: integer("total").notNull(), // En centavos
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

// Tabla de items de facturas
export const facturaItems = sqliteTable("factura_items", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	facturaId: integer("factura_id")
		.notNull()
		.references(() => facturas.id, { onDelete: "cascade" }),
	cantidad: text("cantidad").notNull(), // Guardamos como texto para flexibilidad o decimales
	descripcion: text("descripcion").notNull(),
	codigo: text("codigo"),
	precioUnitario: integer("precio_unitario").notNull(), // En centavos
	dto: text("dto"), // Porcentaje de descuento (texto para preservar input)
	importe: integer("importe").notNull(), // Subtotal en centavos
});

export type Factura = typeof facturas.$inferSelect;
export type NewFactura = typeof facturas.$inferInsert;

export type FacturaItem = typeof facturaItems.$inferSelect;
export type NewFacturaItem = typeof facturaItems.$inferInsert;
