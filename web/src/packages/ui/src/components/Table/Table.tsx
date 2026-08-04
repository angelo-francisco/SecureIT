import type {
	HTMLAttributes,
	ReactNode,
	TableHTMLAttributes,
	TdHTMLAttributes,
	ThHTMLAttributes,
} from "react";
import { cn } from "../../lib/cn";

export const ShadcnTable = ({
	className,
	...props
}: TableHTMLAttributes<HTMLTableElement>) => (
	<div className="relative w-full overflow-auto">
		<table
			className={cn("w-full caption-bottom text-sm", className)}
			{...props}
		/>
	</div>
);

export const TableHeader = ({
	className,
	...props
}: HTMLAttributes<HTMLTableSectionElement>) => (
	<thead
		className={cn("[&_tr]:border-b border-border-light", className)}
		{...props}
	/>
);

export const TableBody = ({
	className,
	...props
}: HTMLAttributes<HTMLTableSectionElement>) => (
	<tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
);

export const TableRow = ({
	className,
	...props
}: HTMLAttributes<HTMLTableRowElement>) => (
	<tr
		className={cn(
			"border-b border-border-light transition-colors hover:bg-surface/50 data-[state=selected]:bg-surface-hover",
			className,
		)}
		{...props}
	/>
);

export const TableHead = ({
	className,
	...props
}: ThHTMLAttributes<HTMLTableCellElement>) => (
	<th
		className={cn(
			"h-12 px-4 text-left align-middle font-semibold text-text-muted text-xs uppercase tracking-wider",
			className,
		)}
		{...props}
	/>
);

export const TableCell = ({
	className,
	...props
}: TdHTMLAttributes<HTMLTableCellElement>) => (
	<td className={cn("p-4 align-middle", className)} {...props} />
);

export interface Column {
	key: string;
	header: string;
	render?: (item: Record<string, unknown>) => ReactNode;
	className?: string;
}

interface TableProps {
	columns: Column[];
	data: Record<string, unknown>[];
}

export function Table({ columns, data }: TableProps) {
	return (
		<ShadcnTable>
			<TableHeader>
				<TableRow>
					{columns.map((col) => (
						<TableHead key={col.key} className={col.className}>
							{col.header}
						</TableHead>
					))}
				</TableRow>
			</TableHeader>
			<TableBody>
				{data.map((row, rowIdx) => (
					<TableRow key={rowIdx}>
						{columns.map((col) => (
							<TableCell key={col.key} className={col.className}>
								{col.render ? col.render(row) : String(row[col.key] ?? "")}
							</TableCell>
						))}
					</TableRow>
				))}
			</TableBody>
		</ShadcnTable>
	);
}
