"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setUser, setLoading } from "@/store/features/auth/authSlice";
import { AuthService } from "@/lib/services/AuthService";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { clsx } from "clsx";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setLocalLoading] = useState(false);
	const router = useRouter();
	const dispatch = useDispatch();

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLocalLoading(true);
		dispatch(setLoading(true));

		try {
			const user = await AuthService.login(email, password);
			if (user) {
				dispatch(setUser(user));
				if (user.mustChangePassword) {
					router.push("/change-password");
				} else {
					router.push("/dashboard");
				}
			} else {
				setError("Credenciales inválidas. Por favor, intente de nuevo.");
			}
		} catch (err) {
			setError("Ocurrió un error al intentar iniciar sesión.");
		} finally {
			setLocalLoading(false);
			dispatch(setLoading(false));
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4 dark:from-neutral-950 dark:to-neutral-900">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="w-full max-w-md"
			>
				<div className="overflow-hidden rounded-3xl bg-white/80 shadow-2xl backdrop-blur-xl dark:bg-neutral-900/80">
					<div className="bg-amber-600 p-8 text-white dark:bg-amber-700">
						<div className="mb-4 flex items-center gap-3">
							<div className="rounded-xl bg-white/20 p-2 border border-white/30">
								<LogIn className="h-6 w-6" />
							</div>
							<h1 className="text-2xl font-bold tracking-tight">
								Acceso al Sistema
							</h1>
						</div>
						<p className="text-amber-100/80">
							Aserradero Don Gustavo - Gestión
						</p>
					</div>

					<form onSubmit={handleLogin} className="space-y-6 p-8">
						{error && (
							<motion.div
								initial={{
									opacity: 0,
									scale: 0.95,
								}}
								animate={{ opacity: 1, scale: 1 }}
								className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/30"
							>
								<AlertCircle className="h-5 w-5 shrink-0" />
								<p>{error}</p>
							</motion.div>
						)}

						<div className="space-y-4">
							<div>
								<label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
									Correo Electrónico
								</label>
								<div className="relative">
									<Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
									<input
										type="email"
										required
										value={email}
										onChange={(e) =>
											setEmail(
												e
													.target
													.value
											)
										}
										className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-11 pr-4 outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
										placeholder="ejemplo@aserradero.com"
									/>
								</div>
							</div>

							<div>
								<label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
									Contraseña
								</label>
								<div className="relative">
									<Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
									<input
										type="password"
										required
										value={password}
										onChange={(e) =>
											setPassword(
												e
													.target
													.value
											)
										}
										className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-11 pr-4 outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
										placeholder="••••••••"
									/>
								</div>
							</div>
						</div>

						<button
							type="submit"
							disabled={isLoading}
							className={clsx(
								"relative flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 py-3.5 font-semibold text-white transition-all hover:bg-amber-700 active:scale-[0.98] disabled:opacity-70 dark:bg-amber-700 dark:hover:bg-amber-600",
								isLoading && "cursor-not-allowed"
							)}
						>
							{isLoading ? (
								<>
									<Loader2 className="h-5 w-5 animate-spin" />
									Iniciando sesión...
								</>
							) : (
								"Iniciar Sesión"
							)}
						</button>

						<div className="pt-2 text-center">
							<p className="text-xs text-neutral-500 dark:text-neutral-400">
								&copy; {new Date().getFullYear()}{" "}
								Aserradero Don Gustavo. Todos los
								derechos reservados.
							</p>
						</div>
					</form>
				</div>
			</motion.div>
		</div>
	);
}
