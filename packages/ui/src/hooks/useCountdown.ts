"use client";

import { useCallback, useEffect, useState } from "react";

export function useCountdown(seconds: number) {
	const [remaining, setRemaining] = useState(0);

	const start = useCallback(() => {
		setRemaining(seconds);
	}, [seconds]);

	useEffect(() => {
		if (remaining <= 0) return;
		const timer = setInterval(() => {
			setRemaining((current) => Math.max(0, current - 1));
		}, 1000);
		return () => clearInterval(timer);
	}, [remaining]);

	return { remaining, canResend: remaining <= 0, start };
}
