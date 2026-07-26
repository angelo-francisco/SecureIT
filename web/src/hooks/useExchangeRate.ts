"use client";

import { useState, useEffect } from "react";

export function useExchangeRate() {
	const [rate, setRate] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("/api/exchange-rate")
			.then((r) => r.json())
			.then((data: any) => {
				if (data.rate) setRate(data.rate);
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	const convert = (usd: number): string => {
		if (!rate) return "---";
		return (usd * rate).toLocaleString("pt-AO", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});
	};

	return { rate, loading, convert };
}
