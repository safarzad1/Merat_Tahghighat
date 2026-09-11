"use client";

import React, { useEffect, useMemo, useRef, useState, type FC, type ReactNode } from "react";
import { Search, ArrowDown, ArrowUp, RefreshCcw, ChevronDown } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TableColumn {
  title: string;
  field: string;
  width?: string;

  render?: (value: any, row: any, rowIndex: number) => ReactNode;

  // Tooltip options
  showTooltip?: boolean;
  tooltipField?: string;

  // tooltip generator
  renderTooltip?: (row: any, value: any, rowIndex: number) => ReactNode;

  // trigger hover fetch only on this column cell
  hoverFetch?: boolean;
}

interface TableAction {
  icon: ReactNode;
  colorClass?: string;
  title?: string;
  onClick: (row: any) => void;
  condition?: (row: any) => boolean;
}

/** ✅ Header action: supports submenu */
export interface HeaderAction {
  icon: ReactNode;
  title?: string;

  /** ✅ optional because parent menu items often only open submenu */
  onClick?: () => void;

  className?: string; // e.g. "bg-green-800 hover:bg-green-600"
  condition?: boolean; // if false => hidden

  /** ✅ submenu */
  children?: HeaderAction[];
}

interface DynamicTableProps {
  data: any[];
  columns?: TableColumn[];
  title?: string;
  totalRecord: number;
  recordsPerPage?: number;
  page: number;
  search?: string;

  onPageChange?: (newPage: number) => void;
  onSearch?: (text: string) => void;
  onSortChange?: (field: string, direction: "asc" | "desc") => void;
  onRefresh?: () => void;
  onExportExcel?: () => void;

  headerActions?: HeaderAction[];

  actions?: TableAction[];
  rowClassName?: (row: any, rowIndex: number) => string;

  rowKeyField?: string;

  onRowMouseEnter?: (
    e: React.MouseEvent<HTMLElement>,
    rowKeyValue: any,
    row: any,
    rowIndex: number
  ) => void;

  onRowMouseLeave?: (e: React.MouseEvent<HTMLElement>, row: any, rowIndex: number) => void;
}

// ✅ Tooltip component
const CustomTooltip: FC<{ children: ReactNode; content: ReactNode }> = ({ children, content }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      top: rect.top - 10,
      left: rect.left + rect.width / 2,
    });
    setIsVisible(true);
  };

  return (
    <div
      className="relative inline-flex items-center justify-center w-full h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
            transform: "translate(-50%, -100%)",
          }}
          className="z-[99999] px-3 py-1.5 mb-2 text-xs text-white bg-gray-900 rounded-md shadow-xl
                     whitespace-nowrap pointer-events-none"
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

// ✅ یک آیتم منو که اگر children داشت زیرمنو می‌سازد
const MenuItem: FC<{
  item: HeaderAction;
  onCloseAll: () => void;
}> = ({ item, onCloseAll }) => {
  const [subOpen, setSubOpen] = useState(false);
  const hasChildren = !!item.children?.some((c) => c.condition !== false);
  const children = useMemo(
    () => (item.children || []).filter((c) => c.condition !== false),
    [item.children]
  );

  return (
    <div
      className="relative"
      onMouseEnter={() => hasChildren && setSubOpen(true)}
      onMouseLeave={() => hasChildren && setSubOpen(false)}
    >
      <button
        type="button"
        className="w-full cursor-pointer text-right px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 flex items-center gap-2"
        onClick={() => {
          if (hasChildren) {
            setSubOpen((v) => !v);
            return;
          }
          item.onClick?.();
          onCloseAll();
        }}
        title={item.title}
      >
        <span className="text-gray-600">{item.icon}</span>
        <span className="text-gray-800 flex-1">{item.title}</span>

        {/* فلش فقط برای آیتم‌های زیرمنو */}
        {hasChildren && <span className="text-gray-400">›</span>}
      </button>

      {/* ✅ زیرمنو: به راست باز می‌شود */}
      {hasChildren && subOpen && (
        <div className="absolute top-0 left-full ml-2 w-[320px] bg-white border border-gray-200 rounded-xl shadow-xl z-[99999] overflow-hidden">
          {children.map((c, idx) => (
            <MenuItem key={idx} item={c} onCloseAll={onCloseAll} />
          ))}
        </div>
      )}
    </div>
  );
};

