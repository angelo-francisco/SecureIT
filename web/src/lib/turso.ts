export function normalizeTursoUrl(url: string): string {
	if (url.startsWith("turso://"))
		return `libsql://${url.slice("turso://".length)}`;
	return url;
}
