export const DOCS_LOCALES = ["pt", "en"] as const;

export type DocsLocale = (typeof DOCS_LOCALES)[number];

export const DEFAULT_DOCS_LOCALE: DocsLocale = "pt";

export function isDocsLocale(value: string): value is DocsLocale {
	return (DOCS_LOCALES as readonly string[]).includes(value);
}

/**
 * URL do vídeo de apresentação embebido na página de Introdução.
 *
 * TODO: substituir pelo link final do vídeo quando estiver disponível.
 * Pode ser um URL do YouTube, Vimeo ou um ficheiro MP4 directo.
 */
export const PRESENTATION_VIDEO_URL =
	"https://drive.google.com/file/d/1VI4aMeGjhz1Af0FkxXsblGNApbnMg31_/preview";

export const PRESENTATION_VIDEO_TITLE = "SecureIT — Vídeo de Apresentação";
