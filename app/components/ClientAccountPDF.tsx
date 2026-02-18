import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate, formatCurrency } from "@/lib/utils";

interface Transaction {
	id: number;
	date: number;
	documentNumber?: string;
	description: string;
	amount: number;
	balance: number;
	paymentMethod: string;
	type: 'purchase' | 'payment';
	cheque?: any;
}

interface AccountHistoryData {
	customerName: string;
	customerCuit?: string;
	customerAddress?: string;
	transactions: Transaction[];
}

const loadImage = (url: string): Promise<HTMLImageElement> => {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.src = url;
		img.onload = () => resolve(img);
		img.onerror = (err) => reject(err);
	});
};

export async function generateClientAccountPDF(data: AccountHistoryData) {
	const doc = new jsPDF();
	const pageWidth = doc.internal.pageSize.getWidth();
	const margin = 15;
	const today = new Date().toLocaleDateString("es-AR");

	// --- 1. Header ---
	try {
		const logo = await loadImage("/logo-aserradero.png");
		const logoWidth = 30;
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
			doc.addImage(grayscaleDataUrl, "PNG", margin, 10, logoWidth, logoHeight);
		} else {
			doc.addImage(logo, "PNG", margin, 10, logoWidth, logoHeight);
		}
	} catch (e) {
		doc.setFontSize(16);
		doc.setFont("helvetica", "bold");
		doc.text("ASERRADERO DON GUSTAVO", margin, 20);
	}

	doc.setFontSize(14);
	doc.setFont("helvetica", "bold");
	doc.text("RESUMEN DE CUENTA CORRIENTE", pageWidth - margin, 20, { align: "right" });

	doc.setFontSize(10);
	doc.setFont("helvetica", "normal");
	doc.text(`Fecha de emisión: ${today}`, pageWidth - margin, 26, { align: "right" });

	// --- 2. Customer Info ---
	const infoY = 40;
	doc.setDrawColor(200);
	doc.line(margin, infoY, pageWidth - margin, infoY);

	doc.setFont("helvetica", "bold");
	doc.text("Cliente:", margin, infoY + 8);
	doc.setFont("helvetica", "normal");
	doc.text(data.customerName, margin + 20, infoY + 8);

	if (data.customerCuit) {
		doc.setFont("helvetica", "bold");
		doc.text("CUIT:", margin, infoY + 14);
		doc.setFont("helvetica", "normal");
		doc.text(data.customerCuit, margin + 20, infoY + 14);
	}

	if (data.customerAddress) {
		doc.setFont("helvetica", "bold");
		doc.text("Dirección:", pageWidth / 2, infoY + 8);
		doc.setFont("helvetica", "normal");
		doc.text(data.customerAddress, (pageWidth / 2) + 20, infoY + 8);
	}

	// --- 3. Table ---
	const tableBody = data.transactions.map((t) => {
		const isDebit = t.type === 'purchase';
		const debitAmount = isDebit ? Math.abs(t.amount) : 0;
		const creditAmount = !isDebit ? t.amount : 0;

		let formaPago = t.paymentMethod;
		if (formaPago === 'current_account') formaPago = 'Cta. Cte.';
		if (formaPago === 'cheque') formaPago = 'Cheque';
		if (formaPago === 'transfer') formaPago = 'Transf.';
		if (formaPago === 'cash') formaPago = 'Efectivo';
		if (t.paymentMethod === 'cheque' && t.cheque) {
			formaPago += ` (#${t.cheque.number})`;
		}

		return [
			formatDate(t.date),
			t.documentNumber?.replace(/^Remito\s*#?\s*/i, "").trim() || "-",
			debitAmount > 0 ? formatCurrency(debitAmount) : "-",
			creditAmount > 0 ? formatCurrency(creditAmount) : "-",
			formatCurrency(t.balance),
			formaPago
		];
	});

	// @ts-ignore
	autoTable(doc, {
		startY: infoY + 25,
		head: [['FECHA', 'REMITO', 'DEBE', 'HABER', 'SALDO', 'FORMA DE PAGO']],
		body: tableBody,
		theme: 'striped',
		styles: {
			fontSize: 9,
			cellPadding: 3,
		},
		headStyles: {
			fillColor: [245, 245, 245], // Light gray
			textColor: 50,
			fontStyle: 'bold',
			halign: 'center',
		},
		columnStyles: {
			0: { halign: 'center' }, // Fecha
			2: { halign: 'right' }, // Total (Debit)
			3: { halign: 'right' }, // Paga (Credit)
			4: { halign: 'right', fontStyle: 'bold' }, // Saldo
			5: { halign: 'center' } // Forma Pago
		},
	});

	// --- 4. Final Balance ---
	// @ts-ignore
	const finalY = doc.lastAutoTable.finalY + 10;

	// Get the last balance from the last transaction
	const currentBalance = data.transactions.length > 0 ? data.transactions[0].balance : 0; // Assuming desc order, actually wait.
	// The API returns transactions in DESC order (newest first).
	// So data.transactions[0].balance is the CURRENT balance.

	doc.setFontSize(12);
	doc.setFont("helvetica", "bold");
	doc.text(`Saldo Actual: ${formatCurrency(currentBalance)}`, pageWidth - margin, finalY, { align: "right" });

	doc.save(`Resumen_Cuenta_${data.customerName.replace(/[^a-z0-9]/gi, '_')}.pdf`);
}
