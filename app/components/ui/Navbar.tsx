"use client";

import { useTheme } from "next-themes";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Sun, Moon, Search, Bell, Command, ChevronDown, Menu } from "lucide-react";
import { motion } from "framer-motion";

interface NavbarProps {
	onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
	const { theme, setTheme } = useTheme();
	const { user } = useSelector((state: RootState) => state.auth);

	return (
		<header className="sticky top-0 z-30 flex h-16 md:h-20 w-full items-center justify-between bg-background/80 px-4 md:px-8 backdrop-blur-md">
			<div className="flex flex-1 items-center gap-4">
				{/* Hamburger Menu Button - Mobile Only */}
				<button
					onClick={onMenuClick}
					className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--card)] text-stone-600 transition-all hover:bg-stone-200 border border-stone-200 lg:hidden"
				>
					<Menu className="h-5 w-5" />
				</button>
			</div>

			<div className="flex items-center gap-2 md:gap-4">
				{/* Theme Toggle */}
				<button
					onClick={() =>
						setTheme(theme === "dark" ? "light" : "dark")
					}
					className="cursor-pointer flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-2xl bg-[var(--card)] text-stone-600 transition-all hover:bg-stone-200 border border-stone-200"
				>
					{theme === "dark" ? (
						<Sun className="h-4 w-4 md:h-5 md:w-5" />
					) : (
						<Moon className="h-4 w-4 md:h-5 md:w-5" />
					)}
				</button>
				{/* User Profile */}
				<div className="ml-2 flex items-center gap-2 md:gap-3 rounded-xl md:rounded-2xl bg-[var(--card)] p-1.5 md:p-2">
					<div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg md:rounded-xl bg-amber-100 text-amber-600 font-bold text-sm">
						{user?.name.charAt(0)}
					</div>
					<div className="hidden md:flex flex-col">
						<span className="text-xs font-bold text-[var(--foreground)]">
							{user?.name}
						</span>
						<span className="text-[10px] text-stone-500">
							{user?.email}
						</span>
					</div>
				</div>
			</div>
		</header>
	);
}
