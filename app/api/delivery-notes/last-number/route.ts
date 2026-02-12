import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deliveryNotes } from "@/lib/db/schema";
import { desc, like } from "drizzle-orm";

export async function GET() {
	try {
		// Fetch the delivery note with the highest number
		// Assuming numbers are sequential like "00000001", "00000002"
		// If they have prefixes, this simple sort might fail if formats differ widely.
		// We will order by id desc as a proxy for latest, then try to parse its number.
		// Or order by number desc? Number is text.

		const lastNote = await db
			.select({ number: deliveryNotes.number })
			.from(deliveryNotes)
			.orderBy(desc(deliveryNotes.id)) // Assuming ID is sequential
			.limit(1);

		let nextNumber = "00000001";

		if (lastNote.length > 0 && lastNote[0].number) {
			const currentStr = lastNote[0].number;
			// Extract numeric part. Assuming it's fully numeric or suffix numeric.
			// If the user inputs "RE-0001", we might struggle.
			// Let's assume they want a simple increment of the string if it parses.

			const numericPart = currentStr.replace(/\D/g, "");
			if (numericPart) {
				const currentVal = parseInt(numericPart, 10);
				const nextVal = currentVal + 1;
				// Pad with zeros to match length or default 8
				const len = Math.max(currentStr.length, 8);
				nextNumber = nextVal.toString().padStart(len, "0");
			}
		}

		return NextResponse.json({ nextNumber });
	} catch (error) {
		console.error("Error fetching next delivery note number:", error);
		// Return default instead of error to avoid blocking the UI
		return NextResponse.json({ nextNumber: "00000001" });
	}
}
