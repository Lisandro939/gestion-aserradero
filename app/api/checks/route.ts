import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cheques, transactions, customers } from "@/lib/db/schema";
import { eq, asc, isNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET - Get all checks with related data
export async function GET(request: NextRequest) {
	try {
		// Get all checks joined with their transaction and customer
		const allChecks = await db
			.select({
				id: cheques.id,
				number: cheques.number,
				bank: cheques.bank,
				drawerName: cheques.drawerName,
				amount: cheques.amount,
				dueDate: cheques.dueDate,
				status: cheques.status,
				createdAt: cheques.createdAt,
				transactionId: cheques.transactionId,
				customerId: transactions.customerId,
				customerName: customers.name,
				transactionDeletedAt: transactions.deletedAt,
			})
			.from(cheques)
			.innerJoin(transactions, eq(cheques.transactionId, transactions.id))
			.innerJoin(customers, eq(transactions.customerId, customers.id))
			.where(isNull(transactions.deletedAt))
			.orderBy(asc(cheques.dueDate));

		// Map to response format
		const checksMapped = allChecks.map((c) => ({
			id: c.id,
			number: c.number,
			bank: c.bank,
			drawerName: c.drawerName,
			amount: c.amount / 100, // Convert from cents
			dueDate: c.dueDate ? new Date(c.dueDate).getTime() : null,
			status: c.status,
			createdAt: c.createdAt ? new Date(c.createdAt).getTime() : null,
			customerId: c.customerId,
			customerName: c.customerName,
		}));

		return NextResponse.json(checksMapped);
	} catch (error) {
		console.error("Error fetching checks:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}

// PATCH - Update check status
export async function PATCH(request: NextRequest) {
	try {
		const data = await request.json();
		const { id, status } = data;

		if (!id || !status) {
			return NextResponse.json(
				{ error: "ID and status are required" },
				{ status: 400 }
			);
		}

		const validStatuses = ["pending", "deposited", "rejected", "honored"];
		if (!validStatuses.includes(status)) {
			return NextResponse.json(
				{ error: "Invalid status" },
				{ status: 400 }
			);
		}

		const [updatedCheck] = await db
			.update(cheques)
			.set({ status, updatedAt: new Date() })
			.where(eq(cheques.id, parseInt(id)))
			.returning();

		return NextResponse.json(updatedCheck);
	} catch (error) {
		console.error("Error updating check:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
