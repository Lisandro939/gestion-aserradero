import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { facturas, facturaItems } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

// GET - Obtener todas las facturas
export async function GET() {
	try {
		const result = await db
			.select()
			.from(facturas)
			.orderBy(desc(facturas.createdAt));

		// Convertir centavos a pesos para la respuesta
		const facturasConPesos = result.map((factura) => ({
			...factura,
			total: factura.total / 100,
			// Convertir fechas a timestamps para cliente (opcional si ya es timestamp)
			// Drizzle devuelve Date object para timestamp mode, lo pasamos a ISO string o timestamp
			fecha: factura.fecha ? new Date(factura.fecha).toLocaleDateString("es-AR") : null,
			createdAt: factura.createdAt,
		}));

		return NextResponse.json(facturasConPesos);
	} catch (error) {
		console.error("Error al obtener facturas:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}

// POST - Crear nueva factura
export async function POST(request: NextRequest) {
	try {
		const data = await request.json();
		const {
			presupuesto,
			fecha, // String "DD/MM/YYYY" or ISO? Client sends "DD/MM/YYYY" via new Date().toLocaleDateString("es-AR")?
			cliente,
			domicilio,
			localidad,
			telefono,
			mov,
			vendedor,
			observaciones,
			items,
		} = data;

		if (!cliente || !items || items.length === 0) {
			return NextResponse.json(
				{ error: "Cliente e items son requeridos" },
				{ status: 400 }
			);
		}

		// Calcular total
		let totalEnCentavos = 0;
		// Validar y limpiar items
		const itemsProcesados = items
			.filter((item: any) => {
				const hasDescription = item.descripcion && item.descripcion.trim() !== "";
				const hasAmount =
					(parseFloat(item.cantidad) || 0) > 0 || (parseFloat(item.importe) || 0) > 0;
				return hasDescription || hasAmount;
			})
			.map((item: any) => {
				const precio = parseFloat(item.precio) || 0;
				const cantidad = parseFloat(item.cantidad) || 0;
				const dto = parseFloat(item.dto) || 0;

				const subtotal = precio * cantidad;
				const descuento = subtotal * (dto / 100);
				const importe = subtotal - descuento;

				totalEnCentavos += Math.round(importe * 100);

				return {
					cantidad: item.cantidad.toString(),
					descripcion: item.descripcion,
					codigo: item.codigo,
					precioUnitario: Math.round(precio * 100),
					dto: item.dto.toString(),
					importe: Math.round(importe * 100),
				};
			});

		// Parse fecha (DD/MM/YYYY or ISO)
		// Client sends formatted string "DD/MM/YYYY" likely, or whatever input has.
		// If input has "10/02/2026", new Date("10/02/2026") might be invalid in JS (expects MM/DD/YYYY).
		// We should handle date parsing or store as current date if invalid.
		// Better: use new Date() if not provided or valid.
		// If client sends "DD/MM/YYYY", we need to parse it.
		let fechaDate = new Date();
		if (fecha && fecha.includes("/")) {
			const [day, month, year] = fecha.split("/");
			fechaDate = new Date(`${year}-${month}-${day}`);
		} else if (fecha) {
			fechaDate = new Date(fecha);
		}

		// Crear factura
		const [nuevaFactura] = await db
			.insert(facturas)
			.values({
				presupuesto,
				fecha: fechaDate,
				cliente, // Texto libre
				domicilio,
				localidad,
				telefono,
				mov,
				vendedor,
				observaciones,
				total: totalEnCentavos,
			})
			.returning();

		// Crear items
		if (itemsProcesados.length > 0) {
			await db.insert(facturaItems).values(
				itemsProcesados.map((item: any) => ({
					facturaId: nuevaFactura.id,
					...item,
				}))
			);
		}

		// Respuesta
		const facturaResponse = {
			...nuevaFactura,
			total: nuevaFactura.total / 100,
			items: itemsProcesados.map((item: any) => ({
				...item,
				precioUnitario: item.precioUnitario / 100,
				importe: item.importe / 100,
			})),
		};

		return NextResponse.json(facturaResponse, { status: 201 });
	} catch (error) {
		console.error("Error al crear factura:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}
