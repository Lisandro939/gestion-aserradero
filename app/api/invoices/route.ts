import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, invoiceItems } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

// GET - Get all invoices
export async function GET() {
	try {
		const result = await db.query.invoices.findMany({
			with: {
				items: true,
			},
			orderBy: (invoices, { desc }) => [desc(invoices.createdAt)],
		});

		// Convert cents to pesos
		const invoicesWithPesos = result.map((invoice) => ({
			...invoice,
			total: invoice.total / 100,
			// Drizzle returns Date object for timestamp mode
			date: invoice.date ? new Date(invoice.date).toLocaleDateString("es-AR") : null,
			salePoint: invoice.salePoint ? invoice.salePoint.toString().padStart(3, "0") : "001",
			createdAt: invoice.createdAt,
			deletedAt: invoice.deletedAt,
			// Compatibility
			presupuesto: invoice.quoteNumber,
			cliente: invoice.customerName,
			domicilio: invoice.address,
			localidad: invoice.city,
			telefono: invoice.phone,
			mov: invoice.movementType,
			vendedor: invoice.salesperson,
			observaciones: invoice.notes,
			items: invoice.items.map((item) => ({
				...item,
				unitPrice: item.unitPrice / 100,
				amount: item.amount / 100,
				// Ensure strings for PDF
				quantity: item.quantity.toString(),
				description: item.description,
				code: item.code || "",
				discount: item.discount || "",
			})),
		}));

		return NextResponse.json(invoicesWithPesos);
	} catch (error) {
		console.error("Error fetching invoices:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}

// POST - Create new invoice
export async function POST(request: NextRequest) {
	try {
		const data = await request.json();
		const {
			quoteNumber,
			budgetNumber, // compat
			presupuesto, // compat
			date, // String "DD/MM/YYYY" or ISO
			customerName,
			cliente, // compat
			address,
			domicilio, // compat
			city,
			localidad, // compat
			phone,
			telefono, // compat
			movementType,
			mov, // compat
			salesperson,
			vendedor, // compat
			notes,
			observaciones, // compat
			items,
		} = data;

		// Resolve fields
		const resolvedQuoteNumber = quoteNumber || budgetNumber || presupuesto;
		const resolvedCustomerName = customerName || cliente;
		const resolvedAddress = address || domicilio;
		const resolvedCity = city || localidad;
		const resolvedPhone = phone || telefono;
		const resolvedMovementType = movementType || mov;
		const resolvedSalesperson = salesperson || vendedor;
		const resolvedNotes = notes || observaciones;

		if (!resolvedCustomerName || !items || items.length === 0) {
			return NextResponse.json(
				{ error: "Customer and items are required" },
				{ status: 400 }
			);
		}

		// Calculate total
		let totalInCents = 0;
		// Validate and clean items
		const processedItems = items
			.filter((item: any) => {
				const hasDescription = item.description && item.description.trim() !== "";
				// Compat check for older frontend payloads?
				const description = item.description || item.descripcion;
				const quantity = item.quantity || item.cantidad;
				const price = item.price || item.precio || item.unitPrice || item.precio_unitario;

				const hasAmount =
					(parseFloat(quantity) || 0) > 0 || (parseFloat(item.amount || item.importe) || 0) > 0;
				return (description && description.trim() !== "") || hasAmount;
			})
			.map((item: any) => {
				const price = parseFloat(item.price || item.precio || item.unitPrice || item.precio_unitario) || 0;
				const quantityVal = parseFloat(item.quantity || item.cantidad) || 0;
				const discount = parseFloat(item.discount || item.dto) || 0;

				const subtotal = price * quantityVal;
				const discountAmount = subtotal * (discount / 100);
				const amount = subtotal - discountAmount;

				totalInCents += Math.round(amount * 100);

				return {
					quantity: (item.quantity || item.cantidad).toString(),
					description: item.description || item.descripcion,
					code: item.code || item.codigo,
					unitPrice: Math.round(price * 100),
					discount: (item.discount || item.dto || "").toString(),
					amount: Math.round(amount * 100),
				};
			});

		// Parse date
		let dateObj = new Date();
		const dateStr = date || data.fecha;
		if (dateStr && dateStr.includes("/")) {
			const [day, month, year] = dateStr.split("/");
			dateObj = new Date(`${year}-${month}-${day}`);
		} else if (dateStr) {
			dateObj = new Date(dateStr);
		}

		// Create invoice
		const [newInvoice] = await db
			.insert(invoices)
			.values({
				quoteNumber: resolvedQuoteNumber,
				salePoint: data.salePoint || 1,
				date: dateObj,
				customerName: resolvedCustomerName,
				address: resolvedAddress,
				city: resolvedCity,
				phone: resolvedPhone,
				movementType: resolvedMovementType,
				salesperson: resolvedSalesperson,
				notes: resolvedNotes,
				total: totalInCents,
			})
			.returning();

		// Create items
		if (processedItems.length > 0) {
			await db.insert(invoiceItems).values(
				processedItems.map((item: any) => ({
					invoiceId: newInvoice.id,
					...item,
				}))
			);
		}

		// Response
		const invoiceResponse = {
			...newInvoice,
			total: newInvoice.total / 100,
			items: processedItems.map((item: any) => ({
				...item,
				unitPrice: item.unitPrice / 100,
				amount: item.amount / 100,
			})),
		};

		return NextResponse.json(invoiceResponse, { status: 201 });
	} catch (error) {
		console.error("Error creating invoice:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}


