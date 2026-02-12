import { NextResponse } from "next/server";

// Simulamos una base de datos en memoria para los items históricos de facturas
// En producción, esto debería estar en una base de datos real
let historicalItems: Set<string> = new Set();

export async function GET() {
	try {
		// Retornar los items únicos ordenados alfabéticamente
		const items = Array.from(historicalItems).sort();
		return NextResponse.json(items);
	} catch (error) {
		console.error("Error fetching historical items:", error);
		return NextResponse.json(
			{ error: "Error fetching historical items" },
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
	try {
		const { items } = await request.json();

		if (!Array.isArray(items)) {
			return NextResponse.json(
				{ error: "Expected an array of items" },
				{ status: 400 }
			);
		}

		// Agregar los nuevos items al set (automáticamente elimina duplicados)
		items.forEach((item: string) => {
			if (item && item.trim()) {
				historicalItems.add(item.trim());
			}
		});

		return NextResponse.json({
			success: true,
			totalItems: historicalItems.size
		});
	} catch (error) {
		console.error("Error saving historical items:", error);
		return NextResponse.json(
			{ error: "Error saving historical items" },
			{ status: 500 }
		);
	}
}
