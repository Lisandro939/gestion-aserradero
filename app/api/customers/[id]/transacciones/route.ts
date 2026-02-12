import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, customers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

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
			.select()
			.from(transactions)
			.where(eq(transactions.customerId, customerId))
			.orderBy(desc(transactions.date));

		// Convertir centavos a pesos y fechas a timestamps
		const mappedTransactions = result.map((t) => ({
			id: t.id,
			customerId: t.customerId,
			type: t.type, // 'purchase' | 'payment'
			description: t.description,
			amount: t.amount / 100,
			balance: t.balance / 100,
			date: t.date ? new Date(t.date).getTime() : null,
			createdAt: t.createdAt ? new Date(t.createdAt).getTime() : null,

			// Compatibility keys if needed, but let's stick to English primarily
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
		// Accept Spanish or English keys
		const { tipo, type, concepto, description, monto, amount } = body;

		const transactionType = type || (tipo === 'compra' ? 'purchase' : (tipo === 'pago' ? 'payment' : null));
		const transactionDesc = description || concepto;
		const transactionAmount = amount !== undefined ? amount : monto;

		if (!transactionType || !transactionDesc || transactionAmount === undefined) {
			return NextResponse.json(
				{ error: "Tipo/Type, concepto/description y monto/amount son requeridos" },
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

		// Calcular nuevo saldo
		// In new schema: amount is negative for purchase, positive for payment?
		// Comments in schema: "negative for purchases, positive for payments"
		// Wait, logically a purchase INCREASES debt (if it's a credit account) or decreases balance?
		// Let's assume schema comment is source of truth: "negativo para compras, positivo para pagos"
		// Wait, if I buy something, my balance (money I owe?) goes UP?
		// Usually "Saldo" = "Debt". If I buy, Debt Increases. If I pay, Debt Decreases.
		// If "Saldo" = "Money inside wallet", then Purchase Decreases it.
		// The original code: `const montoTransaccion = tipo === "pago" ? montoEnCentavos : -montoEnCentavos;`
		// `const nuevoSaldo = cliente.saldoActual + montoTransaccion;`
		// So Payment adds (Positive), Purchase subtracts (Negative).
		// This implies `saldoActual` is likely "Funds available" or "Account Balance" (positive is good).
		// Let's stick to this logic.

		const amountCents = Math.round(transactionAmount * 100);
		const netAmount = (transactionType === "payment") ? amountCents : -amountCents;
		const newBalance = customer.currentBalance + netAmount;

		// Crear transacción
		const [newTransaction] = await db
			.insert(transactions)
			.values({
				customerId,
				type: transactionType as "purchase" | "payment",
				description: transactionDesc,
				amount: netAmount,
				balance: newBalance,
				date: new Date(), // Using current date for transaction
			})
			.returning();

		// Actualizar saldo del cliente
		await db
			.update(customers)
			.set({
				currentBalance: newBalance,
				lastPurchaseDate: transactionType === "purchase" ? new Date() : customer.lastPurchaseDate,
				updatedAt: new Date(),
			})
			.where(eq(customers.id, customerId));

		// Convertir centavos a pesos y fechas a timestamps
		const response = {
			id: newTransaction.id,
			customerId: newTransaction.customerId,
			type: newTransaction.type,
			description: newTransaction.description,
			amount: newTransaction.amount / 100,
			balance: newTransaction.balance / 100,
			date: newTransaction.date ? new Date(newTransaction.date).getTime() : null,
			createdAt: newTransaction.createdAt ? new Date(newTransaction.createdAt).getTime() : null,

			// Compatibility
			tipo: newTransaction.type === 'purchase' ? 'compra' : 'pago',
			concepto: newTransaction.description,
			monto: newTransaction.amount / 100,
			saldo: newTransaction.balance / 100,
			fecha: newTransaction.date ? new Date(newTransaction.date).getTime() : null,
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
