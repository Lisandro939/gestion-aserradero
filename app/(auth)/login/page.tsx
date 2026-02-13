"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setUser, setLoading } from "@/store/features/auth/authSlice";
import { AuthService } from "@/lib/services/AuthService";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, Mail, Lock, AlertCircle, Loader2, Package, Eye, EyeOff } from "lucide-react";
import { clsx } from "clsx";
import Image from "next/image";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setLocalLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

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
				setError("Credenciales inválidas.");
			}
		} catch (err) {
			setError("Ocurrió un error al intentar iniciar sesión.");
		} finally {
			setLocalLoading(false);
			dispatch(setLoading(false));
		}
	};

	return (
		<div className="flex min-h-screen w-full bg-amber-600">
			<div className="container mx-auto flex min-h-screen items-center justify-center px-4 lg:px-8">
				<div className="flex w-full flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">

					{/* Left Side - Brand Only */}
					<div className="hidden lg:flex w-full lg:w-1/2 flex-col items-center lg:items-start lg:pl-24 text-white">
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.6 }}
							className="flex flex-col items-center lg:items-start text-center lg:text-left"
						>
							<Image
								src="/logo-aserradero.png"
								alt="Logo"
								width={300}
								height={300}
							/>
						</motion.div>
					</div>

					{/* Right Side - Floating Login Box */}
					<div className="w-full lg:w-[480px] lg:pr-12">
						<motion.div
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.5, delay: 0.2 }}
							className="min-h-[90vh] lg:min-h-[75vh] flex flex-col justify-between rounded-[2.5rem] bg-white p-8 lg:p-12 shadow-2xl relative"
						>
							<div className="flex flex-col items-center mb-2">
								<h3 className="text-2xl font-bold text-stone-800 mb-2">
									¡Hola de nuevo!
								</h3>
								<div className="h-10 flex items-center justify-center w-full">
									<AnimatePresence mode="wait">
										{error ? (
											<motion.div
												key="error"
												initial={{ opacity: 0, y: 5 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -5 }}
												className="flex items-center gap-2 rounded-full bg-red-100 px-4 py-1.5 text-xs font-medium text-red-600 border border-red-300"
											>
												<AlertCircle className="h-3.5 w-3.5 shrink-0" />
												<p>{error}</p>
											</motion.div>
										) : (
											<motion.p
												key="instruction"
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												exit={{ opacity: 0 }}
												className="text-stone-500 text-center text-sm"
											>
												Ingresa tus datos para acceder al sistema
											</motion.p>
										)}
									</AnimatePresence>
								</div>
							</div>

							<form onSubmit={handleLogin} className="space-y-6">

								<div className="space-y-6">
									<div className="group relative">
										<input
											type="email"
											required
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											className="peer w-full border-b-2 border-stone-200 bg-transparent py-3 text-stone-800 placeholder-transparent outline-none transition-colors focus:border-amber-600"
											placeholder="Email"
											id="email"
										/>
										<label
											htmlFor="email"
											className="absolute left-0 -top-3.5 text-xs font-medium text-stone-400 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-amber-600"
										>
											Correo Electrónico
										</label>
									</div>

									<div className="group relative">
										<div className="relative">
											<input
												type={showPassword ? "text" : "password"}
												required
												value={password}
												onChange={(e) => setPassword(e.target.value)}
												className="peer w-full border-b-2 border-stone-200 bg-transparent py-3 pr-10 text-stone-800 placeholder-transparent outline-none transition-colors focus:border-amber-600"
												placeholder="Password"
												id="password"
											/>
											<label
												htmlFor="password"
												className="absolute left-0 -top-3.5 text-xs font-medium text-stone-400 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-amber-600"
											>
												Contraseña
											</label>
											<button
												type="button"
												onClick={() => setShowPassword(!showPassword)}
												className="cursor-pointer absolute right-0 top-3 text-stone-400 hover:text-stone-600 transition-colors"
											>
												{showPassword ? (
													<EyeOff className="h-5 w-5" />
												) : (
													<Eye className="h-5 w-5" />
												)}
											</button>
										</div>
									</div>
								</div>

								<button
									type="submit"
									disabled={isLoading}
									className={clsx(
										"cursor-pointer group relative mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-amber-600 py-4 text-sm font-bold text-white transition-all hover:bg-amber-700 hover:shadow-lg hover:shadow-amber-600/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed",
										isLoading && "opacity-70"
									)}
								>
									{isLoading ? (
										<Loader2 className="h-5 w-5 animate-spin" />
									) : (
										<>
											INGRESAR AL SISTEMA
											<LogIn className="h-4 w-4 transition-transform group-hover:translate-x-1" />
										</>
									)}
								</button>
							</form>

							<div className="mt-10 text-center">
								<p className="text-xs font-medium text-stone-400">
									&copy; {new Date().getFullYear()} Aserradero Don Gustavo
								</p>
							</div>
						</motion.div>
					</div>
				</div>
			</div>
		</div>
	);
}
