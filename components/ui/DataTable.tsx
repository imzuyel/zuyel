"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "./SkeletonScreens";
import { Inbox, AlertTriangle, RefreshCw } from "lucide-react";
import Button from "./Button";

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  sticky?: boolean;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  isLoading?: boolean;
  loadingRows?: number;
  error?: string | null;
  onRetry?: () => void;
  emptyMessage?: string;
  emptyTitle?: string;
  emptyAction?: React.ReactNode;
  className?: string;
  tableClassName?: string;
  onRowClick?: (row: T) => void;
  stickyFirstColumn?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  loadingRows = 5,
  error = null,
  onRetry,
  emptyTitle = "কোনো তথ্য পাওয়া যায়নি (No Records Found)",
  emptyMessage = "বর্তমান ফিল্টারে প্রদর্শনের মতো কোনো তথ্য নেই।",
  emptyAction,
  className,
  tableClassName,
  onRowClick,
  stickyFirstColumn = false,
}: DataTableProps<T>) {
  // 1. Loading State
  if (isLoading) {
    return (
      <div className={cn("w-full overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4", className)}>
        <TableSkeleton rows={loadingRows} />
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div
        className={cn(
          "w-full rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/20 p-8",
          "flex flex-col items-center justify-center text-center space-y-3",
          className
        )}
      >
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <AlertTriangle className="w-6 h-6 shrink-0" />
        </div>
        <div className="space-y-1">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
            তথ্য লোড করতে সমস্যা হয়েছে
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
            {error}
          </p>
        </div>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            পুনরায় চেষ্টা করুন (Retry)
          </Button>
        )}
      </div>
    );
  }

  // 3. Empty State
  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          "w-full rounded-xl border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/40 p-10",
          "flex flex-col items-center justify-center text-center space-y-3",
          className
        )}
      >
        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
          <Inbox className="w-7 h-7 shrink-0" />
        </div>
        <div className="space-y-1">
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-base">
            {emptyTitle}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            {emptyMessage}
          </p>
        </div>
        {emptyAction && <div className="pt-1">{emptyAction}</div>}
      </div>
    );
  }

  // 4. Data Table Display
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs",
        className
      )}
    >
      <div className="overflow-x-auto custom-scrollbar">
        <table className={cn("w-full border-collapse text-left text-sm", tableClassName)}>
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
              {columns.map((col, idx) => {
                const isSticky = stickyFirstColumn && idx === 0;
                return (
                  <th
                    key={col.key || idx}
                    className={cn(
                      "px-4 py-3.5 font-semibold text-xs tracking-wider uppercase text-slate-600 dark:text-slate-300 select-none whitespace-nowrap",
                      isSticky && "sticky left-0 z-10 bg-slate-50 dark:bg-slate-900 shadow-[1px_0_0_0_rgba(226,232,240,0.8)] dark:shadow-[1px_0_0_0_rgba(51,65,85,0.7)]",
                      col.headerClassName,
                      col.className
                    )}
                  >
                    {col.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {data.map((row, rowIdx) => {
              const rowKey = keyExtractor(row, rowIdx);
              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    "transition-colors duration-100",
                    rowIdx % 2 === 1
                      ? "bg-slate-50/40 dark:bg-slate-900/30"
                      : "bg-white dark:bg-slate-900",
                    onRowClick && "cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-slate-800/60",
                    !onRowClick && "hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  )}
                >
                  {columns.map((col, colIdx) => {
                    const isSticky = stickyFirstColumn && colIdx === 0;
                    const content = col.render
                      ? col.render(row, rowIdx)
                      : (row as any)[col.key];

                    return (
                      <td
                        key={col.key || colIdx}
                        className={cn(
                          "px-4 py-3 text-slate-700 dark:text-slate-300 align-middle",
                          isSticky &&
                            cn(
                              "sticky left-0 z-10 font-medium text-slate-900 dark:text-slate-100",
                              "shadow-[1px_0_0_0_rgba(226,232,240,0.8)] dark:shadow-[1px_0_0_0_rgba(51,65,85,0.7)]",
                              rowIdx % 2 === 1
                                ? "bg-slate-50 dark:bg-slate-900"
                                : "bg-white dark:bg-slate-900"
                            ),
                          col.className
                        )}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
