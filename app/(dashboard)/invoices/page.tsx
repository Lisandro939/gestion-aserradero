"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Plus, ArrowLeft } from "lucide-react";

// Sub-components
import ViewInvoicesTab from "./(tabs)/ViewInvoicesTab";
import GenerateInvoiceTab from "./(tabs)/GenerateInvoiceTab";

export default function InvoicesPage() {
	const [activeTab, setActiveTab] = useState<"view" | "generate">("view");
	const [mounted, setMounted] = useState(false);
	const router = useRouter();

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) return null;

	const handleViewInvoice = (invoice: any) => {
		router.push(`/invoices/${invoice.id}`);
	};

	return (
		<div className="space-y-4 md:space-y-6 mx-auto">
			{/* Header */}
			<div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-xl md:text-2xl font-bold text-[var(--card-foreground)]">
						{activeTab === "view" ? "Facturas" : "Nueva Factura"}
					</h1>
					<p className="text-xs md:text-sm text-stone-500">
						{activeTab === "view"
							? "Gestiona tus presupuestos y facturas"
							: "Genera un nuevo comprobante"}
					</p>
				</div>

				{activeTab === "view" ? (
					<button
						onClick={() => setActiveTab("generate")}
						className="cursor-pointer flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 md:px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-amber-700 active:scale-95 shadow-lg shadow-amber-600/20 w-full md:w-auto"
					>
						<Plus className="h-4 w-4" />
						Nueva factura
					</button>
				) : (
					<button
						onClick={() => setActiveTab("view")}
						className="cursor-pointer flex items-center justify-center gap-2 rounded-xl bg-stone-100 px-4 md:px-5 py-2.5 text-sm font-bold text-stone-600 transition-all hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 w-full md:w-auto"
					>
						<ArrowLeft className="h-4 w-4" />
						Volver
					</button>
				)}
			</div>

			{/* Content */}
			{activeTab === "view" && (
				<ViewInvoicesTab handleViewInvoice={handleViewInvoice} />
			)}
			{activeTab === "generate" && (
				<GenerateInvoiceTab />
			)}
		</div>
	);
}
