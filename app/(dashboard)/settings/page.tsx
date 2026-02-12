"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { AuthService } from "@/lib/services/AuthService";
import { User } from "@/store/features/auth/authSlice";
import {
	Settings,
	UserPlus,
	ShieldCheck,
	RotateCcw,
	Search,
	CheckCircle2,
	AlertCircle,
	Loader2,
	X,
	KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
	const { user } = useSelector((state: RootState) => state.auth);
	const [activeUsers, setActiveUsers] = useState<User[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (mounted) {
			loadUsers();
		}
	}, [mounted]);

	const loadUsers = async () => {
		try {
			const users = await AuthService.getAllUsers();
			setActiveUsers(users);
		} catch (error) {
			console.error("Error loading users:", error);
		}
	};



	// States for new user form
	const [newEmail, setNewEmail] = useState("");
	const [newName, setNewName] = useState("");
	const [newRole, setNewRole] = useState<"admin" | "user">("user");
	const [newPass, setNewPass] = useState("");
	const [successMsg, setSuccessMsg] = useState("");

	const isAdmin = user?.role === "admin";
	const [showResetModal, setShowResetModal] = useState(false);
	const [resetUser, setResetUser] = useState<{ email: string; tempPass: string } | null>(null);

	const handleAddUser = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			await AuthService.addUser("token", {
				email: newEmail,
				name: newName,
				role: newRole,
				password: newPass,
			});
			setSuccessMsg("Usuario creado con éxito.");
			setSuccessMsg("Usuario creado con éxito.");
			loadUsers();
			// Reset form
			setNewEmail("");
			setNewName("");
			setNewPass("");
		} catch (err) {
			console.error(err);
		} finally {
			setIsLoading(false);
			setTimeout(() => setSuccessMsg(""), 3000);
		}
	};

	const handleResetPassword = (email: string) => {
		const tempPass = Math.random().toString(36).slice(-8);
		setResetUser({ email, tempPass });
		setShowResetModal(true);
	};

	const confirmReset = async () => {
		if (!resetUser) return;
		setIsLoading(true);
		try {
			await AuthService.resetPassword(resetUser.email, resetUser.tempPass);
			// Success feedback - could be another modal or toast, but alert is consistent with previous behavior for success
			// OR we can just show success message in the page
			alert(
				`Contraseña reseteada exitosamente. El usuario ${resetUser.email} deberá ingresar con: ${resetUser.tempPass}`
			);
			setShowResetModal(false);
			setResetUser(null);
		} catch (error) {
			console.error(error);
			alert("Error al resetear contraseña");
		} finally {
			setIsLoading(false);
		}
	};

	// Don't render until mounted
	if (!mounted) {
		return null;
	}

	return (
		<div className="space-y-6 md:space-y-8 mx-auto">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl md:text-2xl font-bold text-[var(--card-foreground)]">
						Configuración
					</h1>
					<p className="text-xs md:text-sm text-stone-500">
						Configura tu perfil y gestiona el acceso al sistema.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
				{/* Profile Card */}
				<div className="lg:col-span-1 space-y-4 md:space-y-6">
					<section className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">
						<h2 className="mb-6 text-sm font-bold text-stone-400 uppercase tracking-wider">
							Tu Perfil
						</h2>
						<div className="flex flex-col items-center text-center space-y-4">
							<div className="h-24 w-24 rounded-full bg-amber-100 flex items-center justify-center text-3xl font-bold text-amber-600 dark:bg-amber-900/30">
								{user?.name.charAt(0)}
							</div>
							<div>
								<h3 className="text-xl font-bold text-[var(--card-foreground)]">
									{user?.name}
								</h3>
								<span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full dark:bg-amber-900/20">
									<ShieldCheck className="h-3 w-3" />
									{user?.role === "admin"
										? "Administrador"
										: "Usuario"}
								</span>
								<p className="mt-2 text-sm text-stone-500">
									{user?.email}
								</p>
							</div>
						</div>
						<div className="mt-8 border-t border-stone-100 pt-6 dark:border-stone-800">
							<button className="w-full rounded-xl border border-stone-200 py-3 text-sm font-bold text-stone-600 transition-all dark:border-stone-800 dark:text-stone-400 text-center hover:bg-[var(--card-foreground)]">
								Editar Información
							</button>
						</div>
					</section>
				</div>

				{/* User Management Section (Admin Only) */}
				<div className="lg:col-span-2 space-y-6 md:space-y-8">
					{!isAdmin && (
						<div className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800/50 flex items-center gap-4 bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/30">
							<AlertCircle className="h-6 w-6 text-amber-600" />
							<div>
								<h3 className="text-sm font-bold text-amber-800 dark:text-amber-400">
									Acceso Restringido
								</h3>
								<p className="text-xs text-amber-700 dark:text-amber-500">
									Solo los administradores
									pueden gestionar otras
									cuentas.
								</p>
							</div>
						</div>
					)}

					{isAdmin && (
						<>
							{/* Add User Form */}
							<section className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">
								<div className="mb-6 flex items-center gap-3">
									<UserPlus className="h-5 w-5 text-amber-600" />
									<h2 className="text-lg font-bold text-[var(--card-foreground)]">
										Añadir Nueva Cuenta
									</h2>
								</div>

								<form
									onSubmit={handleAddUser}
									className="space-y-4"
								>
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
										<div className="space-y-1.5">
											<label className="text-[10px] font-bold text-stone-500 uppercase">
												Nombre
												Completo
											</label>
											<input
												type="text"
												required
												value={
													newName
												}
												onChange={(
													e
												) =>
													setNewName(
														e
															.target
															.value
													)
												}
												className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2 text-sm outline-none"
											/>
										</div>
										<div className="space-y-1.5">
											<label className="text-[10px] font-bold text-stone-500 uppercase">
												Correo
												Electrónico
											</label>
											<input
												type="email"
												required
												value={
													newEmail
												}
												onChange={(
													e
												) =>
													setNewEmail(
														e
															.target
															.value
													)
												}
												className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2 text-sm outline-none"
											/>
										</div>
										<div className="space-y-1.5">
											<label className="text-[10px] font-bold text-stone-500 uppercase">
												Contraseña
												Inicial
											</label>
											<input
												type="password"
												required
												value={
													newPass
												}
												onChange={(
													e
												) =>
													setNewPass(
														e
															.target
															.value
													)
												}
												className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2 text-sm outline-none"
											/>
										</div>
										<div className="space-y-1.5">
											<label className="text-[10px] font-bold text-stone-500 uppercase">
												Rol
												/
												Permisos
											</label>
											<select
												value={
													newRole
												}
												onChange={(
													e
												) =>
													setNewRole(
														e
															.target
															.value as any
													)
												}
												className="w-full rounded-xl border border-stone-200 bg-[var(--card)] px-4 py-2 text-sm outline-none"
											>
												<option value="user">
													Colaborador
													(User)
												</option>
												<option value="admin">
													Administrador
												</option>
											</select>
										</div>
									</div>

									<div className="flex items-center justify-between pt-2">
										{successMsg && (
											<div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
												<CheckCircle2 className="h-4 w-4" />
												{
													successMsg
												}
											</div>
										)}
										<button
											type="submit"
											disabled={
												isLoading
											}
											className="cursor-pointer ml-auto flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-stone-300 dark:bg-white dark:text-stone-900"
										>
											{isLoading ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												"Crear Cuenta"
											)}
										</button>
									</div>
								</form>
							</section>

							{/* Users List */}
							<section className="bg-[var(--card)] rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800/50">
								<div className="mb-6 flex items-center justify-between">
									<h2 className="text-lg font-bold text-[var(--card-foreground)]">
										Gestionar Cuentas
										Existentes
									</h2>
									<div className="relative w-48">
										<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
										<input
											type="text"
											placeholder="Buscar..."
											className="w-full rounded-lg bg-[var(--card)] py-1.5 pl-9 pr-3 text-xs outline-none border border-stone-100"
										/>
									</div>
								</div>

								<div className="space-y-3">
									{activeUsers.map((u) => (
										<div
											key={u.id}
											className="flex items-center justify-between p-4 rounded-2xl border border-stone-100 bg-[var(--card)]"
										>
											<div className="flex items-center gap-3">
												<div className="h-10 w-10 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-500 dark:bg-stone-800">
													{u.name.charAt(
														0
													)}
												</div>
												<div>
													<p className="text-sm font-bold text-[var(--card-foreground)]">
														{
															u.name
														}
													</p>
													<p className="text-xs text-stone-500">
														{
															u.email
														}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-4">
												<span
													className={cn(
														"px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
														u.role ===
															"admin"
															? "bg-amber-100 text-amber-700"
															: "bg-stone-200 text-stone-600"
													)}
												>
													{
														u.role
													}
												</span>
												<button
													onClick={() =>
														handleResetPassword(
															u.email
														)
													}
													className="p-2 rounded-lg text-stone-400 hover:bg-amber-100 hover:text-amber-600 transition-all dark:hover:bg-amber-900/30"
													title="Resetear Password"
												>
													<RotateCcw className="h-4 w-4" />
												</button>
											</div>
										</div>
									))}
								</div>
							</section>
						</>
					)}
				</div>
			</div>
			{/* Reset Password Modal */}
			{showResetModal && resetUser && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
					<div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in duration-200">
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center gap-3">
								<div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 dark:bg-amber-900/30">
									<KeyRound className="h-5 w-5" />
								</div>
								<h3 className="text-xl font-bold text-stone-900 dark:text-white">
									Resetear Contraseña
								</h3>
							</div>
							<button
								onClick={() => setShowResetModal(false)}
								className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
							>
								<X className="h-5 w-5 text-stone-400" />
							</button>
						</div>

						<div className="space-y-4 mb-8">
							<p className="text-stone-600 dark:text-stone-300">
								¿Estás seguro de resetear la contraseña de{" "}
								<span className="font-bold text-stone-900 dark:text-white">
									{resetUser.email}
								</span>
								?
							</p>
							<div className="bg-amber-50 border border-amber-100 rounded-xl p-4 dark:bg-amber-900/10 dark:border-amber-900/20">
								<p className="text-xs font-bold text-amber-800 uppercase mb-1 dark:text-amber-500">
									Nueva contraseña temporal
								</p>
								<p className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400 select-all">
									{resetUser.tempPass}
								</p>
							</div>
							<p className="text-xs text-stone-500">
								Esta acción no se puede deshacer. El usuario deberá cambiar esta contraseña al
								iniciar sesión.
							</p>
						</div>

						<div className="flex gap-3">
							<button
								onClick={() => setShowResetModal(false)}
								className="flex-1 px-4 py-2.5 rounded-xl font-bold text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800 transition-colors"
							>
								Cancelar
							</button>
							<button
								onClick={confirmReset}
								disabled={isLoading}
								className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
							>
								{isLoading ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									"Confirmar Reset"
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
