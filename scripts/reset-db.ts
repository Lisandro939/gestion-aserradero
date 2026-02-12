import { sql } from "drizzle-orm";
import { db } from "../lib/db";

async function resetDb() {
	console.log("Dropping all tables...");

	// Disable foreign keys to allow dropping tables in any order
	await db.run(sql`PRAGMA foreign_keys = OFF`);

	// List of tables to drop (old Spanish names and new English names just in case)
	const tables = [
		"users",
		"clientes",
		"customers",
		"transacciones",
		"transactions",
		"inventario",
		"products",
		"compra",
		"remitos",
		"delivery_notes",
		"remito_items",
		"delivery_note_items",
		"facturas",
		"invoices",
		"factura_items",
		"invoice_items",
		"__new_delivery_notes", // potential temp table left over
		"__new_invoices",
		"__new_customers"
	];

	for (const table of tables) {
		try {
			await db.run(sql.raw(`DROP TABLE IF EXISTS ${table}`));
			console.log(`Dropped table: ${table}`);
		} catch (e) {
			console.log(`Failed to drop optional table ${table}: ${e}`);
		}
	}

	// Re-enable foreign keys
	await db.run(sql`PRAGMA foreign_keys = ON`);

	console.log("Database reset complete.");
}

resetDb().catch(console.error);
