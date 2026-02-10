import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { remitos, remitoItems, clientes, inventario } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET - Obtener un remito por ID con sus items
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: idString } = await params;
		const id = parseInt(idString);

		if (isNaN(id)) {
			return NextResponse.json({ error: "ID inválido" }, { status: 400 });
		}

		// Obtener remito con cliente
		const [remitoData] = await db
			.select({
				remito: remitos,
				cliente: clientes,
			})
			.from(remitos)
			.leftJoin(clientes, eq(remitos.clienteId, clientes.id))
			.where(eq(remitos.id, id))
			.limit(1);

		if (!remitoData) {
			return NextResponse.json(
				{ error: "Remito no encontrado" },
				{ status: 404 }
			);
		}

		// Obtener items del remito
		const items = await db
			.select({
				item: remitoItems,
				producto: inventario,
			})
			.from(remitoItems)
			.leftJoin(inventario, eq(remitoItems.productoId, inventario.id))
			.where(eq(remitoItems.remitoId, id));

		// Convertir centavos a pesos
		const itemsConPesos = items.map(({ item, producto }) => ({
			...item,
			precioUnitario: item.precioUnitario / 100,
			subtotal: item.subtotal / 100,
			producto: producto
				? {
					...producto,
					precioUnitario: producto.precioUnitario / 100,
				}
				: null,
		}));

		const response = {
			...remitoData.remito,
			total: remitoData.remito.total / 100,
			cliente: remitoData.cliente
				? {
					...remitoData.cliente,
					saldoActual: remitoData.cliente.saldoActual / 100,
					limiteCredito: remitoData.cliente.limiteCredito / 100,
				}
				: null,
			items: itemsConPesos,
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error("Error al obtener remito:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}

// PUT - Actualizar estado del remito
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: idString } = await params;
		const id = parseInt(idString);

		if (isNaN(id)) {
			return NextResponse.json({ error: "ID inválido" }, { status: 400 });
		}

		const { estado } = await request.json();

		if (!estado) {
			return NextResponse.json(
				{ error: "Estado es requerido" },
				{ status: 400 }
			);
		}

		const [updatedRemito] = await db
			.update(remitos)
			.set({
				estado,
				updatedAt: new Date(),
			})
			.where(eq(remitos.id, id))
			.returning();

		if (!updatedRemito) {
			return NextResponse.json(
				{ error: "Remito no encontrado" },
				{ status: 404 }
			);
		}

		const remitoConPesos = {
			...updatedRemito,
			total: updatedRemito.total / 100,
		};

		return NextResponse.json(remitoConPesos);
	} catch (error) {
		console.error("Error al actualizar remito:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}

// DELETE - Eliminar un remito
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: idString } = await params;
		const id = parseInt(idString);

		if (isNaN(id)) {
			return NextResponse.json({ error: "ID inválido" }, { status: 400 });
		}

		// Obtener items para devolver stock
		const items = await db
			.select()
			.from(remitoItems)
			.where(eq(remitoItems.remitoId, id));

		// Devolver stock al inventario
		for (const item of items) {
			const [producto] = await db
				.select()
				.from(inventario)
				.where(eq(inventario.id, item.productoId))
				.limit(1);

			if (producto) {
				await db
					.update(inventario)
					.set({
						stock: producto.stock + item.cantidad,
						updatedAt: new Date(),
					})
					.where(eq(inventario.id, item.productoId));
			}
		}

		// Eliminar remito (los items se eliminan automáticamente por CASCADE)
		const result = await db
			.delete(remitos)
			.where(eq(remitos.id, id))
			.returning();

		if (result.length === 0) {
			return NextResponse.json(
				{ error: "Remito no encontrado" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			message: "Remito eliminado exitosamente",
		});
	} catch (error) {
		console.error("Error al eliminar remito:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}