/** ✅ Dropdown زیر دکمه از چپ باز می‌شود */
const HeaderDropdown: FC<{ action: HeaderAction }> = ({ action }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const items = useMemo(
    () => (action.children || []).filter((c) => c.condition !== false),
    [action.children]
  );

  useEffect(() => {
    if (!open) return;

    const onDocDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDocDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const closeAll = () => setOpen(false);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={cn(
          "h-8 px-3 flex items-center justify-center gap-1 rounded-full text-white hover:opacity-90 transition",
          action.className || "bg-blue-600"
        )}
        title={action.title}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center justify-center">{action.icon}</span>
        <ChevronDown size={14} className={cn("transition", open ? "rotate-180" : "")} />
      </button>

      {/* ✅ منو زیر دکمه و از چپ تراز می‌شود */}
      {open && items.length > 0 && (
        <div className="absolute top-full left-0 mt-2 w-[360px] bg-white border border-gray-200 rounded-xl shadow-xl z-[99999] overflow-visible">
          <div className="px-3 py-2 font-bold text-white bg-green-700 border-b">
            {action.title || "منو"}
          </div>

          <div className="py-1">
            {items.map((it, idx) => (
              <MenuItem key={idx} item={it} onCloseAll={closeAll} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DynamicTable: FC<DynamicTableProps> = ({
  data,
  columns = [],
  title = "جدول اطلاعات",
  totalRecord,
  recordsPerPage = 10,
  page,
  search,
  onPageChange,
  onSearch,
  onSortChange,
  onRefresh,
  onExportExcel,
  headerActions = [],
  actions = [],
  rowClassName,
  rowKeyField,
  onRowMouseEnter,
  onRowMouseLeave,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalRecord / recordsPerPage));
  const [localSearch, setLocalSearch] = useState(search || "");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    setLocalSearch(search || "");
  }, [search]);

  const handleSort = (field: string) => {
    let newDirection: "asc" | "desc" = "asc";
    if (field === sortField) newDirection = sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);
    onSortChange?.(field, newDirection);
  };

  const renderPageNumbers = () => {
    const pages: ReactNode[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (totalPages > 15 && i !== 1 && i !== totalPages && (i < page - 2 || i > page + 2)) {
        if (i === 2 || i === totalPages - 1) pages.push(<span key={i}>...</span>);
        continue;
      }

      pages.push(
        <button
          key={i}
          onClick={() => onPageChange?.(i)}
          className={cn(
            "cursor-pointer px-2 py-[2px] border rounded text-sm",
            i === page ? "bg-blue-500 text-white" : "hover:bg-gray-200"
          )}
          type="button"
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  const getDefaultRowClass = (idx: number) =>
    `${idx % 2 === 0 ? "bg-white" : "bg-gray-100"} hover:bg-gray-200`;

  const getRowClass = (row: any, idx: number) => {
    const custom = rowClassName?.(row, idx);
    if (custom && custom.trim()) return custom;
    return getDefaultRowClass(idx);
  };

  const getRowKeyValue = (row: any, fallbackIdx: number) => {
    // اگر rowKeyField تعریف شده
    if (rowKeyField) {
      const v = row?.[rowKeyField];

      // اگر مقدار معتبر نبود => fallback
      if (v === undefined || v === null || v === "") {
        return fallbackIdx;
      }

      // اگر عدد/رشته بود همان
      if (typeof v === "string" || typeof v === "number") return v;

      // اگر چیز دیگری بود (مثلا object) => fallback
      return fallbackIdx;
    }

    // اگر rowKeyField نداریم
    return fallbackIdx;
  };

  const visibleHeaderActions = useMemo(
    () => headerActions.filter((a) => a.condition !== false),
    [headerActions]
  );

  return (
    <div className="w-full">
      {/* ===== Header ===== */}
      <div className="flex justify-between items-center mb-2 gap-3 flex-wrap">
        <div className="bg-green-200 px-3 py-2 rounded-2xl text-gray-700 font-medium text-[17px]">
          {title} | تعداد کل: <span className="text-blue-600">{totalRecord}</span>
        </div>

        <div className="relative w-72 flex-1 max-w-md">
          <input
            type="text"
            placeholder="جستجو..."
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              onSearch?.(e.target.value);
            }}
            className="h-9 pr-9 pl-3 border border-gray-300 rounded-full w-full text-[14px]
                       focus:border-blue-500 focus:ring-1 focus:ring-blue-400
                       outline-none transition-all duration-200 ease-in-out"
          />
          <Search
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* ✅ header actions (buttons + dropdowns) */}
          {visibleHeaderActions.map((a, i) => {
            const hasChildren = !!a.children?.some((c) => c.condition !== false);
            if (hasChildren) return <HeaderDropdown key={i} action={a} />;

            return (
              <button
                key={i}
                onClick={a.onClick}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full text-white hover:opacity-90 transition",
                  a.className || "bg-blue-600"
                )}
                title={a.title}
                type="button"
              >
                {a.icon}
              </button>
            );
          })}

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-green-800 text-white hover:bg-green-600"
              title="تازه‌سازی"
              type="button"
            >
              <RefreshCcw size={16} />
            </button>
          )}

          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="px-3 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-500 text-sm"
              title="خروجی اکسل"
              type="button"
            >
              Excel
            </button>
          )}
        </div>
      </div>

      {/* ===== Table ===== */}
      <table className="min-w-full table-auto border-collapse">
        <thead className="text-[15px] border-b-2 border-gray-400">
          <tr className="bg-sky-100 text-gray-900 h-10">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className="border border-gray-400 px-3 py-1 text-center cursor-pointer select-none
                           hover:bg-sky-200 transition-colors"
                style={{ width: col.width || "auto" }}
                onClick={() => handleSort(col.field)}
              >
                <div className="flex items-center justify-center gap-1">
                  {col.title}
                  {sortField === col.field ? (
                    sortDirection === "asc" ? (
                      <ArrowUp size={13} />
                    ) : (
                      <ArrowDown size={13} />
                    )
                  ) : null}
                </div>
              </th>
            ))}
            {actions.length > 0 && <th className="border px-1 py-0/5 text-center">عملیات</th>}
          </tr>
        </thead>

        <tbody className="text-[16px]">
          {data.length > 0 ? (
            data.map((item, idx) => (
              <tr

                key={`${getRowKeyValue(item, idx)}-${idx}`}

                className={cn(getRowClass(item, idx), "transition-colors cursor-pointer")}
                onClick={() => {
                  if (actions.length > 0) actions[0].onClick(item);
                }}
                onMouseLeave={(e) => onRowMouseLeave?.(e as any, item, idx)}
              >
                {columns.map((col, fidx) => {
                  const cellValue = item?.[col.field];
                  const cellContent = col.render ? col.render(cellValue, item, idx) : cellValue;

                  const tooltipContent = col.renderTooltip
                    ? col.renderTooltip(item, cellValue, idx)
                    : col.tooltipField
                      ? item?.[col.tooltipField]
                      : cellContent;

                  const shouldShowTooltip = !!col.showTooltip;

                  return (
                    <td
                      key={fidx}
                      className="text-center border px-2 py-2 truncate relative"
                      onMouseEnter={(e) => {
                        if (!col.hoverFetch) return;
                        const keyValue = rowKeyField ? item?.[rowKeyField] : item;
                        onRowMouseEnter?.(e as any, keyValue, item, idx);
                      }}
                    >
                      {shouldShowTooltip ? (
                        <CustomTooltip content={tooltipContent}>
                          <span className="block w-full">{cellContent ?? ""}</span>
                        </CustomTooltip>
                      ) : (
                        <span>{cellContent ?? ""}</span>
                      )}
                    </td>
                  );
                })}

                {actions.length > 0 && (
                  <td className="text-center border px-1 py-1 w-5 relative">
                    <div className="flex justify-center gap-1">
                      {actions.map((action, aIdx) => {
                        if (action.condition && !action.condition(item)) return null;

                        return (
                          <button
                            key={aIdx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(item);
                            }}
                            title={action.title}
                            className={cn(
                              "p-2 cursor-pointer rounded-full text-white hover:opacity-90 transition",
                              action.colorClass || "bg-blue-500"
                            )}
                          >
                            {action.icon}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td
                className="border px-4 py-4 text-center text-sm"
                colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
              >
                هیچ داده‌ای یافت نشد
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ===== Pagination ===== */}
      <div className="flex justify-center gap-1.5 mt-3">
        <button
          onClick={() => onPageChange?.(Math.max(page - 1, 1))}
          className="cursor-pointer px-3 py-[3px] border rounded disabled:opacity-50 bg-green-700 text-white text-sm"
          disabled={page === 1}
          type="button"
        >
          قبلی
        </button>

        {renderPageNumbers()}

        <button
          onClick={() => onPageChange?.(Math.min(page + 1, totalPages))}
          className="cursor-pointer px-3 py-[3px] border rounded disabled:opacity-50 bg-green-700 text-white text-sm"
          disabled={page === totalPages}
          type="button"
        >
          بعدی
        </button>
      </div>
    </div>
  );
};

export default DynamicTable;