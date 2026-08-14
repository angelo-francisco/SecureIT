"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DocsLocale } from "@/lib/docs-config";
import { DOCS_NAV } from "@/lib/docs-nav";

interface DocsSidebarProps {
	locale: DocsLocale;
}

export function DocsSidebar({ locale }: DocsSidebarProps) {
	const pathname = usePathname();

	const isActive = (slug: string) => {
		const current = pathname.split("/").pop();
		return current === slug;
	};

	return (
		<nav
			aria-label="Documentação"
			className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-8 pr-4"
		>
			<div className="mb-6 flex items-center gap-2">
				<BookOpen className="h-5 w-5" />
				<span className="text-xl font-bold text-text">Documentação</span>
			</div>

			<div className="space-y-8">
				{DOCS_NAV.map((section) => (
					<div key={section.id}>
						<p className="mb-2 text-sm font-semibold uppercase tracking-widest text-text-muted">
							{section.title[locale]}
						</p>
						<ul className="space-y-1">
							{section.items.map((item) => {
								const active = isActive(item.slug);
								return (
									<li key={item.slug}>
										<Link
											href={`/docs/${locale}/${item.slug}`}
											aria-current={active ? "page" : undefined}
											className={`block border-l-2 px-3 py-2 text-lg transition-colors ${
												active
													? "border-primary bg-primary/10 font-semibold text-primary"
													: "border-transparent text-text-muted hover:border-border hover:text-text"
											}`}
										>
											{item.title[locale]}
										</Link>
									</li>
								);
							})}
						</ul>
					</div>
				))}
			</div>
		</nav>
	);
}
