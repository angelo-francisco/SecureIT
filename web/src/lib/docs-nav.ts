import type { DocsLocale } from "./docs-config";

export interface DocsNavItem {
	slug: string;
	title: Record<DocsLocale, string>;
}

export interface DocsNavSection {
	id: string;
	title: Record<DocsLocale, string>;
	items: DocsNavItem[];
}

export const DOCS_NAV: DocsNavSection[] = [
	{
		id: "guide",
		title: { pt: "Guia", en: "Guide" },
		items: [
			{
				slug: "intro",
				title: {
					pt: "Introdução",
					en: "Introduction",
				},
			},
			{
				slug: "quickstart",
				title: {
					pt: "Primeiros Passos",
					en: "Getting Started",
				},
			},
		],
	},
	{
		id: "areas",
		title: { pt: "Áreas do Aplicativo", en: "Application Areas" },
		items: [
			{
				slug: "cameras",
				title: {
					pt: "Câmaras",
					en: "Cameras",
				},
			},
			{
				slug: "people",
				title: {
					pt: "Pessoas",
					en: "People",
				},
			},
			{
				slug: "dashboard",
				title: {
					pt: "Dashboard & Monitoramento",
					en: "Dashboard & Monitoring",
				},
			},
			{
				slug: "detection-area",
				title: {
					pt: "Detecção de Área",
					en: "Area Detection",
				},
			},
			{
				slug: "face-recognition",
				title: {
					pt: "Reconhecimento Facial",
					en: "Face Recognition",
				},
			},
			{
				slug: "behaviour-analysis",
				title: {
					pt: "Análise de Comportamento",
					en: "Behaviour Analysis",
				},
			},
			{
				slug: "notifications",
				title: {
					pt: "Notificações",
					en: "Notifications",
				},
			},
			{
				slug: "profiles",
				title: {
					pt: "Perfis & PIN",
					en: "Profiles & PIN",
				},
			},
			{
				slug: "licenses",
				title: {
					pt: "Licenças",
					en: "Licenses",
				},
			},
			{
				slug: "settings",
				title: {
					pt: "Configurações",
					en: "Settings",
				},
			},
			{
				slug: "audit",
				title: {
					pt: "Registos de Auditoria",
					en: "Audit Logs",
				},
			},
		],
	},
	{
		id: "support",
		title: { pt: "Suporte", en: "Support" },
		items: [
			{
				slug: "faq",
				title: {
					pt: "Perguntas Frequentes",
					en: "Frequently Asked Questions",
				},
			},
		],
	},
];

export function getAllDocSlugs(): string[] {
	return DOCS_NAV.flatMap((section) => section.items.map((item) => item.slug));
}

export function getDocTitle(slug: string, locale: DocsLocale): string {
	for (const section of DOCS_NAV) {
		for (const item of section.items) {
			if (item.slug === slug) return item.title[locale];
		}
	}
	return slug;
}

export function getDocOrder(slug: string): number {
	const slugs = getAllDocSlugs();
	const index = slugs.indexOf(slug);
	return index === -1 ? slugs.length : index;
}

export function getPrevNext(slug: string): {
	prev?: DocsNavItem;
	next?: DocsNavItem;
} {
	const slugs = getAllDocSlugs();
	const index = slugs.indexOf(slug);
	if (index === -1) return {};
	return {
		prev: index > 0 ? findItem(slugs[index - 1]) : undefined,
		next: index < slugs.length - 1 ? findItem(slugs[index + 1]) : undefined,
	};
}

function findItem(slug: string): DocsNavItem | undefined {
	for (const section of DOCS_NAV) {
		for (const item of section.items) {
			if (item.slug === slug) return item;
		}
	}
	return undefined;
}
