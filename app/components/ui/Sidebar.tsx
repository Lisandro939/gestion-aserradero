"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	LayoutDashboard,
	Package,
	Users,
	FileText,
	Settings,
	LogOut,
	ChevronRight,
	Circle,
	DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDispatch } from "react-redux";
import { logout } from "@/store/features/auth/authSlice";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
	{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
	{ name: "Clientes", href: "/clientes", icon: Users },
	{ name: "Remitos", href: "/remitos", icon: FileText },
	{ name: "Facturas", href: "/facturas", icon: DollarSign },
	{ name: "Configuración", href: "/settings", icon: Settings },
];

interface SidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
	const pathname = usePathname();
	const dispatch = useDispatch();

	return (
		<>
			{/* Mobile Overlay */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
					/>
				)}
			</AnimatePresence>

			{/* Sidebar */}
			<aside
				className={cn(
					"fixed left-0 top-0 z-50 h-screen w-72 border-r border-stone-200 bg-[var(--background)] dark:border-stone-800 transition-transform duration-300 ease-in-out",
					"lg:translate-x-0",
					isOpen ? "translate-x-0" : "-translate-x-full"
				)}
			>
				<div className="flex h-full flex-col p-6">
					<div className="mb-10 flex items-center gap-3 px-2">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-lg shadow-amber-600/20">
							<Package className="h-6 w-6" />
						</div>
						<span className="text-xl font-bold tracking-tight text-[var(--foreground)]">
							Aserradero{" "}
							<span className="text-amber-600">Don Gustavo</span>
						</span>
					</div>

					<nav className="flex-1 space-y-1.5">
						{navItems.map((item) => {
							const isActive = pathname === item.href;
							return (
								<Link
									key={item.href}
									href={item.href}
									onClick={() => onClose()}
									className={cn(
										"group relative flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
										isActive
											? "bg-amber-600 text-white shadow-lg shadow-amber-600/20"
											: "text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-white"
									)}
								>
									<div className="flex items-center gap-3">
										<item.icon
											className={cn(
												"h-5 w-5",
												isActive
													? "text-white"
													: "text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300"
											)}
										/>
										{item.name}
									</div>
									{isActive && (
										<motion.div
											layoutId="activeNav"
											className="absolute inset-0 rounded-xl border border-white/10"
										/>
									)}
									{isActive && (
										<ChevronRight className="h-4 w-4 text-white/70" />
									)}
								</Link>
							);
						})}
					</nav>

					<div className="mt-auto space-y-4 pt-6">
						<button
							onClick={() => dispatch(logout())}
							className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-900/10"
						>
							<LogOut className="h-5 w-5" />
							Cerrar Sesión
						</button>
					</div>
				</div>
			</aside>
		</>
	);
}
