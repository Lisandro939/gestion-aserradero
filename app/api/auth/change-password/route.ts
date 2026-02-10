import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
	try {
		const { email, newPassword } = await request.json();

		if (!email || !newPassword) {
			return NextResponse.json(
				{ error: "Email y nueva contraseña son requeridos" },
				{ status: 400 }
			);
		}

		// Validar longitud de contraseña
		if (newPassword.length < 6) {
			return NextResponse.json(
				{ error: "La contraseña debe tener al menos 6 caracteres" },
				{ status: 400 }
			);
		}

		// Hashear nueva contraseña
		const hashedPassword = await bcrypt.hash(newPassword, 10);

		// Actualizar contraseña
		const result = await db
			.update(users)
			.set({
				password: hashedPassword,
				mustChangePassword: false,
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
			message: "Contraseña actualizada exitosamente",
		});
	} catch (error) {
		console.error("Error al cambiar contraseña:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}
