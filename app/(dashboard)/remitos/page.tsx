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
	const [mounted, setMounted] = useState(false);
	const [activeTab, setActiveTab] = useState<"ver" | "generar">("generar");
	const [remitos, setRemitos] = useState<any[]>([]);

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

	const [historicalItems, setHistoricalItems] = useState<string[]>([]);
	const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
	const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

	// Mount component
	useEffect(() => {
		setMounted(true);
	}, []);

	// Cargar datos solo cuando esté montado en el cliente
	useEffect(() => {
		if (!mounted) return;

		// Set fecha on client side only
		setFormData(prev => ({
			...prev,
			fecha: new Date().toLocaleDateString("es-AR")
		}));

		fetchHistoricalItems();
		fetchRemitos();
	}, [mounted]);

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
				const data = await response.json();
				setHistoricalItems(data.items || []);
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
			console.error("Error al guardar items:", error);
		}
	};

	const handleGeneratePDF = async () => {
		// Guardar items históricos
		const newItems = formData.items
			.map((item) => item.detalle.trim())
			.filter((detalle) => detalle !== "");

		if (newItems.length > 0) {
			await saveHistoricalItems(newItems);
		}

		// Generar el PDF
		generarRemitoPDF(formData);
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleItemChange = (index: number, field: keyof ItemRemito, value: string) => {
		setFormData((prev) => {
			const newItems = [...prev.items];
			newItems[index] = { ...newItems[index], [field]: value };
			return { ...prev, items: newItems };
		});

		// Filtrar sugerencias si es el campo detalle
		if (field === "detalle") {
			setActiveInputIndex(index);
			if (value.trim() === "") {
				setFilteredSuggestions([]);
			} else {
				const filtered = historicalItems
					.filter((item) =>
						item.toLowerCase().includes(value.toLowerCase())
					)
					.sort();
				setFilteredSuggestions(filtered);
			}
		}
	};

	const selectSuggestion = (index: number, suggestion: string) => {
		setFormData((prev) => {
			const newItems = [...prev.items];
			newItems[index] = { ...newItems[index], detalle: suggestion };
			return { ...prev, items: newItems };
		});
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

	// Don't render until mounted
	if (!mounted) {
		return null;
	}

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
											<td className="py-4 text-sm">{remito.numero || "-"}</td>
											<td className="py-4 text-sm">{new Date(remito.fecha).toLocaleDateString("es-AR")}</td>
											<td className="py-4 text-sm">{remito.cliente?.nombre || "Sin cliente"}</td>
											<td className="py-4 text-sm">{remito.cliente?.cuit || "-"}</td>
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
										<FileText className="h-4 w-4" />
									</div>
									Información del Documento
								</h2>
								<div className="space-y-4">
									<div>
										<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
											Número de Documento
										</label>
										<input
											type="text"
											name="numeroDocumento"
											value={formData.numeroDocumento}
											onChange={handleChange}
											placeholder="Opcional"
											className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
										/>
									</div>
									<div>
										<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
											Fecha
										</label>
										<input
											type="text"
											name="fecha"
											value={formData.fecha}
											onChange={handleChange}
											className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
										/>
									</div>
								</div>
							</section>

							<section className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">
								<h2 className="mb-6 flex items-center gap-2 text-base font-bold text-[var(--card-foreground)]">
									<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-xs text-blue-600 dark:bg-blue-900/30">
										<User className="h-4 w-4" />
									</div>
									Información del Cliente
								</h2>
								<div className="space-y-4">
									<div>
										<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
											Cliente
										</label>
										<input
											type="text"
											name="cliente"
											value={formData.cliente}
											onChange={handleChange}
											placeholder="Nombre del cliente"
											className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
										/>
									</div>
									<div>
										<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
											<MapPin className="mr-1 inline h-3 w-3" />
											Domicilio
										</label>
										<input
											type="text"
											name="domicilio"
											value={formData.domicilio}
											onChange={handleChange}
											placeholder="Dirección completa"
											className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
										/>
									</div>
									<div>
										<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
											<CreditCard className="mr-1 inline h-3 w-3" />
											CUIT
										</label>
										<input
											type="text"
											name="cuit"
											value={formData.cuit}
											onChange={handleChange}
											placeholder="XX-XXXXXXXX-X"
											className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
										/>
									</div>
								</div>
							</section>
						</div>

						{/* Step 3: Conditions */}
						<div className="space-y-4 md:space-y-6 lg:space-y-8">
							<section className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">
								<h2 className="mb-6 flex items-center gap-2 text-base font-bold text-[var(--card-foreground)]">
									<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs text-emerald-600 dark:bg-emerald-900/30">
										3
									</div>
									Condiciones
								</h2>
								<div className="space-y-4">
									<div>
										<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
											Condición de Venta
										</label>
										<select
											name="condicionVenta"
											value={formData.condicionVenta}
											onChange={handleSelectChange}
											className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
										>
											<option value="contado">Contado</option>
											<option value="cuentaCorriente">Cuenta Corriente</option>
										</select>
									</div>
									<div>
										<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
											Condición IVA
										</label>
										<select
											name="condicionIva"
											value={formData.condicionIva}
											onChange={handleSelectChange}
											className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
										>
											<option value="consFinal">Consumidor Final</option>
											<option value="responsableInscripto">Responsable Inscripto</option>
											<option value="exento">Exento</option>
											<option value="monotributo">Monotributo</option>
										</select>
									</div>
								</div>
							</section>
						</div>
					</div>

					{/* Step 4: Items Table */}
					<section className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">
						<h2 className="mb-6 flex items-center gap-2 text-base font-bold text-[var(--card-foreground)]">
							<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-xs text-amber-600 dark:bg-amber-900/30">
								<ClipboardList className="h-4 w-4" />
							</div>
							Detalle de la entrega
						</h2>
						<div className="overflow-x-auto -mx-4 md:mx-0">
							<table className="w-full min-w-[640px] text-left">
								<thead>
									<tr className="border-b border-neutral-100 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:border-neutral-800">
										<th className="py-3 pl-4">Cantidad</th>
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
													value={item.cantidad}
													onChange={(e) =>
														handleItemChange(
															index,
															"cantidad",
															e.target.value
														)
													}
													placeholder="10"
													className="w-full rounded-xl border border-transparent bg-[var(--card)] py-2 text-center text-sm font-bold focus:border-amber-500"
												/>
											</td>
											<td className="py-2 px-4">
												<div className="relative">
													<input
														type="text"
														value={item.detalle}
														onChange={(e) =>
															handleItemChange(
																index,
																"detalle",
																e.target.value
															)
														}
														placeholder="Ej: Tablas de pino 1x6x3m"
														className="w-full rounded-xl border border-transparent bg-[var(--card)] py-2 px-3 text-sm focus:border-amber-500"
													/>
													{/* Autocomplete Dropdown */}
													{activeInputIndex === index && filteredSuggestions.length > 0 && (
														<div className="absolute z-10 w-full mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
															{filteredSuggestions.map((suggestion, idx) => (
																<button
																	key={idx}
																	type="button"
																	onClick={() => selectSuggestion(index, suggestion)}
																	className="w-full text-left px-3 py-2 text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors first:rounded-t-xl last:rounded-b-xl"
																>
																	{suggestion}
																</button>
															))}
														</div>
													)}
												</div>
											</td>
											<td className="py-2 pr-4 text-center">
												<button
													onClick={() => removeItem(index)}
													disabled={formData.items.length <= 1}
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
						<button
							onClick={addItem}
							className="mt-4 flex items-center gap-2 rounded-lg bg-stone-100 px-4 py-2 text-sm font-bold text-stone-600 transition-all hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
						>
							<Plus className="h-4 w-4" />
							Añadir Item
						</button>
					</section>
				</div>
			)}
		</div>
	);
}
