import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { DocsLocale } from "./docs-config";
import { getAllDocSlugs } from "./docs-nav";

export const DOCS_CONTENT_DIR = path.join(process.cwd(), "src/content/docs");

export const DOCS_IMAGES_DIR = "/docs";

export interface DocFrontmatter {
	title: string;
	description?: string;
}

export interface DocMeta extends DocFrontmatter {
	slug: string;
	locale: DocsLocale;
}

export function getContentPath(locale: DocsLocale, slug: string): string {
	return path.join(DOCS_CONTENT_DIR, locale, `${slug}.mdx`);
}

export function contentExists(locale: DocsLocale, slug: string): boolean {
	return fs.existsSync(getContentPath(locale, slug));
}

export function readDocContent(locale: DocsLocale, slug: string): string {
	return fs.readFileSync(getContentPath(locale, slug), "utf8");
}

export function readDocBody(locale: DocsLocale, slug: string): string {
	return matter(readDocContent(locale, slug)).content;
}

export function parseDocFrontmatter(
	locale: DocsLocale,
	slug: string,
): DocFrontmatter {
	const source = readDocContent(locale, slug);
	const { data } = matter(source);
	return {
		title: typeof data.title === "string" ? data.title : slug,
		description:
			typeof data.description === "string" ? data.description : undefined,
	};
}

export function getDocMeta(locale: DocsLocale, slug: string): DocMeta {
	return { slug, locale, ...parseDocFrontmatter(locale, slug) };
}

export function listDocSlugs(locale: DocsLocale): string[] {
	return getAllDocSlugs().filter((slug) => contentExists(locale, slug));
}
