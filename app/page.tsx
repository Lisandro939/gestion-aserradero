"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

export default function RootPage() {
	const router = useRouter();
	const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

	useEffect(() => {
		if (!isAuthenticated) {
			router.push("/login");
		} else if (user?.mustChangePassword) {
			router.push("/change-password");
		} else {
			router.push("/dashboard");
		}
	}, [isAuthenticated, user, router]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-white dark:bg-neutral-950">
			<div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
		</div>
	);
}
