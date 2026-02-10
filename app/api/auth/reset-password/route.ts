import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
	try {
		const { email, tempPassword } = await request.json();

		if (!email || !tempPassword) {
			return NextResponse.json(
				{ error: "Email y contraseña temporal son requeridos" },
				{ status: 400 }
			);
		}

		// Hashear contraseña temporal
		const hashedPassword = await bcrypt.hash(tempPassword, 10);

		// Actualizar contraseña y marcar para cambio obligatorio
		const result = await db
			.update(users)
			.set({
				password: hashedPassword,
				mustChangePassword: true,
				updatedAt: new Date(),
			})
			.where(eq(users.email, email))
			.returning();

		if (result.length === 0) {
			return NextResponse.json(
				{ error: "Usuario no encontrado" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			message: "Contraseña reseteada exitosamente",
		});
	} catch (error) {
		console.error("Error al resetear contraseña:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}
