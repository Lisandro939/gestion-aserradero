import { sql, relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Users table
export const users = sqliteTable("users", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	email: text("email").notNull().unique(),
	name: text("name").notNull(),
	password: text("password").notNull(), // Hashed with bcrypt
	role: text("role", { enum: ["admin", "user"] })
		.notNull()
		.default("user"),
	mustChangePassword: integer("must_change_password", { mode: "boolean" })
		.notNull()
		.default(false),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

// Customers table
export const customers = sqliteTable("customers", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	email: text("email").notNull(),
	phone: text("phone").notNull(),
	address: text("address").notNull(),
	taxId: text("tax_id").notNull().unique(), // CUIT
	currentBalance: integer("current_balance").notNull().default(0), // In cents
	creditLimit: integer("credit_limit").notNull().default(0), // In cents
	status: text("status", { enum: ["active", "inactive", "overdue"] })
		.notNull()
		.default("active"),
	registrationDate: integer("registration_date", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	lastPurchaseDate: integer("last_purchase_date", { mode: "timestamp" }),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

// Transactions table (history of purchases and payments)
export const transactions = sqliteTable("transactions", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	customerId: integer("customer_id")
		.notNull()
		.references(() => customers.id, { onDelete: "cascade" }),
	type: text("type", { enum: ["purchase", "payment"] }).notNull(),
	date: integer("date", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	description: text("description").notNull(),
	amount: integer("amount").notNull(), // In cents, negative for purchases, positive for payments
	balance: integer("balance").notNull(), // Balance after transaction, in cents
	paymentMethod: text("payment_method", {
		enum: ["cash", "transfer", "cheque", "current_account"],
	}).default("current_account"),
	documentNumber: text("document_number"), // Remito or Invoice number
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

// Cheques table
export const cheques = sqliteTable("cheques", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	transactionId: integer("transaction_id")
		.notNull()
		.references(() => transactions.id, { onDelete: "cascade" }),
	number: text("number").notNull(),
	bank: text("bank").notNull(),
	drawerName: text("drawer_name").notNull(), // Name of the person who gave the cheque
	amount: integer("amount").notNull(), // In cents
	dueDate: integer("due_date", { mode: "timestamp" }).notNull(),
	status: text("status", { enum: ["pending", "deposited", "rejected", "honored"] })
		.notNull()
		.default("pending"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

// Products table (Inventory)
export const products = sqliteTable("products", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	description: text("description"),
	category: text("category").notNull(),
	unit: text("unit").notNull(), // m3, unit, kg, etc.
	stock: integer("stock").notNull().default(0),
	minStock: integer("min_stock").notNull().default(0),
	unitPrice: integer("unit_price").notNull(), // In cents
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

// Delivery Notes table (Remitos)
export const deliveryNotes = sqliteTable("delivery_notes", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	number: text("number").notNull().unique(),
	customerId: integer("customer_id")
		.notNull()
		.references(() => customers.id),
	date: integer("date", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	salePoint: integer("sale_point").notNull().default(1),
	status: text("status", { enum: ["pending", "delivered", "cancelled"] })
		.notNull()
		.default("pending"),
	total: integer("total").notNull(), // In cents
	notes: text("notes"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

// Delivery Note Items table
export const deliveryNoteItems = sqliteTable("delivery_note_items", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	deliveryNoteId: integer("delivery_note_id")
		.notNull()
		.references(() => deliveryNotes.id, { onDelete: "cascade" }),
	productId: integer("product_id")
		.references(() => products.id), // Nullable now
	description: text("description").notNull(), // Added description
	quantity: integer("quantity").notNull(),
	unitPrice: integer("unit_price").default(0), // In cents, default 0
	subtotal: integer("subtotal").default(0), // In cents, default 0
});

// Invoices table (Facturas)
export const invoices = sqliteTable("invoices", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	quoteNumber: text("quote_number"),
	date: integer("date", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	salePoint: integer("sale_point").notNull().default(1),
	customerName: text("customer_name").notNull(), // Free text or copied
	customerId: integer("customer_id").references(() => customers.id), // Optional
	address: text("address"),
	city: text("city"),
	phone: text("phone"),
	movementType: text("movement_type"),
	salesperson: text("salesperson"),
	notes: text("notes"),
	total: integer("total").notNull(), // In cents
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
	deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

// Invoice Items table
export const invoiceItems = sqliteTable("invoice_items", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	invoiceId: integer("invoice_id")
		.notNull()
		.references(() => invoices.id, { onDelete: "cascade" }),
	quantity: text("quantity").notNull(), // Stored as text for flexibility
	description: text("description").notNull(),
	code: text("code"),
	unitPrice: integer("unit_price").notNull(), // In cents
	discount: text("discount"), // Discount percentage
	amount: integer("amount").notNull(), // Subtotal in cents
});

// Inferred Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type DeliveryNote = typeof deliveryNotes.$inferSelect;
export type NewDeliveryNote = typeof deliveryNotes.$inferInsert;

export type DeliveryNoteItem = typeof deliveryNoteItems.$inferSelect;
export type NewDeliveryNoteItem = typeof deliveryNoteItems.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;

export type Cheque = typeof cheques.$inferSelect;
export type NewCheque = typeof cheques.$inferInsert;
