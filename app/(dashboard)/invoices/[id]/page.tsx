"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, FileText, User, MapPin, Phone, CreditCard, ChevronLeft } from "lucide-react";
import { generateInvoicePDF, InvoiceData } from "@/app/components/InvoicePDF";

export default function InvoiceDetailPage() {
	const params = useParams();
	const router = useRouter();
	const [invoice, setInvoice] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);

	const formatDate = (dateString: string | Date | undefined) => {
		if (!dateString) return "-";
		const date = new Date(dateString);
		const day = date.getUTCDate().toString().padStart(2, "0");
		const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
		const year = date.getUTCFullYear();
		return `${day}/${month}/${year}`;
	};

	useEffect(() => {
		if (params.id) {
			fetchInvoice(params.id as string);
		}
	}, [params.id]);

	const fetchInvoice = async (id: string) => {
		try {
			// Reuse the generic fetch all endpoint but ideally we should have a specific one
			// Or filter the list.
			// Currently GET /api/invoices returns all.
			// Let's assume we can filter or find in the list.
			// A specific endpoint /api/invoices/[id] would be better but consistent with delivery notes we might use query param?
			// But wait, delivery notes uses /api/delivery-notes?id=... for DELETE.
			// GET /api/delivery-notes returns all.
			// Let's try to fetch all and find, or implement GET by ID.
			// I'll implement finding in all for now as I haven't changed the GET endpoint to support single ID fetching yet.
			// Actually I should update the GET endpoint to support filtering by ID for efficiency.
			// But for now, let's fetch all and filter client side to be safe with current API.

			const response = await fetch(`/api/invoices/${id}`);
			if (response.ok) {
				const data = await response.json();
				setInvoice(data);
				// generatePDFPreview(data); // Not really generating preview anymore, just setting data
			} else {
				// handle not found or error
				console.error("Invoice not found");
			}
		} catch (error) {
			console.error("Error fetching invoice:", error);
		} finally {
			setLoading(false);
		}
	};



	const handleBack = () => {
		router.back();
	};

	if (loading) {
		return <div className="p-8 text-center text-stone-500">Cargando factura...</div>;
	}

	if (!invoice) {
		return <div className="p-8 text-center text-stone-500">Factura no encontrada</div>;
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<button
					onClick={handleBack}
					className="cursor-pointer p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
				>
					<ArrowLeft className="h-5 w-5" />
				</button>
				<div>
					<h1 className="text-2xl font-bold text-[var(--card-foreground)]">
						Factura #{invoice.quoteNumber}
					</h1>
					<p className="text-sm text-stone-500">
						Detalles del documento
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Details Column */}
				<div className="space-y-6">
					{/* Basic Info */}
					<div className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">
						<h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[var(--card-foreground)]">
							<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-xs text-amber-600 dark:bg-amber-900/30">
								<FileText className="h-4 w-4" />
							</div>
							Información General
						</h2>
						<div className="grid grid-cols-2 gap-4">
							<div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50">
								<label className="text-xs text-stone-400 block font-medium uppercase mb-1">Fecha</label>
								<p className="font-bold text-stone-800 dark:text-stone-200">
									{formatDate(invoice.date)}
								</p>
							</div>
							<div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50">
								<label className="text-xs text-stone-400 block font-medium uppercase mb-1">Punto de Venta</label>
								<p className="font-bold text-stone-800 dark:text-stone-200">
									{invoice.salePoint?.toString().padStart(3, "0")}
								</p>
							</div>
							<div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 col-span-2">
								<label className="text-xs text-stone-400 block font-medium uppercase mb-1">Total</label>
								<p className="font-bold text-xl text-amber-600 dark:text-amber-500">
									${invoice.total?.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
								</p>
							</div>
						</div>
					</div>

					{/* Customer Info */}
					<div className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">
						<h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[var(--card-foreground)]">
							<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-xs text-blue-600 dark:bg-blue-900/30">
								<User className="h-4 w-4" />
							</div>
							Cliente
						</h2>
						<div className="space-y-4">
							<div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50">
								<div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
									<User className="h-4 w-4" />
								</div>
								<div>
									<p className="text-sm font-bold text-stone-800 dark:text-stone-200">
										{invoice.customerName || invoice.customer || "Consumidor Final"}
									</p>
								</div>
							</div>
							{invoice.address && (
								<div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50">
									<div className="h-8 w-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-500">
										<MapPin className="h-4 w-4" />
									</div>
									<p className="text-sm text-stone-600 dark:text-stone-300">
										{invoice.address} {invoice.city ? ` - ${invoice.city}` : ""}
									</p>
								</div>
							)}
							{invoice.phone && (
								<div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50">
									<div className="h-8 w-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-500">
										<Phone className="h-4 w-4" />
									</div>
									<p className="text-sm text-stone-600 dark:text-stone-300">
										{invoice.phone}
									</p>
								</div>
							)}
						</div>
					</div>

					{/* Additional Info */}
					{(invoice.salesperson || invoice.movementType || invoice.notes) && (
						<div className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">
							<h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[var(--card-foreground)]">
								<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs text-emerald-600 dark:bg-emerald-900/30">
									<div className="text-[10px] font-bold">INFO</div>
								</div>
								Datos Adicionales
							</h2>
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									{invoice.salesperson && (
										<div>
											<label className="text-xs text-stone-400 block uppercase font-medium">Vendedor</label>
											<p className="text-sm font-semibold">{invoice.salesperson}</p>
										</div>
									)}
									{invoice.movementType && (
										<div>
											<label className="text-xs text-stone-400 block uppercase font-medium">Movimiento</label>
											<p className="text-sm font-semibold">{invoice.movementType}</p>
										</div>
									)}
								</div>
								{invoice.notes && (
									<div>
										<label className="text-xs text-stone-400 block uppercase font-medium">Observaciones</label>
										<p className="text-sm text-stone-600 bg-stone-50 p-2 rounded-lg italic dark:bg-stone-800 dark:text-stone-300">
											"{invoice.notes}"
										</p>
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Items & Actions Column */}
				<div className="space-y-6">
					{/* Items List */}
					<div className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800/50 flex flex-col h-full">
						<h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[var(--card-foreground)]">
							<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-xs text-purple-600 dark:bg-purple-900/30">
								<div className="text-[10px] font-bold">LIST</div>
							</div>
							Items del Presupuesto
						</h2>

						<div className="flex-1 overflow-auto max-h-[500px] mb-6">
							<table className="w-full text-left">
								<thead className="sticky top-0 bg-[var(--card)] z-10">
									<tr className="border-b border-stone-100 dark:border-stone-800 text-[10px] uppercase text-stone-400 font-bold">
										<th className="py-2 pl-2">Cant.</th>
										<th className="py-2 px-2">Descripción</th>
										<th className="py-2 px-2 text-right">Precio</th>
										<th className="py-2 pr-2 text-right">Total</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-stone-50 dark:divide-stone-900">
									{invoice.items?.map((item: any, idx: number) => (
										<tr key={idx}>
											<td className="py-3 pl-2 text-sm font-medium">{item.quantity}</td>
											<td className="py-3 px-2 text-sm text-stone-600 dark:text-stone-300">
												{item.description}
												{item.code && <span className="block text-[10px] text-stone-400">Cód: {item.code}</span>}
											</td>
											<td className="py-3 px-2 text-sm text-right text-stone-500">
												${parseFloat(item.price || item.unitPrice).toLocaleString("es-AR")}
											</td>
											<td className="py-3 pr-2 text-sm text-right font-bold text-stone-700 dark:text-stone-200">
												${parseFloat(item.amount).toLocaleString("es-AR")}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Actions */}
						<div className="pt-6 border-t border-stone-100 dark:border-stone-800 mt-auto">
							<button
								onClick={() => {
									const pdfData: InvoiceData = {
										budgetNumber: invoice.budgetNumber || "00000000",
										date: new Date(invoice.date).toLocaleDateString("es-AR"), // Or use helper if available in scope
										salePoint: invoice.salePoint?.toString().padStart(3, "0") || "001",
										customer: invoice.customerName || invoice.customer || "",
										address: invoice.address || "",
										city: invoice.city || "",
										phone: invoice.phone || "",
										movementType: invoice.movementType || "",
										salesperson: invoice.salesperson || "Administración",
										notes: invoice.notes || "",
										items: invoice.items || [],
									};
									generateInvoicePDF(pdfData);
								}}
								className="cursor-pointer w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 py-4 text-sm font-bold text-white transition-all hover:bg-amber-700 shadow-lg shadow-amber-600/20 active:scale-95"
							>
								<Download className="h-5 w-5" />
								Descargar PDF
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
