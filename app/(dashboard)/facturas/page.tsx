"use client";

import { useState, useEffect } from "react";
import { generarFacturaPDF, DatosFactura, ItemFactura } from "@/app/components/FacturaPDF";
import {
	Plus,
	Trash2,
	Download,
	User,
	MapPin,
	Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function FacturasPage() {
	const [mounted, setMounted] = useState(false);
	const [activeTab, setActiveTab] = useState<"ver" | "generar">("generar");
	const [facturas, setFacturas] = useState<any[]>([]);

	const [formData, setFormData] = useState<DatosFactura>({
		presupuesto: "",
		fecha: "",
		cliente: "",
		domicilio: "",
		localidad: "",
		telefono: "",
		mov: "",
		vendedor: "Administracion",
		observaciones: "",
		items: [
			{ cantidad: "", descripcion: "", codigo: "", precio: "", dto: "", importe: "" },
			{ cantidad: "", descripcion: "", codigo: "", precio: "", dto: "", importe: "" },
			{ cantidad: "", descripcion: "", codigo: "", precio: "", dto: "", importe: "" },
		],
	});

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

		fetchFacturas();
	}, [mounted]);

	const fetchFacturas = async () => {
		try {
			const response = await fetch("/api/facturas");
			if (response.ok) {
				const data = await response.json();
				setFacturas(data);
			}
		} catch (error) {
			console.error("Error al cargar facturas:", error);
		}
	};

	const handleGeneratePDF = async () => {
		// Generar el PDF
		generarFacturaPDF(formData);

		// Opcional: Guardar en la base de datos
		try {
			await fetch("/api/facturas", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});
			// Recargar facturas
			fetchFacturas();
		} catch (error) {
			console.error("Error al guardar factura:", error);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleItemChange = (index: number, field: keyof ItemFactura, value: string) => {
		setFormData((prev) => {
			const newItems = [...prev.items];
			newItems[index] = { ...newItems[index], [field]: value };

			// Auto-calcular importe si cambia cantidad o precio
			if (field === "cantidad" || field === "precio" || field === "dto") {
				const cantidad = parseFloat(newItems[index].cantidad) || 0;
				const precio = parseFloat(newItems[index].precio) || 0;
				const dto = parseFloat(newItems[index].dto) || 0;
				const subtotal = cantidad * precio;
				const descuento = subtotal * (dto / 100);
				newItems[index].importe = (subtotal - descuento).toFixed(2);
			}

			return { ...prev, items: newItems };
		});
	};

	const addItem = () => {
		setFormData((prev) => ({
			...prev,
			items: [...prev.items, { cantidad: "", descripcion: "", codigo: "", precio: "", dto: "", importe: "" }],
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

	const calcularTotal = () => {
		return formData.items.reduce((sum, item) => {
			const importe = parseFloat(item.importe) || 0;
			return sum + importe;
		}, 0);
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
						Facturas
					</h1>
					<p className="text-xs md:text-sm text-stone-500">
						Gestiona tus presupuestos y facturas
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
						Ver Facturas
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
						Generar Factura
						{activeTab === "generar" && (
							<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 dark:bg-amber-400" />
						)}
					</button>
				</div>
			</div>

			{/* Tab Content: Ver Facturas */}
			{activeTab === "ver" && (
				<div className="bg-[var(--card)] rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">
					<div className="overflow-x-auto -mx-4 md:mx-0">
						<table className="w-full min-w-[640px]">
							<thead>
								<tr className="border-b border-stone-100 dark:border-stone-800">
									<th className="pb-4 text-left text-xs font-bold text-stone-400 uppercase">Presupuesto</th>
									<th className="pb-4 text-left text-xs font-bold text-stone-400 uppercase">Fecha</th>
									<th className="pb-4 text-left text-xs font-bold text-stone-400 uppercase">Cliente</th>
									<th className="pb-4 text-left text-xs font-bold text-stone-400 uppercase">Localidad</th>
									<th className="pb-4 text-left text-xs font-bold text-stone-400 uppercase">Total</th>
								</tr>
							</thead>
							<tbody>
								{facturas.length === 0 ? (
									<tr>
										<td colSpan={5} className="py-8 text-center text-stone-500">
											No hay facturas generadas aún
										</td>
									</tr>
								) : (
									facturas.map((factura, index) => (
										<tr key={index} className="border-b border-stone-100 dark:border-stone-800">
											<td className="py-4 text-sm">{factura.presupuesto || "-"}</td>
											<td className="py-4 text-sm">{factura.fecha}</td>
											<td className="py-4 text-sm">{factura.cliente}</td>
											<td className="py-4 text-sm">{factura.localidad}</td>
											<td className="py-4 text-sm font-bold">
												${factura.total?.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Tab Content: Generar Factura */}
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
						{/* Información del Documento */}
						<div className="space-y-4 md:space-y-6 lg:space-y-8">
							<section className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">
								<h2 className="mb-6 flex items-center gap-2 text-base font-bold text-[var(--card-foreground)]">
									<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-xs text-amber-600 dark:bg-amber-900/30">
										1
									</div>
									Información del Documento
								</h2>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
											Presupuesto N°
										</label>
										<input
											type="text"
											name="presupuesto"
											value={formData.presupuesto}
											onChange={handleChange}
											placeholder="00007704"
											className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
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
											className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
										/>
									</div>
								</div>
							</section>

							{/* Información del Cliente */}
							<section className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">
								<h2 className="mb-6 flex items-center gap-2 text-base font-bold text-[var(--card-foreground)]">
									<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-xs text-blue-600 dark:bg-blue-900/30">
										2
									</div>
									Información del Cliente
								</h2>
								<div className="space-y-4">
									<div>
										<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
											<User className="mr-1 inline h-3 w-3" />
											Cliente
										</label>
										<input
											type="text"
											name="cliente"
											value={formData.cliente}
											onChange={handleChange}
											placeholder="GUSTAVO CHACON"
											className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
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
											placeholder="CIUDAD"
											className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
										/>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
												Localidad
											</label>
											<input
												type="text"
												name="localidad"
												value={formData.localidad}
												onChange={handleChange}
												className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
											/>
										</div>
										<div>
											<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
												<Phone className="mr-1 inline h-3 w-3" />
												Teléfono
											</label>
											<input
												type="text"
												name="telefono"
												value={formData.telefono}
												onChange={handleChange}
												className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
											/>
										</div>
									</div>
								</div>
							</section>
						</div>

						{/* Información Adicional */}
						<div className="space-y-4 md:space-y-6 lg:space-y-8">
							<section className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">
								<h2 className="mb-6 flex items-center gap-2 text-base font-bold text-[var(--card-foreground)]">
									<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs text-emerald-600 dark:bg-emerald-900/30">
										3
									</div>
									Información Adicional
								</h2>
								<div className="space-y-4">
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
												Mov
											</label>
											<input
												type="text"
												name="mov"
												value={formData.mov}
												onChange={handleChange}
												placeholder="28806"
												className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
											/>
										</div>
										<div>
											<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
												Vendedor
											</label>
											<input
												type="text"
												name="vendedor"
												value={formData.vendedor}
												onChange={handleChange}
												className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
											/>
										</div>
									</div>
									<div>
										<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
											Observaciones
										</label>
										<textarea
											name="observaciones"
											value={formData.observaciones}
											onChange={handleChange}
											rows={4}
											className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 resize-none"
										/>
									</div>
								</div>
							</section>
						</div>
					</div>

					{/* Tabla de Items */}
					<section className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">
						<div className="mb-6 flex items-center justify-between">
							<h2 className="flex items-center gap-2 text-base font-bold text-[var(--card-foreground)]">
								<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-xs text-purple-600 dark:bg-purple-900/30">
									4
								</div>
								Detalle de Items
							</h2>
							<button
								onClick={addItem}
								className="flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white transition-all hover:bg-amber-700 active:scale-95"
							>
								<Plus className="h-3 w-3" />
								Agregar Item
							</button>
						</div>

						<div className="overflow-x-auto">
							<table className="w-full text-left">
								<thead>
									<tr className="border-b border-neutral-100 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:border-neutral-800">
										<th className="py-3 pl-2">Cant.</th>
										<th className="py-3 px-4">Descripción</th>
										<th className="py-3 px-4">Cód.</th>
										<th className="py-3 px-4">Precio</th>
										<th className="py-3 px-4">Dto%</th>
										<th className="py-3 px-4">Importe</th>
										<th className="py-3 pr-4 w-12 text-center">Acción</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
									{formData.items.map((item, index) => (
										<tr key={index}>
											<td className="py-2 pl-2">
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
													placeholder="1.00"
													className="w-full rounded-xl border border-transparent bg-[var(--card)] py-2 text-center text-sm font-bold focus:border-amber-500"
												/>
											</td>
											<td className="py-2 px-4">
												<input
													type="text"
													value={item.descripcion}
													onChange={(e) =>
														handleItemChange(
															index,
															"descripcion",
															e.target.value
														)
													}
													placeholder="MAQUINA COBUCO 92/40"
													className="w-full rounded-xl border border-transparent bg-[var(--card)] py-2 px-3 text-sm focus:border-amber-500"
												/>
											</td>
											<td className="py-2 px-4">
												<input
													type="text"
													value={item.codigo}
													onChange={(e) =>
														handleItemChange(
															index,
															"codigo",
															e.target.value
														)
													}
													placeholder="U"
													className="w-full rounded-xl border border-transparent bg-[var(--card)] py-2 text-center text-sm focus:border-amber-500"
												/>
											</td>
											<td className="py-2 px-4">
												<input
													type="text"
													value={item.precio}
													onChange={(e) =>
														handleItemChange(
															index,
															"precio",
															e.target.value
														)
													}
													placeholder="554852.89"
													className="w-full rounded-xl border border-transparent bg-[var(--card)] py-2 px-3 text-sm focus:border-amber-500"
												/>
											</td>
											<td className="py-2 px-4">
												<input
													type="text"
													value={item.dto}
													onChange={(e) =>
														handleItemChange(
															index,
															"dto",
															e.target.value
														)
													}
													placeholder="0"
													className="w-full rounded-xl border border-transparent bg-[var(--card)] py-2 text-center text-sm focus:border-amber-500"
												/>
											</td>
											<td className="py-2 px-4">
												<input
													type="text"
													value={item.importe}
													readOnly
													className="w-full rounded-xl border border-transparent bg-stone-100 dark:bg-stone-800 py-2 px-3 text-sm font-bold"
												/>
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

						{/* Total */}
						<div className="mt-6 flex justify-end">
							<div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl px-6 py-4 border border-amber-200 dark:border-amber-800">
								<div className="flex items-center gap-4">
									<span className="text-sm font-bold text-stone-600 dark:text-stone-400">TOTAL:</span>
									<span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
										${calcularTotal().toLocaleString("es-AR", { minimumFractionDigits: 2 })}
									</span>
								</div>
							</div>
						</div>
					</section>
				</div>
			)}
		</div>
	);
}
