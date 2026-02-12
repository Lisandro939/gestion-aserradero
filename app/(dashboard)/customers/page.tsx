"use client";

import { useState, useEffect } from "react";
import {
	UserPlus,
	Search,
	Filter,
	Edit,
	Trash2,
	Eye,
	Phone,
	Mail,
	MapPin,
	X,
	Loader2,
	Check,
	AlertCircle,
	RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Tipos de datos
interface Customer {
	id: number;
	name: string;
	email: string;
	phone: string;
	address: string;
	cuit: string;
	currentBalance: number;
	creditLimit: number;
	status: "active" | "inactive"; // English status values
	deletedAt?: Date | number | null;
	registrationDate: Date | number;
	lastPurchase: Date | number | null;
}

interface Transaction {
	id: number;
	type: "purchase" | "payment";
	date: Date | number;
	concept: string;
	amount: number;
	balance: number;
}

export default function CustomersPage() {
	const [mounted, setMounted] = useState(false);
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
	const [showModal, setShowModal] = useState<"view" | "edit" | "add" | "delete" | "restore" | null>(null);
	const [filterStatus, setFilterStatus] = useState<
		"all" | "active" | "inactive"
	>("active");
	const [transactions, setTransactions] = useState<Transaction[]>([]);

	// Form state
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone: "",
		address: "",
		cuit: "",
	});
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	// Auto-dismiss alerts
	useEffect(() => {
		if (error || success) {
			const timer = setTimeout(() => {
				setError(null);
				setSuccess(null);
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [error, success]);

	// Mount component
	useEffect(() => {
		setMounted(true);
	}, []);

	// Load customers only when mounted
	useEffect(() => {
		if (!mounted) return;
		fetchCustomers();
	}, [mounted]);

	const fetchCustomers = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/customers");
			if (response.ok) {
				const data = await response.json();
				// Map API to Interface (if needed, or direct assignment if matches)
				// Assuming API returns English keys now or matches exactly
				// API keys: id, name, email, phone, address, cuit, registrationDate, lastPurchase
				// + currentBalance, creditLimit, status (if I fix API, else undefined)
				const mapped: Customer[] = data.map((c: any) => ({
					id: c.id,
					name: c.name,
					email: c.email,
					phone: c.phone,
					address: c.address,
					cuit: c.cuit,
					currentBalance: c.currentBalance || 0,
					creditLimit: c.creditLimit || 0,
					status: c.status,
					deletedAt: c.deletedAt,
					registrationDate: c.registrationDate,
					lastPurchase: c.lastPurchase
				}));
				setCustomers(mapped);
			}
		} catch (error) {
			console.error("Error loading customers:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchTransactions = async (customerId: number) => {
		try {
			// Endpoint might need update too if I renamed it, but let's assume it keeps structure
			// Assuming the return is also in English or I map it
			const response = await fetch(`/api/customers/${customerId}/transactions`);
			if (response.ok) {
				const data = await response.json();
				setTransactions(data);
			}
		} catch (error) {
			console.error("Error loading transactions:", error);
		}
	};

	const handleViewCustomer = (customer: Customer) => {
		setSelectedCustomer(customer);
		setShowModal("view");
		fetchTransactions(customer.id);
	};

	// Delete Customer Logic
	const [customerToDelete, setCustomerToDelete] = useState<number | null>(null);

	const handleDeleteClick = (id: number) => {
		setCustomerToDelete(id);
		setShowModal("delete"); // I need to add 'delete' to showModal type
	};

	const confirmDeleteCustomer = async () => {
		if (!customerToDelete) return;

		try {
			const response = await fetch(`/api/customers?id=${customerToDelete}`, {
				method: "DELETE",
			});

			if (response.ok) {
				await fetchCustomers();
				setShowModal(null);
				setCustomerToDelete(null);
				setSuccess("Cliente eliminado correctamente");
			} else {
				setError("Error al eliminar el cliente");
			}
		} catch (error) {
			console.error("Error deleting customer:", error);
			setError("Error de conexión al eliminar el cliente");
		}
	};

	// Restore Customer Logic
	const [customerToRestore, setCustomerToRestore] = useState<number | null>(null);

	const handleRestoreClick = (id: number) => {
		setCustomerToRestore(id);
		setShowModal("restore");
	};

	const confirmRestoreCustomer = async () => {
		if (!customerToRestore) return;

		try {
			const response = await fetch("/api/customers", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					id: customerToRestore,
					action: "restore",
				}),
			});

			if (response.ok) {
				await fetchCustomers();
				setShowModal(null);
				setCustomerToRestore(null);
				setSuccess("Cliente restaurado correctamente");
			} else {
				setError("Error al restaurar el cliente");
			}
		} catch (error) {
			console.error("Error restoring customer:", error);
			setError("Error de conexión al restaurar el cliente");
		}
	};

	const formatCUIT = (value: string) => {
		// Eliminar todo lo que no sea número
		const numbers = value.replace(/\D/g, "");

		// Limitar a 11 dígitos
		const limited = numbers.slice(0, 11);

		// Formatear: XX-XXXXXXXX-X
		let formatted = limited;
		if (limited.length > 2) {
			formatted = `${limited.slice(0, 2)}-${limited.slice(2)}`;
		}
		if (limited.length > 10) {
			formatted = `${formatted.slice(0, 11)}-${formatted.slice(11)}`;
		}

		return formatted;
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;

		if (name === "cuit") {
			const formatted = formatCUIT(value);
			setFormData((prev) => ({ ...prev, [name]: formatted }));
			return;
		}

		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (submitting) return;

		setSubmitting(true);
		try {
			let response;

			if (showModal === "edit" && selectedCustomer) {
				// Update
				response = await fetch("/api/customers", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						id: selectedCustomer.id,
						name: formData.name,
						email: formData.email,
						phone: formData.phone,
						address: formData.address,
						cuit: formData.cuit,
					}),
				});
			} else {
				// Create
				response = await fetch("/api/customers", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: formData.name,
						email: formData.email,
						phone: formData.phone,
						address: formData.address,
						cuit: formData.cuit,
					}),
				});
			}

			if (response.ok) {
				setShowModal(null);
				setFormData({ name: "", email: "", phone: "", address: "", cuit: "" });
				setSelectedCustomer(null);
				fetchCustomers();
				setSuccess("Cliente guardado correctamente");
			} else {
				const err = await response.json();
				setError(err.error || "Error al guardar el cliente");
			}
		} catch (error) {
			console.error("Error saving customer:", error);
			setError("Error de conexión al guardar el cliente");
		} finally {
			setSubmitting(false);
		}
	};

	// Populate form for edit
	useEffect(() => {
		if (showModal === "edit" && selectedCustomer) {
			setFormData({
				name: selectedCustomer.name,
				email: selectedCustomer.email,
				phone: selectedCustomer.phone,
				address: selectedCustomer.address,
				cuit: selectedCustomer.cuit,
			});
		} else if (showModal === "add") {
			setFormData({ name: "", email: "", phone: "", address: "", cuit: "" });
		}
	}, [showModal, selectedCustomer]);

	// Filter logic
	const filteredCustomers = customers.filter((customer) => {
		const matchSearch =
			customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
			customer.cuit.includes(searchTerm);
		const matchStatus = filterStatus === "all" || customer.status === filterStatus;
		return matchSearch && matchStatus;
	});

	const formatDate = (date: Date | number | string | null) => {
		if (!date) return "N/A";
		// Si es number, asumimos que es milliseconds (porque el API envía getTime())
		// Si es string (ISO), new Date lo maneja
		// Si es Date, new Date lo copia
		return new Date(date).toLocaleDateString("es-AR");
	};

	// Don't render until mounted
	if (!mounted) {
		return null;
	}

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
						Gestión de Clientes
					</h1>
					<p className="text-xs md:text-sm text-stone-500">
						Administra tu base de clientes y cuentas corrientes
					</p>
				</div>
				<button
					onClick={() => setShowModal("add")}
					className="cursor-pointer flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 md:px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-amber-700 active:scale-95 shadow-lg shadow-amber-600/20 w-full md:w-auto"
				>
					<UserPlus className="h-4 w-4" />
					Nuevo cliente
				</button>
			</div>

			{/* Search and Filters */}
			<div className="bg-[var(--card)] rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">
				<div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
					<div className="relative flex-1 md:max-w-md">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
						<input
							type="text"
							placeholder="Buscar por nombre, email o CUIT..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full rounded-xl border border-stone-200 bg-[var(--card)] py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
						/>
					</div>

					<div className="flex items-center gap-2">
						<Filter className="h-4 w-4 text-stone-400" />
						<select
							value={filterStatus}
							onChange={(e) => setFilterStatus(e.target.value as any)}
							className="flex-1 md:flex-none rounded-xl border border-stone-200 bg-[var(--card)] px-3 md:px-4 py-2 text-sm outline-none"
						>
							<option value="all">Todos los estados</option>
							<option value="active">Activos</option>
							<option value="inactive">Eliminados</option>
						</select>
					</div>
				</div>
			</div>

			{/* Clientes Table */}
			<div className="bg-[var(--card)] rounded-2xl md:rounded-3xl p-3 md:p-6 shadow-sm border border-stone-200 dark:border-stone-800/50 overflow-hidden">
				<div className="overflow-x-auto -mx-3 md:mx-0">
					<table className="w-full min-w-[640px]">
						<thead>
							<tr className="border-b border-stone-100 dark:border-stone-800">
								<th className="pb-4 text-left text-xs font-bold text-stone-400 uppercase">
									Cliente
								</th>
								<th className="pb-4 text-left text-xs font-bold text-stone-400 uppercase">
									Contacto
								</th>
								<th className="pb-4 text-left text-xs font-bold text-stone-400 uppercase">
									CUIT
								</th>
								<th className="pb-4 text-center text-xs font-bold text-stone-400 uppercase">
									Acciones
								</th>
							</tr>
						</thead>
						<tbody>
							{filteredCustomers.map((customer, index) => (
								<motion.tr
									key={customer.id}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05 }}
									className="border-b border-stone-50 hover:bg-white dark:border-stone-900 dark:hover:bg-stone-900/50 transition-colors"
								>
									<td className="py-4">
										<div className="flex items-center gap-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 font-bold text-sm dark:bg-amber-900/30">
												{customer.name.charAt(0)}
											</div>
											<div>
												<p className="text-sm font-bold text-[var(--card-foreground)]">
													{customer.name}
												</p>
												<p className="text-xs text-stone-500">
													Cliente desde {formatDate(customer.registrationDate)}
												</p>
											</div>
										</div>
									</td>
									<td className="py-4">
										<div className="flex flex-col gap-1">
											<div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
												<Mail className="h-3 w-3" />
												{customer.email}
											</div>
											<div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
												<Phone className="h-3 w-3" />
												{customer.phone}
											</div>
										</div>
									</td>
									<td className="py-4">
										<span className="text-sm font-mono text-stone-600 dark:text-stone-400">
											{customer.cuit}
										</span>
									</td>
									<td className="py-4">
										<div className="flex items-center justify-center gap-2">
											<button
												onClick={() => handleViewCustomer(customer)}
												className="cursor-pointer p-2 rounded-lg text-stone-400 hover:bg-blue-100 hover:text-blue-600 transition-all dark:hover:bg-blue-900/30"
												title="Ver detalles"
											>
												<Eye className="h-4 w-4" />
											</button>
											<button
												onClick={() => {
													setSelectedCustomer(customer);
													setShowModal("edit");
												}}
												className="cursor-pointer p-2 rounded-lg text-stone-400 hover:bg-amber-100 hover:text-amber-600 transition-all dark:hover:bg-amber-900/30"
												title="Editar"
											>
												<Edit className="h-4 w-4" />
											</button>
											{customer.status === "inactive" ? (
												<button
													onClick={() => handleRestoreClick(customer.id)}
													className="cursor-pointer p-2 rounded-lg text-stone-400 hover:bg-emerald-100 hover:text-emerald-600 transition-all dark:hover:bg-emerald-900/30"
													title="Restaurar"
												>
													<RotateCcw className="h-4 w-4" />
												</button>
											) : (
												<button
													onClick={() => handleDeleteClick(customer.id)}
													className="cursor-pointer p-2 rounded-lg text-stone-400 hover:bg-red-100 hover:text-red-600 transition-all dark:hover:bg-red-900/30"
													title="Eliminar"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											)}
										</div>
									</td>
								</motion.tr>
							))}
						</tbody>
					</table>
				</div>

				{filteredCustomers.length === 0 && (
					<div className="text-center py-12">
						<Search className="h-12 w-12 text-stone-300 dark:text-stone-700 mx-auto mb-4" />
						<p className="text-stone-500">
							No se encontraron clientes con los filtros aplicados
						</p>
					</div>
				)}
			</div>

			{/* Modal de Detalles */}
			<AnimatePresence>
				{showModal === "view" && selectedCustomer && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
						onClick={() => setShowModal(null)}
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							onClick={(e) => e.stopPropagation()}
							className="bg-[var(--card)] rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
						>
							<div className="flex items-center justify-between p-6 border-b border-stone-200 dark:border-stone-800">
								<div className="flex items-center gap-4">
									<div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 font-bold text-xl dark:bg-amber-900/30">
										{selectedCustomer.name.charAt(0)}
									</div>
									<div>
										<h2 className="text-xl font-bold text-[var(--card-foreground)]">
											{selectedCustomer.name}
										</h2>
										<p className="text-sm text-stone-500">CUIT: {selectedCustomer.cuit}</p>
									</div>
								</div>
								<button
									onClick={() => setShowModal(null)}
									className="p-2 rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors"
								>
									<X className="h-5 w-5" />
								</button>
							</div>

							<div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
								<div className="space-y-4">
									<div>
										<h3 className="text-sm font-bold text-stone-400 uppercase mb-2">
											Información de Contacto
										</h3>
										<div className="space-y-2">
											<div className="flex items-center gap-2">
												<Mail className="h-4 w-4 text-stone-400" />
												<span className="text-sm">{selectedCustomer.email}</span>
											</div>
											<div className="flex items-center gap-2">
												<Phone className="h-4 w-4 text-stone-400" />
												<span className="text-sm">{selectedCustomer.phone}</span>
											</div>
											<div className="flex items-center gap-2">
												<MapPin className="h-4 w-4 text-stone-400" />
												<span className="text-sm">{selectedCustomer.address}</span>
											</div>
										</div>
									</div>
									{transactions.length > 0 && (
										<div className="pt-4 border-t border-stone-200 dark:border-stone-800">
											<h3 className="text-sm font-bold text-stone-400 uppercase mb-4">
												Historial de Movimientos
											</h3>
											<div className="space-y-3">
												{transactions.map((t) => (
													<div
														key={t.id}
														className="flex items-center justify-between p-4 rounded-2xl border border-stone-100 bg-white/50 dark:border-stone-800 dark:bg-stone-900/50"
													>
														<div>
															<p className="text-sm font-bold">{t.concept}</p>
															<p className="text-xs text-stone-500">
																{formatDate(t.date)}
															</p>
														</div>
														<div className="text-right">
															<p
																className={cn(
																	"text-lg font-bold",
																	t.type === "payment" ? "text-emerald-600" : "text-red-600"
																)}
															>
																{t.type === "payment" ? "+" : ""}$
																{Math.abs(t.amount).toLocaleString()}
															</p>
															<p className="text-xs text-stone-500">
																Saldo: ${t.balance.toLocaleString()}
															</p>
														</div>
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}

				{/* Modal Agregar Cliente */}
				{showModal === "add" && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
						onClick={() => setShowModal(null)}
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							onClick={(e) => e.stopPropagation()}
							className="bg-[var(--card)] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
						>
							<div className="flex items-center justify-between p-6 border-b border-stone-200 dark:border-stone-800">
								<h2 className="text-xl font-bold text-[var(--card-foreground)]">
									Nuevo cliente
								</h2>
								<button
									onClick={() => setShowModal(null)}
									className="cursor-pointer p-2 rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors"
								>
									<X className="h-5 w-5" />
								</button>
							</div>

							<div className="p-6">
								<form onSubmit={handleSubmit} className="space-y-4">
									<div>
										<label className="block text-xs font-bold text-stone-400 uppercase mb-2">Nombre Completo</label>
										<input
											type="text"
											name="name"
											value={formData.name}
											onChange={handleInputChange}
											className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
											required
										/>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="block text-xs font-bold text-stone-400 uppercase mb-2">Email</label>
											<input
												type="email"
												name="email"
												value={formData.email}
												onChange={handleInputChange}
												className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
												required
											/>
										</div>
										<div>
											<label className="block text-xs font-bold text-stone-400 uppercase mb-2">Teléfono</label>
											<input
												type="text"
												name="phone"
												value={formData.phone}
												onChange={handleInputChange}
												className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
												required
											/>
										</div>
									</div>
									<div>
										<label className="block text-xs font-bold text-stone-400 uppercase mb-2">Dirección</label>
										<input
											type="text"
											name="address"
											value={formData.address}
											onChange={handleInputChange}
											className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
											required
										/>
									</div>
									<div>
										<label className="block text-xs font-bold text-stone-400 uppercase mb-2">CUIT</label>
										<input
											type="text"
											name="cuit"
											value={formData.cuit}
											onChange={handleInputChange}
											className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
											required
										/>
									</div>

									<div className="flex gap-3 pt-4">
										<button
											type="button"
											onClick={() => setShowModal(null)}
											className="cursor-pointer flex-1 rounded-xl py-3 text-sm font-bold text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
										>
											Cancelar
										</button>
										<button
											type="submit"
											disabled={submitting}
											className="cursor-pointer flex-1 rounded-xl bg-amber-600 py-3 text-sm font-bold text-white shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-colors disabled:opacity-50"
										>
											{submitting ? "Guardando..." : "Guardar cliente"}
										</button>
									</div>
								</form>
							</div>
						</motion.div>
					</motion.div>
				)}
				{/* Modal Editar Cliente */}
				{showModal === "edit" && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
						onClick={() => setShowModal(null)}
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							onClick={(e) => e.stopPropagation()}
							className="bg-[var(--card)] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
						>
							<div className="flex items-center justify-between p-6 border-b border-stone-200 dark:border-stone-800">
								<h2 className="text-xl font-bold text-[var(--card-foreground)]">
									Editar Cliente
								</h2>
								<button
									onClick={() => setShowModal(null)}
									className="p-2 rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors"
								>
									<X className="h-5 w-5" />
								</button>
							</div>

							<div className="p-6">
								<form onSubmit={handleSubmit} className="space-y-4">
									<div>
										<label className="block text-xs font-bold text-stone-400 uppercase mb-2">Nombre Completo</label>
										<input
											type="text"
											name="name"
											value={formData.name}
											onChange={handleInputChange}
											className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
											required
										/>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="block text-xs font-bold text-stone-400 uppercase mb-2">Email</label>
											<input
												type="email"
												name="email"
												value={formData.email}
												onChange={handleInputChange}
												className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
												required
											/>
										</div>
										<div>
											<label className="block text-xs font-bold text-stone-400 uppercase mb-2">Teléfono</label>
											<input
												type="text"
												name="phone"
												value={formData.phone}
												onChange={handleInputChange}
												className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
												required
											/>
										</div>
									</div>
									<div>
										<label className="block text-xs font-bold text-stone-400 uppercase mb-2">Dirección</label>
										<input
											type="text"
											name="address"
											value={formData.address}
											onChange={handleInputChange}
											className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
											required
										/>
									</div>
									<div>
										<label className="block text-xs font-bold text-stone-400 uppercase mb-2">CUIT</label>
										<input
											type="text"
											name="cuit"
											value={formData.cuit}
											onChange={handleInputChange}
											className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
											required
										/>
									</div>

									<div className="flex gap-3 pt-4">
										<button
											type="button"
											onClick={() => setShowModal(null)}
											className="cursor-pointer flex-1 rounded-xl py-3 text-sm font-bold text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
										>
											Cancelar
										</button>
										<button
											type="submit"
											disabled={submitting}
											className="cursor-pointer flex-1 rounded-xl bg-amber-600 py-3 text-sm font-bold text-white shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-colors disabled:opacity-50"
										>
											{submitting ? "Guardando..." : "Actualizar"}
										</button>
									</div>
								</form>
							</div>
						</motion.div>
					</motion.div>
				)}

				{/* Delete Modal */}
				{showModal === "delete" && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
						onClick={() => setShowModal(null)}
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							onClick={(e) => e.stopPropagation()}
							className="bg-[var(--card)] rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col"
						>
							<div className="p-6 text-center">
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30">
									<Trash2 className="h-8 w-8" />
								</div>
								<h2 className="mb-2 text-lg font-bold text-[var(--card-foreground)]">
									¿Eliminar cliente?
								</h2>
								<p className="text-sm text-stone-500 dark:text-stone-400">
									El cliente será marcado como inactivo. No se perderá su historial.
								</p>
							</div>
							<div className="flex border-t border-stone-100 bg-stone-50 p-4 gap-3 dark:border-stone-800 dark:bg-stone-900/50">
								<button
									onClick={() => setShowModal(null)}
									className="flex-1 cursor-pointer rounded-xl bg-white border border-stone-200 py-3 text-sm font-bold text-stone-600 hover:bg-stone-50 transition-colors dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-700"
								>
									Cancelar
								</button>
								<button
									onClick={confirmDeleteCustomer}
									className="flex-1 cursor-pointer rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors"
								>
									Eliminar
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}

				{/* Restore Modal */}
				{showModal === "restore" && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
						onClick={() => setShowModal(null)}
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							onClick={(e) => e.stopPropagation()}
							className="bg-[var(--card)] rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col"
						>
							<div className="p-6 text-center">
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
									<RotateCcw className="h-8 w-8" />
								</div>
								<h2 className="mb-2 text-lg font-bold text-[var(--card-foreground)]">
									¿Restaurar cliente?
								</h2>
								<p className="text-sm text-stone-500 dark:text-stone-400">
									El cliente volverá a estar activo y visible en la lista principal.
								</p>
							</div>
							<div className="flex border-t border-stone-100 bg-stone-50 p-4 gap-3 dark:border-stone-800 dark:bg-stone-900/50">
								<button
									onClick={() => setShowModal(null)}
									className="flex-1 cursor-pointer rounded-xl bg-white border border-stone-200 py-3 text-sm font-bold text-stone-600 hover:bg-stone-50 transition-colors dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-700"
								>
									Cancelar
								</button>
								<button
									onClick={confirmRestoreCustomer}
									className="flex-1 cursor-pointer rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
								>
									Restaurar
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}

			</AnimatePresence>

			{/* Custom Toast Notifications */}
			<AnimatePresence>
				{(error || success) && (
					<motion.div
						initial={{ opacity: 0, y: 50, x: "-50%" }}
						animate={{ opacity: 1, y: 0, x: "-50%" }}
						exit={{ opacity: 0, y: 20, x: "-50%" }}
						className="fixed bottom-8 left-1/2 z-[100] flex items-center gap-3 rounded-xl px-4 py-3 shadow-2xl"
					>
						{error ? (
							<div className="flex items-center gap-3 bg-red-600 text-white px-4 py-3 rounded-xl shadow-lg shadow-red-600/20">
								<AlertCircle className="h-5 w-5" />
								<span className="text-sm font-bold">{error}</span>
								<button onClick={() => setError(null)} className="ml-2 opacity-80 hover:opacity-100">
									<X className="h-4 w-4" />
								</button>
							</div>
						) : (
							<div className="flex items-center gap-3 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg shadow-emerald-600/20">
								<Check className="h-5 w-5" />
								<span className="text-sm font-bold">{success}</span>
								<button onClick={() => setSuccess(null)} className="ml-2 opacity-80 hover:opacity-100">
									<X className="h-4 w-4" />
								</button>
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
