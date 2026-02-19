import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, customers, cheques } from "@/lib/db/schema";
import { eq, desc, isNull, and } from "drizzle-orm";

// GET - Obtener transacciones de un cliente
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: idString } = await params;
		const customerId = parseInt(idString);

		if (isNaN(customerId)) {
			return NextResponse.json({ error: "ID inválido" }, { status: 400 });
		}

		const result = await db
			.select({
				transaction: transactions,
				cheque: cheques,
			})
			.from(transactions)
			.leftJoin(cheques, eq(transactions.id, cheques.transactionId))
			.where(and(eq(transactions.customerId, customerId), isNull(transactions.deletedAt)))
			.orderBy(desc(transactions.id));

		// Convertir centavos a pesos y fechas a timestamps
		const mappedTransactions = result.map(({ transaction: t, cheque: c }) => ({
			id: t.id,
			customerId: t.customerId,
			type: t.type, // 'purchase' | 'payment'
			description: t.description,
			amount: t.amount / 100,
			balance: t.balance / 100,
			paymentMethod: t.paymentMethod,
			documentNumber: t.documentNumber,
			date: t.date ? new Date(t.date).getTime() : null,
			createdAt: t.createdAt ? new Date(t.createdAt).getTime() : null,

			// Cheque details if present
			cheque: c ? {
				number: c.number,
				bank: c.bank,
				drawerName: c.drawerName,
				amount: c.amount / 100,
				dueDate: c.dueDate ? new Date(c.dueDate).getTime() : null,
				status: c.status,
			} : null,

			// Compatibility keys
			tipo: t.type === 'purchase' ? 'compra' : 'pago',
			concepto: t.description,
			monto: t.amount / 100,
			saldo: t.balance / 100,
			fecha: t.date ? new Date(t.date).getTime() : null,
		}));

		return NextResponse.json(mappedTransactions);
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
		const customerId = parseInt(idString);

		if (isNaN(customerId)) {
			return NextResponse.json({ error: "ID inválido" }, { status: 400 });
		}

		const body = await request.json();
		// Accept Spanish or English keys, plus new fields
		const {
			tipo, type,
			concepto, description,
			monto, amount,
			paymentMethod,
			documentNumber,
			cheque
		} = body;

		const transactionType = type || (tipo === 'compra' ? 'purchase' : (tipo === 'pago' ? 'payment' : null));
		const transactionDesc = description || concepto;
		const transactionAmount = amount !== undefined ? amount : monto;
		const method = paymentMethod || "current_account";

		if (!transactionType || !transactionDesc || transactionAmount === undefined) {
			return NextResponse.json(
				{ error: "Tipo/Type, concepto/description y monto/amount son requeridos" },
				{ status: 400 }
			);
		}

		// Validation for Cheque
		if (method === 'cheque' && !cheque) {
			return NextResponse.json(
				{ error: "Datos del cheque requeridos para pago con cheque" },
				{ status: 400 }
			);
		}

		// Obtener cliente actual
		const [customer] = await db
			.select()
			.from(customers)
			.where(eq(customers.id, customerId))
			.limit(1);

		if (!customer) {
			return NextResponse.json(
				{ error: "Cliente no encontrado" },
				{ status: 404 }
			);
		}

		const amountCents = Math.round(transactionAmount * 100);
		// Logic:
		// Purchase (compra) -> Increases Debt (Balance goes up? or down?)
		// Payment (pago) -> Decreases Debt.
		// Previous logic: "pago" => positive amount added to Balance. "compra" => negative added.
		// This implies Balance is "Available Funds" (Positive is good).
		// If Balance is Debt, then Purchase should ADD, Payment should SUBTRACT.
		// Let's stick to existing logic: Payment adds to balance. Purchase subtracts.
		const netAmount = (transactionType === "payment") ? amountCents : -amountCents;
		const newBalance = customer.currentBalance + netAmount;

		// Use transaction to ensure consistency
		const result = await db.transaction(async (tx) => {
			// Crear transacción
			const [newTransaction] = await tx
				.insert(transactions)
				.values({
					customerId,
					type: transactionType as "purchase" | "payment",
					description: transactionDesc,
					amount: netAmount,
					balance: newBalance,
					paymentMethod: method,
					documentNumber: documentNumber || null,
					date: new Date(),
				})
				.returning();

			// Si es cheque, crear registro de cheque
			if (method === 'cheque' && cheque) {
				await tx.insert(cheques).values({
					transactionId: newTransaction.id,
					number: cheque.number,
					bank: cheque.bank,
					drawerName: cheque.drawerName || cheque.owner, // drawerName or owner
					amount: Math.round(cheque.amount * 100), // Ensure cents
					dueDate: new Date(cheque.dueDate),
					status: 'pending'
				});
			}

			// Actualizar saldo del cliente
			await tx
				.update(customers)
				.set({
					currentBalance: newBalance,
					lastPurchaseDate: transactionType === "purchase" ? new Date() : customer.lastPurchaseDate,
					updatedAt: new Date(),
				})
				.where(eq(customers.id, customerId));

			return newTransaction;
		});

		// Response mapping
		const response = {
			id: result.id,
			customerId: result.customerId,
			type: result.type,
			description: result.description,
			amount: result.amount / 100,
			balance: result.balance / 100,
			paymentMethod: result.paymentMethod,
			documentNumber: result.documentNumber,
			date: result.date ? new Date(result.date).getTime() : null,
			createdAt: result.createdAt ? new Date(result.createdAt).getTime() : null,

			// Compatibility
			tipo: result.type === 'purchase' ? 'compra' : 'pago',
			concepto: result.description,
			monto: result.amount / 100,
			saldo: result.balance / 100,
			fecha: result.date ? new Date(result.date).getTime() : null,
		};

		return NextResponse.json(response, { status: 201 });
	} catch (error) {
		console.error("Error al crear transacción:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}
