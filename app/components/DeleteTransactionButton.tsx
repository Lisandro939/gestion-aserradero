"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";

interface DeleteTransactionButtonProps {
	transactionId: number;
	onSuccess?: () => void;
}

export function DeleteTransactionButton({ transactionId, onSuccess }: DeleteTransactionButtonProps) {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleDelete = async () => {
		setLoading(true);
		try {
			const res = await fetch(`/api/transactions/${transactionId}`, {
				method: "DELETE",
			});

			if (!res.ok) {
				throw new Error("Error al eliminar");
			}

			setIsOpen(false);
			router.refresh();
			if (onSuccess) onSuccess();
		} catch (error) {
			console.error("Error deleting transaction:", error);
			// Optionally show toast error
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<button
				onClick={() => setIsOpen(true)}
				className="cursor-pointer p-1 text-stone-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
				title="Eliminar"
			>
				<Trash2 className="h-4 w-4" />
			</button>

			{isOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
					onClick={() => setIsOpen(false)}
				>
					<div
						className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex flex-col items-center text-center gap-2">
							<div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
								<AlertTriangle className="h-6 w-6" />
							</div>
							<h3 className="font-bold text-lg text-stone-900">¿Eliminar Transacción?</h3>
							<p className="text-sm text-stone-500">
								Esta acción revertirá el saldo de la cuenta corriente. El registro quedará marcado como eliminado.
							</p>
						</div>

						<div className="flex gap-3 pt-2">
							<button
								onClick={() => setIsOpen(false)}
								className="flex-1 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
								disabled={loading}
							>
								Cancelar
							</button>
							<button
								onClick={handleDelete}
								disabled={loading}
								className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
							>
								{loading && <Loader2 className="h-4 w-4 animate-spin" />}
								Eliminar
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
