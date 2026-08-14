import { redirect } from "next/navigation";
import { DEFAULT_DOCS_LOCALE } from "@/lib/docs-config";

export default function DocsIndexPage() {
	redirect(`/docs/${DEFAULT_DOCS_LOCALE}`);
}
