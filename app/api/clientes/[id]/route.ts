import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET - Obtener un cliente por ID
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

		const [cliente] = await db
			.select()
			.from(clientes)
			.where(eq(clientes.id, id))
			.limit(1);

		if (!cliente) {
			return NextResponse.json(
				{ error: "Cliente no encontrado" },
				{ status: 404 }
			);
		}

		// Convertir centavos a pesos y fechas a timestamps
		const clienteConPesos = {
			...cliente,
			saldoActual: cliente.saldoActual / 100,
			limiteCredito: cliente.limiteCredito / 100,
			// Convertir fechas a timestamps
			fechaAlta: cliente.fechaAlta ? new Date(cliente.fechaAlta).getTime() : null,
			ultimaCompra: cliente.ultimaCompra ? new Date(cliente.ultimaCompra).getTime() : null,
			createdAt: cliente.createdAt ? new Date(cliente.createdAt).getTime() : null,
			updatedAt: cliente.updatedAt ? new Date(cliente.updatedAt).getTime() : null,
		};

		return NextResponse.json(clienteConPesos);
	} catch (error) {
		console.error("Error al obtener cliente:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}

// PUT - Actualizar un cliente
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

		const data = await request.json();
		const { nombre, email, telefono, direccion, limiteCredito, estado } = data;

		// Preparar datos para actualizar
		const updateData: any = {
			updatedAt: new Date(),
		};

		if (nombre) updateData.nombre = nombre;
		if (email) updateData.email = email;
		if (telefono) updateData.telefono = telefono;
		if (direccion) updateData.direccion = direccion;
		if (limiteCredito !== undefined)
			updateData.limiteCredito = Math.round(limiteCredito * 100);
		if (estado) updateData.estado = estado;

		const [updatedCliente] = await db
			.update(clientes)
			.set(updateData)
			.where(eq(clientes.id, id))
			.returning();

		if (!updatedCliente) {
			return NextResponse.json(
				{ error: "Cliente no encontrado" },
				{ status: 404 }
			);
		}

		// Convertir centavos a pesos y fechas a timestamps
		const clienteConPesos = {
			...updatedCliente,
			saldoActual: updatedCliente.saldoActual / 100,
			limiteCredito: updatedCliente.limiteCredito / 100,
			// Convertir fechas a timestamps
			fechaAlta: updatedCliente.fechaAlta ? new Date(updatedCliente.fechaAlta).getTime() : null,
			ultimaCompra: updatedCliente.ultimaCompra ? new Date(updatedCliente.ultimaCompra).getTime() : null,
			createdAt: updatedCliente.createdAt ? new Date(updatedCliente.createdAt).getTime() : null,
			updatedAt: updatedCliente.updatedAt ? new Date(updatedCliente.updatedAt).getTime() : null,
		};

		return NextResponse.json(clienteConPesos);
	} catch (error) {
		console.error("Error al actualizar cliente:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}

// DELETE - Eliminar un cliente
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

		const result = await db
			.delete(clientes)
			.where(eq(clientes.id, id))
			.returning();

		if (result.length === 0) {
			return NextResponse.json(
				{ error: "Cliente no encontrado" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			message: "Cliente eliminado exitosamente",
		});
	} catch (error) {
		console.error("Error al eliminar cliente:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}
