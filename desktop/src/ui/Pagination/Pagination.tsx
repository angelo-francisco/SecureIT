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
    <div className="pagination text-center pt-3 pb-10 md:pb-0">
      <span className="step-links flex items-center gap-2 justify-center">
        {hasPrevious && (
          <button
            onClick={() => onPageChange(page - 1)}
            className="text-text-muted hover:text-text transition-colors"
          >
            <Lucide.ChevronLeft />
          </button>
        )}
        <span className="current text-text">
          Pág. {page} / {numPages}
        </span>
        {hasNext && (
          <button
            onClick={() => onPageChange(page + 1)}
            className="text-text-muted hover:text-text transition-colors"
          >
            <Lucide.ChevronRight />
          </button>
        )}
      </span>
    </div>
  );
}
