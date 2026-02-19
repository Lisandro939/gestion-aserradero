"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, CreditCard, Banknote, Landmark, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface RegisterPaymentModalProps {
	customerId: number;
	onSuccess?: () => void;
	trigger?: React.ReactNode;
}

export function RegisterPaymentModal({ customerId, onSuccess, trigger }: RegisterPaymentModalProps) {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const [amount, setAmount] = useState("");
	const [description, setDescription] = useState("");
	const [method, setMethod] = useState("cash"); // cash, transfer, cheque
	const [selectedDeliveryNote, setSelectedDeliveryNote] = useState<string>(""); // ID of delivery note
	const [deliveryNotes, setDeliveryNotes] = useState<any[]>([]);

	// Cheque fields
	const [chequeNumber, setChequeNumber] = useState("");
	const [chequeBank, setChequeBank] = useState("");
	const [chequeDrawer, setChequeDrawer] = useState("");
	const [chequeDate, setChequeDate] = useState("");

	// Fetch delivery notes when modal opens
	useEffect(() => {
		if (isOpen && customerId) {
			const fetchNotes = async () => {
				try {
					const res = await fetch("/api/delivery-notes");
					if (res.ok) {
						const data = await res.json();
						// Filter by customer and valid status if needed.
						// Assuming API returns all, we filter by customer ID.
						const customerNotes = data.data.filter((n: any) => n.customerId.toString() === customerId.toString());
						setDeliveryNotes(customerNotes);
					}
				} catch (e) {
					console.error("Failed to fetch delivery notes", e);
				}
			};
			fetchNotes();
		}
	}, [isOpen, customerId]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			// Find selected note to get its number
			const note = deliveryNotes.find(n => n.id.toString() === selectedDeliveryNote);
			// Only include document number if a specific note is selected. 
			// Otherwise leave undefined so backend handles it or it stays null.
			const documentNumber = note ? note.number : undefined;

			const payload: any = {
				type: "payment",
				amount: parseFloat(amount),
				description: description || `Pago ${documentNumber ? `de Remito #${documentNumber}` : `con ${method}`}`,
				paymentMethod: method,
				documentNumber: documentNumber
			};

			if (method === "cheque") {
				payload.cheque = {
					number: chequeNumber,
					bank: chequeBank,
					drawerName: chequeDrawer,
					amount: parseFloat(amount),
					dueDate: chequeDate,
				};
			}

			const res = await fetch(`/api/customers/${customerId}/transactions`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Error al registrar pago");
			}

			setIsOpen(false);
			setAmount("");
			setDescription("");
			setMethod("cash");
			setSelectedDeliveryNote("");
			// Reset cheque fields
			setChequeNumber("");
			setChequeBank("");
			setChequeDrawer("");
			setChequeDate("");

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
			<div onClick={() => setIsOpen(true)} className="inline-block">
				{trigger || (
					<button className="cursor-pointer bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2">
						<Banknote className="h-4 w-4" />
						Registrar Pago
					</button>
				)}
			</div>

			{isOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
					onClick={() => setIsOpen(false)}
				>
					<div
						className="bg-[var(--card)] text-[var(--card-foreground)] rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
							<h3 className="font-bold text-lg">Registrar nuevo pago</h3>
							<button
								onClick={() => setIsOpen(false)}
								className="cursor-pointer p-1 hover:bg-[var(--secondary-card)] rounded-full transition-colors"
							>
								<X className="h-5 w-5 text-[var(--card-foreground)]/60" />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="p-6 space-y-4">
							{error && (
								<div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
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
											className="w-full pl-7 pr-3 py-2 border border-[var(--border)] bg-[var(--card)] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[var(--card-foreground)]"
											placeholder="0.00"
										/>
									</div>
								</div>
								<div className="space-y-2">
									<label className="text-sm font-medium text-[var(--card-foreground)]">Método</label>
									<select
										value={method}
										onChange={(e) => setMethod(e.target.value)}
										className="w-full px-3 py-2 border border-[var(--border)] bg-[var(--card)] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[var(--card-foreground)]"
									>
										<option value="cash">Efectivo</option>
										<option value="transfer">Transferencia</option>
										<option value="cheque">Cheque</option>
									</select>
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-[var(--card-foreground)] flex items-center gap-2">
									<Package className="h-4 w-4" /> Asignar a Remito (Opcional)
								</label>
								<select
									value={selectedDeliveryNote}
									onChange={(e) => {
										setSelectedDeliveryNote(e.target.value);
										// Optional: Auto-fill amount if empty?
									}}
									className="w-full px-3 py-2 border border-[var(--border)] bg-[var(--card)] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-[var(--card-foreground)]"
								>
									<option value="">-- Sin Remito / General --</option>
									{deliveryNotes.map((note) => (
										<option key={note.id} value={note.id}>
											Remito #{note.number} - {new Date(note.date).toLocaleDateString("es-AR")}
										</option>
									))}
								</select>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-[var(--card-foreground)]">Descripción / Concepto</label>
								<input
									type="text"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									className="w-full px-3 py-2 border border-[var(--border)] bg-[var(--card)] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[var(--card-foreground)]"
									placeholder={method === 'cheque' ? 'Pago con cheque...' : 'Pago parcial...'}
								/>
							</div>

							{/* Cheque Fields */}
							{method === "cheque" && (
								<div className="bg-[var(--secondary-card)] p-4 rounded-lg space-y-4 border border-[var(--border)] mt-2">
									<h4 className="font-bold text-sm text-[var(--card-foreground)] flex items-center gap-2">
										<CreditCard className="h-4 w-4" /> Datos del Cheque
									</h4>

									<div className="grid grid-cols-2 gap-3">
										<div className="space-y-1">
											<label className="text-xs font-medium text-[var(--card-foreground)]/70">Número</label>
											<input
												required
												type="text"
												value={chequeNumber}
												onChange={(e) => setChequeNumber(e.target.value)}
												className="w-full px-2 py-1.5 border border-[var(--border)] bg-[var(--card)] rounded-md text-sm text-[var(--card-foreground)]"
												placeholder="Ej: 12345678"
											/>
										</div>
										<div className="space-y-1">
											<label className="text-xs font-medium text-[var(--card-foreground)]/70">Banco</label>
											<input
												required
												type="text"
												value={chequeBank}
												onChange={(e) => setChequeBank(e.target.value)}
												className="w-full px-2 py-1.5 border border-[var(--border)] bg-[var(--card)] rounded-md text-sm text-[var(--card-foreground)]"
												placeholder="Ej: Galicia"
											/>
										</div>
									</div>

									<div className="space-y-1">
										<label className="text-xs font-medium text-[var(--card-foreground)]/70">Librador (Firmante)</label>
										<input
											required
											type="text"
											value={chequeDrawer}
											onChange={(e) => setChequeDrawer(e.target.value)}
											className="w-full px-2 py-1.5 border border-[var(--border)] bg-[var(--card)] rounded-md text-sm text-[var(--card-foreground)]"
											placeholder="Nombre del titular"
										/>
									</div>

									<div className="space-y-1">
										<label className="text-xs font-medium text-[var(--card-foreground)]/70">Fecha de Cobro/Vto</label>
										<input
											required
											type="date"
											value={chequeDate}
											onChange={(e) => setChequeDate(e.target.value)}
											className="w-full px-2 py-1.5 border border-[var(--border)] bg-[var(--card)] rounded-md text-sm text-[var(--card-foreground)]"
										/>
									</div>
								</div>
							)}

							<div className="pt-4 flex justify-end gap-3">
								<button
									type="button"
									onClick={() => setIsOpen(false)}
									className="cursor-pointer px-4 py-2 text-sm font-medium text-[var(--card-foreground)] hover:bg-[var(--secondary-card)] rounded-lg transition-colors"
									disabled={loading}
								>
									Cancelar
								</button>
								<button
									type="submit"
									disabled={loading}
									className="cursor-pointer bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
								>
									{loading && <Loader2 className="h-4 w-4 animate-spin" />}
									Registrar Pago
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	);
}
