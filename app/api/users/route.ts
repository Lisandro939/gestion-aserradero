import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// GET - Obtener todos los usuarios
export async function GET() {
	try {
		const allUsers = await db.select().from(users);

		// Remover contraseñas de la respuesta
		const usersWithoutPasswords = allUsers.map(({ password, ...user }) => user);

		return NextResponse.json(usersWithoutPasswords);
	} catch (error) {
		console.error("Error al obtener usuarios:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}

// POST - Crear nuevo usuario
export async function POST(request: NextRequest) {
	try {
		const { email, name, password, role = "user" } = await request.json();

		if (!email || !name || !password) {
			return NextResponse.json(
				{ error: "Email, nombre y contraseña son requeridos" },
				{ status: 400 }
			);
		}

		// Verificar si el usuario ya existe
		const [existingUser] = await db
			.select()
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (existingUser) {
			return NextResponse.json(
				{ error: "El email ya está registrado" },
				{ status: 409 }
			);
		}

		// Hashear contraseña
		const hashedPassword = await bcrypt.hash(password, 10);

		// Crear usuario
		const [newUser] = await db
			.insert(users)
			.values({
				email,
				name,
				password: hashedPassword,
				role,
				mustChangePassword: true,
			})
			.returning();

		// Remover contraseña de la respuesta
		const { password: _, ...userWithoutPassword } = newUser;

		return NextResponse.json(userWithoutPassword, { status: 201 });
	} catch (error) {
		console.error("Error al crear usuario:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}
