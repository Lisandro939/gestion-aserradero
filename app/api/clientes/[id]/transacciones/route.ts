import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transacciones, clientes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// GET - Obtener transacciones de un cliente
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: idString } = await params;
		const clienteId = parseInt(idString);

		if (isNaN(clienteId)) {
			return NextResponse.json({ error: "ID inválido" }, { status: 400 });
		}

		const result = await db
			.select()
			.from(transacciones)
			.where(eq(transacciones.clienteId, clienteId))
			.orderBy(desc(transacciones.fecha));

		// Convertir centavos a pesos y fechas a timestamps
		const transaccionesConPesos = result.map((t) => ({
			...t,
			monto: t.monto / 100,
			saldo: t.saldo / 100,
			fecha: t.fecha ? new Date(t.fecha).getTime() : null,
			createdAt: t.createdAt ? new Date(t.createdAt).getTime() : null,
		}));

		return NextResponse.json(transaccionesConPesos);
	} catch (error) {
		console.error("Error al obtener transacciones:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}

// POST - Crear nueva transacción (compra o pago)
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: idString } = await params;
		const clienteId = parseInt(idString);

		if (isNaN(clienteId)) {
			return NextResponse.json({ error: "ID inválido" }, { status: 400 });
		}

		const { tipo, concepto, monto } = await request.json();

		if (!tipo || !concepto || monto === undefined) {
			return NextResponse.json(
				{ error: "Tipo, concepto y monto son requeridos" },
				{ status: 400 }
			);
		}

		// Obtener cliente actual
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

		// Calcular nuevo saldo
		const montoEnCentavos = Math.round(monto * 100);
		const montoTransaccion = tipo === "pago" ? montoEnCentavos : -montoEnCentavos;
		const nuevoSaldo = cliente.saldoActual + montoTransaccion;

		// Crear transacción
		const [nuevaTransaccion] = await db
			.insert(transacciones)
			.values({
				clienteId,
				tipo,
				concepto,
				monto: montoTransaccion,
				saldo: nuevoSaldo,
			})
			.returning();

		// Actualizar saldo del cliente
		await db
			.update(clientes)
			.set({
				saldoActual: nuevoSaldo,
				ultimaCompra: tipo === "compra" ? new Date() : cliente.ultimaCompra,
				updatedAt: new Date(),
			})
			.where(eq(clientes.id, clienteId));

		// Convertir centavos a pesos y fechas a timestamps
		const transaccionConPesos = {
			...nuevaTransaccion,
			monto: nuevaTransaccion.monto / 100,
			saldo: nuevaTransaccion.saldo / 100,
			fecha: nuevaTransaccion.fecha ? new Date(nuevaTransaccion.fecha).getTime() : null,
			createdAt: nuevaTransaccion.createdAt ? new Date(nuevaTransaccion.createdAt).getTime() : null,
		};

		return NextResponse.json(transaccionConPesos, { status: 201 });
	} catch (error) {
		console.error("Error al crear transacción:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}
