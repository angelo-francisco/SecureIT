"use client";

import { useEffect, useState } from "react";

export function useExchangeRate() {
	const [rate, setRate] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("/api/exchange-rate")
			.then((r) => r.json())
			.then((data: { rate?: number }) => {
				if (data.rate) setRate(data.rate);
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	const convert = (usd: number): string => {
		if (!rate) return "---";
		const value = usd * rate;
		const rounded = Math.ceil(value / 100) * 100;
		return rounded.toLocaleString("pt-AO", {
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		});
	};

	return { rate, loading, convert };
}
