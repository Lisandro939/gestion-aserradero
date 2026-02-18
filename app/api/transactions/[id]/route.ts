import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, customers, cheques } from "@/lib/db/schema";
import { eq, and, gt, sql, isNull } from "drizzle-orm";

// PUT - Update a transaction
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: idString } = await params;
		const transactionId = parseInt(idString);

		if (isNaN(transactionId)) {
			return NextResponse.json({ error: "ID inválido" }, { status: 400 });
		}

		const body = await request.json();
		const {
			description,
			amount,
			date,
			paymentMethod,
			documentNumber
		} = body;

		// Start transaction
		const updatedTransaction = await db.transaction(async (tx) => {
			// 1. Get original transaction
			const [originalTx] = await tx
				.select()
				.from(transactions)
				.where(eq(transactions.id, transactionId))
				.limit(1);

			if (!originalTx) {
				throw new Error("Transacción no encontrada");
			}

			// 2. Prepare updates
			const updates: any = {};
			let balanceDiff = 0;

			if (description !== undefined) updates.description = description;
			if (date !== undefined) updates.date = new Date(date);
			if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod;
			if (documentNumber !== undefined) updates.documentNumber = documentNumber;

			// 3. Handle Amount Change
			if (amount !== undefined) {
				const newAmountAbs = Math.round(Math.abs(amount) * 100);
				// Determine sign based on original type
				// Payment = Positive, Purchase = Negative
				const newNetAmount = originalTx.type === "payment" ? newAmountAbs : -newAmountAbs;

				const oldNetAmount = originalTx.amount;
				balanceDiff = newNetAmount - oldNetAmount;

				updates.amount = newNetAmount;
				updates.balance = originalTx.balance + balanceDiff;
			}

			// 4. Update the transaction
			if (Object.keys(updates).length > 0) {
				await tx
					.update(transactions)
					.set(updates)
					.where(eq(transactions.id, transactionId));
			}

			// 5. If balance changed, propagate effects
			if (balanceDiff !== 0) {
				// A. Update Customer Current Balance
				const [customer] = await tx
					.select()
					.from(customers)
					.where(eq(customers.id, originalTx.customerId))
					.limit(1);

				if (customer) {
					await tx
						.update(customers)
						.set({
							currentBalance: customer.currentBalance + balanceDiff,
							updatedAt: new Date(),
						})
						.where(eq(customers.id, customer.id));
				}

				// B. Update subsequent transactions' balance snapshots
				await tx
					.update(transactions)
					.set({
						balance: sql`${transactions.balance} + ${balanceDiff}`
					})
					.where(
						and(
							eq(transactions.customerId, originalTx.customerId),
							gt(transactions.id, transactionId),
							isNull(transactions.deletedAt)
						)
					);
			}

			return { ...originalTx, ...updates };
		});

		return NextResponse.json({ success: true, transaction: updatedTransaction });

	} catch (error: any) {
		console.error("Error updating transaction:", error);
		return NextResponse.json(
			{ error: error.message || "Error interno del servidor" },
			{ status: 500 }
		);
	}
}

// DELETE - Soft delete a transaction
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: idString } = await params;
		const transactionId = parseInt(idString);

		if (isNaN(transactionId)) {
			return NextResponse.json({ error: "ID inválido" }, { status: 400 });
		}

		await db.transaction(async (tx) => {
			// 1. Get transaction
			const [txToDelete] = await tx
				.select()
				.from(transactions)
				.where(eq(transactions.id, transactionId))
				.limit(1);

			if (!txToDelete) {
				throw new Error("Transacción no encontrada");
			}

			if (txToDelete.deletedAt) {
				return; // Already deleted
			}

			// 2. Calculate impact
			// If we remove this transaction, we must reverse its amount effect.
			// Diff = -Amount.
			const diff = -txToDelete.amount;

			// 3. Mark as deleted
			await tx
				.update(transactions)
				.set({ deletedAt: new Date() })
				.where(eq(transactions.id, transactionId));

			// 4. Update Customer Balance
			const [customer] = await tx
				.select()
				.from(customers)
				.where(eq(customers.id, txToDelete.customerId))
				.limit(1);

			if (customer) {
				// A transaction that increased balance (payment) -> deleting it decreases balance.
				// diff = -amount.
				// customer.currentBalance += diff.

				await tx
					.update(customers)
					.set({
						currentBalance: customer.currentBalance + diff,
						updatedAt: new Date(),
					})
					.where(eq(customers.id, customer.id));
			}

			// 5. Update subsequent transactions
			await tx
				.update(transactions)
				.set({
					balance: sql`${transactions.balance} + ${diff}`
				})
				.where(
					and(
						eq(transactions.customerId, txToDelete.customerId),
						gt(transactions.id, transactionId),
						isNull(transactions.deletedAt)
					)
				);
		});

		return NextResponse.json({ success: true });

	} catch (error: any) {
		console.error("Error deleting transaction:", error);
		return NextResponse.json(
			{ error: error.message || "Error interno del servidor" },
			{ status: 500 }
		);
	}
}
