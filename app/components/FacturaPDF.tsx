import jsPDF from "jspdf";

export interface ItemFactura {
	cantidad: string;
	descripcion: string;
	codigo: string;
	precio: string;
	dto: string; // descuento
	importe: string;
}

export interface DatosFactura {
	presupuesto: string;
	fecha: string;
	cliente: string;
	domicilio: string;
	localidad: string;
	telefono: string;
	mov: string; // movimiento
	vendedor: string;
	observaciones: string;
	items: ItemFactura[];
}

export function generarFacturaPDF(datos: DatosFactura) {
	const doc = new jsPDF();
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const margin = 15;

	// Colores
	const colorGray = [60, 60, 60];
	const colorAmber = [217, 119, 6]; // Amber-600
	const colorLight = [245, 245, 245];
	const colorWhite = [255, 255, 255];

	// --- BARRA SUPERIOR DECORATIVA ---
	doc.setFillColor(colorAmber[0], colorAmber[1], colorAmber[2]);
	doc.rect(0, 0, pageWidth, 5, "F");

	// --- ENCABEZADO ---
	// Lado IZQUIERDO: Datos del Presupuesto
	const boxWidth = 80;
	const boxHeight = 25;
	const boxX = margin;
	const boxY = 15;

	// Fondo suave para el cuadro de Presupuesto
	doc.setFillColor(colorLight[0], colorLight[1], colorLight[2]);
	doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, "F");

	doc.setFont("helvetica", "bold");
	doc.setFontSize(14);
	doc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
	doc.text("PRESUPUESTO", boxX + (boxWidth / 2), boxY + 8, { align: "center" });

	doc.setFontSize(10);
	doc.text(`N°: ${datos.presupuesto || "BORRADOR"}`, boxX + (boxWidth / 2), boxY + 15, { align: "center" });

	doc.setFont("helvetica", "normal");
	doc.text(`Fecha: ${datos.fecha}`, boxX + (boxWidth / 2), boxY + 21, { align: "center" });

	// Lado DERECHO: Datos de la Empresa (ASERRADERO DON GUSTAVO)
	// ASERRADERO DON GUSTAVO
	// Maderas - Machimbres - Tirantes
	// Ruta Nacional 14, Km 880 - Oberá, Misiones
	// Tel: (3755) 445566

	const headerRightX = pageWidth - margin;
	let headerY = 20;

	doc.setFont("helvetica", "bold");
	doc.setFontSize(18); // Más grande
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

	// --- DATOS DEL CLIENTE ---
	const clientBoxY = 60;

	// Línea separadora
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

	// Fila 1
	doc.setFont("helvetica", "bold");
	doc.text("Cliente:", col1X, currentY);
	doc.setFont("helvetica", "normal");
	doc.text((datos.cliente || "").toUpperCase(), col1X + 25, currentY);

	doc.setFont("helvetica", "bold");
	doc.text("Vendedor:", col2X, currentY);
	doc.setFont("helvetica", "normal");
	doc.text(datos.vendedor || "-", col2X + 20, currentY);

	// Fila 2
	currentY += 6;
	doc.setFont("helvetica", "bold");
	doc.text("Dirección:", col1X, currentY);
	doc.setFont("helvetica", "normal");
	const direccionCompleta = `${datos.domicilio || ""} - ${datos.localidad || ""}`;
	doc.text(direccionCompleta.toUpperCase(), col1X + 25, currentY);

	doc.setFont("helvetica", "bold");
	doc.text("Teléfono:", col2X, currentY);
	doc.setFont("helvetica", "normal");
	doc.text(datos.telefono || "-", col2X + 20, currentY);

	// Observaciones
	if (datos.observaciones) {
		currentY += 6;
		doc.setFont("helvetica", "bold");
		doc.text("Nota:", col1X, currentY);
		doc.setFont("helvetica", "italic");
		const obsSplit = doc.splitTextToSize(datos.observaciones, pageWidth - margin - 50);
		doc.text(obsSplit, col1X + 25, currentY);
		currentY += (obsSplit.length - 1) * 4;
	}

	// --- TABLA DE ITEMS ---
	const tableStartY = currentY + 15;

	// Encabezados
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

	// Filas
	let rowY = tableStartY + 14;
	doc.setFont("helvetica", "normal");
	doc.setFontSize(9);
	doc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);

	let totalCalculado = 0;
	// Filtramos líneas vacías
	const itemsValidos = datos.items.filter(i => i.cantidad || i.descripcion || (parseFloat(i.precio) > 0));

	itemsValidos.forEach((item, index) => {
		// Calculate row height based on description
		const descWidth = 100; // Max width for description
		const descLines = doc.splitTextToSize((item.descripcion || "").toUpperCase(), descWidth);
		const rowHeight = Math.max(8, descLines.length * 5 + 4);

		// Alternar color fondo
		if (index % 2 === 0) {
			doc.setFillColor(248, 248, 248);
			doc.rect(margin, rowY, pageWidth - margin * 2, rowHeight, "F");
		}

		// Text vertical centering approx
		const textY = rowY + 5;

		const cant = item.cantidad || "";
		doc.text(cant, colQtyX + 2, textY, { align: "center" });

		doc.text(descLines, colDescX, textY);

		const precio = parseFloat(item.precio) || 0;
		if (precio > 0 || (cant && descLines.length > 0)) {
			doc.text(precio.toLocaleString("es-AR", { minimumFractionDigits: 2 }), colPriceX, textY, { align: "right" });
		}

		// Importe logic
		let importe = parseFloat(item.importe) || 0;
		if (importe === 0 && precio > 0) {
			const q = parseFloat(item.cantidad) || 0;
			const dto = parseFloat(item.dto) || 0;
			importe = (q * precio) * (1 - dto / 100);
		}

		if (importe > 0) {
			doc.text(importe.toLocaleString("es-AR", { minimumFractionDigits: 2 }), colTotalX, textY, { align: "right" });
			totalCalculado += importe;
		}

		rowY += rowHeight;

		// Salto de página
		if (rowY > pageHeight - 40) {
			doc.addPage();
			// Re-draw header? Usually simplified header.
			rowY = 20;
		}
	});

	// Línea total
	doc.setDrawColor(colorAmber[0], colorAmber[1], colorAmber[2]);
	doc.setLineWidth(0.5);
	doc.line(margin, rowY, pageWidth - margin, rowY);

	// Total Final
	const totalY = rowY + 10;
	doc.setFontSize(12);
	doc.setFont("helvetica", "bold");
	doc.text("TOTAL ESTIMADO", pageWidth - margin - 40, totalY, { align: "right" });

	doc.setFontSize(14);
	doc.setTextColor(colorAmber[0], colorAmber[1], colorAmber[2]);
	doc.text(`$ ${totalCalculado.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, totalY, { align: "right" });

	// Pie
	doc.setFontSize(8);
	doc.setTextColor(150, 150, 150);
	doc.setFont("helvetica", "italic");
	doc.text("Documento no válido como factura fiscal - Presupuesto sujeto a cambios", pageWidth / 2, pageHeight - 15, { align: "center" });

	// Nombre del archivo
	const cleanClient = (datos.cliente || "Cliente").replace(/[^a-z0-9]/gi, "_");
	const fileName = `Presupuesto_${datos.presupuesto || "BORRADOR"}_${cleanClient}.pdf`;
	doc.save(fileName);
}
