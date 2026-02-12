import jsPDF from "jspdf";

export interface InvoiceItem {
	quantity: string;
	description: string;
	code: string;
	price: string;
	discount: string; // descuento
	amount: string;
}

export interface InvoiceData {
	budgetNumber: string;
	date: string;
	salePoint: string;
	customer: string;
	address: string;
	city: string;
	phone: string;
	movementType: string; // movimiento
	salesperson: string;
	notes: string;
	items: InvoiceItem[];
}

export function generateInvoicePDF(data: InvoiceData) {
	const doc = new jsPDF();
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const margin = 15;

	// Brand Colors
	const colorGray = [60, 60, 60];
	const colorAmber = [217, 119, 6]; // Amber-600
	const colorLight = [245, 245, 245];
	const colorWhite = [255, 255, 255];

	// --- DECORATIVE TOP BAR ---
	doc.setFillColor(colorAmber[0], colorAmber[1], colorAmber[2]);
	doc.rect(0, 0, pageWidth, 5, "F");

	// --- HEADER ---
	// LEFT Side: Budget Data
	const boxWidth = 80;
	const boxHeight = 25;
	const boxX = margin;
	const boxY = 15;

	// Soft background for Budget box
	doc.setFillColor(colorLight[0], colorLight[1], colorLight[2]);
	doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, "F");

	doc.setFont("helvetica", "bold");
	doc.setFontSize(14);
	doc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
	doc.text("PRESUPUESTO", boxX + (boxWidth / 2), boxY + 8, { align: "center" });

	doc.setFontSize(10);
	doc.text(`N°: ${data.salePoint}-${data.budgetNumber || "BORRADOR"}`, boxX + (boxWidth / 2), boxY + 15, { align: "center" });

	doc.setFont("helvetica", "normal");
	doc.text(`Fecha: ${data.date}`, boxX + (boxWidth / 2), boxY + 21, { align: "center" });

	// RIGHT Side: Company Data (ASERRADERO DON GUSTAVO)
	// ASERRADERO DON GUSTAVO
	// Maderas - Machimbres - Tirantes
	// Ruta Nacional 14, Km 880 - Oberá, Misiones
	// Tel: (3755) 445566

	const headerRightX = pageWidth - margin;
	let headerY = 20;

	doc.setFont("helvetica", "bold");
	doc.setFontSize(18); // Larger
	doc.setTextColor(colorAmber[0], colorAmber[1], colorAmber[2]);
	doc.text("ASERRADERO", headerRightX, headerY, { align: "right" });
	headerY += 8;
	doc.text("DON GUSTAVO", headerRightX, headerY, { align: "right" });

	headerY += 6;
	doc.setFont("helvetica", "normal");
	doc.setFontSize(9);
	doc.setTextColor(100, 100, 100);
	doc.text("Maderas - Machimbres - Tirantes", headerRightX, headerY, { align: "right" });
	headerY += 5;
	doc.text("Ruta Nacional 14, Km 880 - Oberá, Misiones", headerRightX, headerY, { align: "right" });
	headerY += 5;
	doc.text("Tel: (3755) 445566", headerRightX, headerY, { align: "right" });

	// --- CUSTOMER DATA ---
	const clientBoxY = 60;

	// Divider line
	doc.setDrawColor(220, 220, 220);
	doc.line(margin, clientBoxY - 5, pageWidth - margin, clientBoxY - 5);

	doc.setFont("helvetica", "bold");
	doc.setFontSize(10);
	doc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
	doc.text("DATOS DEL CLIENTE", margin, clientBoxY);

	const col1X = margin;
	const col2X = pageWidth / 2 + 10;
	let currentY = clientBoxY + 8;

	doc.setFontSize(9);

	// Row 1
	doc.setFont("helvetica", "bold");
	doc.text("Cliente:", col1X, currentY);
	doc.setFont("helvetica", "normal");
	doc.text((data.customer || "").toUpperCase(), col1X + 25, currentY);

	doc.setFont("helvetica", "bold");
	doc.text("Vendedor:", col2X, currentY);
	doc.setFont("helvetica", "normal");
	doc.text(data.salesperson || "-", col2X + 20, currentY);

	// Row 2
	currentY += 6;
	doc.setFont("helvetica", "bold");
	doc.text("Dirección:", col1X, currentY);
	doc.setFont("helvetica", "normal");
	const fullAddress = `${data.address || ""} - ${data.city || ""}`;
	doc.text(fullAddress.toUpperCase(), col1X + 25, currentY);

	doc.setFont("helvetica", "bold");
	doc.text("Teléfono:", col2X, currentY);
	doc.setFont("helvetica", "normal");
	doc.text(data.phone || "-", col2X + 20, currentY);

	// Notes
	if (data.notes) {
		currentY += 6;
		doc.setFont("helvetica", "bold");
		doc.text("Nota:", col1X, currentY);
		doc.setFont("helvetica", "italic");
		const notesSplit = doc.splitTextToSize(data.notes, pageWidth - margin - 50);
		doc.text(notesSplit, col1X + 25, currentY);
		currentY += (notesSplit.length - 1) * 4;
	}

	// --- ITEMS TABLE ---
	const tableStartY = currentY + 15;

	// Headers
	doc.setFillColor(colorGray[0], colorGray[1], colorGray[2]);
	doc.rect(margin, tableStartY, pageWidth - margin * 2, 8, "F");

	doc.setTextColor(255, 255, 255);
	doc.setFont("helvetica", "bold");
	doc.setFontSize(8);

	// Column settings
	const colQtyX = margin + 5;
	const colDescX = margin + 25;
	const colPriceX = margin + 140; // Align right
	const colTotalX = pageWidth - margin - 5; // Align right

	const colY = tableStartY + 5;
	doc.text("CANT.", colQtyX, colY);
	doc.text("DESCRIPCIÓN", colDescX, colY);
	doc.text("PRECIO UNIT.", colPriceX, colY, { align: "right" });
	doc.text("SUBTOTAL", colTotalX, colY, { align: "right" });

	// Rows
	let rowY = tableStartY + 14;
	doc.setFont("helvetica", "normal");
	doc.setFontSize(9);
	doc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);

	let calculatedTotal = 0;
	// Filter empty lines
	const validItems = data.items.filter(i => i.quantity || i.description || (parseFloat(i.price) > 0));

	validItems.forEach((item, index) => {
		// Calculate row height based on description
		const descWidth = 100; // Max width for description
		const descLines = doc.splitTextToSize((item.description || "").toUpperCase(), descWidth);
		const rowHeight = Math.max(8, descLines.length * 5 + 4);

		// Alternating background color
		if (index % 2 === 0) {
			doc.setFillColor(248, 248, 248);
			doc.rect(margin, rowY, pageWidth - margin * 2, rowHeight, "F");
		}

		// Text vertical centering approx
		const textY = rowY + 5;

		const qty = item.quantity || "";
		doc.text(qty, colQtyX + 2, textY, { align: "center" });

		doc.text(descLines, colDescX, textY);

		const price = parseFloat(item.price) || 0;
		if (price > 0 || (qty && descLines.length > 0)) {
			doc.text(price.toLocaleString("es-AR", { minimumFractionDigits: 2 }), colPriceX, textY, { align: "right" });
		}

		// Amount logic
		let amount = parseFloat(item.amount) || 0;
		if (amount === 0 && price > 0) {
			const q = parseFloat(item.quantity) || 0;
			const discount = parseFloat(item.discount) || 0;
			amount = (q * price) * (1 - discount / 100);
		}

		if (amount > 0) {
			doc.text(amount.toLocaleString("es-AR", { minimumFractionDigits: 2 }), colTotalX, textY, { align: "right" });
			calculatedTotal += amount;
		}

		rowY += rowHeight;

		// Page break
		if (rowY > pageHeight - 40) {
			doc.addPage();
			// Re-draw header? Usually simplified header.
			rowY = 20;
		}
	});

	// Total Line
	doc.setDrawColor(colorAmber[0], colorAmber[1], colorAmber[2]);
	doc.setLineWidth(0.5);
	doc.line(margin, rowY, pageWidth - margin, rowY);

	// Final Total
	const totalY = rowY + 10;
	doc.setFontSize(12);
	doc.setFont("helvetica", "bold");
	doc.text("TOTAL ESTIMADO", pageWidth - margin - 40, totalY, { align: "right" });

	doc.setFontSize(14);
	doc.setTextColor(colorAmber[0], colorAmber[1], colorAmber[2]);
	doc.text(`$ ${calculatedTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, totalY, { align: "right" });

	// Footer
	doc.setFontSize(8);
	doc.setTextColor(150, 150, 150);
	doc.setFont("helvetica", "italic");
	doc.text("Documento no válido como factura fiscal - Presupuesto sujeto a cambios", pageWidth / 2, pageHeight - 15, { align: "center" });

	// Filename
	const cleanClient = (data.customer || "Cliente").replace(/[^a-z0-9]/gi, "_");
	const fileName = `Presupuesto_${data.budgetNumber || "BORRADOR"}_${cleanClient}.pdf`;
	doc.save(fileName);
}
