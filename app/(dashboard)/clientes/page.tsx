"use client";

import { useState, useEffect } from "react";
import {
	UserPlus,
	Search,
	Filter,
	Edit,
	Trash2,
	Eye,
	DollarSign,
	TrendingUp,
	TrendingDown,
	Phone,
	Mail,
	MapPin,
	X,
	Check,
	AlertCircle,
	Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Tipos de datos
interface Cliente {
	id: number;
	nombre: string;
	email: string;
	telefono: string;
	direccion: string;
	cuit: string;
	saldoActual: number;
	limiteCredito: number;
	estado: "activo" | "inactivo" | "moroso";
	fechaAlta: Date | number;
	ultimaCompra: Date | number | null;
}

interface Transaccion {
	id: number;
	tipo: "compra" | "pago";
	fecha: Date | number;
	concepto: string;
	monto: number;
	saldo: number;
}

export default function ClientesPage() {
	const [mounted, setMounted] = useState(false);
	const [clientes, setClientes] = useState<Cliente[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
	const [showModal, setShowModal] = useState<"view" | "edit" | "add" | null>(null);
	const [filterEstado, setFilterEstado] = useState<
		"todos" | "activo" | "inactivo" | "moroso"
	>("todos");
	const [transacciones, setTransacciones] = useState<Transaccion[]>([]);

	// Mount component
	useEffect(() => {
		setMounted(true);
	}, []);

	// Cargar clientes solo cuando esté montado
	useEffect(() => {
		if (!mounted) return;
		fetchClientes();
	}, [mounted]);

	const fetchClientes = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/clientes");
			if (response.ok) {
				const data = await response.json();
				setClientes(data);
			}
		} catch (error) {
			console.error("Error al cargar clientes:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchTransacciones = async (clienteId: number) => {
		try {
			const response = await fetch(`/api/clientes/${clienteId}/transacciones`);
			if (response.ok) {
				const data = await response.json();
				setTransacciones(data);
			}
		} catch (error) {
			console.error("Error al cargar transacciones:", error);
		}
	};

	const handleViewCliente = (cliente: Cliente) => {
		setSelectedCliente(cliente);
		setShowModal("view");
		fetchTransacciones(cliente.id);
	};

	const handleDeleteCliente = async (id: number) => {
		if (!confirm("¿Estás seguro de eliminar este cliente?")) return;

		try {
			const response = await fetch(`/api/clientes/${id}`, {
				method: "DELETE",
			});

			if (response.ok) {
				await fetchClientes();
			}
		} catch (error) {
			console.error("Error al eliminar cliente:", error);
		}
	};

	// Filtrar clientes
	const clientesFiltrados = clientes.filter((cliente) => {
		const matchSearch =
			cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
			cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
			cliente.cuit.includes(searchTerm);
		const matchEstado = filterEstado === "todos" || cliente.estado === filterEstado;
		return matchSearch && matchEstado;
	});

	// Calcular estadísticas
	const stats = {
		totalClientes: clientes.length,
		clientesActivos: clientes.filter((c) => c.estado === "activo").length,
		saldoTotal: clientes.reduce((acc, c) => acc + c.saldoActual, 0),
		clientesMorosos: clientes.filter((c) => c.estado === "moroso").length,
	};

	const getEstadoBadge = (estado: Cliente["estado"]) => {
		const styles = {
			activo: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
			inactivo: "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
			moroso: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
		};
		return styles[estado];
	};

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
					className="flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 md:px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-amber-700 active:scale-95 shadow-lg shadow-amber-600/20 w-full md:w-auto"
				>
					<UserPlus className="h-4 w-4" />
					Nuevo Cliente
				</button>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-[var(--card)] rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-stone-200 dark:border-stone-800/50"
				>
					<div className="flex items-center justify-between mb-3 md:mb-4">
						<div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
							<UserPlus className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
						</div>
						<TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-emerald-500" />
					</div>
					<h3 className="text-xs md:text-sm font-medium text-stone-500 dark:text-stone-400">
						Total Clientes
					</h3>
					<p className="text-xl md:text-2xl font-bold text-[var(--card-foreground)] mt-1">
						{stats.totalClientes}
					</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800/50"
				>
					<div className="flex items-center justify-between mb-4">
						<div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
							<Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
						</div>
					</div>
					<h3 className="text-sm font-medium text-stone-500 dark:text-stone-400">
						Clientes Activos
					</h3>
					<p className="text-2xl font-bold text-[var(--card-foreground)] mt-1">
						{stats.clientesActivos}
					</p>
					<p className="text-xs text-stone-400 mt-1">
						{stats.totalClientes > 0
							? ((stats.clientesActivos / stats.totalClientes) * 100).toFixed(0)
							: 0}
						% del total
					</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800/50"
				>
					<div className="flex items-center justify-between mb-4">
						<div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
							<DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
						</div>
						{stats.saldoTotal < 0 ? (
							<TrendingDown className="h-4 w-4 text-red-500" />
						) : (
							<TrendingUp className="h-4 w-4 text-emerald-500" />
						)}
					</div>
					<h3 className="text-sm font-medium text-stone-500 dark:text-stone-400">
						Saldo Total
					</h3>
					<p
						className={cn(
							"text-2xl font-bold mt-1",
							stats.saldoTotal < 0 ? "text-red-600" : "text-emerald-600"
						)}
					>
						${Math.abs(stats.saldoTotal).toLocaleString()}
					</p>
					<p className="text-xs text-stone-400 mt-1">
						{stats.saldoTotal < 0 ? "A cobrar" : "A favor"}
					</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
					className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800/50"
				>
					<div className="flex items-center justify-between mb-4">
						<div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
							<AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
						</div>
					</div>
					<h3 className="text-sm font-medium text-stone-500 dark:text-stone-400">
						Clientes Morosos
					</h3>
					<p className="text-2xl font-bold text-red-600 mt-1">
						{stats.clientesMorosos}
					</p>
					<p className="text-xs text-stone-400 mt-1">Requieren atención</p>
				</motion.div>
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
							value={filterEstado}
							onChange={(e) => setFilterEstado(e.target.value as any)}
							className="flex-1 md:flex-none rounded-xl border border-stone-200 bg-[var(--card)] px-3 md:px-4 py-2 text-sm outline-none"
						>
							<option value="todos">Todos los estados</option>
							<option value="activo">Activos</option>
							<option value="inactivo">Inactivos</option>
							<option value="moroso">Morosos</option>
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
								<th className="pb-4 text-right text-xs font-bold text-stone-400 uppercase">
									Saldo Actual
								</th>
								<th className="pb-4 text-right text-xs font-bold text-stone-400 uppercase">
									Límite
								</th>
								<th className="pb-4 text-center text-xs font-bold text-stone-400 uppercase">
									Estado
								</th>
								<th className="pb-4 text-center text-xs font-bold text-stone-400 uppercase">
									Acciones
								</th>
							</tr>
						</thead>
						<tbody>
							{clientesFiltrados.map((cliente, index) => (
								<motion.tr
									key={cliente.id}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05 }}
									className="border-b border-stone-50 hover:bg-white dark:border-stone-900 dark:hover:bg-stone-900/50 transition-colors"
								>
									<td className="py-4">
										<div className="flex items-center gap-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 font-bold text-sm dark:bg-amber-900/30">
												{cliente.nombre.charAt(0)}
											</div>
											<div>
												<p className="text-sm font-bold text-[var(--card-foreground)]">
													{cliente.nombre}
												</p>
												<p className="text-xs text-stone-500">
													Cliente desde {formatDate(cliente.fechaAlta)}
												</p>
											</div>
										</div>
									</td>
									<td className="py-4">
										<div className="flex flex-col gap-1">
											<div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
												<Mail className="h-3 w-3" />
												{cliente.email}
											</div>
											<div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400">
												<Phone className="h-3 w-3" />
												{cliente.telefono}
											</div>
										</div>
									</td>
									<td className="py-4">
										<span className="text-sm font-mono text-stone-600 dark:text-stone-400">
											{cliente.cuit}
										</span>
									</td>
									<td className="py-4 text-right">
										<span
											className={cn(
												"text-sm font-bold",
												cliente.saldoActual < 0 ? "text-red-600" : "text-emerald-600"
											)}
										>
											${Math.abs(cliente.saldoActual).toLocaleString()}
										</span>
										<p className="text-xs text-stone-400">
											{cliente.saldoActual < 0 ? "Debe" : "A favor"}
										</p>
									</td>
									<td className="py-4 text-right">
										<span className="text-sm font-bold text-stone-600 dark:text-stone-400">
											${cliente.limiteCredito.toLocaleString()}
										</span>
										<div className="mt-1 h-1.5 w-20 ml-auto rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
											<div
												className={cn(
													"h-full rounded-full",
													Math.abs(cliente.saldoActual) / cliente.limiteCredito > 0.8
														? "bg-red-500"
														: "bg-amber-500"
												)}
												style={{
													width: `${Math.min((Math.abs(cliente.saldoActual) / cliente.limiteCredito) * 100, 100)}%`,
												}}
											/>
										</div>
									</td>
									<td className="py-4 text-center">
										<span
											className={cn(
												"inline-block px-3 py-1 rounded-full text-xs font-bold",
												getEstadoBadge(cliente.estado)
											)}
										>
											{cliente.estado.charAt(0).toUpperCase() + cliente.estado.slice(1)}
										</span>
									</td>
									<td className="py-4">
										<div className="flex items-center justify-center gap-2">
											<button
												onClick={() => handleViewCliente(cliente)}
												className="p-2 rounded-lg text-stone-400 hover:bg-blue-100 hover:text-blue-600 transition-all dark:hover:bg-blue-900/30"
												title="Ver detalles"
											>
												<Eye className="h-4 w-4" />
											</button>
											<button
												onClick={() => {
													setSelectedCliente(cliente);
													setShowModal("edit");
												}}
												className="p-2 rounded-lg text-stone-400 hover:bg-amber-100 hover:text-amber-600 transition-all dark:hover:bg-amber-900/30"
												title="Editar"
											>
												<Edit className="h-4 w-4" />
											</button>
											<button
												onClick={() => handleDeleteCliente(cliente.id)}
												className="p-2 rounded-lg text-stone-400 hover:bg-red-100 hover:text-red-600 transition-all dark:hover:bg-red-900/30"
												title="Eliminar"
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</div>
									</td>
								</motion.tr>
							))}
						</tbody>
					</table>
				</div>

				{clientesFiltrados.length === 0 && (
					<div className="text-center py-12">
						<Search className="h-12 w-12 text-stone-300 dark:text-stone-700 mx-auto mb-4" />
						<p className="text-stone-500">
							No se encontraron clientes con los filtros aplicados
						</p>
					</div>
				)}
			</div>

			{/* Modal de Detalles - Simplificado por ahora */}
			<AnimatePresence>
				{showModal === "view" && selectedCliente && (
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
										{selectedCliente.nombre.charAt(0)}
									</div>
									<div>
										<h2 className="text-xl font-bold text-[var(--card-foreground)]">
											{selectedCliente.nombre}
										</h2>
										<p className="text-sm text-stone-500">CUIT: {selectedCliente.cuit}</p>
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
												<span className="text-sm">{selectedCliente.email}</span>
											</div>
											<div className="flex items-center gap-2">
												<Phone className="h-4 w-4 text-stone-400" />
												<span className="text-sm">{selectedCliente.telefono}</span>
											</div>
											<div className="flex items-center gap-2">
												<MapPin className="h-4 w-4 text-stone-400" />
												<span className="text-sm">{selectedCliente.direccion}</span>
											</div>
										</div>
									</div>

									<div className="pt-4 border-t border-stone-200 dark:border-stone-800">
										<h3 className="text-sm font-bold text-stone-400 uppercase mb-2">
											Estado de Cuenta
										</h3>
										<div className="space-y-2">
											<div className="flex justify-between">
												<span className="text-sm text-stone-500">Saldo Actual</span>
												<span
													className={cn(
														"text-lg font-bold",
														selectedCliente.saldoActual < 0
															? "text-red-600"
															: "text-emerald-600"
													)}
												>
													${Math.abs(selectedCliente.saldoActual).toLocaleString()}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-sm text-stone-500">Límite de Crédito</span>
												<span className="text-sm font-bold">
													${selectedCliente.limiteCredito.toLocaleString()}
												</span>
											</div>
										</div>
									</div>

									{transacciones.length > 0 && (
										<div className="pt-4 border-t border-stone-200 dark:border-stone-800">
											<h3 className="text-sm font-bold text-stone-400 uppercase mb-4">
												Historial de Movimientos
											</h3>
											<div className="space-y-3">
												{transacciones.map((t) => (
													<div
														key={t.id}
														className="flex items-center justify-between p-4 rounded-2xl border border-stone-100 bg-white/50 dark:border-stone-800 dark:bg-stone-900/50"
													>
														<div>
															<p className="text-sm font-bold">{t.concepto}</p>
															<p className="text-xs text-stone-500">
																{formatDate(t.fecha)}
															</p>
														</div>
														<div className="text-right">
															<p
																className={cn(
																	"text-lg font-bold",
																	t.tipo === "pago" ? "text-emerald-600" : "text-red-600"
																)}
															>
																{t.tipo === "pago" ? "+" : ""}$
																{Math.abs(t.monto).toLocaleString()}
															</p>
															<p className="text-xs text-stone-500">
																Saldo: ${t.saldo.toLocaleString()}
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
			</AnimatePresence>
		</div>
	);
}
