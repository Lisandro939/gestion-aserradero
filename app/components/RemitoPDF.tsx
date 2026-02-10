"use client";

import { jsPDF } from "jspdf";

// Tipos para los datos del formulario
export interface ItemRemito {
	cantidad: string;
	detalle: string;
}

export interface DatosRemito {
	// Datos del documento
	numeroDocumento: string;
	fecha: string;

	// Datos del cliente
	cliente: string;
	domicilio: string;
	cuit: string;

	// Condiciones de venta
	condicionVenta: "contado" | "ctaCorriente";

	// Condición IVA
	condicionIva: "respInsc" | "monotributo" | "respNoInsc" | "exento" | "consFinal";

	// Items de la tabla
	items: ItemRemito[];
}

// Datos del aserradero (fijos)
const ASERRADERO_DATA = {
	nombre: "ASERRADERO DON GUSTAVO",
	propietario: "de CHACON GUSTAVO ADOLFO",
	telefono: "2612429703",
	direccion: "Ruta 36 S/N - Tres de Mayo",
	localidad: "Lavalle - Mendoza",
	cuit: "20-21917064-6",
	ingBrutos: "02M310",
	nroEstablec: "13-02943-10-00",
	sedeTamizado: "01",
	inicioActividad: "01-06-1996",
	ivaCondicion: "IVA RESPONSABLE INSCRIPTO",
	puntoVenta: "0001",
};

