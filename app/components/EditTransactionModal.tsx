"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, Pencil } from "lucide-react";

interface EditTransactionModalProps {
	transaction: {
		id: number;
		amount: number;
		description: string;
		date: number | null;
		paymentMethod: string;
		type: string;
		documentNumber?: string | null;
		customerId?: number;
	};
	onSuccess?: () => void;
	trigger?: React.ReactNode;
}

export function EditTransactionModal({ transaction, onSuccess, trigger }: EditTransactionModalProps) {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const [amount, setAmount] = useState(transaction.amount.toString());
	const [description, setDescription] = useState(transaction.description);
	const [date, setDate] = useState(
		transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : ""
	);
	const [documentNumber, setDocumentNumber] = useState(transaction.documentNumber || "");

	const [deliveryNotes, setDeliveryNotes] = useState<any[]>([]);
	const [selectedDeliveryNote, setSelectedDeliveryNote] = useState("");

	// Fetch delivery notes on open
	const fetchDeliveryNotes = async () => {
		if (!transaction.customerId) return;
		try {
			const res = await fetch(`/api/delivery-notes?customerId=${transaction.customerId}`);
			if (res.ok) {
				const data = await res.json();
				setDeliveryNotes(data.data || []);
			}
		} catch (err) {
			console.error("Error fetching delivery notes", err);
		}
	};

	// Trigger fetch when opening
	const handleOpen = () => {
		setIsOpen(true);
		fetchDeliveryNotes();
	};

	// Effect to set selected delivery note when fetched notes are available and documentNumber is set
	useEffect(() => {
		if (deliveryNotes.length > 0 && documentNumber) {
			const match = deliveryNotes.find(n =>
				documentNumber.includes(n.number) || documentNumber === `Remito #${n.number}`
			);
			if (match) {
				setSelectedDeliveryNote(match.id.toString());
			}
		}
	}, [deliveryNotes, documentNumber]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const payload = {
				amount: parseFloat(amount),
				description,
				documentNumber,
				date: date ? new Date(date).getTime() : undefined,
			};

			const res = await fetch(`/api/transactions/${transaction.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Error al actualizar transacción");
			}

			setIsOpen(false);
			router.refresh();
			if (onSuccess) onSuccess();
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<div onClick={handleOpen} className="inline-block cursor-pointer">
				{trigger || (
					<button className="cursor-pointer p-2 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-100 transition-colors dark:hover:bg-amber-900/20 dark:hover:text-amber-400" title="Editar">
						<Pencil className="h-4 w-4" />
					</button>
				)}
			</div>

			{isOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
					onClick={() => setIsOpen(false)}
				>
					<div
						className="bg-[var(--card)] text-[var(--card-foreground)] rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-[var(--border)]"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
							<h3 className="font-bold text-lg">Editar transacción</h3>
							<button
								onClick={() => setIsOpen(false)}
								className="cursor-pointer p-1 hover:bg-[var(--secondary-card)] rounded-full transition-colors"
							>
								<X className="h-5 w-5 text-[var(--card-foreground)]/60" />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="p-6 space-y-4">
							{error && (
								<div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30">
									{error}
								</div>
							)}

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<label className="text-sm font-medium text-[var(--card-foreground)]">Monto</label>
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--card-foreground)]/60">$</span>
										<input
											type="number"
											step="0.01"
											required
											min="0"
											value={amount}
											onChange={(e) => setAmount(e.target.value)}
											className="w-full pl-7 pr-3 py-2 border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
											placeholder="0.00"
										/>
									</div>
									<p className="text-xs text-[var(--card-foreground)]/60">
										{transaction.type === 'payment' ? 'Pago (Credito)' : 'Compra (Debito)'}
									</p>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium text-[var(--card-foreground)]">Fecha</label>
									<input
										type="date"
										value={date}
										onChange={(e) => setDate(e.target.value)}
										className="w-full px-3 py-2 border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-[var(--card-foreground)]">Documento / Remito</label>
								<select
									value={selectedDeliveryNote}
									onChange={(e) => {
										setSelectedDeliveryNote(e.target.value);
										// Find the selected note to update documentNumber text if needed, 
										// but usually we just want to link the ID or number.
										// The backend expects 'documentNumber' string.
										// If we select a note, we should probably set documentNumber to "Remito #NUMBER".
										// Or if the backend supported linking by ID that would be better, but currently transaction has documentNumber string.
										// Let's stick to the Select -> "Remito #..." string logic for now to match current behavior,
										// OR better: Just send the string.
										const note = deliveryNotes.find(n => n.id.toString() === e.target.value);
										if (note) {
											setDocumentNumber(`Remito #${note.number}`);
										} else {
											setDocumentNumber("");
										}
									}}
									className="w-full px-3 py-2 border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
								>
									<option value="">-- Sin Remito / Otro --</option>
									{deliveryNotes.map((note) => (
										<option key={note.id} value={note.id}>
											Remito #{note.number} - {new Date(note.date).toLocaleDateString("es-AR")} (${note.total})
										</option>
									))}
								</select>
								<p className="text-xs text-[var(--card-foreground)]/60 pt-1">
									Selecciona un remito. Dejar en blanco para desvincular.
								</p>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-[var(--card-foreground)]">Descripción</label>
								<input
									type="text"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									className="w-full px-3 py-2 border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
								/>
							</div>

							<div className="pt-4 flex justify-end gap-3 border-t border-[var(--border)] mt-4">
								<button
									type="button"
									onClick={() => setIsOpen(false)}
									className="px-4 py-2 text-sm font-medium text-[var(--card-foreground)] hover:bg-[var(--secondary-card)] rounded-lg transition-colors"
									disabled={loading}
								>
									Cancelar
								</button>
								<button
									type="submit"
									disabled={loading}
									className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors flex items-center gap-2 disabled:opacity-50"
								>
									{loading && <Loader2 className="h-4 w-4 animate-spin" />}
									Guardar Cambios
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	);
}
