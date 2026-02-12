import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

		// Fetch invoice with items
		const invoice = await db.query.invoices.findFirst({
			where: eq(invoices.id, id),
			with: {
				items: true,
			},
		});

		if (!invoice) {
			return NextResponse.json(
				{ error: "Invoice not found" },
				{ status: 404 }
			);
		}

		// Format response
		const formattedInvoice = {
			...invoice,
			total: invoice.total / 100,
			// Drizzle returns Date object for timestamp mode
			date: invoice.date ? new Date(invoice.date).toLocaleDateString("es-AR") : null,
			salePoint: invoice.salePoint ? invoice.salePoint.toString().padStart(3, "0") : "001",
			items: invoice.items.map((item) => ({
				...item,
				unitPrice: item.unitPrice / 100,
				amount: item.amount / 100,
			})),
			// Compatibility fields for frontend if needed
			budgetNumber: invoice.quoteNumber,
			presupuesto: invoice.quoteNumber,
			cliente: invoice.customerName,
			domicilio: invoice.address,
			localidad: invoice.city,
			telefono: invoice.phone,
			mov: invoice.movementType,
			vendedor: invoice.salesperson,
			observaciones: invoice.notes,
		};


		return NextResponse.json(formattedInvoice);
	} catch (error) {
		console.error("Error fetching invoice:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}

// DELETE - Soft delete invoice
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: idString } = await params;
		const id = parseInt(idString);

		if (isNaN(id)) {
			return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
		}

		await db
			.update(invoices)
			.set({
				deletedAt: new Date(),
			})
			.where(eq(invoices.id, id));

		return NextResponse.json({ message: "Invoice deleted successfully" });
	} catch (error) {
		console.error("Error deleting invoice:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}

// PATCH - Restore invoice
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

		const { searchParams } = new URL(request.url);
		const action = searchParams.get("action");

		if (action === "restore") {
			await db
				.update(invoices)
				.set({
					deletedAt: null,
				})
				.where(eq(invoices.id, id));

			return NextResponse.json({ message: "Invoice restored successfully" });
		}

		return NextResponse.json({ error: "Invalid action" }, { status: 400 });
	} catch (error) {
		console.error("Error restoring invoice:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
