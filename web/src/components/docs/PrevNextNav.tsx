import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { DocsLocale } from "@/lib/docs-config";
import type { DocsNavItem } from "@/lib/docs-nav";
import { getPrevNext } from "@/lib/docs-nav";

interface PrevNextNavProps {
	locale: DocsLocale;
	slug: string;
}

export function PrevNextNav({ locale, slug }: PrevNextNavProps) {
	const { prev, next } = getPrevNext(slug);

	if (!prev && !next) return null;

	return (
		<div className="mt-12 grid gap-4 border-t border-border pt-8 sm:grid-cols-2">
			{prev ? (
				<DocLink item={prev} locale={locale} direction="prev" />
			) : (
				<div />
			)}
			{next && <DocLink item={next} locale={locale} direction="next" />}
		</div>
	);
}

function DocLink({
	item,
	locale,
	direction,
}: {
	item: DocsNavItem;
	locale: DocsLocale;
	direction: "prev" | "next";
}) {
	const isNext = direction === "next";
	return (
		<Link
			href={`/docs/${locale}/${item.slug}`}
			className={`group flex flex-col gap-1 border border-border p-4 transition-colors hover:border-primary/50 ${
				isNext ? "items-end text-right" : "items-start"
			}`}
		>
			<span className="flex items-center gap-2 text-sm text-text-muted">
				{!isNext && (
					<ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
				)}
				{isNext ? "Seguinte" : "Anterior"}
				{isNext && (
					<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
				)}
			</span>
			<span className="text-lg font-semibold text-text group-hover:text-primary">
				{item.title[locale]}
			</span>
		</Link>
	);
}
