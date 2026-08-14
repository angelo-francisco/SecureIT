import {
	PRESENTATION_VIDEO_TITLE,
	PRESENTATION_VIDEO_URL,
} from "@/lib/docs-config";

interface VideoEmbedProps {
	url?: string;
	title?: string;
}

export function VideoEmbed({
	url = PRESENTATION_VIDEO_URL,
	title = PRESENTATION_VIDEO_TITLE,
}: VideoEmbedProps) {
	return (
		<figure className="my-8">
			<div className="relative aspect-video w-full overflow-hidden border border-border bg-black">
				<iframe
					src={url}
					title={title}
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
					allowFullScreen
					className="absolute inset-0 h-full w-full border-0"
				/>
			</div>
			<figcaption className="mt-3 text-base text-text-muted">
				{title}
			</figcaption>
		</figure>
	);
}
