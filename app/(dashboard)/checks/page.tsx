"use client";

import { useState, useEffect } from "react";
import {
	CreditCard,
	Search,
	Filter,
	Loader2,
	AlertTriangle,
	Building2,
	User,
	Calendar,
	CheckCircle2,
	XCircle,
	Banknote,
	Eye,
	X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatCurrency, formatDate, getDaysUntilDue } from "@/lib/utils";
import { ChequeDetails } from "@/app/components/ChequeDetails";

interface CheckData {
	id: number;
	number: string;
	bank: string;
	drawerName: string;
	amount: number;
	dueDate: number | null;
	status: string;
	createdAt: number | null;
	customerId: number;
	customerName: string;
}

interface ConfirmAction {
	checkId: number;
	checkNumber: string;
	newStatus: string;
	label: string;
}

const ALERT_DAYS = 7; // Threshold: 7 days before due


function getStatusLabel(status: string) {
	switch (status) {
		case "pending": return "En Cartera";
		case "deposited": return "Depositado";
		case "rejected": return "Rechazado";
		case "honored": return "Cobrado";
		default: return status;
	}
}

function getStatusStyle(status: string) {
	switch (status) {
		case "pending": return "bg-amber-500/15 text-amber-500 border-amber-500/20";
		case "deposited": return "bg-blue-500/15 text-blue-500 border-blue-500/20";
		case "rejected": return "bg-red-500/15 text-red-500 border-red-500/20";
		case "honored": return "bg-emerald-500/15 text-emerald-500 border-emerald-500/20";
		default: return "bg-stone-500/15 text-stone-500 border-stone-500/20";
	}
}

function getConfirmActionStyle(status: string) {
	switch (status) {
		case "deposited": return "bg-blue-600 hover:bg-blue-700";
		case "honored": return "bg-emerald-600 hover:bg-emerald-700";
		case "rejected": return "bg-red-600 hover:bg-red-700";
		default: return "bg-stone-600 hover:bg-stone-700";
	}
}

