"use client";

import { useState, useEffect } from "react";
import { generarRemitoPDF, DatosRemito, ItemRemito } from "@/app/components/RemitoPDF";
import {
	FileText,
	Plus,
	Trash2,
	Download,
	User,
	MapPin,
	CreditCard,
	ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function RemitosPage() {
	const [formData, setFormData] = useState<DatosRemito>({
		numeroDocumento: "",
		fecha: "",
		cliente: "",
		domicilio: "",
		cuit: "",
		condicionVenta: "contado",
		condicionIva: "consFinal",
		items: [
			{ cantidad: "", detalle: "" },
			{ cantidad: "", detalle: "" },
			{ cantidad: "", detalle: "" },
		],
	});

	const [activeTab, setActiveTab] = useState<"ver" | "generar">("generar");
	const [remitos, setRemitos] = useState<any[]>([]);

	const [historicalItems, setHistoricalItems] = useState<string[]>([]);
	const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
	const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

	// Cargar items históricos al montar el componente
	useEffect(() => {
		// Set fecha on client side only
		setFormData(prev => ({
			...prev,
			fecha: new Date().toLocaleDateString("es-AR")
		}));
		fetchHistoricalItems();
		fetchRemitos();
	}, []);

	const fetchRemitos = async () => {
		try {
			const response = await fetch("/api/remitos");
			if (response.ok) {
				const data = await response.json();
				setRemitos(data);
			}
		} catch (error) {
			console.error("Error al cargar remitos:", error);
		}
	};

	const fetchHistoricalItems = async () => {
		try {
			const response = await fetch("/api/remito-items");
			if (response.ok) {
				const items = await response.json();
				setHistoricalItems(items);
			}
		} catch (error) {
			console.error("Error al cargar items históricos:", error);
		}
	};

	const saveHistoricalItems = async (items: string[]) => {
		try {
			await fetch("/api/remito-items", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ items }),
			});
		} catch (error) {
			console.error("Error al guardar items históricos:", error);
		}
	};

	const handleGeneratePDF = async () => {
		// Guardar los detalles de los items antes de generar el PDF
		const itemDetails = formData.items
			.map(item => item.detalle)
			.filter(detalle => detalle.trim() !== "");

		if (itemDetails.length > 0) {
			await saveHistoricalItems(itemDetails);
			// Actualizar la lista local
			setHistoricalItems(prev => {
				const newSet = new Set([...prev, ...itemDetails]);
				return Array.from(newSet).sort();
			});
		}

		// Generar el PDF
		generarRemitoPDF(formData);
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleItemChange = (index: number, field: keyof ItemRemito, value: string) => {
		setFormData((prev) => {
			const newItems = [...prev.items];
			newItems[index] = { ...newItems[index], [field]: value };
			return { ...prev, items: newItems };
		});

		// Si es el campo detalle, filtrar sugerencias
		if (field === "detalle") {
			if (value.trim() === "") {
				setFilteredSuggestions([]);
				setActiveInputIndex(null);
			} else {
				const filtered = historicalItems.filter(item =>
					item.toLowerCase().includes(value.toLowerCase())
				);
				setFilteredSuggestions(filtered);
				setActiveInputIndex(index);
			}
		}
	};

	const selectSuggestion = (index: number, suggestion: string) => {
		handleItemChange(index, "detalle", suggestion);
		setFilteredSuggestions([]);
		setActiveInputIndex(null);
	};

	const addItem = () => {
		setFormData((prev) => ({
			...prev,
			items: [...prev.items, { cantidad: "", detalle: "" }],
		}));
	};

	const removeItem = (index: number) => {
		if (formData.items.length > 1) {
			setFormData((prev) => ({
				...prev,
				items: prev.items.filter((_, i) => i !== index),
			}));
		}
	};

	return (
		<div className="space-y-3 md:space-y-4 mx-auto">
			{/* Header */}
			<div className="flex flex-col gap-3 md:gap-4">
				<div>
					<h1 className="text-xl md:text-2xl font-bold text-[var(--card-foreground)]">
						Remitos
					</h1>
					<p className="text-xs md:text-sm text-stone-500">
						Gestiona tus documentos de remisión
					</p>
				</div>

				{/* Tabs */}
				<div className="flex gap-2 border-b border-stone-200 dark:border-stone-800">
					<button
						onClick={() => setActiveTab("ver")}
						className={cn(
							"px-4 py-2 text-sm font-medium transition-colors relative",
							activeTab === "ver"
								? "text-amber-600 dark:text-amber-400"
								: "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
						)}
					>
						Ver Remitos
						{activeTab === "ver" && (
							<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 dark:bg-amber-400" />
						)}
					</button>
					<button
						onClick={() => setActiveTab("generar")}
						className={cn(
							"px-4 py-2 text-sm font-medium transition-colors relative",
							activeTab === "generar"
								? "text-amber-600 dark:text-amber-400"
								: "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
						)}
					>
						Generar Remito
						{activeTab === "generar" && (
							<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 dark:bg-amber-400" />
						)}
					</button>
				</div>
			</div>

			{/* Tab Content: Ver Remitos */}
			{activeTab === "ver" && (
				<div className="bg-[var(--card)] rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">
					<div className="overflow-x-auto -mx-4 md:mx-0">
						<table className="w-full min-w-[640px]">
							<thead>
								<tr className="border-b border-stone-100 dark:border-stone-800">
									<th className="pb-4 text-left text-xs font-bold text-stone-400 uppercase">N° Documento</th>
									<th className="pb-4 text-left text-xs font-bold text-stone-400 uppercase">Fecha</th>
									<th className="pb-4 text-left text-xs font-bold text-stone-400 uppercase">Cliente</th>
									<th className="pb-4 text-left text-xs font-bold text-stone-400 uppercase">CUIT</th>
									<th className="pb-4 text-left text-xs font-bold text-stone-400 uppercase">Items</th>
								</tr>
							</thead>
							<tbody>
								{remitos.length === 0 ? (
									<tr>
										<td colSpan={5} className="py-8 text-center text-stone-500">
											No hay remitos generados aún
										</td>
									</tr>
								) : (
									remitos.map((remito, index) => (
										<tr key={index} className="border-b border-stone-100 dark:border-stone-800">
											<td className="py-4 text-sm">{remito.numeroDocumento || "-"}</td>
											<td className="py-4 text-sm">{remito.fecha}</td>
											<td className="py-4 text-sm">{remito.cliente}</td>
											<td className="py-4 text-sm">{remito.cuit}</td>
											<td className="py-4 text-sm">{remito.items?.length || 0}</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Tab Content: Generar Remito */}
			{activeTab === "generar" && (
				<div className="space-y-3 md:space-y-4">
					<div className="flex justify-end">
						<button
							onClick={handleGeneratePDF}
							className="flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 md:px-6 py-2.5 md:py-3 text-sm font-bold text-white transition-all hover:bg-amber-700 active:scale-95 shadow-lg shadow-amber-600/20 w-full md:w-auto"
						>
							<Download className="h-4 w-4" />
							Descargar PDF
						</button>
					</div>

					<div className="grid grid-cols-1 gap-4 md:gap-6 lg:gap-8 lg:grid-cols-2">
						{/* Step 1 & 2: Document & Client Info */}
						<div className="space-y-4 md:space-y-6 lg:space-y-8">
							<section className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">
								<h2 className="mb-6 flex items-center gap-2 text-base font-bold text-[var(--card-foreground)]">
									<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-xs text-amber-600 dark:bg-amber-900/30">
										1
									</div>
									Datos del Documento
								</h2>
								<div className="grid gap-4 sm:grid-cols-2">
									<div className="space-y-1.5">
										<label className="text-xs font-bold text-stone-500 uppercase">
											N° Documento
										</label>
										<input
											type="text"
											name="numeroDocumento"
											value={
												formData.numeroDocumento
											}
											onChange={handleChange}
											placeholder="00002470"
											className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-amber-500"
										/>
									</div>
									<div className="space-y-1.5">
										<label className="text-xs font-bold text-stone-500 uppercase">
											Fecha
										</label>
										<input
											type="text"
											name="fecha"
											value={formData.fecha}
											onChange={handleChange}
											className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-amber-500"
										/>
									</div>
								</div>
							</section>

							<section className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">
								<h2 className="mb-6 flex items-center gap-2 text-base font-bold text-[var(--card-foreground)]">
									<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-xs text-amber-600 dark:bg-amber-900/30">
										2
									</div>
									Información del Cliente
								</h2>
								<div className="space-y-4">
									<div className="space-y-1.5">
										<label className="text-xs font-bold text-stone-500 uppercase">
											Nombre Completo / Razón
											Social
										</label>
										<div className="relative">
											<User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
											<input
												type="text"
												name="cliente"
												value={
													formData.cliente
												}
												onChange={
													handleChange
												}
												placeholder="Juan Pérez"
												className="w-full rounded-xl border border-stone-200 bg-[var(--card)] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-amber-500"
											/>
										</div>
									</div>
									<div className="space-y-1.5">
										<label className="text-xs font-bold text-stone-500 uppercase">
											Domicilio
										</label>
										<div className="relative">
											<MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
											<input
												type="text"
												name="domicilio"
												value={
													formData.domicilio
												}
												onChange={
													handleChange
												}
												placeholder="Av. San Martín 1234, Mendoza"
												className="w-full rounded-xl border border-stone-200 bg-[var(--card)] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-amber-500"
											/>
										</div>
									</div>
									<div className="space-y-1.5">
										<label className="text-xs font-bold text-stone-500 uppercase">
											CUIT
										</label>
										<div className="relative">
											<CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
											<input
												type="text"
												name="cuit"
												value={
													formData.cuit
												}
												onChange={
													handleChange
												}
												placeholder="20-12345678-9"
												className="w-full rounded-xl border border-stone-200 bg-[var(--card)] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-amber-500"
											/>
										</div>
									</div>
								</div>
							</section>
						</div>

						{/* Step 3: Conditions */}
						<div className="space-y-8">
							<section className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800/50 h-full">
								<h2 className="mb-6 flex items-center gap-2 text-base font-bold text-[var(--card-foreground)]">
									<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-xs text-amber-600 dark:bg-amber-900/30">
										3
									</div>
									Condiciones de la Operación
								</h2>

								<div className="space-y-8">
									<div className="space-y-3">
										<label className="text-xs font-bold text-stone-500 uppercase">
											Método de Venta
										</label>
										<div className="grid grid-cols-2 gap-4">
											{[
												{
													value: "contado",
													label: "Contado",
												},
												{
													value: "ctaCorriente",
													label: "Cta. Corriente",
												},
											].map((option) => (
												<label
													key={
														option.value
													}
													className={cn(
														"flex cursor-pointer items-center justify-center gap-2 rounded-xl border py-3 transition-all",
														formData.condicionVenta ===
															option.value
															? "border-amber-600 bg-amber-50 text-amber-700 dark:bg-amber-900/20"
															: "border-stone-100 bg-[var(--card)] text-stone-500"
													)}
												>
													<input
														type="radio"
														name="condicionVenta"
														value={
															option.value
														}
														checked={
															formData.condicionVenta ===
															option.value
														}
														onChange={
															handleRadioChange
														}
														className="hidden"
													/>
													<span className="text-sm font-bold">
														{
															option.label
														}
													</span>
												</label>
											))}
										</div>
									</div>

									<div className="space-y-3">
										<label className="text-xs font-bold text-stone-500 uppercase">
											Situación frente al IVA
										</label>
										<div className="grid grid-cols-1 gap-2">
											{[
												{
													value: "respInsc",
													label: "Responsable Inscripto",
												},
												{
													value: "monotributo",
													label: "Monotributo",
												},
												{
													value: "respNoInsc",
													label: "Responsable No Inscripto",
												},
												{
													value: "exento",
													label: "Exento",
												},
												{
													value: "consFinal",
													label: "Consumidor Final",
												},
											].map((option) => (
												<label
													key={
														option.value
													}
													className={cn(
														"flex cursor-pointer items-center justify-between px-4 py-3 rounded-xl border transition-all",
														formData.condicionIva ===
															option.value
															? "border-amber-600 bg-amber-50 text-amber-700 dark:bg-amber-900/20"
															: "border-stone-100 bg-[var(--card)] text-stone-500"
													)}
												>
													<span className="text-sm font-bold">
														{
															option.label
														}
													</span>
													<input
														type="radio"
														name="condicionIva"
														value={
															option.value
														}
														checked={
															formData.condicionIva ===
															option.value
														}
														onChange={
															handleRadioChange
														}
														className="h-4 w-4 text-amber-600 focus:ring-amber-500"
													/>
												</label>
											))}
										</div>
									</div>
								</div>
							</section>
						</div>
					</div>

					{/* Step 4: Items Table */}
					<section className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">
						<div className="mb-6 flex items-center justify-between">
							<h2 className="flex items-center gap-2 text-base font-bold text-[var(--card-foreground)]">
								<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-xs text-amber-600 dark:bg-amber-900/30">
									4
								</div>
								Detalle de la Entrega (Items)
							</h2>
							<button
								onClick={addItem}
								className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-xs font-bold text-neutral-600 transition-all hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900"
							>
								<Plus className="h-4 w-4" />
								Agregar Item
							</button>
						</div>

						<div className="overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800">
							<table className="w-full text-left">
								<thead className="bg-[var(--card)]">
									<tr className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
										<th className="py-3 pl-4 w-24">
											Cant.
										</th>
										<th className="py-3 px-4">
											Descripción del Producto /
											Detalle
										</th>
										<th className="py-3 pr-4 w-12 text-center">
											Acción
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
									{formData.items.map((item, index) => (
										<tr key={index}>
											<td className="py-2 pl-4">
												<input
													type="text"
													value={
														item.cantidad
													}
													onChange={(
														e
													) =>
														handleItemChange(
															index,
															"cantidad",
															e
																.target
																.value
														)
													}
													placeholder="10"
													className="w-full rounded-xl border border-transparent bg-[var(--card)] py-2 text-center text-sm font-bold focus:border-amber-500"
												/>
											</td>
											<td className="py-2 px-4">
												<input
													type="text"
													value={
														item.detalle
													}
													onChange={(
														e
													) =>
														handleItemChange(
															index,
															"detalle",
															e
																.target
																.value
														)
													}
													placeholder="Ej: Tablas de pino 1x6x3m"
													className="w-full rounded-xl border border-transparent bg-[var(--card)] py-2 px-3 text-sm focus:border-amber-500"
												/>
											</td>
											<td className="py-2 pr-4 text-center">
												<button
													onClick={() =>
														removeItem(
															index
														)
													}
													disabled={
														formData
															.items
															.length <=
														1
													}
													className="rounded-lg p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 disabled:opacity-20"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</section>
				</div>
			)}
		</div>
	);
}
