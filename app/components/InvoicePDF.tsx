import jsPDF from "jspdf";
// @ts-ignore
import autoTable from "jspdf-autotable";

export interface InvoiceItem {
	quantity: string;
	description: string;
	code: string;
	price: string;
	discount: string;
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
	movementType: string;
	salesperson: string;
	notes: string;
	items: InvoiceItem[];
}

const loadImage = (url: string): Promise<HTMLImageElement> => {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.src = url;
		img.onload = () => resolve(img);
		img.onerror = (err) => reject(err);
	});
};

export async function getInvoiceDoc(data: InvoiceData) {
	const doc = new jsPDF();
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const margin = 15;

	// Helper for borders
	const drawBorder = (x: number, y: number, w: number, h: number) => {
		doc.setDrawColor(0);
		doc.setLineWidth(0.5);
		doc.rect(x, y, w, h);
	};

	// --- 1. Top Warning ---
	doc.setFontSize(8);
	doc.setFont("helvetica", "bold");
	doc.text("DOCUMENTO NO VALIDO COMO FACTURA", margin, 10);
	doc.line(margin, 12, pageWidth - margin, 12);

	// --- 2. Header ---
	// Logo - Grayscale
	try {
		const logo = await loadImage("/logo-aserradero.png");
		const logoWidth = 45;
		const logoHeight = (logo.height * logoWidth) / logo.width;

		// Create canvas to make it grayscale
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (ctx) {
			canvas.width = logo.width;
			canvas.height = logo.height;
			ctx.drawImage(logo, 0, 0);
			const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const data = imgData.data;
			for (let i = 0; i < data.length; i += 4) {
				const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
				data[i] = avg; // red
				data[i + 1] = avg; // green
				data[i + 2] = avg; // blue
			}
			ctx.putImageData(imgData, 0, 0);
			const grayscaleDataUrl = canvas.toDataURL('image/png');
			doc.addImage(grayscaleDataUrl, "PNG", margin, 15, logoWidth, logoHeight);
		} else {
			doc.addImage(logo, "PNG", margin, 15, logoWidth, logoHeight);
		}

	} catch (e) {
		console.error("Could not load logo", e);
		// Fallback text if logo fails
		doc.setFontSize(18);
		doc.setFont("helvetica", "bold");
		doc.text("ASERRADERO DON GUSTAVO", margin, 25);
	}

	// Budget Details (Right Side)
	const headerRightX = pageWidth - margin - 60;
	let headerY = 20;

	doc.setFontSize(10);
	doc.setFont("helvetica", "bold");

	doc.text("Factura:", headerRightX, headerY);
	doc.setFont("courier", "bold");
	doc.setFontSize(12);
	doc.text((data.budgetNumber || "00000000").toString().padStart(8, "0"), headerRightX + 25, headerY);

	headerY += 6;
	doc.setFont("helvetica", "bold");
	doc.setFontSize(10);
	doc.text("Punto de Vta.:", headerRightX, headerY); // Align 'Punto de Vta.:' label
	doc.setFont("courier", "bold");
	doc.setFontSize(12);
	doc.text((data.salePoint || "001").toString(), headerRightX + 25, headerY);

	headerY += 6;
	doc.setFont("helvetica", "bold");
	doc.setFontSize(10);
	doc.text("Fecha:", headerRightX + 12, headerY, { align: "right" }); // Align 'Fecha:' label
	doc.setFont("helvetica", "normal");
	doc.text(data.date, headerRightX + 14, headerY); // Value

	// --- 3. Client Info Block ---
	const infoBoxY = 60; // Shift down slightly due to extra header line
	const infoBoxHeight = 35;

	// Upper line of info box
	doc.line(margin, infoBoxY, pageWidth - margin, infoBoxY);

	let infoY = infoBoxY + 6;
	const leftColX = margin + 2;
	const rightColX = pageWidth / 2 + 10;

	doc.setFontSize(9);

	// Row 1
	doc.setFont("helvetica", "bold");
	doc.text("Cliente:", leftColX, infoY);
	doc.setFont("helvetica", "normal");
	doc.text((data.customer || "").toUpperCase(), leftColX + 25, infoY);

	doc.setFont("helvetica", "bold");
	doc.text("Mov:", rightColX, infoY);
	doc.setFont("helvetica", "normal");
	doc.text(data.movementType || "-", rightColX + 12, infoY);

	// Row 2
	infoY += 5;
	doc.setFont("helvetica", "bold");
	doc.text("Domicilio:", leftColX, infoY);
	doc.setFont("helvetica", "normal");
	doc.text((data.address || "").toUpperCase(), leftColX + 25, infoY);

	doc.setFont("helvetica", "bold");
	doc.text("Vend:", rightColX, infoY);
	doc.setFont("helvetica", "normal");
	doc.text((data.salesperson || "Administración").toUpperCase(), rightColX + 12, infoY);

	// Row 3 (Localidad)
	infoY += 5;
	doc.setFont("helvetica", "bold");
	doc.text("Localidad:", leftColX, infoY);
	doc.setFont("helvetica", "normal");
	doc.text((data.city || "").toUpperCase(), leftColX + 25, infoY);

	// Row 4 (Teléfono)
	infoY += 5;
	doc.setFont("helvetica", "bold");
	doc.text("Teléfono:", leftColX, infoY);
	doc.setFont("helvetica", "normal");
	doc.text(data.phone || "-", leftColX + 25, infoY);

	// Observations
	infoY += 8;
	doc.setFont("helvetica", "bold");
	doc.text("Observaciones:", leftColX, infoY);
	doc.setFont("helvetica", "normal");

	let notesHeight = 0;
	if (data.notes) {
		const maxNoteWidth = pageWidth - margin - (leftColX + 28) - margin;
		const splitNotes = doc.splitTextToSize(data.notes, maxNoteWidth);
		doc.text(splitNotes, leftColX + 28, infoY);
		notesHeight = (splitNotes.length - 1) * 3.5; // Approx height per extra line
	}

	// Underline for observations
	doc.setLineWidth(0.1);
	// doc.line(leftColX + 28, infoY + 1, pageWidth - margin - 2, infoY + 1);

	// Bottom line of info box (Top of table)
	// Dynamic table start, usually fixed but let's push it if notes are long
	const tableTopY = Math.max(infoBoxY + 30, infoY + notesHeight + 5);

	// --- 4. Items Table ---

	// Prepare table body
	const tableBody = data.items.map(item => {
		const unitPrice = parseFloat(item.price);
		const quantity = parseFloat(item.quantity);
		const discount = parseFloat(item.discount) || 0;
		let amount = parseFloat(item.amount);

		// Recalculate amount if needed ensures consistency
		if (!amount && unitPrice && quantity) {
			amount = (quantity * unitPrice) * (1 - discount / 100);
		}

		return [
			item.quantity,
			item.description.toUpperCase(),
			item.code || "-",
			unitPrice ? unitPrice.toLocaleString("es-AR", { minimumFractionDigits: 2 }) : "",
			discount > 0 ? `${discount}%` : "-",
			amount ? amount.toLocaleString("es-AR", { minimumFractionDigits: 2 }) : ""
		];
	});

	// @ts-ignore
	autoTable(doc, {
		startY: tableTopY,
		head: [['CANTIDAD', 'DESCRIPCION', 'COD.', 'PRECIO', 'DTO', 'IMPORTE']],
		body: tableBody,
		theme: 'plain',
		styles: {
			fontSize: 8,
			cellPadding: 2,
			lineColor: 0,
			lineWidth: 0.1,
		},
		headStyles: {
			fillColor: [240, 240, 240],
			textColor: 0,
			fontStyle: 'bold',
			halign: 'center',
			lineWidth: 0.1,
			lineColor: 0
		},
		columnStyles: {
			0: { halign: 'center', cellWidth: 20 }, // Cantidad
			1: { halign: 'left' }, // Descripcion
			2: { halign: 'center', cellWidth: 20 }, // Cod
			3: { halign: 'right', cellWidth: 25 }, // Precio
			4: { halign: 'center', cellWidth: 15 }, // Dto
			5: { halign: 'right', cellWidth: 25 }, // Importe
		},
		margin: { left: margin, right: margin },
		didDrawPage: (data: any) => {
			// Watermark on every page
			doc.saveGraphicsState();
			doc.setTextColor(230, 230, 230);
			doc.setFontSize(60);
			doc.setFont("helvetica", "bold");
			// Rotate -45 degrees
			// Translate to center
			const cx = pageWidth / 2;
			const cy = pageHeight / 2;

			// We need to implement rotation manually or use a context transform if available in this version of jsPDF.
			// Standard jsPDF text rotation:
			doc.restoreGraphicsState();
		}
	});

	// --- 5. Footer & Total ---
	// @ts-ignore
	const finalY = (doc as any).lastAutoTable.finalY + 5;

	// Total Line logic
	// If finalY is too close to bottom, add page
	if (finalY > pageHeight - 40) {
		doc.addPage();
		// finalY = 20; // reset
	}

	const totalBoxY = finalY;

	// Total Label and Value
	const total = data.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

	doc.setDrawColor(0);
	doc.setLineWidth(0.5);
	doc.line(margin, totalBoxY, pageWidth - margin, totalBoxY); // Line above total

	doc.setFontSize(12);
	doc.setFont("helvetica", "bold");
	doc.setTextColor(0);
	doc.text("TOTAL", pageWidth - margin - 50, totalBoxY + 10, { align: "right" });

	doc.setFillColor(240, 240, 240); // Light gray background for total
	doc.rect(pageWidth - margin - 45, totalBoxY + 2, 45, 12, "F");
	doc.rect(pageWidth - margin - 45, totalBoxY + 2, 45, 12, "S"); // Border

	doc.text(`$ ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, totalBoxY + 10, { align: "right" });

	return doc;
}

export async function generateInvoicePDF(data: InvoiceData) {
	const doc = await getInvoiceDoc(data);
	// Filename
	const cleanClient = (data.customer || "Cliente").replace(/[^a-z0-9]/gi, "_");
	const fileName = `Presupuesto_${data.budgetNumber || "BORRADOR"}_${cleanClient}.pdf`;
	doc.save(fileName);
}
