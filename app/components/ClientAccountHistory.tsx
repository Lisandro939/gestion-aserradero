"use client";

import { useMemo } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Printer, Download, CreditCard, Banknote, Eye } from "lucide-react";
import { ChequeDetails } from "./ChequeDetails";
import { RegisterPaymentModal } from "./RegisterPaymentModal";
import { useRouter } from "next/navigation";
import { generateClientAccountPDF } from "./ClientAccountPDF";
import { DeleteTransactionButton } from "./DeleteTransactionButton";
import { EditTransactionModal } from "./EditTransactionModal";

interface Cheque {
	number: string;
	bank: string;
	drawerName: string;
	amount: number;
	dueDate: number;
	status: string;
}

interface Transaction {
	id: number;
	date: number;
	documentNumber?: string;
	description: string;
	amount: number; // positive for payment (credit), negative for purchase (debit)
	balance: number;
	paymentMethod: string;
	cheque?: Cheque;
	type: 'purchase' | 'payment';
	customerId: number;
}

interface ClientAccountHistoryProps {
	transactions: Transaction[];
	customer: {
		id: number;
		name: string;
		cuit?: string;
		taxId?: string;
		address?: string;
		phone?: string;
		email?: string;
	};
	refreshData?: () => void;
}

export function ClientAccountHistory({ transactions, customer, refreshData }: ClientAccountHistoryProps) {
	const router = useRouter();

	const handleDownload = () => {
		generateClientAccountPDF({
			transactions,
			customerName: customer.name,
			customerCuit: customer.cuit || customer.taxId,
			customerAddress: customer.address
		});
	};

	const handlePaymentSuccess = () => {
		router.refresh();
		if (refreshData) refreshData();
	};

	// Calculate running balance dynamically
	const processedTransactions = useMemo(() => {
		// Sort by date ascending to calculate running balance
		const sorted = [...transactions].sort((a, b) => (a.date || 0) - (b.date || 0));

		let runningBalance = 0;
		const withBalance = sorted.map(t => {
			// amount: positive for payment (Credit/Haber), negative for purchase (Debit/Debe)
			// Balance = Sum(Amounts)
			runningBalance += t.amount;
			return { ...t, calculatedBalance: runningBalance };
		});

		// Return reversed (newest first) for display
		return withBalance.reverse();
	}, [transactions]);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between no-print">
				<h3 className="text-lg font-bold">Cuenta Corriente</h3>
				<div className="flex gap-2">
					<RegisterPaymentModal
						customerId={customer.id}
						onSuccess={handlePaymentSuccess}
					/>
					<button
						onClick={handleDownload}
						className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm font-medium border border-[var(--border)] rounded-xl hover:bg-[var(--secondary)] transition-colors bg-[var(--card)] text-[var(--card-foreground)] shadow-sm"
					>
						<Download className="h-4 w-4" />
						Descargar PDF
					</button>
				</div>
			</div>

			<div className="rounded-xl border border-[var(--border)] bg-[var(--card)] print:border-none print:shadow-none overflow-hidden">
				<div className="p-6 hidden print:block border-b border-[var(--border)] mb-4">
					<h1 className="text-2xl font-bold mb-2 text-[var(--card-foreground)]">Resumen de Cuenta Corriente</h1>
					<div className="flex justify-between text-sm text-[var(--muted-foreground)]">
						<p><strong>Cliente:</strong> {customer.name}</p>
						<p><strong>Fecha de emisión:</strong> {new Date().toLocaleDateString("es-AR")}</p>
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-sm text-left">
						<thead className="bg-[var(--muted)] text-[var(--muted-foreground)] uppercase text-xs font-bold">
							<tr>
								<th className="px-6 py-4">Fecha de Venta</th>
								<th className="px-6 py-4">Número de Remito</th>
								<th className="px-6 py-4 text-right">Debe</th>
								<th className="px-6 py-4 text-right">Haber</th>
								<th className="px-6 py-4 text-right">Saldo</th>
								<th className="px-6 py-4">Forma de Pago</th>
								<th className="px-6 py-4 w-24 no-print text-center">Acciones</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[var(--border)]">
							{processedTransactions.length > 0 ? (
								processedTransactions.map((t) => {
									const isDebit = t.type === 'purchase';
									const debitAmount = isDebit ? Math.abs(t.amount) : 0;
									const creditAmount = !isDebit ? t.amount : 0;

									return (
										<tr key={t.id} className="hover:bg-[var(--muted)]/50 transition-colors">
											<td className="px-6 py-4 whitespace-nowrap text-[var(--muted-foreground)]">{formatDate(t.date)}</td>
											<td className="px-6 py-4 font-medium text-[var(--card-foreground)]">
												{t.documentNumber?.replace(/^Remito\s*#?\s*/i, "").replace(/^\d+-/, "").trim() || "-"}
											</td>
											<td className="px-6 py-4 text-right text-red-600 font-medium whitespace-nowrap">
												{debitAmount > 0 ? formatCurrency(debitAmount) : "-"}
											</td>
											<td className="px-6 py-4 text-right text-emerald-600 font-medium whitespace-nowrap">
												{creditAmount > 0 ? formatCurrency(creditAmount) : "-"}
											</td>
											<td className="px-6 py-4 text-right font-bold text-[var(--card-foreground)] whitespace-nowrap">
												{formatCurrency(t.calculatedBalance)}
											</td>
											<td className="px-6 py-4">
												<div className="flex items-center gap-2">
													<span className={`
														px-2 py-1 rounded-md text-xs font-medium capitalize
														${t.paymentMethod === 'current_account' ? 'bg-[var(--muted)] text-[var(--muted-foreground)]' :
															t.paymentMethod === 'cheque' ? 'bg-amber-500/10 text-amber-600' :
																t.paymentMethod === 'transfer' ? 'bg-blue-500/10 text-blue-600' :
																	t.paymentMethod === 'cash' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-[var(--muted)]'}
													`}>
														{t.paymentMethod === 'current_account' ? 'Cta. Cte.' :
															t.paymentMethod === 'cheque' ? 'Cheque' :
																t.paymentMethod === 'transfer' ? 'Transf.' :
																	t.paymentMethod === 'cash' ? 'Efectivo' :
																		t.paymentMethod || '-'}
													</span>
													{t.paymentMethod === 'cheque' && t.cheque && (
														<div className="no-print">
															<ChequeDetails
																cheque={t.cheque}
																trigger={
																	<button className="cursor-pointer text-stone-400 hover:text-amber-600 transition-colors p-2 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/20 dark:hover:text-amber-400" title="Ver Cheque">
																		<CreditCard className="h-4 w-4" />
																	</button>
																}
															/>
														</div>
													)}
													{t.paymentMethod === 'cheque' && t.cheque && (
														<span className="hidden print:inline text-xs text-stone-500 ml-1">
															(#{t.cheque.number})
														</span>
													)}
												</div>
											</td>
											<td className="px-6 py-4 no-print text-center">
												{t.type === 'payment' && (
													<div className="flex items-center justify-center gap-1">
														<EditTransactionModal
															transaction={t}
															onSuccess={() => {
																if (refreshData) refreshData();
																router.refresh();
															}}
														/>
														<DeleteTransactionButton
															transactionId={t.id}
															onSuccess={() => {
																if (refreshData) refreshData();
																router.refresh();
															}}
														/>
													</div>
												)}
												{
													t.type === 'purchase' && (
														<div className="flex items-center justify-center gap-1">
															<a href={`/delivery-notes/${t.documentNumber?.replace(/^Remito\s*#?\s*/i, "").replace(/^\d+-/, "").trim() || "-"}`} className="cursor-pointer text-stone-400 hover:text-sky-600 transition-colors p-2 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/20 dark:hover:text-sky-400" title="Ver Remito">
																<Eye className="h-4 w-4" />
															</a>
														</div>
													)
												}
											</td>
										</tr>
									);
								})
							) : (
								<tr>
									<td colSpan={7} className="px-6 py-8 text-center text-[var(--muted-foreground)]">
										No hay movimientos registrados
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			<style jsx global>{`
				@media print {
					@page { margin: 1cm; size: auto; }
					body * {
						visibility: hidden;
					}
					.print\\:block {
						display: block !important;
					}
					.print\\:inline {
						display: inline !important;
					}
					.print\\:border-none {
						border: none !important;
					}
					.print\\:shadow-none {
						box-shadow: none !important;
					}
					/* Select the table container and make it visible */
					.space-y-4 > div.rounded-xl,
					.space-y-4 > div.rounded-xl * {
						visibility: visible;
					}
					.space-y-4 > div.rounded-xl {
						position: absolute;
						left: 0;
						top: 0;
						width: 100%;
						background: white;
						overflow: visible !important;
						border: none !important;
					}
					/* Hide no-print elements */
					.no-print {
						display: none !important;
					}
				}
			`}</style>
		</div>
	);
}
