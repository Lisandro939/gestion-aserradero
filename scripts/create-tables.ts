import dotenv from "dotenv";
import { createClient } from "@libsql/client";

// Cargar variables de entorno desde .env.local
dotenv.config({ path: ".env.local" });

// Validar variables de entorno
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
	console.error("❌ Error: Variables de entorno no configuradas");
	console.error("Por favor, configura TURSO_DATABASE_URL y TURSO_AUTH_TOKEN en .env.local");
	process.exit(1);
}

const client = createClient({
	url: process.env.TURSO_DATABASE_URL,
	authToken: process.env.TURSO_AUTH_TOKEN,
});

async function createTables() {
	console.log("🗄️  Creando tablas en la base de datos...\n");

	try {
		// Tabla de usuarios
		console.log("📝 Creando tabla 'users'...");
		await client.execute(`
			CREATE TABLE IF NOT EXISTS users (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				email TEXT NOT NULL UNIQUE,
				name TEXT NOT NULL,
				password TEXT NOT NULL,
				role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
				must_change_password INTEGER NOT NULL DEFAULT 0,
				created_at INTEGER NOT NULL DEFAULT (unixepoch()),
				updated_at INTEGER NOT NULL DEFAULT (unixepoch())
			);
		`);
		console.log("✅ Tabla 'users' creada\n");

		// Tabla de clientes
		console.log("📝 Creando tabla 'clientes'...");
		await client.execute(`
			CREATE TABLE IF NOT EXISTS clientes (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				nombre TEXT NOT NULL,
				email TEXT NOT NULL,
				telefono TEXT NOT NULL,
				direccion TEXT NOT NULL,
				cuit TEXT NOT NULL UNIQUE,
				saldo_actual INTEGER NOT NULL DEFAULT 0,
				limite_credito INTEGER NOT NULL DEFAULT 0,
				estado TEXT NOT NULL DEFAULT 'activo' CHECK(estado IN ('activo', 'inactivo', 'moroso')),
				fecha_alta INTEGER NOT NULL DEFAULT (unixepoch()),
				ultima_compra INTEGER,
				created_at INTEGER NOT NULL DEFAULT (unixepoch()),
				updated_at INTEGER NOT NULL DEFAULT (unixepoch())
			);
		`);
		console.log("✅ Tabla 'clientes' creada\n");

		// Tabla de transacciones
		console.log("📝 Creando tabla 'transacciones'...");
		await client.execute(`
			CREATE TABLE IF NOT EXISTS transacciones (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				cliente_id INTEGER NOT NULL,
				tipo TEXT NOT NULL CHECK(tipo IN ('compra', 'pago')),
				fecha INTEGER NOT NULL DEFAULT (unixepoch()),
				concepto TEXT NOT NULL,
				monto INTEGER NOT NULL,
				saldo INTEGER NOT NULL,
				created_at INTEGER NOT NULL DEFAULT (unixepoch()),
				FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
			);
		`);
		console.log("✅ Tabla 'transacciones' creada\n");

		// Tabla de inventario
		console.log("📝 Creando tabla 'inventario'...");
		await client.execute(`
			CREATE TABLE IF NOT EXISTS inventario (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				nombre TEXT NOT NULL,
				descripcion TEXT,
				categoria TEXT NOT NULL,
				unidad TEXT NOT NULL,
				stock INTEGER NOT NULL DEFAULT 0,
				stock_minimo INTEGER NOT NULL DEFAULT 0,
				precio_unitario INTEGER NOT NULL,
				created_at INTEGER NOT NULL DEFAULT (unixepoch()),
				updated_at INTEGER NOT NULL DEFAULT (unixepoch())
			);
		`);
		console.log("✅ Tabla 'inventario' creada\n");

		// Tabla de remitos
		console.log("📝 Creando tabla 'remitos'...");
		await client.execute(`
			CREATE TABLE IF NOT EXISTS remitos (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				numero TEXT NOT NULL UNIQUE,
				cliente_id INTEGER NOT NULL,
				fecha INTEGER NOT NULL DEFAULT (unixepoch()),
				estado TEXT NOT NULL DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'entregado', 'cancelado')),
				total INTEGER NOT NULL,
				observaciones TEXT,
				created_at INTEGER NOT NULL DEFAULT (unixepoch()),
				updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
				FOREIGN KEY (cliente_id) REFERENCES clientes(id)
			);
		`);
		console.log("✅ Tabla 'remitos' creada\n");

		// Tabla de items de remitos
		console.log("📝 Creando tabla 'remito_items'...");
		await client.execute(`
			CREATE TABLE IF NOT EXISTS remito_items (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				remito_id INTEGER NOT NULL,
				producto_id INTEGER NOT NULL,
				cantidad INTEGER NOT NULL,
				precio_unitario INTEGER NOT NULL,
				subtotal INTEGER NOT NULL,
				FOREIGN KEY (remito_id) REFERENCES remitos(id) ON DELETE CASCADE,
				FOREIGN KEY (producto_id) REFERENCES inventario(id)
			);
		`);
		console.log("✅ Tabla 'remito_items' creada\n");

		// Crear índices para mejorar el rendimiento
		console.log("📊 Creando índices...");

		await client.execute(`
			CREATE INDEX IF NOT EXISTS idx_transacciones_cliente 
			ON transacciones(cliente_id);
		`);

		await client.execute(`
			CREATE INDEX IF NOT EXISTS idx_remitos_cliente 
			ON remitos(cliente_id);
		`);

		await client.execute(`
			CREATE INDEX IF NOT EXISTS idx_remito_items_remito 
			ON remito_items(remito_id);
		`);

		await client.execute(`
			CREATE INDEX IF NOT EXISTS idx_remito_items_producto 
			ON remito_items(producto_id);
		`);

		console.log("✅ Índices creados\n");

		console.log("✨ ¡Todas las tablas fueron creadas exitosamente!\n");
		console.log("📋 Tablas creadas:");
		console.log("   - users");
		console.log("   - clientes");
		console.log("   - transacciones");
		console.log("   - inventario");
		console.log("   - remitos");
		console.log("   - remito_items");
		console.log("\n💡 Próximo paso: Ejecuta 'pnpm db:seed' para poblar con datos de ejemplo");
	} catch (error) {
		console.error("❌ Error al crear tablas:", error);
		throw error;
	}
}

// Ejecutar
createTables()
	.then(() => {
		console.log("\n👋 Proceso finalizado");
		process.exit(0);
	})
	.catch((error) => {
		console.error("💥 Error fatal:", error);
		process.exit(1);
	});
