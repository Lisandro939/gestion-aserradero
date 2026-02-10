"use client";

import { User } from "@/store/features/auth/authSlice";

export class AuthService {
	static async login(email: string, password: string): Promise<User | null> {
		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }),
			});

			if (!response.ok) {
				return null;
			}

			const data = await response.json();
			return data.user;
		} catch (error) {
			console.error("Error en login:", error);
			return null;
		}
	}

	static async changePassword(
		email: string,
		newPassword: string
	): Promise<boolean> {
		try {
			const response = await fetch("/api/auth/change-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, newPassword }),
			});

			return response.ok;
		} catch (error) {
			console.error("Error al cambiar contraseña:", error);
			return false;
		}
	}

	static async addUser(
		adminToken: string,
		newUser: Omit<User, "id"> & { password?: string }
	): Promise<boolean> {
		try {
			const response = await fetch("/api/users", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(newUser),
			});

			return response.ok;
		} catch (error) {
			console.error("Error al crear usuario:", error);
			return false;
		}
	}

	static async resetPassword(
		email: string,
		newTempPassword: string
	): Promise<boolean> {
		try {
			const response = await fetch("/api/auth/reset-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, tempPassword: newTempPassword }),
			});

			return response.ok;
		} catch (error) {
			console.error("Error al resetear contraseña:", error);
			return false;
		}
	}

	static async getAllUsers(): Promise<User[]> {
		try {
			const response = await fetch("/api/users");

			if (!response.ok) {
				return [];
			}

			return await response.json();
		} catch (error) {
			console.error("Error al obtener usuarios:", error);
			return [];
		}
	}
}
