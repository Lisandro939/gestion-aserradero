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
	TrendingUp,
	CreditCard,
	Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SalesChart } from "@/app/components/SalesChart";

interface Stats {
	totalClientes: number;
	clientesActivos: number;
	totalRemitos: number;
	totalFacturas: number;
	// New fields
	totalDebt: number;
	totalSales: number;
	currentMonthSales: number;
	monthlySales: any[];
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
			// 1. Cargar contadores básicos
			const clientesRes = await fetch("/api/customers");
			const clientes = clientesRes.ok ? await clientesRes.json() : [];

			const remitosRes = await fetch("/api/delivery-notes");
			const remitos = remitosRes.ok ? await remitosRes.json() : [];

			const facturasRes = await fetch("/api/invoices");
			const facturas = facturasRes.ok ? await facturasRes.json() : [];

			// 2. Cargar financieras avanzadas
			const moneyStatsRes = await fetch("/api/dashboard/stats");
			const moneyStats = moneyStatsRes.ok ? await moneyStatsRes.json() : {};

			// Calcular estadísticas combinadas
			const statsData: Stats = {
				totalClientes: clientes.length,
				clientesActivos: clientes.filter((c: any) => c.estado === "activo").length,
				totalRemitos: remitos.data ? remitos.data.length : 0,
				totalFacturas: facturas.length,
				totalDebt: moneyStats.totalDebt || 0,
				totalSales: moneyStats.totalSales || 0,
				currentMonthSales: moneyStats.currentMonthSales || 0,
				monthlySales: moneyStats.monthlySales || []
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
			name: "Ventas Totales",
			value: stats.totalSales.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }),
			subtitle: `Mes actual: ${stats.currentMonthSales.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}`,
			icon: TrendingUp,
			color: "text-emerald-500",
			bg: "bg-emerald-500/10",
			href: "/delivery-notes", // Or specific sales report
		},
		{
			name: "Deuda en Cta. Cte.",
			value: stats.totalDebt.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }),
			subtitle: "Saldo pendiente de cobro",
			icon: CreditCard,
			color: "text-red-500",
			bg: "bg-red-500/10",
			href: "/customers",
		},
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
			name: "Comprobantes",
			value: (stats.totalRemitos + stats.totalFacturas).toString(),
			subtitle: `${stats.totalRemitos} Remitos / ${stats.totalFacturas} Facturas`,
			icon: FileText,
			color: "text-amber-500",
			bg: "bg-amber-500/10",
			href: "/delivery-notes",
		},
	];

	return (
		<div className="space-y-6 md:space-y-8 w-full">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl md:text-3xl font-bold text-[var(--card-foreground)]">
						Dashboard
					</h1>
					<p className="text-xs md:text-sm text-stone-500 mt-1">
						Resumen general y métricas clave
					</p>
				</div>
				<div className="flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] p-2 rounded-xl">
					<Calendar className="h-4 w-4 text-[var(--muted-foreground)]" />
					<span className="text-xs font-medium text-[var(--card-foreground)]">
						{new Date().toLocaleDateString("es-AR", { month: 'long', year: 'numeric', day: 'numeric' })}
					</span>
				</div>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
				{dashboardStats.map((stat, i) => (
					<motion.a
						key={stat.name}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: i * 0.1 }}
						href={stat.href}
						className="bg-[var(--card)] rounded-2xl p-4 md:p-6 shadow-sm border border-stone-200 group hover:border-amber-500/50 transition-all cursor-pointer relative overflow-hidden"
					>
						<div className="mb-3 md:mb-4 flex items-center justify-between relative z-10">
							<div className={cn("p-2 rounded-xl", stat.bg)}>
								<stat.icon className={cn("h-4 w-4 md:h-5 md:w-5", stat.color)} />
							</div>
							<ArrowUpRight className="h-3 w-3 md:h-4 md:w-4 text-stone-400 group-hover:text-amber-500 transition-colors" />
						</div>
						<h3 className="text-xs md:text-sm font-medium text-stone-500 relative z-10">
							{stat.name}
						</h3>
						<div className="mt-1 flex items-baseline gap-2 relative z-10">
							<span className="text-xl md:text-2xl font-bold text-[var(--card-foreground)] truncate max-w-full block">
								{stat.value}
							</span>
						</div>
						<p className="mt-1 text-[10px] md:text-xs text-stone-400 font-medium relative z-10">
							{stat.subtitle}
						</p>
					</motion.a>
				))}
			</div>

			{/* Charts Section */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Sales Chart (2 cols) */}
				<div className="lg:col-span-2 bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200">
					<div className="flex items-center justify-between mb-6">
						<div>
							<h2 className="text-lg font-bold text-[var(--card-foreground)]">Evolución de Ventas</h2>
							<p className="text-xs text-stone-500">Últimos 12 meses (Basado en Remitos)</p>
						</div>
					</div>
					<SalesChart data={stats.monthlySales} />
				</div>

				{/* Quick Actions (1 col) */}
				<div className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 flex flex-col">
					<h2 className="text-lg font-bold text-[var(--card-foreground)] mb-6">Acciones Rápidas</h2>
					<div className="space-y-3 flex-1">
						<a
							href="/delivery-notes"
							className="flex items-center justify-between p-4 rounded-2xl border border-stone-100 bg-[var(--card)] hover:bg-stone-50 transition-all group"
						>
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-xl bg-amber-100/50">
									<Package className="h-5 w-5 text-amber-600" />
								</div>
								<div>
									<p className="text-sm font-bold text-[var(--card-foreground)]">Nuevo Remito</p>
									<p className="text-xs text-stone-500">Registrar entrega</p>
								</div>
							</div>
							<ArrowUpRight className="h-4 w-4 text-stone-300 group-hover:text-amber-500 transition-colors" />
						</a>

						<a
							href="/invoices"
							className="flex items-center justify-between p-4 rounded-2xl border border-stone-100 bg-[var(--card)] hover:bg-stone-50 transition-all group"
						>
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-xl bg-emerald-100/50">
									<DollarSign className="h-5 w-5 text-emerald-600" />
								</div>
								<div>
									<p className="text-sm font-bold text-[var(--card-foreground)]">Nueva Factura</p>
									<p className="text-xs text-stone-500">Emitir comprobante</p>
								</div>
							</div>
							<ArrowUpRight className="h-4 w-4 text-stone-300 group-hover:text-emerald-500 transition-colors" />
						</a>

						<a
							href="/customers"
							className="flex items-center justify-between p-4 rounded-2xl border border-stone-100 bg-[var(--card)] hover:bg-stone-50 transition-all group"
						>
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-xl bg-blue-100/50">
									<Users className="h-5 w-5 text-blue-600" />
								</div>
								<div>
									<p className="text-sm font-bold text-[var(--card-foreground)]">Nuevo Cliente</p>
									<p className="text-xs text-stone-500">Registrar contacto</p>
								</div>
							</div>
							<ArrowUpRight className="h-4 w-4 text-stone-300 group-hover:text-blue-500 transition-colors" />
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
