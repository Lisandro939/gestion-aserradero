import dotenv from "dotenv";
import { db } from "../lib/db";
import {
	users,
	clientes,
	transacciones,
	inventario,
	remitos,
	remitoItems,
} from "../lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Cargar variables de entorno desde .env.local
dotenv.config({ path: ".env.local" });

async function seed() {
	console.log("🌱 Iniciando seed de la base de datos...");

	try {
		// 1. Crear usuario administrador
		console.log("👤 Creando usuario administrador...");
		const hashedPassword = await bcrypt.hash("admin123", 10);

		const [admin] = await db
			.insert(users)
			.values({
				email: "admin@aserradero.com",
				name: "Administrador",
				password: hashedPassword,
				role: "admin",
				mustChangePassword: false,
			})
			.returning();

		console.log(`✅ Usuario creado: ${admin.email}`);

		// 2. Crear clientes de ejemplo
		console.log("\n👥 Creando clientes de ejemplo...");

		const clientesData = [
			{
				nombre: "Constructora San Martín S.A.",
				email: "contacto@sanmartin.com",
				telefono: "+54 11 4567-8900",
				direccion: "Av. Libertador 1234, CABA",
				cuit: "30-71234567-8",
				saldoActual: -4500000, // -$45,000 en centavos
				limiteCredito: 10000000, // $100,000 en centavos
				estado: "activo" as const,
			},
			{
				nombre: "Maderera El Roble",
				email: "ventas@elroble.com.ar",
				telefono: "+54 11 5678-9012",
				direccion: "Ruta 9 Km 45, Escobar",
				cuit: "30-81234567-9",
				saldoActual: 1200000, // $12,000 en centavos
				limiteCredito: 5000000, // $50,000 en centavos
				estado: "activo" as const,
			},
			{
				nombre: "Carpintería López",
				email: "lopez.carpinteria@gmail.com",
				telefono: "+54 11 6789-0123",
				direccion: "Calle 123 N° 456, San Isidro",
				cuit: "20-12345678-9",
				saldoActual: -7800000, // -$78,000 en centavos
				limiteCredito: 6000000, // $60,000 en centavos
				estado: "moroso" as const,
			},
		];

		const clientesCreados = await db
			.insert(clientes)
			.values(clientesData)
			.returning();

		console.log(`✅ ${clientesCreados.length} clientes creados`);

		// 3. Crear transacciones de ejemplo para el primer cliente
		console.log("\n💰 Creando transacciones de ejemplo...");

		const transaccionesData = [
			{
				clienteId: clientesCreados[0].id,
				tipo: "compra" as const,
				concepto: "Tablas de pino 2x4 x100",
				monto: -2500000, // -$25,000
				saldo: -4500000, // -$45,000
			},
			{
				clienteId: clientesCreados[0].id,
				tipo: "pago" as const,
				concepto: "Pago parcial - Transferencia",
				monto: 3000000, // $30,000
				saldo: -2000000, // -$20,000
			},
			{
				clienteId: clientesCreados[0].id,
				tipo: "compra" as const,
				concepto: "Tirantes 3x3 x50",
				monto: -5000000, // -$50,000
				saldo: -5000000, // -$50,000
			},
		];

		const transaccionesCreadas = await db
			.insert(transacciones)
			.values(transaccionesData)
			.returning();

		console.log(`✅ ${transaccionesCreadas.length} transacciones creadas`);

		// 4. Crear productos de inventario
		console.log("\n📦 Creando productos de inventario...");

		const inventarioData = [
			{
				nombre: "Tabla de Pino 2x4",
				descripcion: "Tabla de pino de 2x4 pulgadas, largo 3 metros",
				categoria: "Maderas",
				unidad: "unidad",
				stock: 500,
				stockMinimo: 100,
				precioUnitario: 25000, // $250 en centavos
			},
			{
				nombre: "Tirante 3x3",
				descripcion: "Tirante de pino de 3x3 pulgadas, largo 3 metros",
				categoria: "Maderas",
				unidad: "unidad",
				stock: 300,
				stockMinimo: 50,
				precioUnitario: 100000, // $1,000 en centavos
			},
			{
				nombre: "Machimbre de Pino",
				descripcion: "Machimbre de pino para revestimiento",
				categoria: "Revestimientos",
				unidad: "m2",
				stock: 200,
				stockMinimo: 30,
				precioUnitario: 180000, // $1,800 en centavos
			},
			{
				nombre: "Viga Laminada 10x20",
				descripcion: "Viga laminada de 10x20 cm, largo 6 metros",
				categoria: "Estructuras",
				unidad: "unidad",
				stock: 50,
				stockMinimo: 10,
				precioUnitario: 550000, // $5,500 en centavos
			},
			{
				nombre: "Deck de Lapacho",
				descripcion: "Tabla de deck de lapacho, 2x6 pulgadas",
				categoria: "Exteriores",
				unidad: "m2",
				stock: 150,
				stockMinimo: 25,
				precioUnitario: 450000, // $4,500 en centavos
			},
		];

		const productosCreados = await db
			.insert(inventario)
			.values(inventarioData)
			.returning();

		console.log(`✅ ${productosCreados.length} productos creados`);

		// 5. Crear un remito de ejemplo
		console.log("\n📄 Creando remito de ejemplo...");

		const [remito] = await db
			.insert(remitos)
			.values({
				numero: "R-2024-001",
				clienteId: clientesCreados[0].id,
				total: 2750000, // $27,500 en centavos
				estado: "entregado" as const,
				observaciones: "Entrega en obra - Av. Libertador",
			})
			.returning();

		// Crear items del remito
		const remitoItemsData = [
			{
				remitoId: remito.id,
				productoId: productosCreados[0].id, // Tabla de Pino 2x4
				cantidad: 100,
				precioUnitario: 25000, // $250
				subtotal: 2500000, // $25,000
			},
			{
				remitoId: remito.id,
				productoId: productosCreados[1].id, // Tirante 3x3
				cantidad: 10,
				precioUnitario: 100000, // $1,000
				subtotal: 1000000, // $10,000
			},
		];

		await db.insert(remitoItems).values(remitoItemsData);

		// Actualizar stock de los productos
		await db
			.update(inventario)
			.set({ stock: productosCreados[0].stock - 100 })
			.where(eq(inventario.id, productosCreados[0].id));

		await db
			.update(inventario)
			.set({ stock: productosCreados[1].stock - 10 })
			.where(eq(inventario.id, productosCreados[1].id));

		console.log(`✅ Remito ${remito.numero} creado con 2 items`);

		console.log("\n✨ Seed completado exitosamente!");
		console.log("\n📊 Resumen:");
		console.log(`   - 1 usuario administrador`);
		console.log(`   - ${clientesCreados.length} clientes`);
		console.log(`   - ${transaccionesCreadas.length} transacciones`);
		console.log(`   - ${productosCreados.length} productos`);
		console.log(`   - 1 remito con 2 items`);
		console.log("\n🔐 Credenciales de acceso:");
		console.log(`   Email: admin@aserradero.com`);
		console.log(`   Password: admin123`);
	} catch (error) {
		console.error("❌ Error durante el seed:", error);
		throw error;
	}
}

// Ejecutar seed
seed()
	.then(() => {
		console.log("\n👋 Proceso finalizado");
		process.exit(0);
	})
	.catch((error) => {
		console.error("💥 Error fatal:", error);
		process.exit(1);
	});
