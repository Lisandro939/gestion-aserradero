import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deliveryNotes, deliveryNoteItems, customers, products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET - Get a single delivery note by ID
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: idString } = await params;
		const id = parseInt(idString);

		if (isNaN(id)) {
			return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
		}

		// Fetch the delivery note with customer details
		const [note] = await db
			.select({
				id: deliveryNotes.id,
				number: deliveryNotes.number,
				customerId: deliveryNotes.customerId,
				customerName: customers.name,
				customerAddress: customers.address,
				customerTaxId: customers.taxId,
				date: deliveryNotes.date,
				status: deliveryNotes.status,
				total: deliveryNotes.total,
				notes: deliveryNotes.notes,
				createdAt: deliveryNotes.createdAt,
				updatedAt: deliveryNotes.updatedAt,
				salePoint: deliveryNotes.salePoint,
			})
			.from(deliveryNotes)
			.leftJoin(customers, eq(deliveryNotes.customerId, customers.id))
			.where(eq(deliveryNotes.id, id))
			.limit(1);

		if (!note) {
			return NextResponse.json(
				{ error: "Delivery note not found" },
				{ status: 404 }
			);
		}

		// Fetch items for this delivery note
		const items = await db
			.select({
				id: deliveryNoteItems.id,
				productId: deliveryNoteItems.productId,
				productName: products.name,
				description: deliveryNoteItems.description,
				quantity: deliveryNoteItems.quantity,
				unitPrice: deliveryNoteItems.unitPrice,
				subtotal: deliveryNoteItems.subtotal,
			})
			.from(deliveryNoteItems)
			.leftJoin(products, eq(deliveryNoteItems.productId, products.id))
			.where(eq(deliveryNoteItems.deliveryNoteId, id));

		return NextResponse.json({
			...note,
			total: note.total / 100, // Convert to user friendly currency
			items: items.map((item) => ({
				...item,
				unitPrice: (item.unitPrice || 0) / 100, // Handle nullable
				subtotal: (item.subtotal || 0) / 100, // Handle nullable
			})),
		});
	} catch (error) {
		console.error("Error fetching delivery note:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}

// PUT - Update a delivery note
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: idString } = await params;
		const id = parseInt(idString);

		if (isNaN(id)) {
			return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
		}

		const body = await request.json();
		const { customerId, date, status, notes, items } = body;

		// Start transaction to update note and items
		await db.transaction(async (tx) => {
			// 1. Update Delivery Note details
			await tx
				.update(deliveryNotes)
				.set({
					customerId,
					date: date ? new Date(date) : undefined,
					status, // If status changes, handled here
					notes,
					updatedAt: new Date(),
				})
				.where(eq(deliveryNotes.id, id));

			// 2. If items are provided, replace them
			if (items && Array.isArray(items)) {
				// Delete existing items
				await tx
					.delete(deliveryNoteItems)
					.where(eq(deliveryNoteItems.deliveryNoteId, id));

				let newTotal = 0;

				// Insert new items
				for (const item of items) {
					const quantity = parseInt(item.quantity?.toString() || "0");
					const unitPrice = item.unitPrice ? Math.round(item.unitPrice * 100) : 0;
					const subtotal = quantity * unitPrice;
					const description = item.detail || item.description || "Sin detalle";
					const productId = item.productId || null;

					newTotal += subtotal;

					await tx.insert(deliveryNoteItems).values({
						deliveryNoteId: id,
						productId,
						description,
						quantity,
						unitPrice,
						subtotal,
					});
				}

				// Update total in delivery note
				await tx
					.update(deliveryNotes)
					.set({ total: newTotal })
					.where(eq(deliveryNotes.id, id));
			}
		});

		return NextResponse.json({
			message: "Delivery note updated successfully",
			id
		});
	} catch (error) {
		console.error("Error updating delivery note:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}

// PATCH - Restore a delivery note, or change status specifically
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: idString } = await params;
		const id = parseInt(idString);

		if (isNaN(id)) {
			return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
		}

		const body = await request.json();
		const { action, status } = body;

		let newStatus = status;
		if (action === 'restore') {
			newStatus = 'pending'; // When restoring, default to pending (or whatever the initial status is)
		}

		if (!newStatus) {
			return NextResponse.json({ error: "Status or action required" }, { status: 400 });
		}

		await db
			.update(deliveryNotes)
			.set({
				status: newStatus,
				updatedAt: new Date(),
			})
			.where(eq(deliveryNotes.id, id));

		return NextResponse.json({
			message: "Delivery note status updated successfully",
			status: newStatus
		});

	} catch (error) {
		console.error("Error patching delivery note:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
