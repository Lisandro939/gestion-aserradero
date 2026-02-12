
import { useState, useEffect, useRef } from "react";
import {
	generateInvoicePDF,
	InvoiceData,
	InvoiceItem,
} from "@/app/components/InvoicePDF";
import {
	FileText,
	Plus,
	Trash2,
	Download,
	User,
	MapPin,
	Phone,
	ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function GenerateInvoiceTab() {
	const [formData, setFormData] = useState<InvoiceData>({
		budgetNumber: "",
		date: "",
		salePoint: "001",
		customer: "",
		address: "",
		city: "",
		phone: "",
		movementType: "",
		salesperson: "Administración",
		notes: "",
		items: [
			{ quantity: "", description: "", code: "", price: "", discount: "", amount: "" },
		],
	});

	// State
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [historicalItems, setHistoricalItems] = useState<string[]>([]);
	const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
	const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
	const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
	const [customers, setCustomers] = useState<any[]>([]);

	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

	// Initial data fetch
	useEffect(() => {
		setFormData((prev) => ({
			...prev,
			date: new Date().toLocaleDateString("es-AR"),
		}));

		fetchCustomers();
		fetchNextInvoiceNumber();
		fetchHistoricalItems();
	}, []);

	// Close dropdown on scroll/resize
	useEffect(() => {
		const handleScroll = () => {
			if (activeInputIndex !== null) setActiveInputIndex(null);
		};
		window.addEventListener("scroll", handleScroll, true);
		window.addEventListener("resize", handleScroll);
		return () => {
			window.removeEventListener("scroll", handleScroll, true);
			window.removeEventListener("resize", handleScroll);
		};
	}, [activeInputIndex]);

	const fetchHistoricalItems = async () => {
		try {
			const response = await fetch("/api/invoice-items");
			if (response.ok) {
				const data = await response.json();
				if (Array.isArray(data)) {
					setHistoricalItems(data);
				}
			}
		} catch (error) {
			console.error("Error loading historical items:", error);
		}
	};

	const saveHistoricalItems = async (items: string[]) => {
		try {
			await fetch("/api/invoice-items", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ items }),
			});
		} catch (error) {
			console.error("Error saving items:", error);
		}
	};

	const fetchNextInvoiceNumber = async () => {
		try {
			const res = await fetch("/api/invoices/last-number");
			if (res.ok) {
				const data = await res.json();
				if (data.nextNumber) {
					setFormData((prev) => ({ ...prev, budgetNumber: data.nextNumber }));
				}
			}
		} catch (error) {
			console.error("Error fetching next invoice number:", error);
		}
	};

	const fetchCustomers = async () => {
		try {
			const response = await fetch("/api/customers");
			if (response.ok) {
				const data = await response.json();
				setCustomers(data);
			}
		} catch (error) {
			console.error("Error fetching customers:", error);
		}
	};

	const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const customerId = e.target.value;
		const selectedCustomer = customers.find(c => c.id.toString() === customerId);

		if (selectedCustomer) {
			setFormData(prev => ({
				...prev,
				customer: selectedCustomer.name,
				address: selectedCustomer.address,
				// Assuming city is part of address or handled separately for now, leaving manual input
				phone: selectedCustomer.phone,
			}));
		} else {
			setFormData(prev => ({
				...prev,
				customer: "",
				address: "",
				phone: "",
			}));
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleItemChange = (index: number, field: keyof InvoiceItem, value: string) => {
		setFormData((prev) => {
			const newItems = [...prev.items];
			newItems[index] = { ...newItems[index], [field]: value };

			// Auto-calculate amount if quantity, price or discount changes
			if (field === "quantity" || field === "price" || field === "discount") {
				const quantity = parseFloat(newItems[index].quantity) || 0;
				const price = parseFloat(newItems[index].price) || 0;
				const discount = parseFloat(newItems[index].discount) || 0;
				const subtotal = quantity * price;
				const discountAmount = subtotal * (discount / 100);
				newItems[index].amount = (subtotal - discountAmount).toFixed(2);
			}

			return { ...prev, items: newItems };
		});

		if (field === "description") {
			setActiveInputIndex(index);
			if (value.trim() === "") {
				setFilteredSuggestions(historicalItems.sort());
			} else {
				const filtered = historicalItems
					.filter((item) => item.toLowerCase().includes(value.toLowerCase()))
					.sort();
				setFilteredSuggestions(filtered);
			}
		}
	};

	const handleInputFocus = (index: number) => {
		setActiveInputIndex(index);

		// Calculate position
		const rect = inputRefs.current[index]?.getBoundingClientRect();
		if (rect) {
			setDropdownPos({
				top: rect.bottom,
				left: rect.left,
				width: rect.width,
			});
		}

		const currentValue = formData.items[index].description;

		if (currentValue.trim() === "") {
			setFilteredSuggestions(historicalItems.sort());
		} else {
			const filtered = historicalItems
				.filter((item) => item.toLowerCase().includes(currentValue.toLowerCase()))
				.sort();
			setFilteredSuggestions(filtered);
		}
	};

	const selectSuggestion = (index: number, suggestion: string) => {
		setFormData((prev) => {
			const newItems = [...prev.items];
			newItems[index] = { ...newItems[index], description: suggestion };
			return { ...prev, items: newItems };
		});
		setFilteredSuggestions([]);
		setActiveInputIndex(null);
	};

	const addItem = () => {
		setFormData((prev) => ({
			...prev,
			items: [...prev.items, { quantity: "", description: "", code: "", price: "", discount: "", amount: "" }],
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

	const handleGeneratePDF = async () => {
		if (isGenerating) return;
		setIsGenerating(true);

		try {
			// Save historical items
			const newItems = formData.items
				.map((item) => item.description.trim())
				.filter((desc) => desc !== "");

			if (newItems.length > 0) {
				// Non-blocking save
				saveHistoricalItems(newItems).then(() => fetchHistoricalItems());
			}

			// Generate PDF
			generateInvoicePDF(formData);

			// Save to DB
			await fetch("/api/invoices", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...formData,
					customerName: formData.customer,
				}),
			});

			// Reload invoices and update next number handled by parent/context ideally, 
			// but here we just update next number for next use
			fetchNextInvoiceNumber();

			setShowSuccessModal(true);
		} catch (error) {
			console.error("Error generating invoice:", error);
			alert("Error al generar la factura. Intente nuevamente.");
		} finally {
			setIsGenerating(false);
		}
	};

	const calculateTotal = () => {
		return formData.items.reduce((sum, item) => {
			const amount = parseFloat(item.amount) || 0;
			return sum + amount;
		}, 0);
	};

	return (
		<div className="space-y-3 md:space-y-4">
			<div className="grid grid-cols-1 gap-4 md:gap-6 lg:gap-8 lg:grid-cols-2">
				{/* Document Information */}
				<div className="space-y-4 md:space-y-6 lg:space-y-8">
					<section className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">
						<h2 className="mb-6 flex items-center gap-2 text-base font-bold text-[var(--card-foreground)]">
							<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-xs text-amber-600 dark:bg-amber-900/30">
								<FileText className="h-4 w-4" />
							</div>
							Información del Documento
						</h2>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
									Punto de Venta
								</label>
								<select
									name="salePoint"
									value={formData.salePoint}
									onChange={handleChange}
									className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
								>
									<option value="001">001</option>
									<option value="002">002</option>
								</select>
							</div>
							<div>
								<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
									N° Presupuesto
								</label>
								<input
									type="text"
									name="budgetNumber"
									value={formData.budgetNumber}
									onChange={handleChange}
									placeholder="00000000"
									className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
								/>
							</div>
							<div>
								<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
									Fecha
								</label>
								<input
									type="text"
									name="date"
									value={formData.date}
									onChange={handleChange}
									className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
								/>
							</div>
						</div>
					</section>

					{/* Customer Information */}
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
									<User className="mr-1 inline h-3 w-3" />
									Cliente
								</label>
								<select
									onChange={handleCustomerSelect}
									className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
									defaultValue=""
								>
									<option value="" disabled>Seleccione un cliente</option>
									{customers.map((c) => (
										<option key={c.id} value={c.id}>
											{c.name}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
									<MapPin className="mr-1 inline h-3 w-3" />
									Domicilio
								</label>
								<input
									type="text"
									name="address"
									value={formData.address}
									readOnly
									placeholder="Dirección completa"
									className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none cursor-not-allowed dark:bg-stone-900/50 dark:border-stone-800 text-stone-500"
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
										Localidad
									</label>
									<input
										type="text"
										name="city"
										value={formData.city}
										onChange={handleChange}
										className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
									/>
								</div>
								<div>
									<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
										<Phone className="mr-1 inline h-3 w-3" />
										Teléfono
									</label>
									<input
										type="text"
										name="phone"
										value={formData.phone}
										readOnly
										className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none cursor-not-allowed dark:bg-stone-900/50 dark:border-stone-800 text-stone-500"
									/>
								</div>
							</div>
						</div>
					</section>
				</div>

				{/* Additional Information */}
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
										name="movementType"
										value={formData.movementType}
										onChange={handleChange}
										placeholder="00000"
										className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
									/>
								</div>
								<div>
									<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
										Vendedor
									</label>
									<input
										type="text"
										name="salesperson"
										value={formData.salesperson}
										onChange={handleChange}
										className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
									/>
								</div>
							</div>
							<div>
								<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
									Observaciones
								</label>
								<textarea
									name="notes"
									value={formData.notes}
									onChange={handleChange}
									rows={4}
									className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 resize-none dark:border-stone-800"
								/>
							</div>
						</div>
					</section>
				</div>
			</div>

			{/* Items Table */}
			<section className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">
				<div className="mb-6 flex items-center justify-between">
					<h2 className="flex items-center gap-2 text-base font-bold text-[var(--card-foreground)]">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-xs text-purple-600 dark:bg-purple-900/30">
							<ClipboardList className="h-4 w-4" />
						</div>
						Detalle de Items
					</h2>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-left">
						<thead>
							<tr className="border-b border-neutral-100 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:border-neutral-800">
								<th className="py-3 pl-2 md:w-[5vw] text-center">Cantidad</th>
								<th className="py-3 px-4 min-w-[75vw] md:min-w-[30vw]">Descripción</th>
								<th className="py-3 px-4 md:w-[5vw] text-center">Cód.</th>
								<th className="py-3 px-4 md:w-[10vw] text-center">Precio</th>
								<th className="py-3 px-4 w-[5vw] text-center">Desc%</th>
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
											value={item.quantity}
											onChange={(e) =>
												handleItemChange(
													index,
													"quantity",
													e.target.value
												)
											}
											placeholder="1.00"
											className="w-full rounded-xl border border-transparent bg-[var(--card)] py-2 text-center text-sm font-bold focus:border-amber-500"
										/>
									</td>
									<td className="py-2 px-4 relative">
										<input
											type="text"
											value={item.description}
											onChange={(e) =>
												handleItemChange(
													index,
													"description",
													e.target.value
												)
											}
											ref={(el) => { inputRefs.current[index] = el; }}
											onFocus={() => handleInputFocus(index)}
											onBlur={() => {
												// Delayed close to allow click
												setTimeout(() => {
													if (activeInputIndex === index) {
														setActiveInputIndex(null);
													}
												}, 200);
											}}
											placeholder="DESCRIPCIÓN"
											className="w-full rounded-xl border border-transparent bg-[var(--card)] py-2 px-3 text-sm focus:border-amber-500"
										/>
									</td>
									<td className="py-2 px-4">
										<input
											type="text"
											value={item.code}
											onChange={(e) =>
												handleItemChange(
													index,
													"code",
													e.target.value
												)
											}
											placeholder="-"
											className="w-full rounded-xl border border-transparent bg-[var(--card)] py-2 text-center text-sm focus:border-amber-500"
										/>
									</td>
									<td className="py-2 px-4">
										<input
											type="text"
											value={item.price}
											onChange={(e) =>
												handleItemChange(
													index,
													"price",
													e.target.value
												)
											}
											placeholder="0.00"
											className="w-full rounded-xl border border-transparent bg-[var(--card)] py-2 text-right text-sm focus:border-amber-500"
										/>
									</td>
									<td className="py-2 px-4">
										<input
											type="text"
											value={item.discount}
											onChange={(e) =>
												handleItemChange(
													index,
													"discount",
													e.target.value
												)
											}
											placeholder="0"
											className="w-full rounded-xl border border-transparent bg-[var(--card)] py-2 text-center text-sm focus:border-amber-500"
										/>
									</td>
									<td className="py-2 px-4 text-right font-medium text-stone-700 dark:text-stone-300">
										${item.amount || "0.00"}
									</td>
									<td className="py-2 pr-4 text-center">
										<button
											onClick={() => removeItem(index)}
											disabled={formData.items.length <= 1}
											className="cursor-pointer rounded-lg p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 disabled:opacity-20"
										>
											<Trash2 className="h-4 w-4" />
										</button>
									</td>
								</tr>
							))}
						</tbody>
						<tfoot>
							<tr>
								<td colSpan={5} className="py-4 text-right font-bold text-lg uppercase text-stone-500">
									Total
								</td>
								<td className="py-4 text-right font-bold text-xl text-stone-800 dark:text-stone-100">
									$
									{calculateTotal().toLocaleString("es-AR", {
										minimumFractionDigits: 2,
									})}
								</td>
								<td></td>
							</tr>
						</tfoot>
					</table>
				</div>

				<button
					onClick={addItem}
					className="cursor-pointer mt-4 flex items-center gap-2 rounded-lg bg-stone-100 px-4 py-2 text-sm font-bold text-stone-600 transition-all hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
				>
					<Plus className="h-4 w-4" />
					Agregar Item
				</button>
			</section>

			<div className="flex justify-end pb-8">
				<button
					onClick={handleGeneratePDF}
					disabled={isGenerating}
					className="cursor-pointer flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 md:px-6 py-2.5 md:py-3 text-sm font-bold text-white transition-all hover:bg-amber-700 active:scale-95 shadow-lg shadow-amber-600/20 w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isGenerating ? (
						<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
					) : (
						<Download className="h-4 w-4" />
					)}
					{isGenerating ? "Generando..." : "Generar Factura"}
				</button>
			</div>

			{/* Dropdown for suggestions */}
			{activeInputIndex !== null && filteredSuggestions.length > 0 && (
				<div
					style={{
						position: "fixed",
						top: dropdownPos.top,
						left: dropdownPos.left,
						width: dropdownPos.width,
						zIndex: 9999,
					}}
					className="mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl max-h-60 overflow-y-auto"
				>
					{filteredSuggestions.map((suggestion, idx) => (
						<button
							key={idx}
							type="button"
							onMouseDown={(e) => {
								e.preventDefault();
								selectSuggestion(activeInputIndex, suggestion);
							}}
							className="w-full text-left px-3 py-2 text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors first:rounded-t-xl last:rounded-b-xl"
						>
							{suggestion}
						</button>
					))}
				</div>
			)}

			{/* Success Modal */}
			{showSuccessModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
					<div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
						<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30">
							<FileText className="h-6 w-6" />
						</div>
						<h3 className="mb-2 text-lg font-bold text-stone-800 dark:text-stone-100">
							¡Factura Generada!
						</h3>
						<p className="mb-6 text-sm text-stone-500 dark:text-stone-400">
							La factura se ha guardado correctamente en la base de datos y el PDF ha sido descargado.
						</p>
						<button
							onClick={() => setShowSuccessModal(false)}
							className="cursor-pointer w-full rounded-xl bg-stone-900 py-3 text-sm font-bold text-white transition-colors hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
						>
							Aceptar
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
