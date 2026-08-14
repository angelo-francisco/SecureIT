"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DocsLocale } from "@/lib/docs-config";
import { DOCS_LOCALES } from "@/lib/docs-config";

interface DocsLanguageSwitchProps {
	locale: DocsLocale;
}

const LABELS: Record<DocsLocale, string> = {
	pt: "Português",
	en: "English",
};

export function DocsLanguageSwitch({ locale }: DocsLanguageSwitchProps) {
	const pathname = usePathname();

	const switchTo = (target: DocsLocale) => {
		if (target === locale) return pathname;
		const segments = pathname.split("/");
		const docsIndex = segments.indexOf("docs");
		if (docsIndex !== -1) {
			segments[docsIndex + 1] = target;
			return segments.join("/");
		}
		return `/${target}`;
	};

	return (
		<div className="flex items-center border border-border">
			{DOCS_LOCALES.map((loc) => {
				const isActive = loc === locale;
				return (
					<Link
						key={loc}
						href={switchTo(loc)}
						aria-current={isActive ? "page" : undefined}
						className={`px-3 py-1.5 text-sm font-medium transition-colors ${
							isActive
								? "bg-primary text-white"
								: "text-text-muted hover:text-text"
						}`}
					>
						{LABELS[loc]}
					</Link>
				);
			})}
		</div>
	);
}
