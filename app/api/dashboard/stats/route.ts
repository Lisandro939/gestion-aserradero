import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers, deliveryNotes } from "@/lib/db/schema";
import { gte } from "drizzle-orm";

export async function GET(request: NextRequest) {
	try {
		const today = new Date();

		// 1. Total Debt (Sum of negative balances)
		// Balances are stored in cents. Negative balance means debt.
		const allCustomers = await db.select({
			currentBalance: customers.currentBalance
		}).from(customers);

		let totalDebtCents = 0;
		for (const c of allCustomers) {
			if (c.currentBalance < 0) {
				totalDebtCents += Math.abs(c.currentBalance);
			}
		}

		// 2. Sales History (Last 12 months)
		// We can get this from delivery notes (or invoices). User mentioned "facturación y remitos".
		// Let's use Delivery Notes as the primary sales indicator for now (as per user's usage).

		const twelveMonthsAgo = new Date();
		twelveMonthsAgo.setMonth(today.getMonth() - 11);
		twelveMonthsAgo.setDate(1); // Start of that month

		// Fetch all delivery notes from 12 months ago
		const notes = await db
			.select({
				date: deliveryNotes.date,
				total: deliveryNotes.total
			})
			.from(deliveryNotes)
			.where(gte(deliveryNotes.date, twelveMonthsAgo));

		// Process Monthly Sales
		const monthlyData = [];

		// Initialize last 12 months with 0
		// We want order: Oldest (11 months ago) -> Newest (0 months ago)
		for (let i = 11; i >= 0; i--) {
			const d = new Date();
			d.setMonth(today.getMonth() - i);

			// Format month label
			const monthLabel = d.toLocaleString('es-AR', { month: 'short' });
			// Capitalize first letter: "ene" -> "Ene"
			const formattedLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
			const key = d.toISOString().slice(0, 7); // YYYY-MM key for matching

			monthlyData.push({
				key: key,
				month: formattedLabel,
				sales: 0
			});
		}

		// Aggregate sales into months
		for (const n of notes) {
			if (!n.date) continue;
			const nDate = new Date(n.date);
			const key = nDate.toISOString().slice(0, 7);

			// Find correct month bucket
			const match = monthlyData.find(m => m.key === key);
			if (match) {
				match.sales += (n.total / 100);
			}
		}

		// 3. Total Sales All Time
		const allNotes = await db.select({ total: deliveryNotes.total }).from(deliveryNotes);
		const totalSalesAllTime = allNotes.reduce((sum, n) => sum + (n.total / 100), 0);

		// Current Month Sales
		const currentMonthKey = today.toISOString().slice(0, 7);
		const currentMonthData = monthlyData.find(m => m.key === currentMonthKey);
		const currentMonthSales = currentMonthData ? currentMonthData.sales : 0;

		return NextResponse.json({
			totalDebt: totalDebtCents / 100, // Positive number representing magnitude of debt
			totalSales: totalSalesAllTime,
			currentMonthSales: currentMonthSales,
			monthlySales: monthlyData // Check formatting in frontend
		});

	} catch (error) {
		console.error("Error fetching dashboard stats:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
