"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@dbk/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./Table";
import { Skeleton } from "../primitives/Skeleton";
import { EmptyState } from "../feedback/EmptyState";

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  sort?: { columnId: string; direction: "asc" | "desc" };
  onSortChange?: (columnId: string) => void;
  onRowClick?: (row: T) => void;
}

/**
 * A deliberately lightweight, dependency-free sortable table (columns +
 * rows in, semantic `<table>` out) rather than adopting a table library
 * like @tanstack/react-table. That's the right trade-off for the
 * server-driven, single-sort-column tables this platform needs today
 * (Admin/Creator management lists per §2.6's PagedResponse); if a future
 * screen needs client-side multi-column sort, column resizing, or virtual
 * scrolling, adopting @tanstack/react-table at that point is additive — it
 * wouldn't need this component's call sites to change their column defs.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  isLoading = false,
  emptyTitle = "Nothing to show yet",
  emptyDescription,
  sort,
  onSortChange,
  onRowClick,
}: DataTableProps<T>) {
  if (!isLoading && rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => {
            const isSorted = sort?.columnId === column.id;
            const SortIcon = !isSorted ? ChevronsUpDown : sort?.direction === "asc" ? ArrowUp : ArrowDown;

            return (
              <TableHead key={column.id} className={column.className}>
                {column.sortable ? (
                  <button
                    type="button"
                    onClick={() => onSortChange?.(column.id)}
                    className="flex items-center gap-1 uppercase tracking-wide hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] rounded"
                    aria-sort={isSorted ? (sort?.direction === "asc" ? "ascending" : "descending") : "none"}
                  >
                    {column.header}
                    <SortIcon className="size-3.5" aria-hidden />
                  </button>
                ) : (
                  column.header
                )}
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                {columns.map((column) => (
                  <TableCell key={column.id}>
                    <Skeleton className="h-4 w-full max-w-32" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : rows.map((row) => (
              <TableRow
                key={getRowId(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick ? "cursor-pointer" : undefined)}
              >
                {columns.map((column) => (
                  <TableCell key={column.id} className={column.className}>
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
      </TableBody>
    </Table>
  );
}
