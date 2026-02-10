import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return NextResponse.json(
				{ error: "Email y contraseña son requeridos" },
				{ status: 400 }
			);
		}

		// Buscar usuario por email
		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (!user) {
			return NextResponse.json(
				{ error: "Credenciales inválidas" },
				{ status: 401 }
			);
		}

		// Verificar contraseña
		const isValidPassword = await bcrypt.compare(password, user.password);

		if (!isValidPassword) {
			return NextResponse.json(
				{ error: "Credenciales inválidas" },
				{ status: 401 }
			);
		}

		// Retornar usuario sin la contraseña
		const { password: _, ...userWithoutPassword } = user;

		return NextResponse.json({
			user: userWithoutPassword,
			message: "Login exitoso",
		});
	} catch (error) {
		console.error("Error en login:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}
