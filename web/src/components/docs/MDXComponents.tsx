import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { Callout } from "./Callout";
import { Figure } from "./Figure";
import { VideoEmbed } from "./VideoEmbed";

function DocsLink({ href, children, ...props }: ComponentPropsWithoutRef<"a">) {
	const isInternal = href?.startsWith("/") && !href.startsWith("//");
	if (isInternal) {
		return (
			<Link href={href as string} {...props}>
				{children}
			</Link>
		);
	}
	return (
		<a href={href} target="_blank" rel="noopener noreferrer" {...props}>
			{children}
		</a>
	);
}

function DocsImage({ alt, ...props }: ComponentPropsWithoutRef<"img">) {
	return (
		<span className="my-8 block">
			<span className="block overflow-hidden border border-border bg-surface/40">
				{/* biome-ignore lint/performance/noImgElement: docs images can be local or remote */}
				<img
					alt={alt ?? ""}
					className="h-auto w-full object-contain"
					{...props}
				/>
			</span>
			{alt && (
				<span className="mt-3 block text-base text-text-muted">{alt}</span>
			)}
		</span>
	);
}

function Table({ children }: ComponentPropsWithoutRef<"table">) {
	return (
		<div className="my-6 overflow-x-auto border border-border">
			<table className="w-full border-collapse text-left text-lg">
				{children}
			</table>
		</div>
	);
}

export const MDX_COMPONENTS: MDXComponents = {
	a: DocsLink,
	img: DocsImage,
	table: Table,
	VideoEmbed,
	Figure,
	Callout,
};
