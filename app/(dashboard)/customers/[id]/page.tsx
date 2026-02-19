"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	ArrowLeft,
	User,
	Mail,
	Phone,
	MapPin,
	CreditCard,
	FileText,
	Download,
	TrendingUp,
	TrendingDown,
	Loader2,
	Calendar,
	DollarSign,
	Package,
	Eye,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { generateDeliveryNotePDF } from "@/app/components/DeliveryNotePDF";
import { generateInvoicePDF } from "@/app/components/InvoicePDF";
import { ClientAccountHistory } from "@/app/components/ClientAccountHistory";

export default function CustomerDetailsPage() {
	const params = useParams();
	const router = useRouter();
	const id = params?.id as string;

	const [customer, setCustomer] = useState<any>(null);
	const [transactions, setTransactions] = useState<any[]>([]);
	const [deliveryNotes, setDeliveryNotes] = useState<any[]>([]);
	const [invoices, setInvoices] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchData = useCallback(async (signal?: AbortSignal) => {
		try {
			// Don't set loading to true here if we want to avoid flicker on strict mode re-runs?
			// But we need it for initial load.
			// Let's keep it, but maybe check signal first.
			if (signal?.aborted) return;
			setLoading(true);

			// 1. Fetch Customer
			const customerRes = await fetch(`/api/customers/${id}`, { signal });
			if (!customerRes.ok) throw new Error("Customer not found");
			const customerData = await customerRes.json();
			setCustomer(customerData);

			// 2. Fetch Transactions
			const transactionsRes = await fetch(`/api/customers/${id}/transactions`, { signal });
			if (transactionsRes.ok) {
				const transactionsData = await transactionsRes.json();
				setTransactions(transactionsData);
			}

			// 3. Fetch Delivery Notes (Filter by ID)
			const notesRes = await fetch("/api/delivery-notes", { signal });
			if (notesRes.ok) {
				const notesData = await notesRes.json();
				const filteredNotes = notesData.data.filter(
					(n: any) => n.customerId.toString() === id.toString()
				);
				setDeliveryNotes(filteredNotes);
			}

			// 4. Fetch Invoices (Filter by Name - Fallback)
			const invoicesRes = await fetch("/api/invoices", { signal });
			if (invoicesRes.ok) {
				const invoicesData = await invoicesRes.json();
				// Normalize for comparison
				const normalizedName = customerData.name.toLowerCase().trim();
				const filteredInvoices = invoicesData.filter(
					(inv: any) =>
						inv.customerName?.toLowerCase().trim() === normalizedName ||
						inv.customerId?.toString() === id.toString()
				);
				setInvoices(filteredInvoices);
			}
		} catch (error: any) {
			if (error.name === "AbortError") {
				// Request cancelled, ignore
				return;
			}
			console.error("Error fetching data:", error);
		} finally {
			if (!signal?.aborted) {
				setLoading(false);
			}
		}
	}, [id]);

	useEffect(() => {
		if (!id) return;
		const controller = new AbortController();
		fetchData(controller.signal);
		return () => controller.abort();
	}, [id, fetchData]);

	const [activeTab, setActiveTab] = useState("current-account");

	const formatDate = (date: string | number | Date) => {
		if (!date) return "-";
		return new Date(date).toLocaleDateString("es-AR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: "ARS",
		}).format(amount);
	};

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-amber-600" />
			</div>
		);
	}

	if (!customer) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-4">
				<p className="text-stone-500">Cliente no encontrado</p>
				<button
					onClick={() => router.back()}
					className="cursor-pointer flex items-center gap-2 rounded-xl bg-stone-100 px-4 py-2 text-sm font-bold text-stone-600 transition-colors hover:bg-stone-200"
				>
					<ArrowLeft className="h-4 w-4" /> Volver
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-6 pb-12">
			{/* Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="flex items-center gap-4">
					<button
						onClick={() => router.back()}
						className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--secondary-card)] border border-[var(--card-foreground)] p-2 text-[var(--card-foreground)]"
					>
						<ArrowLeft className="h-5 w-5" />
					</button>
					<div>
						<h1 className="text-2xl font-bold text-[var(--card-foreground)]">
							{customer.name}
						</h1>
						<div className="flex items-center gap-2 text-sm text-stone-500">
							<span className="flex items-center gap-1">
								<CreditCard className="h-3 w-3" /> CUIT: {customer.cuit || customer.taxId}
							</span>
							<span>•</span>
							<span>Cliente #{customer.id}</span>
						</div>
					</div>
				</div>

				{/* Account Balance Display */}
				<div className={cn(
					"flex items-center gap-3 px-6 py-3 rounded-2xl border-2 shadow-sm",
					customer.currentBalance < 0
						? "bg-red-50 border-red-100 text-red-700 dark:bg-red-900/10 dark:border-red-900 dark:text-red-400"
						: customer.currentBalance > 0
							? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/10 dark:border-emerald-900 dark:text-emerald-400"
							: "bg-stone-50 border-stone-100 text-stone-600 dark:bg-stone-900/20 dark:border-stone-800 dark:text-stone-400"
				)}>
					<div className="text-right">
						<p className="text-xs font-bold uppercase opacity-70 mb-0.5">Saldo Actual</p>
						<p className="text-3xl font-bold tracking-tight">
							{(customer.currentBalance).toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
						</p>
					</div>
					<div className={cn(
						"flex h-12 w-12 items-center justify-center rounded-xl bg-white/50 backdrop-blur-sm",
						customer.currentBalance < 0 ? "text-red-600" :
							customer.currentBalance > 0 ? "text-emerald-600" : "text-stone-400"
					)}>
						{customer.currentBalance < 0 ? <TrendingDown className="h-6 w-6" /> :
							customer.currentBalance > 0 ? <TrendingUp className="h-6 w-6" /> :
								<DollarSign className="h-6 w-6" />}
					</div>
				</div>
			</div>

			{/* Tabs Navigation */}
			<div className="flex p-1 bg-[var(--muted)] rounded-xl w-fit max-w-full overflow-x-auto overflow-y-hidden">
				<button
					onClick={() => setActiveTab("current-account")}
					className={cn(
						"cursor-pointer px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
						activeTab === "current-account"
							? "bg-[var(--card)] text-amber-600 shadow-sm"
							: "text-[var(--muted-foreground)] hover:text-[var(--card-foreground)]"
					)}
				>
					Cuenta Corriente
				</button>
				<button
					onClick={() => setActiveTab("delivery-notes")}
					className={cn(
						"cursor-pointer px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
						activeTab === "delivery-notes"
							? "bg-[var(--card)] text-amber-600 shadow-sm"
							: "text-[var(--muted-foreground)] hover:text-[var(--card-foreground)]"
					)}
				>
					Remitos
				</button>
				<button
					onClick={() => setActiveTab("invoices")}
					className={cn(
						"cursor-pointer px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
						activeTab === "invoices"
							? "bg-[var(--card)] text-amber-600 shadow-sm"
							: "text-[var(--muted-foreground)] hover:text-[var(--card-foreground)]"
					)}
				>
					Facturas
				</button>
				<button
					onClick={() => setActiveTab("info")}
					className={cn(
						"cursor-pointer px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
						activeTab === "info"
							? "bg-[var(--card)] text-amber-600 shadow-sm"
							: "text-[var(--muted-foreground)] hover:text-[var(--card-foreground)]"
					)}
				>
					Información
				</button>
			</div>

			{/* Tab Content */}
			<div className="min-h-[400px]">
				{/* Tab: Cuenta Corriente */}
				{activeTab === "current-account" && (
					<section>
						<div className="rounded-3xl border border-stone-200 bg-[var(--card)] shadow-sm p-6 dark:border-stone-800">
							<ClientAccountHistory
								transactions={transactions}
								customer={customer}
								refreshData={fetchData}
							/>
						</div>
					</section>
				)}

				{/* Tab: Remitos */}
				{activeTab === "delivery-notes" && (
					<section>
						<div className="flex items-center justify-between mb-4">
							<h3 className="flex items-center gap-2 text-lg font-bold text-[var(--card-foreground)]">
								<Package className="h-5 w-5 text-blue-600" />
								Remitos
							</h3>
						</div>
						<div className="rounded-3xl border border-stone-200 bg-[var(--card)] shadow-sm overflow-hidden dark:border-stone-800">
							{deliveryNotes.length > 0 ? (
								<div className="divide-y divide-stone-100 dark:divide-stone-800">
									{deliveryNotes.map((note) => (
										<div
											key={note.id}
											className="flex items-center justify-between p-4"
										>
											<div>
												<p className="text-sm font-bold text-[var(--card-foreground)]">
													Remito #{note.number}
												</p>
												<p className="text-xs text-stone-500">
													{formatDate(note.date)} • {note.status}
												</p>
											</div>
											<div className="flex items-center gap-2">
												<button
													onClick={() => router.push(`/delivery-notes/${note.id}`)}
													className="cursor-pointer rounded-lg bg-[var(--secondary-card)] hover:bg-[var(--card-foreground)] p-2 text-[var(--card-foreground)] hover:text-[var(--card)]"
													title="Ver Remito"
												>
													<Eye className="h-4 w-4" />
												</button>
												<button
													onClick={() => generateDeliveryNotePDF({
														...note,
														documentNumber: note.number,
														items: note.items || [],
														taxId: customer.taxId || customer.cuit,
														customer: customer.name,
														address: customer.address,
														saleCondition: "currentAccount",
														vatCondition: "finalConsumer"
													})}
													className="cursor-pointer rounded-lg bg-[var(--secondary-card)] hover:bg-[var(--card-foreground)] p-2 text-[var(--card-foreground)] hover:text-[var(--card)]"
													title="Descargar PDF"
												>
													<Download className="h-4 w-4" />
												</button>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="flex h-64 items-center justify-center p-8 text-center text-stone-500 text-sm">
									No hay remitos
								</div>
							)}
						</div>
					</section>
				)}

				{/* Tab: Facturas */}
				{activeTab === "invoices" && (
					<section>
						<div className="flex items-center justify-between mb-4">
							<h3 className="flex items-center gap-2 text-lg font-bold text-[var(--card-foreground)]">
								<FileText className="h-5 w-5 text-emerald-600" />
								Facturas
							</h3>
						</div>
						<div className="rounded-3xl border border-stone-200 bg-[var(--card)] shadow-sm overflow-hidden dark:border-stone-800">
							{invoices.length > 0 ? (
								<div className="divide-y divide-stone-100 dark:divide-stone-800">
									{invoices.map((inv) => (
										<div
											key={inv.id}
											className="flex items-center justify-between p-4"
										>
											<div>
												<p className="text-sm font-bold text-[var(--card-foreground)]">
													{inv.presupuesto ? `Presupuesto #${inv.presupuesto}` : `Factura #${inv.id}`}
												</p>
												<p className="text-xs text-stone-500">
													{inv.date} • {formatCurrency(inv.total)}
												</p>
											</div>
											<div className="flex items-center gap-2">
												<button
													onClick={() => router.push(`/invoices/${inv.id}`)}
													className="cursor-pointer rounded-lg bg-[var(--secondary-card)] hover:bg-[var(--card-foreground)] p-2 text-[var(--card-foreground)] hover:text-[var(--card)]"
													title="Ver Factura"
												>
													<Eye className="h-4 w-4" />
												</button>
												<button
													onClick={() => generateInvoicePDF({
														...inv,
														budgetNumber: inv.presupuesto || inv.quoteNumber,
														items: inv.items || [],
														customer: inv.customerName,
														address: inv.address,
														city: inv.city,
														phone: inv.phone,
														salesperson: inv.salesperson,
														notes: inv.notes,
														salePoint: inv.salePoint
													})}
													className="cursor-pointer rounded-lg bg-[var(--secondary-card)] hover:bg-[var(--card-foreground)] p-2 text-[var(--card-foreground)] hover:text-[var(--card)]"
													title="Descargar PDF"
												>
													<Download className="h-4 w-4" />
												</button>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="flex h-64 items-center justify-center p-8 text-center text-stone-500 text-sm">
									No hay facturas
								</div>
							)}
						</div>
					</section>
				)}

				{/* Tab: Information */}
				{activeTab === "info" && (
					<section className="max-w-xl">
						<div className="rounded-3xl border border-stone-200 bg-[var(--card)] p-6 shadow-sm dark:border-stone-800">
							<h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-stone-400 uppercase">
								<User className="h-4 w-4" /> Información de Contacto
							</h3>
							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--secondary-card)] border border-[var(--card-foreground)] p-2 text-[var(--card-foreground)]">
										<Mail className="h-4 w-4" />
									</div>
									<div>
										<p className="text-xs text-stone-400 uppercase">Email</p>
										<p className="text-sm font-medium text-[var(--card-foreground)]">
											{customer.email}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--secondary-card)] border border-[var(--card-foreground)] p-2 text-[var(--card-foreground)]">
										<Phone className="h-4 w-4" />
									</div>
									<div>
										<p className="text-xs text-stone-400 uppercase">Teléfono</p>
										<p className="text-sm font-medium text-[var(--card-foreground)]">
											{customer.phone}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--secondary-card)] border border-[var(--card-foreground)] p-2 text-[var(--card-foreground)]">
										<MapPin className="h-4 w-4" />
									</div>
									<div>
										<p className="text-xs text-stone-400 uppercase">Dirección</p>
										<p className="text-sm font-medium text-[var(--card-foreground)]">
											{customer.address}
										</p>
									</div>
								</div>
								<div className="pt-4 border-t border-stone-100 dark:border-stone-800">
									<div className="flex justify-between text-sm">
										<span className="text-stone-500">Fecha Alta</span>
										<span className="font-medium text-[var(--card-foreground)]">
											{formatDate(customer.registrationDate)}
										</span>
									</div>
									<div className="flex justify-between text-sm mt-2">
										<span className="text-stone-500">Última Compra</span>
										<span className="font-medium text-[var(--card-foreground)]">
											{formatDate(customer.lastPurchaseDate || customer.lastPurchase)}
										</span>
									</div>
								</div>
							</div>
						</div>
					</section>
				)}
			</div>
		</div>
	);

}
