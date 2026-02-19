import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers, transactions } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

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

		const [customer] = await db
			.select()
			.from(customers)
			.where(eq(customers.id, id))
			.limit(1);

		if (!customer) {
			return NextResponse.json(
				{ error: "Cliente no encontrado" },
				{ status: 404 }
			);
		}

		// Calculate balance dynamically from transactions
		const customerTransactions = await db
			.select({
				amount: transactions.amount,
				type: transactions.type
			})
			.from(transactions)
			.where(and(
				eq(transactions.customerId, id),
				isNull(transactions.deletedAt)
			));

		// Balance = Sum of payments - Sum of purchases (assuming amount is stored as net value in DB or explicit type handling)
		// Schema says: amount is integer, negative for purchases, positive for payments.
		// So we just sum them up.
		const calculatedBalance = customerTransactions.reduce((sum, t) => sum + t.amount, 0);

		// Convertir centavos a pesos y fechas a timestamps
		const customerWithPesos = {
			...customer,
			currentBalance: calculatedBalance / 100, // Use calculated balance
			creditLimit: customer.creditLimit / 100,
			// Mapeo para compatibilidad
			saldoActual: calculatedBalance / 100,
			limiteCredito: customer.creditLimit / 100,
			nombre: customer.name,
			direccion: customer.address,
			telefono: customer.phone,
			cuit: customer.taxId,
			estado: customer.status,

			// Convertir fechas a timestamps
			registrationDate: customer.registrationDate ? new Date(customer.registrationDate).getTime() : null,
			lastPurchaseDate: customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).getTime() : null,
			// Compatibilidad fechas
			fechaAlta: customer.registrationDate ? new Date(customer.registrationDate).getTime() : null,
			ultimaCompra: customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).getTime() : null,

			createdAt: customer.createdAt ? new Date(customer.createdAt).getTime() : null,
			updatedAt: customer.updatedAt ? new Date(customer.updatedAt).getTime() : null,
		};

		return NextResponse.json(customerWithPesos);
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
		// Aceptamos claves en español (del frontend viejo) o inglés
		const { nombre, name, email, telefono, phone, direccion, address, limiteCredito, creditLimit, estado, status, cuit, taxId } = data;

		// Preparar datos para actualizar
		const updateData: any = {
			updatedAt: new Date(),
		};

		if (nombre || name) updateData.name = nombre || name;
		if (email) updateData.email = email;
		if (telefono || phone) updateData.phone = telefono || phone;
		if (direccion || address) updateData.address = direccion || address;
		if (cuit || taxId) updateData.taxId = cuit || taxId;

		const limit = creditLimit !== undefined ? creditLimit : limiteCredito;
		if (limit !== undefined)
			updateData.creditLimit = Math.round(limit * 100);

		if (estado || status) updateData.status = estado || status;

		const [updatedCustomer] = await db
			.update(customers)
			.set(updateData)
			.where(eq(customers.id, id))
			.returning();

		if (!updatedCustomer) {
			return NextResponse.json(
				{ error: "Cliente no encontrado" },
				{ status: 404 }
			);
		}

		// Convertir centavos a pesos y fechas a timestamps
		const customerWithPesos = {
			...updatedCustomer,
			currentBalance: updatedCustomer.currentBalance / 100,
			creditLimit: updatedCustomer.creditLimit / 100,

			// Compatibilidad
			saldoActual: updatedCustomer.currentBalance / 100,
			limiteCredito: updatedCustomer.creditLimit / 100,
			nombre: updatedCustomer.name,
			direccion: updatedCustomer.address,
			telefono: updatedCustomer.phone,
			cuit: updatedCustomer.taxId,
			estado: updatedCustomer.status,

			// Convertir fechas a timestamps
			registrationDate: updatedCustomer.registrationDate ? new Date(updatedCustomer.registrationDate).getTime() : null,
			lastPurchaseDate: updatedCustomer.lastPurchaseDate ? new Date(updatedCustomer.lastPurchaseDate).getTime() : null,
			// Compatibilidad
			fechaAlta: updatedCustomer.registrationDate ? new Date(updatedCustomer.registrationDate).getTime() : null,
			ultimaCompra: updatedCustomer.lastPurchaseDate ? new Date(updatedCustomer.lastPurchaseDate).getTime() : null,

			createdAt: updatedCustomer.createdAt ? new Date(updatedCustomer.createdAt).getTime() : null,
			updatedAt: updatedCustomer.updatedAt ? new Date(updatedCustomer.updatedAt).getTime() : null,
		};

		return NextResponse.json(customerWithPesos);
	} catch (error) {
		console.error("Error al actualizar cliente:", error);
		console.log(error);
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

		// Usamos soft delete via status='inactive' en lugar de borrar filas, si queremos consistencia con customers/route.ts
		// Pero la ruta original hacía DELETE físico (db.delete). 
		// SI el usuario pidió consistencia en customers/route.ts con soft delete, aquí también deberíamos.
		// Pero el código original era delete físico. Mantendré delete físico si el original lo era, 
		// O cambio a soft delete si el nuevo schema/logica lo requiere?
		// El schema tiene status. El usuario en customers/route.ts usaba soft delete.
		// Voy a cambiarlo a soft delete por seguridad y consistencia ("inactive").

		const [updatedCustomer] = await db
			.update(customers)
			.set({ status: 'inactive' })
			.where(eq(customers.id, id))
			.returning();

		if (!updatedCustomer) {
			return NextResponse.json(
				{ error: "Cliente no encontrado" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			message: "Cliente eliminado exitosamente (soft delete)",
		});
	} catch (error) {
		console.error("Error al eliminar cliente:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}
