"use client";

import { Calendar, Download, ExternalLink, Loader, Monitor, Server } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/packages/ui";

interface GitHubAsset {
	name: string;
	browser_download_url: string;
	size: number;
}

interface GitHubRelease {
	tag_name: string;
	name: string;
	published_at: string;
	body: string;
	assets: GitHubAsset[];
}

interface DownloadModalProps {
	open: boolean;
	onClose: () => void;
}

const GITHUB_REPO = "angelo-francisco/SecureIT";

function formatSize(bytes: number): string {
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("pt-AO", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

const platformIcons: Record<string, typeof Monitor> = {
	".exe": Monitor,
	".deb": Server,
	".AppImage": Server,
};

function getPlatformLabel(name: string): string {
	if (name.endsWith(".exe")) return "Windows";
	if (name.endsWith(".deb")) return "Linux (Debian/Ubuntu)";
	if (name.endsWith(".AppImage")) return "Linux (AppImage)";
	return name;
}

export function DownloadModal({ open, onClose }: DownloadModalProps) {
	const [releases, setReleases] = useState<GitHubRelease[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchReleases = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(
				`https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=10`,
			);
			if (!res.ok) throw new Error("Erro ao carregar versões");
			const data: GitHubRelease[] = await res.json();
			setReleases(data);
		} catch {
			setError("Não foi possível carregar as versões disponíveis.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (open && releases.length === 0) {
			fetchReleases();
		}
	}, [open, releases.length, fetchReleases]);

	const getInstallerAssets = (release: GitHubRelease) =>
		release.assets.filter(
			(a) =>
				a.name.endsWith(".exe") ||
				a.name.endsWith(".deb") ||
				a.name.endsWith(".AppImage"),
		);

	return (
		<Modal open={open} onClose={onClose}>
			<div className="flex flex-col border border-border bg-surface w-[min(520px,calc(100vw-2rem))] max-h-[75vh]">
				<div className="flex items-center justify-between border-b border-border px-5 py-4">
					<div className="flex items-center gap-2">
						<Download size={18} className="text-primary" />
						<span className="text-base font-bold uppercase tracking-wider text-text">
							Descarregar SecureIT
						</span>
					</div>
					<a
						href={`https://github.com/${GITHUB_REPO}/releases`}
						target="_blank"
						rel="noopener noreferrer"
						className="text-xs text-text-muted hover:text-primary transition-colors flex items-center gap-1"
					>
						Ver no GitHub
						<ExternalLink size={12} />
					</a>
				</div>

				<div className="overflow-y-auto flex-1 p-4 space-y-3">
					{loading && (
						<div className="flex items-center justify-center py-10">
							<Loader size={24} className="animate-spin text-primary" />
						</div>
					)}

					{error && (
						<p className="text-sm text-center text-red-500 py-6">{error}</p>
					)}

					{!loading && !error && releases.length === 0 && (
						<p className="text-sm text-center text-text-muted py-6">
							Nenhuma versão encontrada.
						</p>
					)}

					{releases.map((release) => {
						const assets = getInstallerAssets(release);
						if (assets.length === 0) return null;

						return (
							<div
								key={release.tag_name}
								className="border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
							>
								<div className="flex items-center justify-between mb-3">
									<div className="flex items-center gap-2">
										<span className="text-sm font-bold text-text">
											{release.tag_name}
										</span>
										{release === releases[0] && (
											<span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
												Latest
											</span>
										)}
									</div>
									<div className="flex items-center gap-1 text-xs text-text-muted">
										<Calendar size={12} />
										{formatDate(release.published_at)}
									</div>
								</div>

								{release.body && (
									<p className="text-xs text-text-muted mb-3 line-clamp-2">
										{release.body}
									</p>
								)}

								<div className="flex flex-wrap gap-2">
									{assets.map((asset) => {
										const ext = asset.name.match(/\.[^.]+$/)?.[0] ?? "";
										const Icon = platformIcons[ext] ?? Download;
										return (
											<a
												key={asset.name}
												href={asset.browser_download_url}
												download
												className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-primary/5 hover:border-primary/30 transition-colors"
											>
												<Icon size={14} className="text-primary" />
												<span>{getPlatformLabel(asset.name)}</span>
												<span className="text-text-muted">
													({formatSize(asset.size)})
												</span>
											</a>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</Modal>
	);
}
