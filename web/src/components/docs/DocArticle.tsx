import { Suspense } from 'react'
import remarkGfm from "remark-gfm";
import type { DocMeta } from "@/lib/docs";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import { PrevNextNav } from "@/components/docs/PrevNextNav";
import { MDX_COMPONENTS } from "@/components/docs/MDXComponents";

interface DocArticleProps {
	meta: DocMeta;
	source: string;
}

async function MDXRender({ source }: { source: string }) {
	const content = await MDXRemote({
		source,
		components: MDX_COMPONENTS,
		options: { mdxOptions: { remarkPlugins: [remarkGfm] } },
	});

	return <>{content}</>;
}

function MDXSkeleton() {
	return (
		<div className="animate-pulse space-y-4 my-8">
			<div className="h-4 bg-gray-200 rounded w-3/4"></div>
			<div className="h-4 bg-gray-200 rounded"></div>
			<div className="h-4 bg-gray-200 rounded w-5/6"></div>
			<div className="h-4 bg-gray-200 rounded w-1/2"></div>
		</div>
	);
}

export async function DocArticle({ meta, source }: DocArticleProps) {

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

			<Suspense fallback={<MDXSkeleton />}>
				<MDXRender source={source} />
			</Suspense>


			<PrevNextNav locale={meta.locale} slug={meta.slug} />
		</article>
	);
}
