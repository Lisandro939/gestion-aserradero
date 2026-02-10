import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { remitos, remitoItems, clientes, inventario } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// GET - Obtener todos los remitos
export async function GET() {
	try {
		const result = await db
			.select({
				remito: remitos,
				cliente: clientes,
			})
			.from(remitos)
			.leftJoin(clientes, eq(remitos.clienteId, clientes.id))
			.orderBy(desc(remitos.fecha));

		// Convertir centavos a pesos
		const remitosConPesos = result.map(({ remito, cliente }) => ({
			...remito,
			total: remito.total / 100,
			cliente: cliente
				? {
					...cliente,
					saldoActual: cliente.saldoActual / 100,
					limiteCredito: cliente.limiteCredito / 100,
				}
				: null,
		}));

		return NextResponse.json(remitosConPesos);
	} catch (error) {
		console.error("Error al obtener remitos:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}

// POST - Crear nuevo remito
export async function POST(request: NextRequest) {
	try {
		const data = await request.json();
		const { numero, clienteId, items, observaciones, estado = "pendiente" } =
			data;

		if (!numero || !clienteId || !items || items.length === 0) {
			return NextResponse.json(
				{ error: "Número, cliente e items son requeridos" },
				{ status: 400 }
			);
		}

		// Verificar que el cliente existe
		const [cliente] = await db
			.select()
			.from(clientes)
			.where(eq(clientes.id, clienteId))
			.limit(1);

		if (!cliente) {
			return NextResponse.json(
				{ error: "Cliente no encontrado" },
				{ status: 404 }
			);
		}

		// Calcular total y validar productos
		let totalEnCentavos = 0;

		for (const item of items) {
			const [producto] = await db
				.select()
				.from(inventario)
				.where(eq(inventario.id, item.productoId))
				.limit(1);

			if (!producto) {
				return NextResponse.json(
					{ error: `Producto ${item.productoId} no encontrado` },
					{ status: 404 }
				);
			}

			// Verificar stock
			if (producto.stock < item.cantidad) {
				return NextResponse.json(
					{
						error: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`,
					},
					{ status: 400 }
				);
			}

			const subtotal = producto.precioUnitario * item.cantidad;
			totalEnCentavos += subtotal;
		}

		// Crear remito
		const [nuevoRemito] = await db
			.insert(remitos)
			.values({
				numero,
				clienteId,
				total: totalEnCentavos,
				observaciones,
				estado,
			})
			.returning();

		// Crear items del remito y actualizar stock
		for (const item of items) {
			const [producto] = await db
				.select()
				.from(inventario)
				.where(eq(inventario.id, item.productoId))
				.limit(1);

			const subtotal = producto!.precioUnitario * item.cantidad;

			// Insertar item
			await db.insert(remitoItems).values({
				remitoId: nuevoRemito.id,
				productoId: item.productoId,
				cantidad: item.cantidad,
				precioUnitario: producto!.precioUnitario,
				subtotal,
			});

			// Actualizar stock
			await db
				.update(inventario)
				.set({
					stock: producto!.stock - item.cantidad,
					updatedAt: new Date(),
				})
				.where(eq(inventario.id, item.productoId));
		}

		// Convertir centavos a pesos
		const remitoConPesos = {
			...nuevoRemito,
			total: nuevoRemito.total / 100,
		};

		return NextResponse.json(remitoConPesos, { status: 201 });
	} catch (error) {
		console.error("Error al crear remito:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}
