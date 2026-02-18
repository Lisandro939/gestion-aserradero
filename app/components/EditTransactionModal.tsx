"use client";

import { useState } from "react";
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const payload = {
				amount: parseFloat(amount),
				description,
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
			<div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
				{trigger || (
					<button className="cursor-pointer p-1 text-stone-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar">
						<Pencil className="h-4 w-4" />
					</button>
				)}
			</div>

			{isOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
					onClick={() => setIsOpen(false)}
				>
					<div
						className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="p-4 border-b flex items-center justify-between">
							<h3 className="font-bold text-lg">Editar Transacción</h3>
							<button
								onClick={() => setIsOpen(false)}
								className="p-1 hover:bg-stone-100 rounded-full transition-colors"
							>
								<X className="h-5 w-5 text-stone-500" />
							</button>
						</div>

						<form onSubmit={handleSubmit} className="p-6 space-y-4">
							{error && (
								<div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
									{error}
								</div>
							)}

							<div className="space-y-2">
								<label className="text-sm font-medium text-stone-700">Monto</label>
								<div className="relative">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">$</span>
									<input
										type="number"
										step="0.01"
										required
										min="0"
										value={amount}
										onChange={(e) => setAmount(e.target.value)}
										className="w-full pl-7 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
										placeholder="0.00"
									/>
								</div>
								<p className="text-xs text-stone-500">
									{transaction.type === 'payment' ? 'Pago (Credito)' : 'Compra (Debito)'}
								</p>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-stone-700">Fecha</label>
								<input
									type="date"
									value={date}
									onChange={(e) => setDate(e.target.value)}
									className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
								/>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-stone-700">Descripción</label>
								<input
									type="text"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
								/>
							</div>

							<div className="pt-4 flex justify-end gap-3">
								<button
									type="button"
									onClick={() => setIsOpen(false)}
									className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
									disabled={loading}
								>
									Cancelar
								</button>
								<button
									type="submit"
									disabled={loading}
									className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-stone-800 transition-colors flex items-center gap-2 disabled:opacity-50"
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
