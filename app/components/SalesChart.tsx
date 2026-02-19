"use client";

import { cn } from "@/lib/utils";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis
} from "recharts";

interface MonthlySalesData {
	month: string; // "Ene", "Feb", etc.
	sales: number;
}

interface SalesChartProps {
	data: MonthlySalesData[];
}

export function SalesChart({ data }: SalesChartProps) {
	return (
		<div className="h-[350px] w-full">
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={data}>
					<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
					<XAxis
						dataKey="month"
						stroke="#888888"
						fontSize={12}
						tickLine={false}
						axisLine={false}
					/>
					<YAxis
						stroke="#888888"
						fontSize={12}
						tickLine={false}
						axisLine={false}
						tickFormatter={(value) => `$${value}`}
					/>
					<Tooltip
						cursor={{ fill: 'transparent' }}
						content={({ active, payload }) => {
							if (active && payload && payload.length) {
								return (
									<div className="rounded-lg border border-stone-200 bg-white p-2 shadow-sm dark:border-stone-800 dark:bg-stone-950">
										<div className="grid grid-cols-2 gap-2">
											<div className="flex flex-col">
												<span className="text-[0.70rem] uppercase text-stone-500 dark:text-stone-400">
													Ventas
												</span>
												<span className="font-bold text-stone-900 dark:text-stone-50">
													{payload[0].value?.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
												</span>
											</div>
										</div>
									</div>
								);
							}
							return null;
						}}
					/>
					<Bar
						dataKey="sales"
						fill="currentColor"
						radius={[4, 4, 0, 0]}
						className="fill-amber-500"
					/>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
