"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
	ArrowUpRight,
	Users,
	Package,
	FileText,
	DollarSign,
	Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
	totalClientes: number;
	clientesActivos: number;
	totalRemitos: number;
	totalFacturas: number;
}

export default function DashboardPage() {
	const [mounted, setMounted] = useState(false);
	const [stats, setStats] = useState<Stats | null>(null);
	const [loading, setLoading] = useState(true);

	// Mount component
	useEffect(() => {
		setMounted(true);
	}, []);

	// Cargar stats solo cuando esté montado
	useEffect(() => {
		if (!mounted) return;
		fetchStats();
	}, [mounted]);

	const fetchStats = async () => {
		try {
			setLoading(true);
			// Cargar clientes
			const clientesRes = await fetch("/api/customers");
			const clientes = clientesRes.ok ? await clientesRes.json() : [];

			// Cargar remitos
			const remitosRes = await fetch("/api/delivery-notes");
			const remitos = remitosRes.ok ? await remitosRes.json() : [];

			// Cargar facturas
			const facturasRes = await fetch("/api/invoices");
			const facturas = facturasRes.ok ? await facturasRes.json() : [];

			// Calcular estadísticas
			const statsData: Stats = {
				totalClientes: clientes.length,
				clientesActivos: clientes.filter((c: any) => c.estado === "activo")
					.length,
				totalRemitos: remitos.data.length,
				totalFacturas: facturas.length,
			};

			setStats(statsData);
		} catch (error) {
			console.error("Error al cargar estadísticas:", error);
		} finally {
			setLoading(false);
		}
	};

	// Don't render until mounted
	if (!mounted) {
		return null;
	}

	if (loading || !stats) {
		return (
			<div className="flex items-center justify-center h-screen">
				<Loader2 className="h-8 w-8 animate-spin text-amber-600" />
			</div>
		);
	}

	const dashboardStats = [
		{
			name: "Total Clientes",
			value: stats.totalClientes.toString(),
			subtitle: `${stats.clientesActivos} activos`,
			icon: Users,
			color: "text-blue-500",
			bg: "bg-blue-500/10",
			href: "/customers",
		},
		{
			name: "Remitos Generados",
			value: stats?.totalRemitos?.toString(),
			subtitle: "Total registrados",
			icon: FileText,
			color: "text-amber-500",
			bg: "bg-amber-500/10",
			href: "/delivery-notes",
		},
		{
			name: "Facturas Emitidas",
			value: stats.totalFacturas.toString(),
			subtitle: "Documentos fiscales",
			icon: DollarSign,
			color: "text-emerald-500",
			bg: "bg-emerald-500/10",
			href: "/invoices",
		},
	];

	return (
		<div className="space-y-6 md:space-y-8">
			{/* Header */}
			<div>
				<h1 className="text-2xl md:text-3xl font-bold text-[var(--card-foreground)]">
					Dashboard
				</h1>
				<p className="text-xs md:text-sm text-stone-500 mt-1">
					Bienvenido al panel de control de tu aserradero
				</p>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
				{dashboardStats.map((stat, i) => (
					<motion.a
						key={stat.name}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: i * 0.1 }}
						href={stat.href}
						className="bg-[var(--card)] rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-stone-200 dark:border-stone-800/50 group hover:border-amber-500/50 transition-all cursor-pointer"
					>
						<div className="mb-3 md:mb-4 flex items-center justify-between">
							<div className={cn("p-2 rounded-xl", stat.bg)}>
								<stat.icon className={cn("h-4 w-4 md:h-5 md:w-5", stat.color)} />
							</div>
							<ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 text-stone-400 group-hover:text-amber-500 transition-colors" />
						</div>
						<h3 className="text-xs md:text-sm font-medium text-stone-500 dark:text-stone-400">
							{stat.name}
						</h3>
						<div className="mt-1 flex items-baseline gap-2">
							<span className="text-xl md:text-2xl font-bold text-[var(--card-foreground)]">
								{stat.value}
							</span>
						</div>
						<p className="mt-1 text-[10px] md:text-xs text-stone-400 font-medium">
							{stat.subtitle}
						</p>
					</motion.a>
				))}
			</div>

			{/* Quick Actions */}
			<div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
				<div className="bg-[var(--card)] rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">
					<div className="flex items-center gap-3 mb-4">
						<div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
							<Users className="h-4 w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />
						</div>
						<h2 className="text-base md:text-lg font-bold text-[var(--card-foreground)]">
							Acceso Rápido
						</h2>
					</div>
					<div className="space-y-2 md:space-y-3">
						<a
							href="/customers"
							className="flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl border border-stone-100 bg-[var(--card)] transition-all group"
						>
							<div className="flex items-center gap-2 md:gap-3">
								<Users className="h-4 w-4 md:h-5 md:w-5 text-stone-400 group-hover:text-amber-600 transition-colors" />
								<div>
									<p className="text-xs md:text-sm font-bold text-[var(--card-foreground)]">
										Gestión de clientes
									</p>
									<p className="text-[10px] md:text-xs text-stone-500">
										Ver y administrar clientes
									</p>
								</div>
							</div>
							<ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 text-stone-400 group-hover:text-amber-600 transition-colors" />
						</a>

						<a
							href="/delivery-notes"
							className="flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl border border-stone-100 bg-[var(--card)] transition-all group"
						>
							<div className="flex items-center gap-2 md:gap-3">
								<FileText className="h-4 w-4 md:h-5 md:w-5 text-stone-400 group-hover:text-amber-600 transition-colors" />
								<div>
									<p className="text-xs md:text-sm font-bold text-[var(--card-foreground)]">
										Generar Remitos
									</p>
									<p className="text-[10px] md:text-xs text-stone-500">
										Crear documentos de entrega
									</p>
								</div>
							</div>
							<ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 text-stone-400 group-hover:text-amber-600 transition-colors" />
						</a>

						<a
							href="/invoices"
							className="flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl border border-stone-100 bg-[var(--card)] transition-all group"
						>
							<div className="flex items-center gap-2 md:gap-3">
								<DollarSign className="h-4 w-4 md:h-5 md:w-5 text-stone-400 group-hover:text-emerald-600 transition-colors" />
								<div>
									<p className="text-xs md:text-sm font-bold text-[var(--card-foreground)]">
										Generar Facturas
									</p>
									<p className="text-[10px] md:text-xs text-stone-500">
										Emitir comprobantes fiscales
									</p>
								</div>
							</div>
							<ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 text-stone-400 group-hover:text-emerald-600 transition-colors" />
						</a>
					</div>
				</div>

				<div className="bg-[var(--card)] rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">
					<div className="flex items-center gap-3 mb-4">
						<div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
							<Package className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
						</div>
						<h2 className="text-base md:text-lg font-bold text-[var(--card-foreground)]">
							Estado del Sistema
						</h2>
					</div>
					<div className="space-y-3 md:space-y-4">
						<div className="flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl border border-stone-100 bg-[var(--card)] transition-all group">
							<div>
								<p className="text-xs md:text-sm font-bold text-[var(--card-foreground)]">
									Base de datos
								</p>
							</div>
							<div className="flex items-center gap-2">
								<div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
								<span className="text-[10px] md:text-xs font-bold text-emerald-600">
									Conectado
								</span>
							</div>
						</div>

						<div className="flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl border border-stone-100 bg-[var(--card)] transition-all group">
							<div>
								<p className="text-xs md:text-sm font-bold text-[var(--card-foreground)]">
									Última sincronización
								</p>
								<p className="text-[10px] md:text-xs text-stone-500">
									{new Date().toLocaleString("es-AR")}
								</p>
							</div>
							<div className="flex items-center gap-2">
								<div className="h-2 w-2 rounded-full bg-emerald-500" />
								<span className="text-[10px] md:text-xs font-bold text-emerald-600">OK</span>
							</div>
						</div>
					</div>
				</div>
			</div >
		</div >
	);
}
