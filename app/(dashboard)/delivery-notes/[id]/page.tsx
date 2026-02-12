"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, FileText, Loader2 } from "lucide-react";
import { generateDeliveryNotePDF } from "@/app/components/DeliveryNotePDF";
import { cn } from "@/lib/utils";
import { getDeliveryNoteDoc } from "@/app/components/DeliveryNotePDF";

// Since we use jspdf to generate PDF client-side, we can just get the blob URL and show it in an iframe.
// No need for @react-pdf/renderer.

export default function DeliveryNoteDetailPage() {
	const params = useParams();
	const router = useRouter();
	const id = params.id as string;

	const [loading, setLoading] = useState(true);
	const [note, setNote] = useState<any>(null);
	const [activeTab, setActiveTab] = useState<"info" | "pdf">("info");
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);

	useEffect(() => {
		if (id) {
			fetchNote();
		}
	}, [id]);

	const fetchNote = async () => {
		try {
			setLoading(true);
			const res = await fetch(`/api/delivery-notes/${id}`);
			const data = await res.json();

			if (data) {
				setNote(data);
				const pdfData: any = {
					documentNumber: data.number,
					date: new Date(data.date).toLocaleDateString("es-AR", {
						day: "2-digit",
						month: "2-digit",
						year: "numeric"
					}),
					salePoint: data.salePoint?.toString().padStart(3, "0") || "001",
					customer: data.customerName || "",
					address: data.customerAddress || "",
					taxId: data.customerTaxId || "",
					items: data.items || [],
					notes: data.notes || "",
					saleCondition: "currentAccount", // Default
					vatCondition: "registeredResp", // Default
				};
				const doc = getDeliveryNoteDoc(pdfData);
				const url = doc.output("datauristring");
				setPdfUrl(url);
			} else {
				// Handle not found
			}
		} catch (error) {
			console.error("Error fetching note:", error);
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
		const day = date.getUTCDate().toString().padStart(2, "0");
		const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
		const year = date.getUTCFullYear();
		return `${month}/${day}/${year}`;
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen bg-stone-50 dark:bg-stone-950">
				<Loader2 className="h-8 w-8 animate-spin text-amber-600" />
			</div>
		);
	}

	if (!note) {
		return (
			<div className="flex flex-col items-center justify-center h-screen gap-4 bg-stone-50 dark:bg-stone-950">
				<p className="text-stone-500">Remito no encontrado</p>
				<button onClick={handleBack} className="text-amber-600 font-bold hover:underline">
					Volver a la lista
				</button>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-stone-50 dark:bg-stone-950">
			<div className="mx-auto space-y-6">
				{/* Header */}
				<div className="flex items-center gap-4">
					<button
						onClick={handleBack}
						className="cursor-pointer p-2 rounded-xl bg-white border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors shadow-sm dark:bg-stone-900 dark:border-stone-800"
					>
						<ArrowLeft className="h-5 w-5" />
					</button>
					<div>
						<h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
							Remito N° {note.number}
						</h1>
						<p className="text-stone-500 text-sm">
							Detalles y visualización del documento
						</p>
					</div>
				</div>

				{/* Tabs */}
				<div className="flex p-1 bg-stone-200/50 dark:bg-stone-900/50 rounded-xl w-fit">
					<button
						onClick={() => setActiveTab("info")}
						className={cn(
							"cursor-pointer px-4 py-2 rounded-lg text-sm font-bold transition-all",
							activeTab === "info"
								? "bg-white text-amber-600 shadow-sm dark:bg-stone-800"
								: "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
						)}
					>
						Información
					</button>
					<button
						onClick={() => setActiveTab("pdf")}
						className={cn(
							"cursor-pointer px-4 py-2 rounded-lg text-sm font-bold transition-all",
							activeTab === "pdf"
								? "bg-white text-amber-600 shadow-sm dark:bg-stone-800"
								: "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
						)}
					>
						Visualizar PDF
					</button>
				</div>

				{/* Content */}
				<div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
					{activeTab === "info" ? (
						<div className="p-8 space-y-8">
							{/* Info Content */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
								<div className="space-y-6">
									<div>
										<h3 className="text-xs font-bold text-stone-400 uppercase mb-2">Datos del Cliente</h3>
										<div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 space-y-2">
											<p className="font-bold text-lg">{note.customerName || "Consumidor Final"}</p>
											<div className="space-y-1 text-sm text-stone-500">
												<p>CUIT: {note.customerTaxId || "-"}</p>
												<p>{note.customerAddress}</p>
												<p>{note.customerEmail}</p>
											</div>
										</div>
									</div>
									<div>
										<h3 className="text-xs font-bold text-stone-400 uppercase mb-2">Detalles del Documento</h3>
										<div className="grid grid-cols-2 gap-4">
											<div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50">
												<label className="text-xs text-stone-400 block">Fecha</label>
												<p className="font-bold">{formatDate(note.date)}</p>
											</div>
											<div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50">
												<label className="text-xs text-stone-400 block">Punto de Venta</label>
												<p className="font-bold">{note.salePoint?.toString().padStart(3, "0") || "-"}</p>
											</div>
										</div>
									</div>
								</div>

								<div>
									<h3 className="text-xs font-bold text-stone-400 uppercase mb-2">Items del Remito</h3>
									<div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
										<table className="w-full text-sm">
											<thead className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-800">
												<tr>
													<th className="py-3 px-4 text-left font-bold text-stone-500">Descripción</th>
													<th className="py-3 px-4 text-center font-bold text-stone-500 w-24">Cant.</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-stone-100 dark:divide-stone-800">
												{note.items?.map((item: any, i: number) => (
													<tr key={i} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/50">
														<td className="py-3 px-4">{item.detail || item.description}</td>
														<td className="py-3 px-4 text-center font-bold text-stone-600 dark:text-stone-300">{item.quantity}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
									{note.notes && (
										<div className="mt-6">
											<h3 className="text-xs font-bold text-stone-400 uppercase mb-2">Observaciones</h3>
											<p className="text-sm text-stone-600 dark:text-stone-400 italic bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl">
												{note.notes}
											</p>
										</div>
									)}
								</div>
							</div>
						</div>
					) : (
						<div className="h-full flex flex-col min-h-[800px]">
							<div className="flex-1 bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 relative h-full flex flex-col">
								<div className="p-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex justify-end">
									<button
										onClick={() => {
											const pdfData: any = {
												documentNumber: note.number,
												date: new Date(note.date).toLocaleDateString("es-AR", {
													day: "2-digit",
													month: "2-digit",
													year: "numeric"
												}),
												salePoint: note.salePoint?.toString().padStart(3, "0") || "001",
												customer: note.customer?.name || "",
												address: note.customer?.address || "",
												taxId: note.customer?.taxId || "",
												items: note.items || [],
												notes: note.notes || "",
												saleCondition: "currentAccount",
												vatCondition: "registeredResp",
											};
											generateDeliveryNotePDF(pdfData);
										}}
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
