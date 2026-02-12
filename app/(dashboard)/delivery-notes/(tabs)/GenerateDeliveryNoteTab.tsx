import { useState, useEffect, useRef } from "react";
import {
	generateDeliveryNotePDF,
	DeliveryNoteData,
	DeliveryNoteItem,
} from "@/app/components/DeliveryNotePDF";
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

export default function GenerateDeliveryNoteTab() {
	const [formData, setFormData] = useState<DeliveryNoteData & { customerId?: string }>({
		documentNumber: "",
		date: "",
		salePoint: "001",
		customer: "",
		customerId: "", // Initialize
		address: "",
		taxId: "",
		saleCondition: "cash",
		vatCondition: "finalConsumer",
		items: [
			{ quantity: "", description: "" },
		],
	});

	// Modal state
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);

	const [historicalItems, setHistoricalItems] = useState<string[]>([]);
	const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
	const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
	const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
	const [customers, setCustomers] = useState<any[]>([]);

	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

	useEffect(() => {
		setFormData((prev) => ({
			...prev,
			date: new Date().toLocaleDateString("es-AR"),
		}));

		fetchHistoricalItems();
		fetchCustomers();
		fetchNextNumber();
	}, []);

	const fetchNextNumber = async () => {
		try {
			const res = await fetch("/api/delivery-notes/last-number");
			if (res.ok) {
				const data = await res.json();
				if (data.nextNumber) {
					setFormData((prev) => ({ ...prev, documentNumber: data.nextNumber }));
				}
			}
		} catch (error) {
			console.error("Error fetching next number:", error);
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

	const fetchHistoricalItems = async () => {
		try {
			const response = await fetch("/api/delivery-note-items");
			if (response.ok) {
				const data = await response.json();
				if (Array.isArray(data)) {
					setHistoricalItems(data);
				} else if (data.items) {
					setHistoricalItems(data.items);
				}
			}
		} catch (error) {
			console.error("Error loading historical items:", error);
		}
	};

	const saveHistoricalItems = async (items: string[]) => {
		try {
			await fetch("/api/delivery-note-items", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ items }),
			});
		} catch (error) {
			console.error("Error saving items:", error);
		}
	};

	const handleGeneratePDF = async () => {
		if (isGenerating) return;
		setIsGenerating(true);

		try {
			// Save historical items
			const newItems = formData.items
				.map((item) => item.description.trim())
				.filter((description) => description !== "");

			if (newItems.length > 0) {
				await saveHistoricalItems(newItems);
			}

			// Save Delivery Note to Database
			const response = await fetch("/api/delivery-notes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					documentNumber: formData.documentNumber,
					date: formData.date, // API handles conversion
					salePoint: parseInt(formData.salePoint),
					customerName: formData.customer,
					customerId: formData.customerId, // Send customerId
					customerAddress: formData.address,
					customerCuit: formData.taxId,
					items: formData.items,
					notes: "", // Add notes if needed
					status: "pending"
				}),
			});

			if (!response.ok) {
				throw new Error("Error saving delivery note");
			}

			// Generate PDF
			generateDeliveryNotePDF(formData);

			// Show success modal
			setShowSuccessModal(true);

			// Fetch next number for future use if they stay on page?
			// Or only if they clear form?
			// Let's create a reset function or just leave it.
			// If they click "Aceptar" on modal, maybe we reload or something?
			// The modal has "Aceptar" -> `setShowSuccessModal(false)`.
			// It doesn't clear the form.
			// I'll update the number anyway so if they edit and save again (copy) it has new number?
			// No, that might be confusing.
			// Let's just update it here so if they start a new one it's ready.
			fetchNextNumber();

			// Optional: Clear form? Or leave it?
			// User might want to print again.

		} catch (error) {
			console.error("Error generating delivery note:", error);
			alert("Error al generar el remito. Intente nuevamente.");
		} finally {
			setIsGenerating(false);
		}
	};

	const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const customerId = e.target.value;
		const selectedCustomer = customers.find(c => c.id.toString() === customerId);

		if (selectedCustomer) {
			setFormData(prev => ({
				...prev,
				customer: selectedCustomer.name,
				customerId: selectedCustomer.id.toString(), // Set customerId
				address: selectedCustomer.address,
				taxId: selectedCustomer.cuit,
				// Optionally set other fields if schematic supports it (e.g. saleCondition if stored in customer)
			}));
		} else {
			// Reset if empty selection
			setFormData(prev => ({
				...prev,
				customer: "",
				customerId: "",
				address: "",
				taxId: "",
			}));
		}
	};

	const formatCUIT = (value: string) => {
		// Eliminar todo lo que no sea número
		const numbers = value.replace(/\D/g, "");

		// Limitar a 11 dígitos
		const limited = numbers.slice(0, 11);

		// Formatear: XX-XXXXXXXX-X
		let formatted = limited;
		if (limited.length > 2) {
			formatted = `${limited.slice(0, 2)}-${limited.slice(2)}`;
		}
		if (limited.length > 10) {
			formatted = `${formatted.slice(0, 11)}-${formatted.slice(11)}`;
		}

		return formatted;
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;

		if (name === "taxId") {
			const formatted = formatCUIT(value);
			setFormData((prev) => ({ ...prev, [name]: formatted }));
			return;
		}

		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
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

	const handleItemChange = (
		index: number,
		field: keyof DeliveryNoteItem,
		value: string
	) => {
		setFormData((prev) => {
			const newItems = [...prev.items];
			newItems[index] = { ...newItems[index], [field]: value };
			return { ...prev, items: newItems };
		});

		// Filter suggestions if field is description
		if (field === "description") {
			setActiveInputIndex(index);
			if (value.trim() === "") {
				// Show all if empty
				setFilteredSuggestions(historicalItems.sort());
			} else {
				const filtered = historicalItems
					.filter((item) => item.toLowerCase().includes(value.toLowerCase()))
					.sort();
				setFilteredSuggestions(filtered);
			}
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
			items: [...prev.items, { quantity: "", description: "" }],
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
		<div className="space-y-3 md:space-y-4">
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
									Punto de Venta
								</label>
								<select
									name="salePoint"
									value={formData.salePoint}
									onChange={handleSelectChange}
									className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
								>
									<option value="001">001</option>
									<option value="002">002</option>
								</select>
							</div>
							<div>
								<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
									N° Documento
								</label>
								<input
									type="text"
									name="documentNumber"
									value={formData.documentNumber}
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
									name="date"
									value={formData.date}
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
									className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none cursor-not-allowed dark:bg-stone-900/50 dark:border-stone-800 text-stone-500"
								/>
							</div>
							<div>
								<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
									<CreditCard className="mr-1 inline h-3 w-3" />
									CUIT
								</label>
								<input
									type="text"
									name="taxId"
									value={formData.taxId}
									readOnly
									className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none cursor-not-allowed dark:bg-stone-900/50 dark:border-stone-800 text-stone-500"
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
									name="saleCondition"
									value={formData.saleCondition}
									onChange={handleSelectChange}
									className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
								>
									<option value="cash">Contado</option>
									<option value="currentAccount">Cuenta Corriente</option>
								</select>
							</div>
							<div>
								<label className="mb-2 block text-xs font-bold text-stone-400 uppercase">
									Condición de IVA
								</label>
								<select
									name="vatCondition"
									value={formData.vatCondition}
									onChange={handleSelectChange}
									className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800"
								>
									<option value="finalConsumer">Consumidor Final</option>
									<option value="registeredResp">Responsable Inscripto</option>
									<option value="exempt">Exento</option>
									<option value="monotributo">Monotributo</option>
									<option value="unregisteredResp">Responsable No Inscripto</option>
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
					Detalle de Entrega
				</h2>
				<div className="overflow-x-auto -mx-4 md:mx-0">
					<table className="w-full min-w-[640px] text-left">
						<thead>
							<tr className="border-b border-neutral-100 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:border-neutral-800">
								<th className="py-3 pl-4 w-[5vw] text-center">Cantidad</th>
								<th className="py-3 px-4">Descripción / Detalle</th>
								<th className="py-3 pr-4 w-12 text-center">Acción</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
							{formData.items.map((item, index) => (
								<tr key={index}>
									<td className="py-2 pl-4 w-[5vw]">
										<input
											type="text"
											value={item.quantity}
											onChange={(e) =>
												handleItemChange(index, "quantity", e.target.value)
											}
											placeholder="10"
											className="w-full rounded-xl border border-transparent bg-[var(--card)] py-2 text-center text-sm font-bold focus:border-amber-500"
										/>
									</td>
									<td className="py-2 px-4">
										<div className="relative">
											<input
												type="text"
												value={item.description}
												onChange={(e) =>
													handleItemChange(index, "description", e.target.value)
												}
												ref={(el) => { inputRefs.current[index] = el; }}
												onFocus={() => handleInputFocus(index)}
												onBlur={() => {
													setActiveInputIndex(null);

												}}
												placeholder="Ej: Tablas de pino 1x6x3m"
												className="w-full rounded-xl border border-transparent bg-[var(--card)] py-2 px-3 text-sm focus:border-amber-500"
											/>
										</div>
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
					{isGenerating ? "Generando..." : "Generar PDF"}
				</button>
			</div>

			{/* Fixed Autocomplete Dropdown */}
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
							¡Remito Generado!
						</h3>
						<p className="mb-6 text-sm text-stone-500 dark:text-stone-400">
							El remito se ha guardado correctamente en la base de datos y el PDF ha sido descargado.
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
