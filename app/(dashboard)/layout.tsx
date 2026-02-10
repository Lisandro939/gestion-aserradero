"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Sidebar } from "@/app/components/ui/Sidebar";
import { Navbar } from "@/app/components/ui/Navbar";

export default function DashboardLayout({
	children
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (mounted && !isAuthenticated) {
			router.push("/login");
		} else if (mounted && user?.mustChangePassword) {
			router.push("/change-password");
		}
	}, [mounted, isAuthenticated, user, router]);

	// Don't render anything until mounted on client
	if (!mounted) {
		return null;
	}

	if (!isAuthenticated || user?.mustChangePassword) {
		return null;
	}

	return (
		<div className="min-h-screen bg-background">
			<Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
			<main className="lg:pl-72 transition-all duration-300">
				<Navbar onMenuClick={() => setIsSidebarOpen(true)} />
				<div className="p-4 md:p-8">{children}</div>
			</main>
		</div>
	);
}
