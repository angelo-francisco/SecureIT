import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocArticle } from "@/components/docs/DocArticle";
import { contentExists, getDocMeta, readDocBody } from "@/lib/docs";
import type { DocsLocale } from "@/lib/docs-config";
import { DOCS_LOCALES, isDocsLocale } from "@/lib/docs-config";

export function generateStaticParams() {
	return DOCS_LOCALES.map((locale) => ({ locale }));
}

interface IntroPageProps {
	params: Promise<{ locale: string }>;
}

export async function generateMetadata({
	params,
}: IntroPageProps): Promise<Metadata> {
	const { locale } = await params;
	if (!isDocsLocale(locale) || !contentExists(locale, "intro")) return {};
	const meta = getDocMeta(locale, "intro");
	return { title: meta.title, description: meta.description };
}

export default async function DocsIntroPage({ params }: IntroPageProps) {
	const { locale } = await params;
	if (!isDocsLocale(locale)) notFound();
	const lang: DocsLocale = locale;
	if (!contentExists(lang, "intro")) notFound();

	return (
		<DocArticle
			meta={getDocMeta(lang, "intro")}
			source={readDocBody(lang, "intro")}
		/>
	);
}
