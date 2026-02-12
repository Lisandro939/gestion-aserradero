import { useEffect, useState } from "react";
import { Eye, Download, X, FileText, Trash2, Search, Filter, RotateCcw, AlertTriangle, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { generateDeliveryNotePDF } from "@/app/components/DeliveryNotePDF"; // Adjust path if needed
import { cn } from "@/lib/utils";

// Interface for PDF generator (approximated based on usage)
interface DeliveryNoteData {
	documentNumber: string;
	date: Date | string; // Generator handles string or date? Usually string in form
	salePoint: string;
	customer: string;
	address: string;
	taxId: string;
	items: any[];
	notes?: string;
}

// Helper to ensure DD/MM/YYYY format
const formatDate = (dateString: string | Date | undefined) => {
	if (!dateString) return "-";
	const date = new Date(dateString);
	const day = date.getUTCDate().toString().padStart(2, "0");
	const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
	const year = date.getUTCFullYear();
	return `${day}/${month}/${year}`;
};

export default function ViewDeliveryNotesTab() {
	const [deliveryNotes, setDeliveryNotes] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchDeliveryNotes();
	}, []);

	const fetchDeliveryNotes = async () => {
		try {
			setLoading(true);
			await fetch("/api/delivery-notes")
				.then((res) => res.json())
				.then((data) => {
					setDeliveryNotes(data.data);
				});
		} catch (error) {
			console.error("Error loading delivery notes:", error);
		} finally {
			setLoading(false);
		}
	};

	const router = useRouter();
	const [searchTerm, setSearchTerm] = useState("");
	const [filterStatus, setFilterStatus] = useState<"active" | "inactive">("active");
	const [confirmModal, setConfirmModal] = useState<{
		isOpen: boolean;
		type: "delete" | "restore" | null;
		noteId: number | null;
	}>({
		isOpen: false,
		type: null,
		noteId: null,
	});

	const handleViewNote = (note: any) => {
		router.push(`/delivery-notes/${note.id}`);
	};

	const handleSoftDelete = async () => {
		if (!confirmModal.noteId) return;

		try {
			const response = await fetch(`/api/delivery-notes?id=${confirmModal.noteId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				fetchDeliveryNotes();
				setConfirmModal({ isOpen: false, type: null, noteId: null });
			} else {
				alert("Error al eliminar el remito");
			}
		} catch (error) {
			console.error("Error deleting note:", error);
			alert("Error al eliminar el remito");
		}
	};

	const handleRestore = async () => {
		if (!confirmModal.noteId) return;

		try {
			const response = await fetch(`/api/delivery-notes?id=${confirmModal.noteId}&action=restore`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
			});

			if (response.ok) {
				fetchDeliveryNotes();
				setConfirmModal({ isOpen: false, type: null, noteId: null });
			} else {
				alert("Error al restaurar el remito");
			}
		} catch (error) {
			console.error("Error restoring note:", error);
			alert("Error al restaurar el remito");
		}
	};

	const filteredNotes = deliveryNotes.filter((note) => {
		// Filter by status (active vs inactive)
		if (filterStatus === "active" && note.deletedAt) return false;
		if (filterStatus === "inactive" && !note.deletedAt) return false;

		// Filter by search term
		if (searchTerm === "") return true;
		const searchLower = searchTerm.toLowerCase();
		return (
			note.number?.toLowerCase().includes(searchLower) ||
			note.customer?.name?.toLowerCase().includes(searchLower) ||
			note.customer?.taxId?.toLowerCase().includes(searchLower)
		);
	});

	return (
		<div className="space-y-4">
			{/* Search and Filter Bar */}
			<div className="bg-[var(--card)] rounded-2xl p-4 flex gap-4 items-center shadow-sm border border-stone-200 dark:border-stone-800/50">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
					<input
						type="text"
						placeholder="Buscar por número, cliente o CUIT..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full rounded-xl border border-stone-200 bg-stone-50 pl-10 pr-4 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 dark:border-stone-800 dark:bg-stone-900/50 dark:focus:ring-amber-500/20"
					/>
				</div>
				<div className="relative">
					<Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 pointer-events-none" />
					<select
						value={filterStatus}
						onChange={(e) => setFilterStatus(e.target.value as "active" | "inactive")}
						className="appearance-none rounded-xl border border-stone-200 bg-stone-50 pl-10 pr-8 py-2 text-sm outline-none cursor-pointer focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 dark:border-stone-800 dark:bg-stone-900/50 dark:focus:ring-amber-500/20"
					>
						<option value="active">Activos</option>
						<option value="inactive">Bajas</option>
					</select>
				</div>
			</div>

			<div className="bg-[var(--card)] rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">
				<div className="overflow-x-auto -mx-4 md:mx-0">
					<table className="w-full min-w-[640px]">
						<thead>
							<tr className="border-b border-stone-100 dark:border-stone-800">
								<th className="pb-4 text-left text-xs font-bold text-stone-400 uppercase">
									N° Documento
								</th>
								<th className="pb-4 text-left text-xs font-bold text-stone-400 uppercase">
									Fecha
								</th>
								<th className="pb-4 text-left text-xs font-bold text-stone-400 uppercase">
									Punto de Venta
								</th>
								<th className="pb-4 text-left text-xs font-bold text-stone-400 uppercase">
									Cliente
								</th>
								<th className="pb-4 text-left text-xs font-bold text-stone-400 uppercase">
									CUIT
								</th>
								<th className="pb-4 text-left text-xs font-bold text-stone-400 uppercase">
									Items
								</th>
								<th className="pb-4 text-center text-xs font-bold text-stone-400 uppercase">
									Acciones
								</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr>
									<td colSpan={6} className="py-8 text-center text-stone-500">
										Cargando remitos...
									</td>
								</tr>
							) : filteredNotes.length === 0 ? (
								<tr>
									<td colSpan={7} className="py-8 text-center text-stone-500">
										No hay remitos {filterStatus === "active" ? "activos" : "eliminados"} que coincidan con la búsqueda
									</td>
								</tr>
							) : (
								filteredNotes.map((note, index) => (
									<tr
										key={index}
										className="border-b border-stone-100 dark:border-stone-800"
									>
										<td className="py-4 text-sm">{note.number || "-"}</td>
										<td className="py-4 text-sm">
											{formatDate(note.date)}
										</td>
										<td className="py-4 text-sm font-medium text-stone-600 dark:text-stone-300">
											{note.salePoint?.toString().padStart(3, "0") || "-"}
										</td>
										<td className="py-4 text-sm">
											{note.customer?.name || "Sin cliente"}
										</td>
										<td className="py-4 text-sm">
											{note.customer?.taxId || "-"}
										</td>
										<td className="py-4 text-sm">
											{note.items?.length || 0} items
										</td>
										<td className="py-4 text-center">
											<div className="flex items-center justify-center gap-2">
												<button
													onClick={() => handleViewNote(note)}
													className="cursor-pointer p-2 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-amber-600 transition-all dark:hover:bg-stone-800"
													title="Ver detalle"
												>
													<Eye className="h-4 w-4" />
												</button>
												{filterStatus === "active" ? (
													<button
														onClick={() => setConfirmModal({ isOpen: true, type: "delete", noteId: note.id })}
														className="cursor-pointer p-2 rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600 transition-all dark:hover:bg-red-900/10"
														title="Eliminar"
													>
														<Trash2 className="h-4 w-4" />
													</button>
												) : (
													<button
														onClick={() => setConfirmModal({ isOpen: true, type: "restore", noteId: note.id })}
														className="cursor-pointer p-2 rounded-lg text-stone-400 hover:bg-green-50 hover:text-green-600 transition-all dark:hover:bg-green-900/10"
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



				<div className="mt-4">
					<AnimatePresence>
						{/* Modal */}
						{confirmModal.isOpen && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
								onClick={() => setConfirmModal({ isOpen: false, type: null, noteId: null })}
							>
								<motion.div
									initial={{ scale: 0.95, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0.95, opacity: 0 }}
									onClick={(e) => e.stopPropagation()}
									className="bg-[var(--card)] rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col"
								>
									<div className="p-6 text-center">
										<div className={cn(
											"mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full",
											confirmModal.type === "delete" ? "bg-red-100 text-red-600 dark:bg-red-900/30" : "bg-green-100 text-green-600 dark:bg-green-900/30"
										)}>
											{confirmModal.type === "delete" ? (
												<AlertTriangle className="h-8 w-8" />
											) : (
												<RotateCcw className="h-8 w-8" />
											)}
										</div>
										<h2 className="mb-2 text-lg font-bold text-[var(--card-foreground)]">
											{confirmModal.type === "delete" ? "¿Eliminar remito?" : "¿Restaurar remito?"}
										</h2>
										<p className="text-sm text-stone-500 dark:text-stone-400">
											{confirmModal.type === "delete"
												? "El remito será marcado como cancelado y no aparecerá en el listado principal."
												: "El remito volverá a estar activo y visible en el listado principal."}
										</p>
									</div>
									<div className="flex border-t border-stone-100 bg-stone-50 p-4 gap-3 dark:border-stone-800 dark:bg-stone-900/50">
										<button
											onClick={() => setConfirmModal({ isOpen: false, type: null, noteId: null })}
											className="flex-1 cursor-pointer rounded-xl bg-white border border-stone-200 py-3 text-sm font-bold text-stone-600 hover:bg-stone-50 transition-colors dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-700"
										>
											Cancelar
										</button>
										<button
											onClick={confirmModal.type === "delete" ? handleSoftDelete : handleRestore}
											className={cn(
												"flex-1 cursor-pointer rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-colors",
												confirmModal.type === "delete"
													? "bg-red-600 hover:bg-red-700 shadow-red-600/20"
													: "bg-green-600 hover:bg-green-700 shadow-green-600/20"
											)}
										>
											{confirmModal.type === "delete" ? "Eliminar" : "Restaurar"}
										</button>
									</div>
								</motion.div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>
		</div>
	);
}

