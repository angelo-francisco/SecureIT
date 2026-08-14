import { notFound } from "next/navigation";
import { DocsLanguageSwitch } from "@/components/docs/DocsLanguageSwitch";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import type { DocsLocale } from "@/lib/docs-config";
import { DEFAULT_DOCS_LOCALE, DOCS_LOCALES } from "@/lib/docs-config";

export function generateStaticParams() {
	return DOCS_LOCALES.map((locale) => ({ locale }));
}

function resolveLocale(locale: string): DocsLocale {
	return (DOCS_LOCALES as readonly string[]).includes(locale)
		? (locale as DocsLocale)
		: DEFAULT_DOCS_LOCALE;
}

export default async function DocsLocaleLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const lang = resolveLocale(locale);
	if (lang !== locale) notFound();

	return (
		<div className="mx-auto flex w-full max-w-7xl gap-10 px-6 py-10 md:px-8">
			<aside className="hidden w-64 shrink-0 lg:block">
				<DocsSidebar locale={lang} />
			</aside>
			<div className="min-w-0 flex-1">
				<div className="mb-6 flex justify-end">
					<DocsLanguageSwitch locale={lang} />
				</div>
				{children}
			</div>
		</div>
	);
}
