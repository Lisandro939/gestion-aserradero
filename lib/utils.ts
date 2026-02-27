import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatDate(date: string | number | Date) {
	if (!date) return "-";
	const d = new Date(date);
	// Use UTC methods to avoid timezone-offset display issues
	const day = String(d.getUTCDate()).padStart(2, "0");
	const month = String(d.getUTCMonth() + 1).padStart(2, "0");
	const year = d.getUTCFullYear();
	return `${day}/${month}/${year}`;
}

/**
 * Returns how many calendar days until a due date (negative = already expired).
 * Uses UTC midnight for both sides to avoid timezone off-by-one issues.
 */
export function getDaysUntilDue(dueDate: number | string | Date | null): number | null {
	if (!dueDate) return null;
	const due = new Date(dueDate);
	// Compare at UTC midnight for both to get whole-day difference
	const dueUTC = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
	const now = new Date();
	const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
	return Math.round((dueUTC - nowUTC) / (1000 * 60 * 60 * 24));
}


export function formatCurrency(amount: number) {
	return new Intl.NumberFormat("es-AR", {
		style: "currency",
		currency: "ARS",
	}).format(amount);
}
