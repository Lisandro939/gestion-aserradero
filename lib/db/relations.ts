import { relations } from "drizzle-orm";
import { customers, deliveryNotes, deliveryNoteItems, products, invoices, invoiceItems } from "./schema";

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
	deliveryNotes: many(deliveryNotes),
}));

export const deliveryNotesRelations = relations(deliveryNotes, ({ one, many }) => ({
	customer: one(customers, {
		fields: [deliveryNotes.customerId],
		references: [customers.id],
	}),
	items: many(deliveryNoteItems),
}));

export const deliveryNoteItemsRelations = relations(deliveryNoteItems, ({ one }) => ({
	deliveryNote: one(deliveryNotes, {
		fields: [deliveryNoteItems.deliveryNoteId],
		references: [deliveryNotes.id],
	}),
	product: one(products, {
		fields: [deliveryNoteItems.productId],
		references: [products.id],
	}),
}));

export const invoicesRelations = relations(invoices, ({ many }) => ({
	items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
	invoice: one(invoices, {
		fields: [invoiceItems.invoiceId],
		references: [invoices.id],
	}),
}));
