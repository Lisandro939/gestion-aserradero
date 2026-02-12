"use client";

import { jsPDF } from "jspdf";

// Types for form data
export interface DeliveryNoteItem {
	quantity: string;
	description: string;
}

export interface DeliveryNoteData {
	// Document data
	documentNumber: string;
	date: string;
	salePoint: string;

	// Customer data
	customer: string;
	address: string;
	taxId: string; // CUIT

	// Sale conditions
	saleCondition: "cash" | "currentAccount";

	// VAT Condition
	vatCondition: "registeredResp" | "monotributo" | "unregisteredResp" | "exempt" | "finalConsumer";

	// Items
	items: DeliveryNoteItem[];
}

// Sawmill data (fixed)
const SAWMILL_DATA = {
	name: "ASERRADERO DON GUSTAVO",
	owner: "de CHACON GUSTAVO ADOLFO",
	phone: "2612429703",
	address: "Ruta 36 S/N - Tres de Mayo",
	city: "Lavalle - Mendoza",
	cuit: "20-21917064-6",
	grossIncome: "02M310", // Ingresos Brutos
	establishmentNumber: "13-02943-10-00",
	sievingHeadquarters: "01", // Sede Tamizado
	activityStart: "01-06-1996",
	vatCondition: "IVA RESPONSABLE INSCRIPTO",
};

