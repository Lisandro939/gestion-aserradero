import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
	try {
		const lastInvoice = await db
			.select({ number: invoices.quoteNumber })
			.from(invoices)
			.orderBy(desc(invoices.id))
			.limit(1);

		let nextNumber = "00000001";

		if (lastInvoice.length > 0 && lastInvoice[0].number) {
			const currentStr = lastInvoice[0].number;
			const numericPart = currentStr.replace(/\D/g, "");
			if (numericPart) {
				const currentVal = parseInt(numericPart, 10);
				const nextVal = currentVal + 1;
				// Pad with zeros to match length or default 8
				const len = Math.max(currentStr.length, 8);
				// If it was "00001", next is "00002".
				nextNumber = nextVal.toString().padStart(len, "0");
			}
		}

		return NextResponse.json({ nextNumber });
	} catch (error) {
		console.error("Error fetching next invoice number:", error);
		return NextResponse.json({ nextNumber: "00000001" });
	}
}
