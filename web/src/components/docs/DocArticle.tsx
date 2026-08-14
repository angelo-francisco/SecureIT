import { MDXRemote } from "next-mdx-remote-client/rsc";
import remarkGfm from "remark-gfm";
import { MDX_COMPONENTS } from "@/components/docs/MDXComponents";
import { PrevNextNav } from "@/components/docs/PrevNextNav";
import type { DocMeta } from "@/lib/docs";

interface DocArticleProps {
	meta: DocMeta;
	source: string;
}

export async function DocArticle({ meta, source }: DocArticleProps) {
	const content = await MDXRemote({
		source,
		components: MDX_COMPONENTS,
		options: { mdxOptions: { remarkPlugins: [remarkGfm] } },
	});

	return (
		<article className="mdx-content">
			<header className="mb-10">
				<h1 className="text-4xl font-extrabold tracking-tight text-text md:text-5xl">
					{meta.title}
				</h1>
				{meta.description && (
					<p className="mt-4 text-xl leading-relaxed text-text-muted">
						{meta.description}
					</p>
				)}
			</header>

			{content}

			<PrevNextNav locale={meta.locale} slug={meta.slug} />
		</article>
	);
}