export default function ChecksPage() {
	const [mounted, setMounted] = useState(false);
	const [checks, setChecks] = useState<CheckData[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterStatus, setFilterStatus] = useState<string>("all");
	const [updatingId, setUpdatingId] = useState<number | null>(null);
	const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted) return;
		fetchChecks();
	}, [mounted]);

	const fetchChecks = async () => {
		try {
			setLoading(true);
			const res = await fetch("/api/checks");
			if (res.ok) {
				const data = await res.json();
				setChecks(data);
			}
		} catch (error) {
			console.error("Error loading checks:", error);
		} finally {
			setLoading(false);
		}
	};

	const requestStatusChange = (checkId: number, checkNumber: string, newStatus: string) => {
		const labels: Record<string, string> = {
			deposited: "Depositar",
			honored: "Cobrar",
			rejected: "Rechazar",
		};
		setConfirmAction({
			checkId,
			checkNumber,
			newStatus,
			label: labels[newStatus] || newStatus,
		});
	};

	const confirmStatusChange = async () => {
		if (!confirmAction) return;
		setUpdatingId(confirmAction.checkId);
		setConfirmAction(null);
		try {
			const res = await fetch("/api/checks", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: confirmAction.checkId, status: confirmAction.newStatus }),
			});
			if (res.ok) {
				await fetchChecks();
			}
		} catch (error) {
			console.error("Error updating check status:", error);
		} finally {
			setUpdatingId(null);
		}
	};

	// Filtering
	const filteredChecks = checks.filter((check) => {
		const matchSearch =
			check.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
			check.bank.toLowerCase().includes(searchTerm.toLowerCase()) ||
			check.drawerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			check.customerName.toLowerCase().includes(searchTerm.toLowerCase());
		const matchStatus = filterStatus === "all" || check.status === filterStatus;
		return matchSearch && matchStatus;
	});

	// Stats
	const totalPending = checks.filter(c => c.status === "pending").length;
	const totalAlerted = checks.filter(c => {
		if (c.status !== "pending") return false;
		const days = getDaysUntilDue(c.dueDate);
		return days !== null && days <= ALERT_DAYS;
	}).length;
	const totalAmount = checks
		.filter(c => c.status === "pending")
		.reduce((sum, c) => sum + c.amount, 0);

	// Helper: can this check transition to a given status?
	const canTransitionTo = (currentStatus: string, targetStatus: string) => {
		if (currentStatus === "pending") return ["deposited", "honored", "rejected"].includes(targetStatus);
		if (currentStatus === "deposited") return ["honored", "rejected"].includes(targetStatus);
		return false;
	};

	if (!mounted) return null;

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<Loader2 className="h-8 w-8 animate-spin text-amber-600" />
			</div>
		);
	}

	return (
		<div className="space-y-4 md:space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-xl md:text-2xl font-bold text-[var(--card-foreground)]">
						Gestión de Cheques
					</h1>
					<p className="text-xs md:text-sm text-stone-500">
						Control y seguimiento de cheques recibidos
					</p>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0 }}
					className="bg-[var(--card)] rounded-2xl p-4 md:p-5 shadow-sm border border-[var(--border)]"
				>
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-xl bg-amber-500/10">
							<CreditCard className="h-5 w-5 text-amber-500" />
						</div>
						<div>
							<p className="text-xs font-medium text-stone-500">En Cartera</p>
							<p className="text-xl font-bold text-[var(--card-foreground)]">{totalPending}</p>
						</div>
					</div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className={cn(
						"bg-[var(--card)] rounded-2xl p-4 md:p-5 shadow-sm border",
						totalAlerted > 0 ? "border-red-500/30" : "border-[var(--border)]"
					)}
				>
					<div className="flex items-center gap-3">
						<div className={cn("p-2 rounded-xl", totalAlerted > 0 ? "bg-red-500/10" : "bg-stone-500/10")}>
							<AlertTriangle className={cn("h-5 w-5", totalAlerted > 0 ? "text-red-500" : "text-stone-500")} />
						</div>
						<div>
							<p className="text-xs font-medium text-stone-500">Por Vencer (≤7 días)</p>
							<p className={cn("text-xl font-bold", totalAlerted > 0 ? "text-red-500" : "text-[var(--card-foreground)]")}>{totalAlerted}</p>
						</div>
					</div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="bg-[var(--card)] rounded-2xl p-4 md:p-5 shadow-sm border border-[var(--border)]"
				>
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-xl bg-emerald-500/10">
							<Banknote className="h-5 w-5 text-emerald-500" />
						</div>
						<div>
							<p className="text-xs font-medium text-stone-500">Monto en Cartera</p>
							<p className="text-xl font-bold text-[var(--card-foreground)]">{formatCurrency(totalAmount)}</p>
						</div>
					</div>
				</motion.div>
			</div>

			{/* Search and Filters */}
			<div className="bg-[var(--card)] rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-[var(--border)]">
				<div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
					<div className="relative flex-1 md:max-w-md">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
						<input
							type="text"
							placeholder="Buscar por número, banco, librador o cliente..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-[var(--card-foreground)]"
						/>
					</div>

					<div className="flex items-center gap-2">
						<Filter className="h-4 w-4 text-stone-400" />
						<select
							value={filterStatus}
							onChange={(e) => setFilterStatus(e.target.value)}
							className="flex-1 md:flex-none rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 md:px-4 py-2 text-sm outline-none text-[var(--card-foreground)]"
						>
							<option value="all">Todos los estados</option>
							<option value="pending">En Cartera</option>
							<option value="deposited">Depositados</option>
							<option value="honored">Cobrados</option>
							<option value="rejected">Rechazados</option>
						</select>
					</div>
				</div>
			</div>

			{/* Checks Table */}
			<div className="bg-[var(--card)] rounded-2xl md:rounded-3xl p-3 md:p-6 shadow-sm border border-[var(--border)] overflow-hidden">
				{/* Desktop Table */}
				<div className="hidden md:block overflow-x-auto -mx-3 md:mx-0">
					<table className="w-full min-w-[900px]">
						<thead>
							<tr className="border-b border-[var(--border)]">
								<th className="pb-4 text-left text-xs font-bold text-[var(--card-foreground)] uppercase px-2">
									Número
								</th>
								<th className="pb-4 text-left text-xs font-bold text-[var(--card-foreground)] uppercase px-2">
									Banco
								</th>
								<th className="pb-4 text-left text-xs font-bold text-[var(--card-foreground)] uppercase px-2">
									Librador
								</th>
								<th className="pb-4 text-left text-xs font-bold text-[var(--card-foreground)] uppercase px-2">
									Cliente
								</th>
								<th className="pb-4 text-right text-xs font-bold text-[var(--card-foreground)] uppercase px-2">
									Monto
								</th>
								<th className="pb-4 text-left text-xs font-bold text-[var(--card-foreground)] uppercase px-2">
									Vencimiento
								</th>
								<th className="pb-4 text-center text-xs font-bold text-[var(--card-foreground)] uppercase px-2">
									Estado
								</th>
								<th className="pb-4 text-center text-xs font-bold text-[var(--card-foreground)] uppercase px-2">
									Acciones
								</th>
							</tr>
						</thead>
						<tbody>
							{filteredChecks.map((check, index) => {
								const daysUntilDue = getDaysUntilDue(check.dueDate);
								const isExpiringSoon = check.status === "pending" && daysUntilDue !== null && daysUntilDue <= ALERT_DAYS;
								const isExpired = check.status === "pending" && daysUntilDue !== null && daysUntilDue < 0;

								return (
									<motion.tr
										key={check.id}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.03 }}
										className={cn(
											"border-b border-[var(--border)] transition-colors",
											isExpired && "bg-red-500/10",
											isExpiringSoon && !isExpired && "bg-red-500/5"
										)}
									>
										<td className="py-4 px-2">
											<span className="font-mono font-bold text-sm text-[var(--card-foreground)]">
												{check.number}
											</span>
										</td>
										<td className="py-4 px-2">
											<div className="flex items-center gap-2">
												<Building2 className="h-3.5 w-3.5 text-stone-400" />
												<span className="text-sm text-[var(--card-foreground)]">{check.bank}</span>
											</div>
										</td>
										<td className="py-4 px-2">
											<div className="flex items-center gap-2">
												<User className="h-3.5 w-3.5 text-stone-400" />
												<span className="text-sm text-[var(--card-foreground)]">{check.drawerName}</span>
											</div>
										</td>
										<td className="py-4 px-2">
											<span className="text-sm text-stone-500">{check.customerName}</span>
										</td>
										<td className="py-4 px-2 text-right">
											<span className="font-bold text-sm text-emerald-500">
												{formatCurrency(check.amount)}
											</span>
										</td>
										<td className="py-4 px-2">
											<div className="flex items-center gap-2">
												{isExpiringSoon && (
													<AlertTriangle className={cn("h-4 w-4 shrink-0", isExpired ? "text-red-500" : "text-red-500 animate-pulse")} />
												)}
												<div>
													<p className={cn(
														"text-sm font-medium",
														isExpired ? "text-red-500 font-bold" :
															isExpiringSoon ? "text-red-400 font-bold" :
																"text-[var(--card-foreground)]"
													)}>
														{formatDate(check.dueDate || 0)}
													</p>
													{(check.status === "pending" || check.status === "deposited") && daysUntilDue !== null && (
														<p className={cn(
															"text-xs",
															isExpired ? "text-red-500 font-semibold" :
																isExpiringSoon ? "text-red-400 font-semibold" :
																	"text-stone-500"
														)}>
															{isExpired
																? `Vencido hace ${Math.abs(daysUntilDue)} día${Math.abs(daysUntilDue) !== 1 ? 's' : ''}`
																: daysUntilDue === 0
																	? "Vence hoy"
																	: `Vence en ${daysUntilDue} día${daysUntilDue !== 1 ? 's' : ''}`
															}
														</p>
													)}
												</div>
											</div>
										</td>
										<td className="py-4 px-2 text-center">
											<span className={cn(
												"inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border",
												getStatusStyle(check.status)
											)}>
												{getStatusLabel(check.status)}
											</span>
										</td>
										<td className="py-4 px-2">
											<div className="flex items-center justify-center gap-1">
												<ChequeDetails
													cheque={{
														number: check.number,
														bank: check.bank,
														drawerName: check.drawerName,
														amount: check.amount,
														dueDate: check.dueDate || 0,
														status: check.status,
													}}
													trigger={
														<button className="cursor-pointer p-2 rounded-lg text-stone-400 hover:bg-sky-500/10 hover:text-sky-500 transition-all" title="Ver detalle">
															<Eye className="h-4 w-4" />
														</button>
													}
												/>
												{canTransitionTo(check.status, "deposited") && (
													<button
														onClick={() => requestStatusChange(check.id, check.number, "deposited")}
														disabled={updatingId === check.id}
														className="cursor-pointer p-2 rounded-lg text-stone-400 hover:bg-blue-500/10 hover:text-blue-500 transition-all disabled:opacity-50"
														title="Marcar como Depositado"
													>
														{updatingId === check.id ? (
															<Loader2 className="h-4 w-4 animate-spin" />
														) : (
															<Banknote className="h-4 w-4" />
														)}
													</button>
												)}
												{canTransitionTo(check.status, "honored") && (
													<button
														onClick={() => requestStatusChange(check.id, check.number, "honored")}
														disabled={updatingId === check.id}
														className="cursor-pointer p-2 rounded-lg text-stone-400 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all disabled:opacity-50"
														title="Marcar como Cobrado"
													>
														<CheckCircle2 className="h-4 w-4" />
													</button>
												)}
												{canTransitionTo(check.status, "rejected") && (
													<button
														onClick={() => requestStatusChange(check.id, check.number, "rejected")}
														disabled={updatingId === check.id}
														className="cursor-pointer p-2 rounded-lg text-stone-400 hover:bg-red-500/10 hover:text-red-500 transition-all disabled:opacity-50"
														title="Marcar como Rechazado"
													>
														<XCircle className="h-4 w-4" />
													</button>
												)}
											</div>
										</td>
									</motion.tr>
								);
							})}
						</tbody>
					</table>
				</div>

				{/* Mobile Cards */}
				<div className="md:hidden space-y-4">
					{filteredChecks.map((check, index) => {
						const daysUntilDue = getDaysUntilDue(check.dueDate);
						const isExpiringSoon = check.status === "pending" && daysUntilDue !== null && daysUntilDue <= ALERT_DAYS;
						const isExpired = check.status === "pending" && daysUntilDue !== null && daysUntilDue < 0;

						return (
							<motion.div
								key={check.id}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.03 }}
								className={cn(
									"bg-[var(--card)] p-4 rounded-xl border shadow-sm space-y-3",
									isExpired ? "border-red-500/30" :
										isExpiringSoon ? "border-red-500/20" :
											"border-[var(--border)]"
								)}
							>
								{/* Header */}
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<CreditCard className="h-4 w-4 text-stone-400" />
										<span className="font-mono font-bold text-sm text-[var(--card-foreground)]">
											#{check.number}
										</span>
									</div>
									<span className={cn(
										"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border",
										getStatusStyle(check.status)
									)}>
										{getStatusLabel(check.status)}
									</span>
								</div>

								{/* Details */}
								<div className="space-y-1.5">
									<div className="flex items-center gap-2 text-xs text-stone-500">
										<Building2 className="h-3.5 w-3.5 shrink-0" />
										<span>{check.bank}</span>
									</div>
									<div className="flex items-center gap-2 text-xs text-stone-500">
										<User className="h-3.5 w-3.5 shrink-0" />
										<span>{check.drawerName}</span>
									</div>
									<div className="flex items-center gap-2 text-xs text-stone-500">
										<Calendar className="h-3.5 w-3.5 shrink-0" />
										<span className={cn(isExpiringSoon && "text-red-500 font-semibold")}>
											{formatDate(check.dueDate || 0)}
											{(check.status === "pending" || check.status === "deposited") && daysUntilDue !== null && (
												<span className="ml-1">
													({isExpired
														? `Vencido hace ${Math.abs(daysUntilDue)}d`
														: daysUntilDue === 0
															? "Hoy"
															: `en ${daysUntilDue}d`
													})
												</span>
											)}
										</span>
									</div>
								</div>

								{/* Alert badge if expiring */}
								{isExpiringSoon && (
									<div className={cn(
										"flex items-center gap-2 p-2 rounded-lg text-xs font-semibold",
										isExpired ? "bg-red-500/15 text-red-500" : "bg-red-500/10 text-red-400"
									)}>
										<AlertTriangle className="h-3.5 w-3.5" />
										{isExpired ? "¡Cheque vencido!" : "¡Próximo a vencer!"}
									</div>
								)}

								{/* Footer */}
								<div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
									<p className="text-xs text-stone-500">{check.customerName}</p>
									<p className="font-bold text-sm text-emerald-500">{formatCurrency(check.amount)}</p>
								</div>

								{/* Actions */}
								{(check.status === "pending" || check.status === "deposited") && (
									<div className="flex justify-end gap-2 pt-1">
										{canTransitionTo(check.status, "deposited") && (
											<button
												onClick={() => requestStatusChange(check.id, check.number, "deposited")}
												disabled={updatingId === check.id}
												className="flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-medium hover:bg-blue-500/20 transition-colors disabled:opacity-50"
											>
												<Banknote className="h-3 w-3" /> Depositar
											</button>
										)}
										{canTransitionTo(check.status, "honored") && (
											<button
												onClick={() => requestStatusChange(check.id, check.number, "honored")}
												disabled={updatingId === check.id}
												className="flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
											>
												<CheckCircle2 className="h-3 w-3" /> Cobrar
											</button>
										)}
										{canTransitionTo(check.status, "rejected") && (
											<button
												onClick={() => requestStatusChange(check.id, check.number, "rejected")}
												disabled={updatingId === check.id}
												className="flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
											>
												<XCircle className="h-3 w-3" /> Rechazar
											</button>
										)}
									</div>
								)}
							</motion.div>
						);
					})}
				</div>

				{filteredChecks.length === 0 && (
					<div className="text-center py-12">
						<CreditCard className="h-12 w-12 text-stone-300 mx-auto mb-4" />
						<p className="text-stone-500">
							No se encontraron cheques con los filtros aplicados
						</p>
					</div>
				)}
			</div>

			{/* Confirmation Modal */}
			<AnimatePresence>
				{confirmAction && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
						onClick={() => setConfirmAction(null)}
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							onClick={(e) => e.stopPropagation()}
							className="bg-[var(--card)] text-[var(--card-foreground)] rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
						>
							<div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
								<h3 className="font-bold text-lg">Confirmar acción</h3>
								<button
									onClick={() => setConfirmAction(null)}
									className="p-1 hover:bg-[var(--secondary-card)] rounded-full transition-colors"
								>
									<X className="h-5 w-5 text-stone-500" />
								</button>
							</div>

							<div className="p-6 space-y-4">
								<p className="text-sm text-stone-500">
									¿Estás seguro que querés marcar el cheque <span className="font-bold text-[var(--card-foreground)]">#{confirmAction.checkNumber}</span> como <span className="font-bold text-[var(--card-foreground)]">{getStatusLabel(confirmAction.newStatus)}</span>?
								</p>

								<div className="flex gap-3 pt-2">
									<button
										onClick={() => setConfirmAction(null)}
										className="flex-1 rounded-xl py-2.5 text-sm font-bold text-stone-500 hover:bg-[var(--secondary-card)] transition-colors"
									>
										Cancelar
									</button>
									<button
										onClick={confirmStatusChange}
										className={cn(
											"flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-colors",
											getConfirmActionStyle(confirmAction.newStatus)
										)}
									>
										{confirmAction.label}
									</button>
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
