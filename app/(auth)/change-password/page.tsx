"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setUser } from "@/store/features/auth/authSlice";
import { AuthService } from "@/lib/services/AuthService";
import { motion } from "framer-motion";
import { KeyRound, ShieldAlert, CheckCircle2, Loader2, Lock } from "lucide-react";
import { clsx } from "clsx";

export default function ChangePasswordPage() {
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const router = useRouter();
	const dispatch = useDispatch();
	const { user } = useSelector((state: RootState) => state.auth);

	useEffect(() => {
		if (!user) {
			router.push("/login");
		} else if (!user.mustChangePassword) {
			router.push("/dashboard");
		}
	}, [user, router]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (newPassword.length < 6) {
			setError("La contraseña debe tener al menos 6 caracteres.");
			return;
		}

		if (newPassword !== confirmPassword) {
			setError("Las contraseñas no coinciden.");
			return;
		}

		setIsLoading(true);
		try {
			const ok = await AuthService.changePassword(user!.email, newPassword);
			if (ok) {
				setSuccess(true);
				// Update user in state
				dispatch(setUser({ ...user!, mustChangePassword: false }));
				setTimeout(() => {
					router.push("/dashboard");
				}, 2000);
			} else {
				setError("Error al cambiar la contraseña. Intente de nuevo.");
			}
		} catch (err) {
			setError("Ocurrió un error inesperado.");
		} finally {
			setIsLoading(false);
		}
	};

	if (!user) return null;

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4 dark:from-neutral-950 dark:to-neutral-900">
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				className="w-full max-w-md"
			>
				<div className="overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-900">
					<div className="bg-amber-600 p-8 text-white dark:bg-amber-700">
						<div className="mb-4 flex items-center gap-3">
							<div className="rounded-xl bg-white/20 p-2 border border-white/30">
								<KeyRound className="h-6 w-6" />
							</div>
							<h1 className="text-2xl font-bold tracking-tight">
								Cambiar Contraseña
							</h1>
						</div>
						<p className="text-amber-100/80">
							Es necesario actualizar su contraseña por
							seguridad.
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6 p-8">
						{error && (
							<motion.div
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/30"
							>
								<ShieldAlert className="h-5 w-5 shrink-0" />
								<p>{error}</p>
							</motion.div>
						)}

						{success && (
							<motion.div
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								className="flex items-center gap-3 rounded-xl bg-green-50 p-4 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400 border border-green-100 dark:border-green-900/30"
							>
								<CheckCircle2 className="h-5 w-5 shrink-0" />
								<p>
									Contraseña actualizada
									correctamente.
									Redirigiendo...
								</p>
							</motion.div>
						)}

						<div className="space-y-4">
							<div>
								<label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
									Nueva Contraseña
								</label>
								<div className="relative">
									<Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
									<input
										type="password"
										required
										value={newPassword}
										onChange={(e) =>
											setNewPassword(
												e
													.target
													.value
											)
										}
										className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-11 pr-4 outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
										placeholder="Contraseña nueva"
										disabled={success}
									/>
								</div>
							</div>

							<div>
								<label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
									Confirmar Contraseña
								</label>
								<div className="relative">
									<Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
									<input
										type="password"
										required
										value={
											confirmPassword
										}
										onChange={(e) =>
											setConfirmPassword(
												e
													.target
													.value
											)
										}
										className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-11 pr-4 outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
										placeholder="Confirmar contraseña"
										disabled={success}
									/>
								</div>
							</div>
						</div>

						<button
							type="submit"
							disabled={isLoading || success}
							className={clsx(
								"relative flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 py-3.5 font-semibold text-white transition-all hover:bg-amber-700 active:scale-[0.98] disabled:opacity-70 dark:bg-amber-700 dark:hover:bg-amber-600",
								(isLoading || success) &&
									"cursor-not-allowed"
							)}
						>
							{isLoading ? (
								<>
									<Loader2 className="h-5 w-5 animate-spin" />
									Actualizando...
								</>
							) : success ? (
								"¡Éxito!"
							) : (
								"Actualizar Contraseña"
							)}
						</button>
					</form>
				</div>
			</motion.div>
		</div>
	);
}
