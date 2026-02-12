import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { eq, like, or, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET - Get all customers or search
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const search = searchParams.get("search");

		const conditions = [];

		if (search) {
			conditions.push(
				or(
					like(customers.name, `%${search}%`),
					like(customers.email, `%${search}%`),
					like(customers.taxId, `%${search}%`)
				)
			);
		}

		// By default only show active (unless handled otherwise, but previous logic implies filtering in frontend or showing status)
		// The previous code mapped deletedAt to status. Now we just read status.

		const query = db
			.select()
			.from(customers)
			.where(conditions.length > 0 ? and(...conditions) : undefined);

		const result = await query;

		// Map to interface
		const customersMapped = result.map((customer) => ({
			id: customer.id,
			name: customer.name,
			email: customer.email,
			phone: customer.phone,
			address: customer.address,
			cuit: customer.taxId, // Keeping 'cuit' key for frontend compatibility if needed, or we can switch to taxId
			taxId: customer.taxId,
			status: customer.status,
			registrationDate: customer.registrationDate ? new Date(customer.registrationDate).getTime() : new Date().getTime(),
			lastPurchase: customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).getTime() : null,
		}));

		return NextResponse.json(customersMapped);
	} catch (error) {
		console.error("Error fetching customers:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}

// POST - Create new customer
export async function POST(request: NextRequest) {
	try {
		const data = await request.json();
		const {
			name,
			email,
			phone,
			address,
			cuit, // Map this to taxId
		} = data;

		if (!name || !email || !phone || !address || !cuit) {
			return NextResponse.json(
				{ error: "All fields are required" },
				{ status: 400 }
			);
		}

		// Check if CUIT (taxId) exists
		const [existingCustomer] = await db
			.select()
			.from(customers)
			.where(eq(customers.taxId, cuit))
			.limit(1);

		if (existingCustomer) {
			return NextResponse.json(
				{ error: "El CUIT ya se encuentra registrado" },
				{ status: 409 }
			);
		}

		// Create customer with default values
		const [newCustomer] = await db
			.insert(customers)
			.values({
				name,
				email,
				phone,
				address,
				taxId: cuit,
				// Default values for fields not in form
				currentBalance: 0,
				creditLimit: 0,
				status: "active",
			})
			.returning();

		// Map response
		const customerResponse = {
			id: newCustomer.id,
			name: newCustomer.name,
			email: newCustomer.email,
			phone: newCustomer.phone,
			address: newCustomer.address,
			cuit: newCustomer.taxId,
			taxId: newCustomer.taxId,
			status: newCustomer.status,
			registrationDate: newCustomer.registrationDate ? new Date(newCustomer.registrationDate).getTime() : new Date().getTime(),
			lastPurchase: newCustomer.lastPurchaseDate ? new Date(newCustomer.lastPurchaseDate).getTime() : null,
		};

		return NextResponse.json(customerResponse, { status: 201 });
	} catch (error) {
		console.error("Error creating customer:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}

// PUT - Update customer
export async function PUT(request: NextRequest) {
	try {
		const data = await request.json();
		const { id, name, email, phone, address, cuit } = data;

		if (!id) {
			return NextResponse.json(
				{ error: "Customer ID is required" },
				{ status: 400 }
			);
		}

		const [updatedCustomer] = await db
			.update(customers)
			.set({
				name,
				email,
				phone,
				address,
				taxId: cuit,
			})
			.where(eq(customers.id, parseInt(id)))
			.returning();

		return NextResponse.json({
			...updatedCustomer,
			cuit: updatedCustomer.taxId, // maintain compatibility
			taxId: updatedCustomer.taxId
		});
	} catch (error) {
		console.error("Error updating customer:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}

// DELETE - Soft delete customer (mark as inactive)
export async function DELETE(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const id = searchParams.get("id");

	if (!id) {
		return NextResponse.json({ error: "ID is required" }, { status: 400 });
	}

	try {
		await db
			.update(customers)
			.set({
				status: "inactive"
			})
			.where(eq(customers.id, parseInt(id)));

		return NextResponse.json({ message: "Customer deleted successfully" });
	} catch (error) {
		console.error("Error deleting customer:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}

// PATCH - Restore customer
export async function PATCH(request: NextRequest) {
	try {
		const data = await request.json();
		const { id, action } = data;

		if (!id || action !== "restore") {
			return NextResponse.json(
				{ error: "Invalid request" },
				{ status: 400 }
			);
		}

		await db
			.update(customers)
			.set({
				status: "active"
			})
			.where(eq(customers.id, parseInt(id)));

		return NextResponse.json({ message: "Customer restored successfully" });
	} catch (error) {
		console.error("Error restoring customer:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
