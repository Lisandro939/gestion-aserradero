"use client";

import { useState } from "react";
import { CreditCard, Calendar, User, AlignLeft, Building2, X } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

interface Cheque {
	number: string;
	bank: string;
	drawerName: string;
	amount: number;
	dueDate: number;
	status: string;
}

interface ChequeDetailsProps {
	cheque: Cheque;
	trigger?: React.ReactNode;
}

export function ChequeDetails({ cheque, trigger }: ChequeDetailsProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<div onClick={() => setIsOpen(true)} className="cursor-pointer inline-block">
				{trigger || (
					<button className="flex items-center gap-2 px-2 py-1 text-sm border rounded hover:bg-stone-50">
						<CreditCard className="h-4 w-4" />
						Ver Cheque
					</button>
				)}
			</div>

			{isOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
					onClick={() => setIsOpen(false)}
				>
					<div
						className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="p-4 border-b flex items-center justify-between">
							<h3 className="font-bold text-lg">Detalle del Cheque</h3>
							<button
								onClick={() => setIsOpen(false)}
								className="p-1 hover:bg-stone-100 rounded-full transition-colors"
							>
								<X className="h-5 w-5 text-stone-500" />
							</button>
						</div>

						<div className="p-6 space-y-6">
							<div className="grid grid-cols-2 gap-6">
								<div className="space-y-1">
									<p className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
										<AlignLeft className="h-3 w-3" /> Número
									</p>
									<p className="font-mono font-bold text-lg text-stone-800">{cheque.number}</p>
								</div>
								<div className="space-y-1">
									<p className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
										<Building2 className="h-3 w-3" /> Banco
									</p>
									<p className="font-semibold text-stone-800">{cheque.bank}</p>
								</div>
							</div>

							<div className="space-y-1 bg-stone-50 p-3 rounded-lg border border-stone-100">
								<p className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
									<User className="h-3 w-3" /> Librador / Entregador
								</p>
								<p className="text-sm font-medium text-stone-800">{cheque.drawerName}</p>
							</div>

							<div className="grid grid-cols-2 gap-6 pt-2">
								<div className="space-y-1">
									<p className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
										<Calendar className="h-3 w-3" /> Vencimiento
									</p>
									<p className="font-medium text-stone-800">{formatDate(cheque.dueDate)}</p>
								</div>
								<div className="space-y-1 text-right">
									<p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Monto</p>
									<p className="font-bold text-2xl text-emerald-600">
										{formatCurrency(cheque.amount)}
									</p>
								</div>
							</div>

							<div className="pt-4 border-t text-center">
								<span className={`
									inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
									${cheque.status === 'pending' ? 'bg-amber-100 text-amber-700' :
										cheque.status === 'deposited' ? 'bg-blue-100 text-blue-700' :
											cheque.status === 'rejected' ? 'bg-red-100 text-red-700' :
												'bg-emerald-100 text-emerald-700'}
								`}>
									{cheque.status === 'pending' ? 'En Cartera' :
										cheque.status === 'deposited' ? 'Depositado' :
											cheque.status === 'rejected' ? 'Rechazado' :
												cheque.status === 'honored' ? 'Cobrado' : cheque.status}
								</span>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
