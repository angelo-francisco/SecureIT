"use client";

import { Modal } from "@/packages/ui";
import { DownloadSection } from "../../components/DownloadSection";

interface DownloadModalProps {
	open: boolean;
	onClose?: () => void;
}

export function DownloadModal({ open, onClose }: DownloadModalProps) {
	return (
		<Modal open={open} onClose={onClose}>
			<div className="w-[min(520px,calc(100vw-2rem))] max-h-[75vh]">
				<DownloadSection />
			</div>
		</Modal>
	);
}
