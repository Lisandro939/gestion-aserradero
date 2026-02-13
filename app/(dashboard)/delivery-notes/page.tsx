"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import ViewDeliveryNotesTab from "./(tabs)/ViewDeliveryNotesTab";
import GenerateDeliveryNoteTab from "./(tabs)/GenerateDeliveryNoteTab";

import { Plus, ArrowLeft } from "lucide-react";

export default function DeliveryNotesPage() {
	const [mounted, setMounted] = useState(false);
	const [activeTab, setActiveTab] = useState<"view" | "generate">("view");

	// Mount component
	useEffect(() => {
		setMounted(true);
	}, []);

	// Don't render until mounted
	if (!mounted) {
		return null;
	}

	return (
		<div className="space-y-4 md:space-y-6 mx-auto">
			{/* Header */}
			<div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-xl md:text-2xl font-bold text-[var(--card-foreground)]">
						{activeTab === "view" ? "Remitos" : "Nuevo Remito"}
					</h1>
					<p className="text-xs md:text-sm text-stone-500">
						{activeTab === "view"
							? "Administra tus remitos"
							: "Genera un nuevo comprobante de entrega"}
					</p>
				</div>

				{activeTab === "view" ? (
					<button
						onClick={() => setActiveTab("generate")}
						className="cursor-pointer flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 md:px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-amber-700 active:scale-95 shadow-lg shadow-amber-600/20 w-full md:w-auto"
					>
						<Plus className="h-4 w-4" />
						Generar remito
					</button>
				) : (
					<button
						onClick={() => setActiveTab("view")}
						className="cursor-pointer flex items-center justify-center gap-2 rounded-xl bg-[var(--card-foreground)] px-4 md:px-5 py-2.5 text-sm font-bold text-[var(--card)] transition-all hover:bg-[var(--card-foreground)/80] dark:hover:bg-stone-700 w-full md:w-auto"
					>
						<ArrowLeft className="h-4 w-4" />
						Volver
					</button>
				)}
			</div>

			{/* Tab Content */}
			{activeTab === "view" && <ViewDeliveryNotesTab />}
			{activeTab === "generate" && <GenerateDeliveryNoteTab />}
		</div>
	);
}
