import * as Lucide from "lucide-react";

interface PaginationProps {
	page: number;
	numPages: number;
	hasNext: boolean;
	hasPrevious: boolean;
	onPageChange: (page: number) => void;
}

export function Pagination({
	page,
	numPages,
	hasNext,
	hasPrevious,
	onPageChange,
}: PaginationProps) {
	return (
		<div className="text-center pt-3 pb-10 md:pb-0">
			<span className="flex items-center gap-2 justify-center">
				{hasPrevious && (
					<button
						type="button"
						onClick={() => onPageChange(page - 1)}
						className="text-text-muted hover:text-text transition-colors"
						aria-label="Página anterior"
					>
						<Lucide.ChevronLeft />
					</button>
				)}
				<span className="text-text">
					Pág. {page} / {numPages}
				</span>
				{hasNext && (
					<button
						type="button"
						onClick={() => onPageChange(page + 1)}
						className="text-text-muted hover:text-text transition-colors"
						aria-label="Próxima página"
					>
						<Lucide.ChevronRight />
					</button>
				)}
			</span>
		</div>
	);
}
