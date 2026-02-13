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

export default function CustomerDetailsPage() {
	const params = useParams();
	const router = useRouter();
	const id = params?.id as string;

	const [customer, setCustomer] = useState<any>(null);
	const [transactions, setTransactions] = useState<any[]>([]);
	const [deliveryNotes, setDeliveryNotes] = useState<any[]>([]);
	const [invoices, setInvoices] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			// 1. Fetch Customer
			const customerRes = await fetch(`/api/customers/${id}`);
			if (!customerRes.ok) throw new Error("Customer not found");
			const customerData = await customerRes.json();
			setCustomer(customerData);

			// 2. Fetch Transactions
			const transactionsRes = await fetch(`/api/customers/${id}/transactions`);
			if (transactionsRes.ok) {
				const transactionsData = await transactionsRes.json();
				setTransactions(transactionsData);
			}

			// 3. Fetch Delivery Notes (Filter by ID)
			const notesRes = await fetch("/api/delivery-notes");
			if (notesRes.ok) {
				const notesData = await notesRes.json();
				const filteredNotes = notesData.data.filter(
					(n: any) => n.customerId.toString() === id.toString()
				);
				setDeliveryNotes(filteredNotes);
			}

			// 4. Fetch Invoices (Filter by Name - Fallback)
			const invoicesRes = await fetch("/api/invoices");
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
		} catch (error) {
			console.error("Error fetching data:", error);
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		if (id) fetchData();
	}, [id, fetchData]);

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
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Column 1: Info & Stats */}
				<div className="space-y-6 lg:col-span-1">
					{/* Contact Info */}
					<section className="rounded-3xl border border-stone-200 bg-[var(--card)] p-6 shadow-sm dark:border-stone-800">
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
					</section>
				</div>

				{/* Column 2 & 3: Tabs / Content */}
				<div className="lg:col-span-2 space-y-8">
					{/* Documents (Invoices & Remitos) */}
					<div className="grid gap-6 md:grid-cols-2">
						{/* Remitos */}
						<section>
							<h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[var(--card-foreground)]">
								<Package className="h-5 w-5 text-blue-600" />
								Remitos
							</h3>
							<div className="rounded-3xl border border-stone-200 bg-[var(--card)] shadow-sm overflow-hidden dark:border-stone-800 min-h-[200px]">
								{deliveryNotes.length > 0 ? (
									<div className="divide-y divide-stone-100 dark:divide-stone-800">
										{deliveryNotes.slice(0, 5).map((note) => (
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
															saleCondition: "currentAccount", // Default or fetch
															vatCondition: "finalConsumer" // Default
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
									<div className="flex h-full items-center justify-center p-8 text-center text-stone-500 text-sm">
										No hay remitos
									</div>
								)}
							</div>
						</section>

						{/* Invoices */}
						<section>
							<h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[var(--card-foreground)]">
								<FileText className="h-5 w-5 text-emerald-600" />
								Facturas
							</h3>
							<div className="rounded-3xl border border-stone-200 bg-[var(--card)] shadow-sm overflow-hidden dark:border-stone-800">
								{invoices.length > 0 ? (
									<div className="divide-y divide-stone-100 dark:divide-stone-800">
										{invoices.slice(0, 5).map((inv) => (
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
															items: inv.items || [], // Requires fetch items? Usually fetching invoices returns items if configured
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
									<div className="flex h-full items-center justify-center p-8 text-center text-stone-500 text-sm">
										No hay facturas
									</div>
								)}
							</div>
						</section>
					</div>
				</div>
			</div>
		</div>
	);
}