export function getDeliveryNoteDoc(data: DeliveryNoteData) {
	const doc = new jsPDF({
		orientation: "portrait",
		unit: "mm",
		format: "a4",
	});

	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const margin = 10;

	// ==================== HEADER ====================

	// Document border
	doc.setDrawColor(0);
	doc.setLineWidth(0.5);
	doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);

	// Header vertical divider
	const headerDividerX = pageWidth / 2;
	doc.line(headerDividerX, margin, headerDividerX, 65);

	// Header bottom horizontal line
	doc.line(margin, 65, pageWidth - margin, 65);

	// ==================== LEFT SIDE - SAWMILL DATA ====================

	// Circular logo (simulated)
	const logoX = margin + 25;
	const logoY = 28;
	const logoRadius = 15;

	doc.setDrawColor(0);
	doc.setLineWidth(1);
	doc.circle(logoX, logoY, logoRadius);

	// Inner circle (simulated saw)
	doc.setLineWidth(0.5);
	doc.circle(logoX, logoY, logoRadius - 3);

	// Logo text
	doc.setFontSize(6);
	doc.setFont("helvetica", "bold");

	// Circular text "ASERRADERO"
	doc.text("ASERRADERO", logoX, logoY - 5, { align: "center" });
	doc.text("DON GUSTAVO", logoX, logoY + 1, { align: "center" });

	// Draw saw teeth (radial lines)
	for (let i = 0; i < 16; i++) {
		const angle = (i * 360) / 16;
		const rad = (angle * Math.PI) / 180;
		const innerR = logoRadius - 3;
		const outerR = logoRadius;
		const x1 = logoX + Math.cos(rad) * innerR;
		const y1 = logoY + Math.sin(rad) * innerR;
		const x2 = logoX + Math.cos(rad) * outerR;
		const y2 = logoY + Math.sin(rad) * outerR;
		doc.line(x1, y1, x2, y2);
	}

	// Sawmill info
	const infoX = margin + 5;
	let infoY = 48;

	doc.setFontSize(9);
	doc.setFont("helvetica", "bold");
	doc.text(`Tel: ${SAWMILL_DATA.phone}`, infoX, infoY);

	infoY += 5;
	doc.setFontSize(7);
	doc.setFont("helvetica", "normal");
	doc.text(SAWMILL_DATA.owner, infoX, infoY);

	infoY += 4;
	doc.text(SAWMILL_DATA.address, infoX, infoY);

	infoY += 4;
	doc.text(SAWMILL_DATA.city, infoX, infoY);

	infoY += 3;
	doc.setFont("helvetica", "bold");
	doc.text(SAWMILL_DATA.vatCondition, infoX, infoY);

	// ==================== RIGHT SIDE - DOCUMENT DATA ====================

	// X Box
	const xBoxX = headerDividerX + 5;
	const xBoxY = 15;
	const xBoxSize = 15;

	doc.setLineWidth(1);
	doc.rect(xBoxX, xBoxY, xBoxSize, xBoxSize);

	// Letter X
	doc.setFontSize(24);
	doc.setFont("helvetica", "bold");
	doc.text("X", xBoxX + xBoxSize / 2, xBoxY + xBoxSize - 3, { align: "center" });

	// Title REMITO (Keep Spanish title in PDF)
	doc.setFontSize(14);
	doc.setFont("helvetica", "bold");
	doc.text("R.E.M.I.T.O", xBoxX + xBoxSize + 15, 22);

	doc.setFontSize(6);
	doc.setFont("helvetica", "normal");
	doc.text("DOCUMENTO NO VALIDO COMO FACTURA", xBoxX + xBoxSize + 5, 27);

	// Document Number
	doc.setFontSize(10);
	doc.setFont("helvetica", "bold");
	doc.text(`N°${data.salePoint}:`, xBoxX + xBoxSize + 5, 35);
	doc.text(data.documentNumber.padStart(8, "0"), xBoxX + xBoxSize + 30, 35);

	// Date
	doc.setFontSize(8);
	doc.setFont("helvetica", "bold");
	doc.text("Fecha:", xBoxX + xBoxSize + 5, 42);
	doc.setFont("helvetica", "normal");
	doc.text(data.date, xBoxX + xBoxSize + 20, 42);

	// Fiscal Data
	let fiscalY = 48;
	doc.setFontSize(6);
	doc.setFont("helvetica", "normal");

	doc.text(`CUIT: ${SAWMILL_DATA.cuit}`, xBoxX, fiscalY);
	fiscalY += 3.5;
	doc.text(`ING. BRUTOS: ${SAWMILL_DATA.grossIncome}`, xBoxX, fiscalY);
	fiscalY += 3.5;
	doc.text(`Nº ESTABLEC.: ${SAWMILL_DATA.establishmentNumber}`, xBoxX, fiscalY);

	const fiscalY2 = 48;
	doc.text(`SEDE TAMIZADO: ${SAWMILL_DATA.sievingHeadquarters}`, xBoxX + 40, fiscalY2);
	doc.text(
		`INICIO ACTIVIDAD: ${SAWMILL_DATA.activityStart}`,
		xBoxX + 40,
		fiscalY2 + 3.5
	);

	// ==================== CUSTOMER SECTION ====================

	let customerY = 70;
	const labelWidth = 25;

	doc.setFontSize(8);
	doc.setFont("helvetica", "bold");
	doc.text("Cliente:", margin + 3, customerY);
	doc.setFont("helvetica", "normal");
	doc.text(data.customer, margin + labelWidth, customerY);
	doc.setLineWidth(0.3);
	doc.line(margin + labelWidth - 2, customerY + 1, pageWidth - margin - 3, customerY + 1);

	customerY += 7;
	doc.setFont("helvetica", "bold");
	doc.text("Domicilio:", margin + 3, customerY);
	doc.setFont("helvetica", "normal");
	doc.text(data.address, margin + labelWidth, customerY);
	doc.line(margin + labelWidth - 2, customerY + 1, pageWidth - margin - 3, customerY + 1);

	customerY += 7;
	doc.setFont("helvetica", "bold");
	doc.text("Cuit:", margin + 3, customerY);
	doc.setFont("helvetica", "normal");
	doc.text(data.taxId, margin + labelWidth, customerY);
	doc.line(margin + labelWidth - 2, customerY + 1, margin + 70, customerY + 1);

	// Sale Conditions
	doc.setFont("helvetica", "bold");
	doc.text("Cond. Venta:", margin + 75, customerY);

	const conditionsX = margin + 110;
	doc.setFont("helvetica", "normal");

	// Cash checkbox
	doc.rect(conditionsX, customerY - 3, 4, 4);
	if (data.saleCondition === "cash") {
		doc.text("X", conditionsX + 0.8, customerY);
	}
	doc.text("Contado", conditionsX + 6, customerY);

	// Current Account checkbox
	doc.rect(conditionsX + 28, customerY - 3, 4, 4);
	if (data.saleCondition === "currentAccount") {
		doc.text("X", conditionsX + 28.8, customerY);
	}
	doc.text("Cta. Cte.", conditionsX + 34, customerY);

	// VAT
	customerY += 7;
	doc.setFont("helvetica", "bold");
	doc.text("IVA:", margin + 3, customerY);

	doc.setFont("helvetica", "normal");
	const vatOptions = [
		{ label: "Resp. Insc.", value: "registeredResp", x: margin + 18 },
		{ label: "Monotributo", value: "monotributo", x: margin + 48 },
		{ label: "No Insc.", value: "unregisteredResp", x: margin + 80 },
		{ label: "Exento", value: "exempt", x: margin + 110 },
		{ label: "Cons. Final", value: "finalConsumer", x: margin + 135 },
	];

	vatOptions.forEach((opt) => {
		doc.rect(opt.x - 5, customerY - 3, 4, 4);
		if (data.vatCondition === opt.value) {
			doc.text("X", opt.x - 4.2, customerY);
		}
		doc.text(opt.label, opt.x, customerY);
	});

	// Divider line before table
	customerY += 5;
	doc.setLineWidth(0.5);
	doc.line(margin, customerY, pageWidth - margin, customerY);

	// ==================== DETAILS TABLE ====================

	const tableY = customerY + 2;
	const quantityWidth = 25;

	// Table Headers
	doc.setFontSize(9);
	doc.setFont("helvetica", "bold");
	doc.text("CANTIDAD", margin + 3, tableY + 5);
	doc.text("DETALLE", margin + quantityWidth + 10, tableY + 5);

	// Header divider
	doc.line(margin, tableY + 7, pageWidth - margin, tableY + 7);

	// Vertical line between QUANTITY and DETAIL
	doc.line(margin + quantityWidth, tableY, margin + quantityWidth, pageHeight - 35);

	// Table lines and content
	const rowHeight = 8;
	let currentY = tableY + 7;
	const tableEndY = pageHeight - 35;

	doc.setLineWidth(0.2);
	doc.setFont("helvetica", "normal");
	doc.setFontSize(8);

	let rowIndex = 0;
	while (currentY + rowHeight < tableEndY) {
		currentY += rowHeight;
		doc.line(margin, currentY, pageWidth - margin, currentY);

		// Add items data if exists
		if (rowIndex < data.items.length) {
			const item = data.items[rowIndex];
			if (item.quantity) {
				doc.text(String(item.quantity), margin + 3, currentY - 2);
			}
			if (item.description) {
				doc.text(item.description, margin + quantityWidth + 3, currentY - 5);
			}
		}
		rowIndex++;
	}

	// ==================== FOOTER ====================

	const footerY = pageHeight - 30;

	// Footer top line
	doc.setLineWidth(0.5);
	doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

	// Recibí Conforme
	doc.setFontSize(8);
	doc.setFont("helvetica", "bold");
	doc.text("Recibí Conforme:", margin + 3, footerY);

	// Signature lines
	const signatureX = pageWidth - margin - 60;
	doc.setLineWidth(0.3);

	doc.text("Aclaración:", signatureX, footerY);
	doc.line(signatureX + 20, footerY, pageWidth - margin - 3, footerY);

	doc.text("Firma:", signatureX, footerY + 8);
	doc.line(signatureX + 15, footerY + 8, pageWidth - margin - 3, footerY + 8);

	// Consumer Defense
	doc.setFontSize(6);
	doc.setFont("helvetica", "normal");
	doc.text("DEFENSA DEL CONSUMIDOR MZA. 0800 222 6678", pageWidth / 2, footerY + 15, {
		align: "center",
	});

	// ==================== SAVE PDF ====================

	return doc;
}

export function generateDeliveryNotePDF(data: DeliveryNoteData) {
	const doc = getDeliveryNoteDoc(data);
	doc.save(`remito_${data.documentNumber.padStart(8, "0")}.pdf`);
}
