import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientes } from "@/lib/db/schema";
import { eq, like, or, sql } from "drizzle-orm";

// GET - Obtener todos los clientes o buscar
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const search = searchParams.get("search");
		const estado = searchParams.get("estado");

		let query = db.select().from(clientes);

		// Aplicar filtros
		const conditions = [];

		if (search) {
			conditions.push(
				or(
					like(clientes.nombre, `%${search}%`),
					like(clientes.email, `%${search}%`),
					like(clientes.cuit, `%${search}%`)
				)
			);
		}

		if (estado && estado !== "todos") {
			conditions.push(eq(clientes.estado, estado as any));
		}

		if (conditions.length > 0) {
			query = query.where(sql`${sql.join(conditions, sql` AND `)}`);
		}

		const result = await query;

		// Convertir centavos a pesos para la respuesta
		const clientesConPesos = result.map((cliente) => ({
			...cliente,
			saldoActual: cliente.saldoActual / 100,
			limiteCredito: cliente.limiteCredito / 100,
			// Convertir fechas a timestamps para evitar problemas de serialización
			fechaAlta: cliente.fechaAlta ? new Date(cliente.fechaAlta).getTime() : null,
			ultimaCompra: cliente.ultimaCompra ? new Date(cliente.ultimaCompra).getTime() : null,
			createdAt: cliente.createdAt ? new Date(cliente.createdAt).getTime() : null,
			updatedAt: cliente.updatedAt ? new Date(cliente.updatedAt).getTime() : null,
		}));

		return NextResponse.json(clientesConPesos);
	} catch (error) {
		console.error("Error al obtener clientes:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}

// POST - Crear nuevo cliente
export async function POST(request: NextRequest) {
	try {
		const data = await request.json();
		const {
			nombre,
			email,
			telefono,
			direccion,
			cuit,
			limiteCredito = 0,
			estado = "activo",
		} = data;

		if (!nombre || !email || !telefono || !direccion || !cuit) {
			return NextResponse.json(
				{ error: "Todos los campos son requeridos" },
				{ status: 400 }
			);
		}

		// Verificar si el CUIT ya existe
		const [existingCliente] = await db
			.select()
			.from(clientes)
			.where(eq(clientes.cuit, cuit))
			.limit(1);

		if (existingCliente) {
			return NextResponse.json(
				{ error: "El CUIT ya está registrado" },
				{ status: 409 }
			);
		}

		// Crear cliente (convertir pesos a centavos)
		const [newCliente] = await db
			.insert(clientes)
			.values({
				nombre,
				email,
				telefono,
				direccion,
				cuit,
				saldoActual: 0,
				limiteCredito: Math.round(limiteCredito * 100),
				estado,
			})
			.returning();

		// Convertir centavos a pesos para la respuesta
		const clienteConPesos = {
			...newCliente,
			saldoActual: newCliente.saldoActual / 100,
			limiteCredito: newCliente.limiteCredito / 100,
			// Convertir fechas a timestamps
			fechaAlta: newCliente.fechaAlta ? new Date(newCliente.fechaAlta).getTime() : null,
			ultimaCompra: newCliente.ultimaCompra ? new Date(newCliente.ultimaCompra).getTime() : null,
			createdAt: newCliente.createdAt ? new Date(newCliente.createdAt).getTime() : null,
			updatedAt: newCliente.updatedAt ? new Date(newCliente.updatedAt).getTime() : null,
		};

		return NextResponse.json(clienteConPesos, { status: 201 });
	} catch (error) {
		console.error("Error al crear cliente:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}
