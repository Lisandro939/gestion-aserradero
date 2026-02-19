import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deliveryNotes, deliveryNoteItems, customers, products, transactions } from "@/lib/db/schema";
import { eq, like, or, and, desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

function parseDate(dateStr: string | undefined | null): Date {
	if (!dateStr) return new Date();

	// Check for DD/MM/YYYY format
	const dmy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (dmy) {
		return new Date(parseInt(dmy[3]), parseInt(dmy[2]) - 1, parseInt(dmy[1]));
	}

	const d = new Date(dateStr);
	return isNaN(d.getTime()) ? new Date() : d;
}

// GET - List delivery notes with optional filters
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const customerIdParam = searchParams.get("customerId");

		const whereClause = customerIdParam
			? eq(deliveryNotes.customerId, parseInt(customerIdParam))
			: undefined;

		// Fetch records with relations
		const result = await db.query.deliveryNotes.findMany({
			where: whereClause,
			with: {
				customer: true,
				items: true,
			},
			columns: {
				id: true,
				number: true,
				customerId: true,
				date: true,
				salePoint: true,
				status: true,
				total: true,
				notes: true,
				createdAt: true,
				deletedAt: true,
			},
			orderBy: (deliveryNotes, { desc }) => [desc(deliveryNotes.date), desc(deliveryNotes.createdAt)],
		});

		return NextResponse.json({
			data: result.map((note) => ({
				...note,
				total: note.total / 100, // Convert cents to user-friendly currency
			})),
		});
	} catch (error) {
		console.error("Error fetching delivery notes:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}

// POST - Create a new delivery note
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { documentNumber, customerId, date, status, notes, items } = body; // items: { productId, quantity, unitPrice }[]

		if (!customerId || !items || items.length === 0) {
			return NextResponse.json(
				{ error: "Customer and items are required" },
				{ status: 400 }
			);
		}

		// Calculate total
		let calculatedTotal = 0;

		// Start transaction
		const result = await db.transaction(async (tx) => {
			// 0. Get current customer state
			const [customer] = await tx
				.select()
				.from(customers)
				.where(eq(customers.id, customerId))
				.limit(1);

			if (!customer) {
				throw new Error("Cliente no encontrado");
			}

			// 1. Create Delivery Note
			const [newNote] = await tx
				.insert(deliveryNotes)
				.values({
					customerId,
					number: documentNumber,
					salePoint: body.salePoint || 1,
					date: parseDate(date),
					status: status || "pending",
					notes,
					total: 0, // Will update later
				})
				.returning();

			// 2. Process Items
			for (const item of items) {
				// Frontend sends: { detail: string, quantity: string }
				// We map detail -> description
				const quantity = parseInt(item.quantity?.toString() || "0");
				const unitPrice = item.unitPrice ? Math.round(item.unitPrice * 100) : 0; // Default 0
				const subtotal = quantity * unitPrice;
				const description = item.detail || item.description || "Sin detalle";
				const productId = item.productId || null;

				calculatedTotal += subtotal;

				await tx.insert(deliveryNoteItems).values({
					deliveryNoteId: newNote.id,
					productId,
					description,
					quantity,
					unitPrice,
					subtotal,
				});

				// Optional: Decrease product stock if productId exists
				if (productId) {
					// Logic to decrease stock later
				}
			}

			// 3. Update total in Delivery Note
			await tx
				.update(deliveryNotes)
				.set({ total: calculatedTotal })
				.where(eq(deliveryNotes.id, newNote.id));

			// 4. Update Customer Balance & Create Ledger Transaction
			// Delivery Note = Purchase (Increases Debt / Decreases Balance if Balance is 'Cash')
			// Assuming Balance is 'Available Funds': Purchase is negative.
			const netAmount = -calculatedTotal;
			const newBalance = customer.currentBalance + netAmount;

			await tx.update(customers).set({
				currentBalance: newBalance,
				lastPurchaseDate: new Date(),
				updatedAt: new Date()
			}).where(eq(customers.id, customerId));

			// Create the Transaction Record
			await tx.insert(transactions).values({
				customerId,
				type: "purchase",
				description: `Remito #${documentNumber}`,
				amount: netAmount,
				balance: newBalance,
				paymentMethod: "current_account",
				documentNumber: documentNumber,
				date: parseDate(date), // Use remito date
			});

			return { ...newNote, total: calculatedTotal };
		});

		return NextResponse.json({
			...result,
			total: result.total / 100
		}, { status: 201 });

	} catch (error: any) {
		console.error("Error creating delivery note:", error);
		if ((error as any).code === "SQLITE_CONSTRAINT") { // quick check unique constraint
			return NextResponse.json(
				{ error: "Delivery note number already exists" },
				{ status: 409 }
			);
		}
		return NextResponse.json(
			{ error: error.message || "Internal Server Error" },
			{ status: 500 }
		);
	}
}
// DELETE - Soft delete or restore a delivery note
export async function DELETE(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const id = searchParams.get("id");
		const action = searchParams.get("action"); // 'restore' or 'delete' (default)

		if (!id) {
			return NextResponse.json(
				{ error: "Delivery note ID is required" },
				{ status: 400 }
			);
		}

		const noteId = parseInt(id);

		if (action === "restore") {
			await db
				.update(deliveryNotes)
				.set({ deletedAt: null })
				.where(eq(deliveryNotes.id, noteId));
		} else {
			await db
				.update(deliveryNotes)
				.set({ deletedAt: new Date() })
				.where(eq(deliveryNotes.id, noteId));
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error updating delivery note:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