export function generarRemitoPDF(datos: DatosRemito) {
	const doc = new jsPDF({
		orientation: "portrait",
		unit: "mm",
		format: "a4",
	});

	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const margin = 10;

	// ==================== ENCABEZADO ====================

	// Borde del documento
	doc.setDrawColor(0);
	doc.setLineWidth(0.5);
	doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);

	// Línea divisoria vertical del encabezado
	const headerDividerX = pageWidth / 2;
	doc.line(headerDividerX, margin, headerDividerX, 65);

	// Línea horizontal inferior del encabezado
	doc.line(margin, 65, pageWidth - margin, 65);

	// ==================== LADO IZQUIERDO - DATOS DEL ASERRADERO ====================

	// Logo circular (simulado con un círculo y texto)
	const logoX = margin + 25;
	const logoY = 28;
	const logoRadius = 15;

	doc.setDrawColor(0);
	doc.setLineWidth(1);
	doc.circle(logoX, logoY, logoRadius);

	// Círculo interior (sierra simulada)
	doc.setLineWidth(0.5);
	doc.circle(logoX, logoY, logoRadius - 3);

	// Texto del logo
	doc.setFontSize(6);
	doc.setFont("helvetica", "bold");

	// Texto circular superior "ASERRADERO"
	doc.text("ASERRADERO", logoX, logoY - 5, { align: "center" });
	doc.text("DON GUSTAVO", logoX, logoY + 1, { align: "center" });

	// Dibujar dientes de sierra (líneas radiales)
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

	// Información del aserradero
	const infoX = margin + 5;
	let infoY = 48;

	doc.setFontSize(9);
	doc.setFont("helvetica", "bold");
	doc.text(`Tel: ${ASERRADERO_DATA.telefono}`, infoX, infoY);

	infoY += 5;
	doc.setFontSize(7);
	doc.setFont("helvetica", "normal");
	doc.text(ASERRADERO_DATA.propietario, infoX, infoY);

	infoY += 4;
	doc.text(ASERRADERO_DATA.direccion, infoX, infoY);

	infoY += 4;
	doc.text(ASERRADERO_DATA.localidad, infoX, infoY);

	infoY += 3;
	doc.setFont("helvetica", "bold");
	doc.text(ASERRADERO_DATA.ivaCondicion, infoX, infoY);

	// ==================== LADO DERECHO - DATOS DEL DOCUMENTO ====================

	// Cuadro de la X
	const xBoxX = headerDividerX + 5;
	const xBoxY = 15;
	const xBoxSize = 15;

	doc.setLineWidth(1);
	doc.rect(xBoxX, xBoxY, xBoxSize, xBoxSize);

	// Letra X
	doc.setFontSize(24);
	doc.setFont("helvetica", "bold");
	doc.text("X", xBoxX + xBoxSize / 2, xBoxY + xBoxSize - 3, { align: "center" });

	// Título REMITO
	doc.setFontSize(14);
	doc.setFont("helvetica", "bold");
	doc.text("R.E.M.I.T.O", xBoxX + xBoxSize + 15, 22);

	doc.setFontSize(6);
	doc.setFont("helvetica", "normal");
	doc.text("DOCUMENTO NO VALIDO COMO FACTURA", xBoxX + xBoxSize + 5, 27);

	// Número del documento
	doc.setFontSize(10);
	doc.setFont("helvetica", "bold");
	doc.text(`N°${ASERRADERO_DATA.puntoVenta}:`, xBoxX + xBoxSize + 5, 35);
	doc.text(datos.numeroDocumento.padStart(8, "0"), xBoxX + xBoxSize + 30, 35);

	// Fecha
	doc.setFontSize(8);
	doc.setFont("helvetica", "bold");
	doc.text("Fecha:", xBoxX + xBoxSize + 5, 42);
	doc.setFont("helvetica", "normal");
	doc.text(datos.fecha, xBoxX + xBoxSize + 20, 42);

	// Datos fiscales
	let fiscalY = 48;
	doc.setFontSize(6);
	doc.setFont("helvetica", "normal");

	doc.text(`CUIT: ${ASERRADERO_DATA.cuit}`, xBoxX, fiscalY);
	fiscalY += 3.5;
	doc.text(`ING. BRUTOS: ${ASERRADERO_DATA.ingBrutos}`, xBoxX, fiscalY);
	fiscalY += 3.5;
	doc.text(`Nº ESTABLEC.: ${ASERRADERO_DATA.nroEstablec}`, xBoxX, fiscalY);

	const fiscalY2 = 48;
	doc.text(`SEDE TAMIZADO: ${ASERRADERO_DATA.sedeTamizado}`, xBoxX + 40, fiscalY2);
	doc.text(
		`INICIO ACTIVIDAD: ${ASERRADERO_DATA.inicioActividad}`,
		xBoxX + 40,
		fiscalY2 + 3.5
	);

	// ==================== SECCIÓN CLIENTE ====================

	let clienteY = 70;
	const labelWidth = 25;

	doc.setFontSize(8);
	doc.setFont("helvetica", "bold");
	doc.text("Cliente:", margin + 3, clienteY);
	doc.setFont("helvetica", "normal");
	doc.text(datos.cliente, margin + labelWidth, clienteY);
	doc.setLineWidth(0.3);
	doc.line(margin + labelWidth - 2, clienteY + 1, pageWidth - margin - 3, clienteY + 1);

	clienteY += 7;
	doc.setFont("helvetica", "bold");
	doc.text("Domicilio:", margin + 3, clienteY);
	doc.setFont("helvetica", "normal");
	doc.text(datos.domicilio, margin + labelWidth, clienteY);
	doc.line(margin + labelWidth - 2, clienteY + 1, pageWidth - margin - 3, clienteY + 1);

	clienteY += 7;
	doc.setFont("helvetica", "bold");
	doc.text("Cuit:", margin + 3, clienteY);
	doc.setFont("helvetica", "normal");
	doc.text(datos.cuit, margin + labelWidth, clienteY);
	doc.line(margin + labelWidth - 2, clienteY + 1, margin + 70, clienteY + 1);

	// Condiciones de venta
	doc.setFont("helvetica", "bold");
	doc.text("Cond. Venta:", margin + 75, clienteY);

	const condicionesX = margin + 110;
	doc.setFont("helvetica", "normal");

	// Contado checkbox
	doc.rect(condicionesX, clienteY - 3, 4, 4);
	if (datos.condicionVenta === "contado") {
		doc.text("X", condicionesX + 0.8, clienteY);
	}
	doc.text("Contado", condicionesX + 6, clienteY);

	// Cta. Corriente checkbox
	doc.rect(condicionesX + 28, clienteY - 3, 4, 4);
	if (datos.condicionVenta === "ctaCorriente") {
		doc.text("X", condicionesX + 28.8, clienteY);
	}
	doc.text("Cta. Cte.", condicionesX + 34, clienteY);

	// IVA
	clienteY += 7;
	doc.setFont("helvetica", "bold");
	doc.text("IVA:", margin + 3, clienteY);

	doc.setFont("helvetica", "normal");
	const ivaOptions = [
		{ label: "Resp. Insc.", value: "respInsc", x: margin + 18 },
		{ label: "Monotributo", value: "monotributo", x: margin + 48 },
		{ label: "No Insc.", value: "respNoInsc", x: margin + 80 },
		{ label: "Exento", value: "exento", x: margin + 110 },
		{ label: "Cons. Final", value: "consFinal", x: margin + 135 },
	];

	ivaOptions.forEach((opt) => {
		doc.rect(opt.x - 5, clienteY - 3, 4, 4);
		if (datos.condicionIva === opt.value) {
			doc.text("X", opt.x - 4.2, clienteY);
		}
		doc.text(opt.label, opt.x, clienteY);
	});

	// Línea divisoria antes de la tabla
	clienteY += 5;
	doc.setLineWidth(0.5);
	doc.line(margin, clienteY, pageWidth - margin, clienteY);

	// ==================== TABLA DE DETALLE ====================

	const tablaY = clienteY + 2;
	const cantidadWidth = 25;

	// Encabezados de la tabla
	doc.setFontSize(9);
	doc.setFont("helvetica", "bold");
	doc.text("CANTIDAD", margin + 3, tablaY + 5);
	doc.text("DETALLE", margin + cantidadWidth + 10, tablaY + 5);

	// Línea divisoria de encabezados
	doc.line(margin, tablaY + 7, pageWidth - margin, tablaY + 7);

	// Línea vertical entre CANTIDAD y DETALLE
	doc.line(margin + cantidadWidth, tablaY, margin + cantidadWidth, pageHeight - 35);

	// Líneas de la tabla y contenido
	const rowHeight = 8;
	let currentY = tablaY + 7;
	const tableEndY = pageHeight - 35;

	doc.setLineWidth(0.2);
	doc.setFont("helvetica", "normal");
	doc.setFontSize(8);

	let rowIndex = 0;
	while (currentY + rowHeight < tableEndY) {
		currentY += rowHeight;
		doc.line(margin, currentY, pageWidth - margin, currentY);

		// Agregar datos de los items si existen
		if (rowIndex < datos.items.length) {
			const item = datos.items[rowIndex];
			if (item.cantidad) {
				doc.text(item.cantidad, margin + 3, currentY - 2);
			}
			if (item.detalle) {
				doc.text(item.detalle, margin + cantidadWidth + 3, currentY - 2);
			}
		}
		rowIndex++;
	}

	// ==================== PIE DEL DOCUMENTO ====================

	const footerY = pageHeight - 30;

	// Línea superior del footer
	doc.setLineWidth(0.5);
	doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

	// Recibí Conforme
	doc.setFontSize(8);
	doc.setFont("helvetica", "bold");
	doc.text("Recibí Conforme:", margin + 3, footerY);

	// Líneas para firma
	const firmaX = pageWidth - margin - 60;
	doc.setLineWidth(0.3);

	doc.text("Aclaración:", firmaX, footerY);
	doc.line(firmaX + 20, footerY, pageWidth - margin - 3, footerY);

	doc.text("Firma:", firmaX, footerY + 8);
	doc.line(firmaX + 15, footerY + 8, pageWidth - margin - 3, footerY + 8);

	// Defensa del consumidor
	doc.setFontSize(6);
	doc.setFont("helvetica", "normal");
	doc.text("DEFENSA DEL CONSUMIDOR MZA. 0800 222 6678", pageWidth / 2, footerY + 15, {
		align: "center",
	});

	// ==================== GUARDAR PDF ====================

	doc.save(`remito_${datos.numeroDocumento.padStart(8, "0")}.pdf`);
}
