
import { useState, useEffect } from "react";
import { Eye, Trash2, RotateCcw, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { InvoiceData } from "@/app/components/InvoicePDF";

interface ViewInvoicesTabProps {
	handleViewInvoice: (invoice: any) => void;
}

export default function ViewInvoicesTab({ handleViewInvoice }: ViewInvoicesTabProps) {
	const [invoices, setInvoices] = useState<any[]>([]);
	const [filterStatus, setFilterStatus] = useState<"active" | "inactive">("active");
	const [confirmModal, setConfirmModal] = useState<{
		isOpen: boolean;
		type: "delete" | "restore" | null;
		invoiceId: number | null;
	}>({
		isOpen: false,
		type: null,
		invoiceId: null,
	});

	useEffect(() => {
		fetchInvoices();
	}, []);

	const fetchInvoices = async () => {
		try {
			const response = await fetch("/api/invoices");
			if (response.ok) {
				const data = await response.json();
				setInvoices(data);
			}
		} catch (error) {
			console.error("Error loading invoices:", error);
		}
	};

	const [searchTerm, setSearchTerm] = useState("");

	const filteredInvoices = invoices.filter((inv) => {
		// Filter by status (active vs inactive)
		if (filterStatus === "active" && inv.deletedAt) return false;
		if (filterStatus === "inactive" && !inv.deletedAt) return false;

		// Filter by search term
		if (searchTerm === "") return true;
		const searchLower = searchTerm.toLowerCase();
		return (
			(inv.quoteNumber && inv.quoteNumber.toLowerCase().includes(searchLower)) ||
			(inv.salePoint && inv.salePoint.toString().includes(searchLower)) ||
			(inv.customerName && inv.customerName.toLowerCase().includes(searchLower)) ||
			// (inv.customer && inv.customer.toLowerCase().includes(searchLower)) || // Fallback if customerName not used
			(inv.city && inv.city.toLowerCase().includes(searchLower))
		);
	});

	const handleSoftDelete = async () => {
		if (!confirmModal.invoiceId) return;

		try {
			const res = await fetch(`/api/invoices/${confirmModal.invoiceId}`, {
				method: "DELETE",
			});

			if (res.ok) {
				fetchInvoices();
				setConfirmModal({ isOpen: false, type: null, invoiceId: null });
			}
		} catch (error) {
			console.error("Error deleting invoice:", error);
		}
	};

	const handleRestore = async () => {
		if (!confirmModal.invoiceId) return;

		try {
			// Using DELETE method with specific restore action would be one way, 
			// but PATCH is better semantic for updating state.
			// However, previous implementation used PATCH on main route with body.
			// Now we are using dynamic route /api/invoices/[id].
			// Let's stick to PATCH on dynamic route /api/invoices/[id]?action=restore
			const res = await fetch(`/api/invoices/${confirmModal.invoiceId}?action=restore`, {
				method: "PATCH",
			});

			if (res.ok) {
				fetchInvoices();
				setConfirmModal({ isOpen: false, type: null, invoiceId: null });
			}
		} catch (error) {
			console.error("Error restoring invoice:", error);
		}
	};

	return (
		<div className="space-y-4">
			{/* Search and Filter Bar */}
			<div className="bg-[var(--card)] rounded-2xl p-4 flex gap-4 items-center shadow-sm border border-stone-200 dark:border-stone-800/50">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
					<input
						type="text"
						placeholder="Buscar por número, cliente o localidad..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full rounded-xl border border-stone-200 bg-[var(--secondary-card)] pl-10 pr-4 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 dark:border-stone-800 dark:focus:ring-amber-500/20"
					/>
				</div>
				<div className="relative">
					<Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 pointer-events-none" />
					<select
						value={filterStatus}
						onChange={(e) => setFilterStatus(e.target.value as "active" | "inactive")}
						className="appearance-none rounded-xl border border-stone-200 bg-[var(--secondary-card)] pl-10 pr-8 py-2 text-sm outline-none cursor-pointer focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 dark:border-stone-800 dark:focus:ring-amber-500/20"
					>
						<option value="active">Activas</option>
						<option value="inactive">Bajas</option>
					</select>
				</div>
			</div>

			<div className="bg-[var(--card)] rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">

				{/* Desktop View: Table */}
				<div className="hidden md:block overflow-x-auto -mx-4 md:mx-0">
					<table className="w-full min-w-[640px]">
						<thead>
							<tr className="border-b border-stone-100 dark:border-stone-800">
								<th className="pb-4 text-left text-xs font-bold text-stone-400 uppercase">N° Presupuesto</th>
								<th className="pb-4 text-left text-xs font-bold text-stone-400 uppercase">Fecha</th>
								<th className="pb-4 text-left text-xs font-bold text-stone-400 uppercase">Cliente</th>
								<th className="pb-4 text-left text-xs font-bold text-stone-400 uppercase">Localidad</th>
								<th className="pb-4 text-left text-xs font-bold text-stone-400 uppercase">Total</th>
								<th className="pb-4 text-center text-xs font-bold text-stone-400 uppercase">Acciones</th>
							</tr>
						</thead>
						<tbody>
							{filteredInvoices.length === 0 ? (
								<tr>
									<td colSpan={6} className="py-8 text-center text-stone-500">
										No hay facturas {filterStatus === "active" ? "activas" : "dadas de baja"}
									</td>
								</tr>
							) : (
								filteredInvoices.map((invoice, index) => (
									<tr key={index} className="border-b border-stone-100 dark:border-stone-800">
										<td className="py-4 text-sm">{invoice.quoteNumber || "-"}</td>
										<td className="py-4 text-sm">
											{new Date(invoice.date).toLocaleDateString("es-AR")}
										</td>
										<td className="py-4 text-sm">{invoice.customerName || invoice.customer || "Consumidor Final"}</td>
										<td className="py-4 text-sm">{invoice.city}</td>
										<td className="py-4 text-sm font-bold">
											${invoice.total?.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
										</td>
										<td className="py-4 text-center">
											<div className="flex items-center justify-center gap-2">
												<button
													onClick={() => handleViewInvoice(invoice)}
													className="cursor-pointer p-2 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-amber-600 transition-all dark:hover:bg-stone-800"
													title="Ver detalle"
												>
													<Eye className="h-4 w-4" />
												</button>
												{filterStatus === "active" ? (
													<button
														onClick={() => setConfirmModal({ isOpen: true, type: "delete", invoiceId: invoice.id })}
														className="cursor-pointer p-2 rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-500 transition-all dark:hover:bg-red-900/10"
														title="Dar de baja"
													>
														<Trash2 className="h-4 w-4" />
													</button>
												) : (
													<button
														onClick={() => setConfirmModal({ isOpen: true, type: "restore", invoiceId: invoice.id })}
														className="cursor-pointer p-2 rounded-lg text-stone-400 hover:bg-green-50 hover:text-green-500 transition-all dark:hover:bg-green-900/10"
														title="Restaurar"
													>
														<RotateCcw className="h-4 w-4" />
													</button>
												)}
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Mobile View: Cards */}
				<div className="md:hidden space-y-4">
					{filteredInvoices.length === 0 ? (
						<div className="text-center py-8 text-stone-500">
							No hay facturas {filterStatus === "active" ? "activas" : "dadas de baja"}
						</div>
					) : (
						filteredInvoices.map((invoice, index) => (
							<div key={index} className="bg-[var(--card)] p-4 rounded-xl border border-stone-100 dark:border-stone-800 shadow-sm space-y-3">
								<div className="flex justify-between items-start">
									<div>
										<p className="text-sm font-bold text-[var(--text-primary)]">
											{invoice.quoteNumber || "-"}
										</p>
										<p className="text-xs text-stone-500">
											{new Date(invoice.date).toLocaleDateString("es-AR")}
										</p>
									</div>
									<div className="text-sm font-bold text-[var(--text-primary)]">
										${invoice.total?.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
									</div>
								</div>

								<div>
									<p className="text-sm font-medium text-[var(--text-primary)]">
										{invoice.customerName || invoice.customer || "Consumidor Final"}
									</p>
									<p className="text-xs text-stone-500">
										{invoice.city || "Sin localidad"}
									</p>
								</div>

								<div className="flex justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
									<button
										onClick={() => handleViewInvoice(invoice)}
										className="flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-xs font-medium hover:bg-amber-100 transition-colors"
									>
										<Eye className="h-3 w-3" /> Ver
									</button>
									{filterStatus === "active" ? (
										<button
											onClick={() => setConfirmModal({ isOpen: true, type: "delete", invoiceId: invoice.id })}
											className="flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
										>
											<Trash2 className="h-3 w-3" /> Baja
										</button>
									) : (
										<button
											onClick={() => setConfirmModal({ isOpen: true, type: "restore", invoiceId: invoice.id })}
											className="flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-medium hover:bg-green-100 transition-colors"
										>
											<RotateCcw className="h-3 w-3" /> Restaurar
										</button>
									)}
								</div>
							</div>
						))
					)}
				</div>

				{/* Confirm Modal (Basic implementation included in this component for simplicity, 
			    or could be lifted up if shared across tabs, but here it is contained) */}
				{confirmModal.isOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
						<div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
							<h3 className="mb-2 text-lg font-bold text-stone-800 dark:text-stone-100">
								{confirmModal.type === "delete" ? "Dar de baja factura" : "Restaurar factura"}
							</h3>
							<p className="mb-6 text-sm text-stone-500 dark:text-stone-400">
								¿Estás seguro de que deseas realizar esta acción?
							</p>
							<div className="flex gap-3">
								<button
									onClick={() => setConfirmModal({ isOpen: false, type: null, invoiceId: null })}
									className="cursor-pointer flex-1 rounded-xl bg-stone-100 py-3 text-sm font-bold text-stone-600 transition-colors hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
								>
									Cancelar
								</button>
								<button
									onClick={confirmModal.type === "delete" ? handleSoftDelete : handleRestore}
									className={cn(
										"cursor-pointer flex-1 rounded-xl py-3 text-sm font-bold text-white transition-colors",
										confirmModal.type === "delete"
											? "bg-red-600 hover:bg-red-700"
											: "bg-green-600 hover:bg-green-700"
									)}
								>
									Confirmar
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
