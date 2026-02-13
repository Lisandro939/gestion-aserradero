"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, FileText, Loader2 } from "lucide-react";
import { generateInvoicePDF, getInvoiceDoc, InvoiceData } from "@/app/components/InvoicePDF";
import { cn } from "@/lib/utils";

export default function InvoiceDetailPage() {
	const params = useParams();
	const router = useRouter();
	const id = params.id as string;

	const [loading, setLoading] = useState(true);
	const [invoice, setInvoice] = useState<any>(null);
	const [activeTab, setActiveTab] = useState<"info" | "pdf">("info");
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);

	useEffect(() => {
		if (id) {
			fetchInvoice();
		}
	}, [id]);

	const fetchInvoice = async () => {
		try {
			setLoading(true);
			const res = await fetch(`/api/invoices/${id}`);
			const data = await res.json();

			if (data) {
				setInvoice(data);
				// Generate PDF Blob for preview
				const pdfData: InvoiceData = {
					budgetNumber: data.budgetNumber || data.quoteNumber || "00000000",
					date: new Date(data.date).toLocaleDateString("es-AR"),
					salePoint: data.salePoint?.toString().padStart(3, "0") || "001",
					customer: data.customerName || data.customer || "Consumidor Final",
					address: data.address || "",
					city: data.city || "",
					phone: data.phone || "",
					movementType: data.movementType || "",
					salesperson: data.salesperson || "Administración",
					items: data.items || [],
					notes: data.notes || "",
				};

				try {
					const doc = await getInvoiceDoc(pdfData);
					const blob = doc.output("blob");
					const url = URL.createObjectURL(blob);
					setPdfUrl(url);
				} catch (err) {
					console.error("Error creating PDF preview:", err);
				}

			} else {
				// Handle not found
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

	const formatDate = (dateString: string | Date | undefined) => {
		if (!dateString) return "-";
		const date = new Date(dateString);
		return date.toLocaleDateString("es-AR", {
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

	const handleDownload = () => {
		if (!invoice) return;
		const pdfData: InvoiceData = {
			budgetNumber: invoice.budgetNumber || invoice.quoteNumber || "00000000",
			date: new Date(invoice.date).toLocaleDateString("es-AR"),
			salePoint: invoice.salePoint?.toString().padStart(3, "0") || "001",
			customer: invoice.customerName || invoice.customer || "Consumidor Final",
			address: invoice.address || "",
			city: invoice.city || "",
			phone: invoice.phone || "",
			movementType: invoice.movementType || "",
			salesperson: invoice.salesperson || "Administración",
			items: invoice.items || [],
			notes: invoice.notes || "",
		};
		generateInvoicePDF(pdfData);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen bg-[var(--background)]">
				<Loader2 className="h-8 w-8 animate-spin text-amber-600" />
			</div>
		);
	}

	if (!invoice) {
		return (
			<div className="flex flex-col items-center justify-center h-screen gap-4 bg-[var(--background)]">
				<p className="text-stone-500">Factura no encontrada</p>
				<button onClick={handleBack} className="text-amber-600 font-bold hover:underline">
					Volver a la lista
				</button>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[var(--background)]">
			<div className="mx-auto space-y-6">
				{/* Header */}
				<div className="flex items-center gap-4">
					<button
						onClick={handleBack}
						className="cursor-pointer p-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--secondary-card)] transition-colors shadow-sm"
					>
						<ArrowLeft className="h-5 w-5" />
					</button>
					<div>
						<h1 className="text-2xl font-bold text-[var(--card-foreground)]">
							{invoice.quoteNumber ? `Presupuesto #${invoice.quoteNumber}` : "Detalle de Factura"}
						</h1>
						<div className="flex items-center gap-2 text-sm text-stone-500">
							<span className="flex items-center gap-1">
								<FileText className="h-3 w-3" /> {formatDate(invoice.date)}
							</span>
							<span>•</span>
							<span>{invoice.customerName}</span>
						</div>
					</div>
				</div>

				{/* Tabs */}
				<div className="flex p-1 bg-[var(--muted)] rounded-xl w-fit">
					<button
						onClick={() => setActiveTab("info")}
						className={cn(
							"cursor-pointer px-4 py-2 rounded-lg text-sm font-bold transition-all",
							activeTab === "info"
								? "bg-[var(--card)] text-amber-600 shadow-sm"
								: "text-[var(--muted-foreground)] hover:text-[var(--card-foreground)]"
						)}
					>
						Información
					</button>
					<button
						onClick={() => setActiveTab("pdf")}
						className={cn(
							"cursor-pointer px-4 py-2 rounded-lg text-sm font-bold transition-all",
							activeTab === "pdf"
								? "bg-[var(--card)] text-amber-600 shadow-sm"
								: "text-[var(--muted-foreground)] hover:text-[var(--card-foreground)]"
						)}
					>
						Visualizar PDF
					</button>
				</div>

				{/* Content */}
				<div className="bg-[var(--card)] rounded-3xl shadow-sm border border-[var(--border)] overflow-hidden">
					{activeTab === "info" ? (
						<div className="p-8 space-y-8">
							{/* Info Content */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
								<div className="space-y-6">
									<div>
										<h3 className="text-xs font-bold text-stone-400 uppercase mb-2">Datos del Cliente</h3>
										<div className="p-4 rounded-2xl bg-[var(--secondary-card)] space-y-2">
											<p className="font-bold text-lg text-[var(--card-foreground)]">{invoice.customerName || "Consumidor Final"}</p>
											<div className="space-y-1 text-sm text-stone-500">
												{invoice.customerTaxId && <p>CUIT: {invoice.customerTaxId}</p>}
												<p>{invoice.address || "Dirección no especificada"}</p>
												{invoice.phone && <p>Tel: {invoice.phone}</p>}
												{invoice.email && <p>{invoice.email}</p>}
												<p>{invoice.city}</p>
											</div>
										</div>
									</div>
									<div>
										<h3 className="text-xs font-bold text-stone-400 uppercase mb-2">Detalles del Documento</h3>
										<div className="grid grid-cols-2 gap-4">
											<div className="p-4 rounded-2xl bg-[var(--secondary-card)]">
												<label className="text-xs text-stone-400 block">Fecha</label>
												<p className="font-bold text-[var(--card-foreground)]">{formatDate(invoice.date)}</p>
											</div>
											<div className="p-4 rounded-2xl bg-[var(--secondary-card)]">
												<label className="text-xs text-stone-400 block">Punto de Venta</label>
												<p className="font-bold text-[var(--card-foreground)]">{invoice.salePoint?.toString().padStart(3, "0") || "-"}</p>
											</div>
											<div className="p-4 rounded-2xl bg-[var(--secondary-card)]">
												<label className="text-xs text-stone-400 block">Vendedor</label>
												<p className="font-bold text-[var(--card-foreground)]">{invoice.salesperson || "Admin"}</p>
											</div>
											<div className="p-4 rounded-2xl bg-[var(--secondary-card)]">
												<label className="text-xs text-stone-400 block">Movimiento</label>
												<p className="font-bold text-[var(--card-foreground)]">{invoice.movementType || "-"}</p>
											</div>
										</div>
									</div>
								</div>

								<div>
									<h3 className="text-xs font-bold text-stone-400 uppercase mb-2">Items de la Factura</h3>
									<div className="border border-[var(--border)] rounded-2xl overflow-hidden overflow-x-auto">
										<table className="w-full text-sm min-w-[600px]">
											<thead className="bg-[var(--muted)] border-b border-[var(--border)]">
												<tr>
													<th className="py-3 px-4 text-left font-bold text-stone-500">Descripción</th>
													<th className="py-3 px-4 text-center font-bold text-stone-500 w-16">Cant.</th>
													<th className="py-3 px-4 text-right font-bold text-stone-500">Precio</th>
													<th className="py-3 px-4 text-right font-bold text-stone-500">Total</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-[var(--border)]">
												{invoice.items?.map((item: any, i: number) => (
													<tr key={i} className="hover:bg-[var(--muted)]/50">
														<td className="py-3 px-4">
															<span className="text-[var(--card-foreground)]">{item.description}</span>
															{item.code && <span className="ml-2 text-xs text-stone-400">({item.code})</span>}
														</td>
														<td className="py-3 px-4 text-center font-bold text-[var(--card-foreground)]">{item.quantity}</td>
														<td className="py-3 px-4 text-right text-stone-500">
															{formatCurrency(parseFloat(item.price || item.unitPrice))}
														</td>
														<td className="py-3 px-4 text-right font-bold text-[var(--card-foreground)]">
															{formatCurrency(parseFloat(item.amount))}
														</td>
													</tr>
												))}
											</tbody>
											<tfoot className="bg-[var(--muted)]/30 border-t border-[var(--border)]">
												<tr>
													<td colSpan={3} className="py-3 px-4 text-right font-bold text-stone-500">TOTAL</td>
													<td className="py-3 px-4 text-right font-bold text-lg text-amber-600">
														{formatCurrency(invoice.total)}
													</td>
												</tr>
											</tfoot>
										</table>
									</div>
									{invoice.notes && (
										<div className="mt-6">
											<h3 className="text-xs font-bold text-stone-400 uppercase mb-2">Observaciones</h3>
											<p className="text-sm text-[var(--card-foreground)] italic bg-[var(--secondary-card)] p-4 rounded-2xl">
												{invoice.notes}
											</p>
										</div>
									)}
								</div>
							</div>
						</div>
					) : (
						<div className="h-full flex flex-col min-h-[800px]">
							<div className="flex-1 bg-[var(--muted)] border-b border-[var(--border)] relative h-full flex flex-col">
								<div className="p-4 bg-[var(--card)] border-b border-[var(--border)] flex justify-end">
									<button
										onClick={handleDownload}
										className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20"
									>
										<Download className="h-4 w-4" />
										Descargar PDF
									</button>
								</div>
								{pdfUrl ? (
									<iframe src={pdfUrl} className="w-full h-full min-h-[800px] border-none flex-1" />
								) : (
									<div className="flex flex-col items-center justify-center h-full text-stone-400 gap-4 min-h-[400px]">
										<FileText className="h-16 w-16 opacity-20" />
										<p>Generando vista previa...</p>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div >
	);
}
