import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocArticle } from "@/components/docs/DocArticle";
import { contentExists, getDocMeta, readDocBody } from "@/lib/docs";
import type { DocsLocale } from "@/lib/docs-config";
import { DOCS_LOCALES, isDocsLocale } from "@/lib/docs-config";
import { getAllDocSlugs } from "@/lib/docs-nav";

export function generateStaticParams() {
	const params: { locale: string; slug: string[] }[] = [];
	for (const locale of DOCS_LOCALES) {
		for (const slug of getAllDocSlugs()) {
			params.push({ locale, slug: [slug] });
		}
	}
	return params;
}

interface DocPageProps {
	params: Promise<{ locale: string; slug: string[] }>;
}

export async function generateMetadata({
	params,
}: DocPageProps): Promise<Metadata> {
	const { locale, slug } = await params;
	if (!isDocsLocale(locale)) return {};
	const lang: DocsLocale = locale;
	const resolved = resolveSlug(slug);
	if (!resolved || !contentExists(lang, resolved)) return {};
	const meta = getDocMeta(lang, resolved);
	return { title: meta.title, description: meta.description };
}

export default async function DocPage({ params }: DocPageProps) {
	const { locale, slug } = await params;
	if (!isDocsLocale(locale)) notFound();
	const lang: DocsLocale = locale;
	const resolved = resolveSlug(slug);
	if (!resolved || !contentExists(lang, resolved)) notFound();

	return (
		<DocArticle
			meta={getDocMeta(lang, resolved)}
			source={readDocBody(lang, resolved)}
		/>
	);
}

function resolveSlug(slug: string[]): string | undefined {
	if (!Array.isArray(slug) || slug.length === 0) return undefined;
	return slug.join("/");
}
