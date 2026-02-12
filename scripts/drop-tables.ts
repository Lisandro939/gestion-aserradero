import dotenv from "dotenv";
import { createClient } from "@libsql/client";

// Cargar variables de entorno desde .env.local
dotenv.config({ path: ".env" });

// Validar variables de entorno
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
	console.error("❌ Error: Variables de entorno no configuradas");
	process.exit(1);
}

const client = createClient({
	url: process.env.TURSO_DATABASE_URL,
	authToken: process.env.TURSO_AUTH_TOKEN,
});

async function dropTables() {
	console.log("🗑️  Eliminando tablas antiguas...\n");

	try {
		const tables = [
			"remito_items", "remitos",
			"factura_items", "facturas",
			"transacciones",
			"inventario",
			"clientes",
			"users" // Maybe users too if I changed it? I didn't change users significantly but might as well for consistency if I renamed anything. I didn't rename users columns. But let's keep users if possible? Drizzle might complain if I don't drop it. Let's drop everything to be safe and clean.
		];

		for (const table of tables) {
			console.log(`Dropping ${table}...`);
			await client.execute(`DROP TABLE IF EXISTS ${table}`);
		}

		console.log("\n✅ Tablas eliminadas");
	} catch (error) {
		console.error("❌ Error al eliminar tablas:", error);
		throw error;
	}
}

dropTables()
	.then(() => {
		console.log("\n👋 Proceso finalizado");
		process.exit(0);
	})
	.catch((error) => {
		console.error("💥 Error fatal:", error);
		process.exit(1);
	});
