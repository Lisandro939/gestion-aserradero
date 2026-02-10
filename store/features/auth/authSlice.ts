"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
	id: number;
	email: string;
	name: string;
	role: "admin" | "user";
	mustChangePassword?: boolean;
}

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	loading: boolean;
}

// Load user from localStorage if available
const loadUserFromStorage = (): User | null => {
	if (typeof window === "undefined") return null;
	try {
		const storedUser = localStorage.getItem("auth_user");
		return storedUser ? JSON.parse(storedUser) : null;
	} catch {
		return null;
	}
};

const initialState: AuthState = {
	user: loadUserFromStorage(),
	isAuthenticated: !!loadUserFromStorage(),
	loading: false,
};

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		setUser: (state, action: PayloadAction<User | null>) => {
			state.user = action.payload;
			state.isAuthenticated = !!action.payload;
			// Persist to localStorage
			if (typeof window !== "undefined") {
				if (action.payload) {
					localStorage.setItem(
						"auth_user",
						JSON.stringify(action.payload)
					);
				} else {
					localStorage.removeItem("auth_user");
				}
			}
		},
		logout: (state) => {
			state.user = null;
			state.isAuthenticated = false;
			// Clear from localStorage
			if (typeof window !== "undefined") {
				localStorage.removeItem("auth_user");
			}
		},
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.loading = action.payload;
		},
	},
});

export const { setUser, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
