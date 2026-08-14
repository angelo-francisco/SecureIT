interface FigureProps {
	src: string;
	alt: string;
	caption?: string;
}

export function Figure({ src, alt, caption }: FigureProps) {
	return (
		<figure className="my-8">
			<div className="overflow-hidden border border-border bg-surface/40">
				{/* Usa um <img> simples para permitir qualquer caminho local/remoto. */}
				{/* biome-ignore lint/performance/noImgElement: docs images can be local or remote */}
				<img src={src} alt={alt} className="h-auto w-full object-contain" />
			</div>
			{caption && (
				<figcaption className="mt-3 text-base text-text-muted">
					{caption}
				</figcaption>
			)}
		</figure>
	);
}
