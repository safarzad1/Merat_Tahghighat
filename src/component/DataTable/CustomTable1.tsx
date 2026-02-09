"use client";

import {
  Search,
  ArrowDown,
  ArrowUp,
  RefreshCcw,
} from "lucide-react";
import React, {
  useEffect,
  useState,
  type FC,
  type ReactNode,
} from "react";
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
  showTooltip?: boolean;
  tooltipField?: string;
}

interface TableAction {
  icon: ReactNode;
  colorClass?: string;
  title?: string;
  onClick: (row: any) => void;
  condition?: (row: any) => boolean;
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
  actions?: TableAction[];
  rowClassName?: (row: any, rowIndex: number) => string;
}

// ✅ کامپوننت تولتیپ اصلاح شده با موقعیت‌یابی دقیق (Fixed Position)
const CustomTooltip: FC<{ children: ReactNode; content: ReactNode }> = ({ children, content }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    // دریافت موقعیت موس نسبت به صفحه
    const rect = e.currentTarget.getBoundingClientRect();

    // تنظیم موقعیت: کمی بالاتر از موس و وسط‌چین نسبت به المان
    setPosition({
      top: rect.top - 10, // 10 پیکسل بالاتر
      left: rect.left + rect.width / 2, // وسط افقی المان
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
            position: 'fixed',
            top: position.top,
            left: position.left,
            transform: 'translate(-50%, -100%)', // حرکت به بالا و وسط‌چین کردن
          }}
          className="z-[99999] px-3 py-1.5 mb-2
                      text-xs text-white bg-gray-900 rounded-md shadow-xl 
                      whitespace-nowrap pointer-events-none"
        >
          {content}
          {/* فلش کوچک زیر تولتیپ */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
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
  actions = [],
  rowClassName,
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
    if (field === sortField) {
      newDirection = sortDirection === "asc" ? "desc" : "asc";
    }
    setSortField(field);
    setSortDirection(newDirection);
    onSortChange?.(field, newDirection);
  };

  const renderPageNumbers = () => {
    const pages: ReactNode[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        totalPages > 15 &&
        i !== 1 &&
        i !== totalPages &&
        (i < page - 2 || i > page + 2)
      ) {
        if (i === 2 || i === totalPages - 1)
          pages.push(<span key={i}>...</span>);
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

  return (
    <div className="w-full">
      {/* ===== نوار بالای جدول ===== */}
      <div className="flex justify-between items-center mb-2 gap-3 flex-wrap">
        <div className="bg-green-200 px-3 py-2 rounded-2xl text-gray-700 font-medium text-[17px]">
          {title} | تعداد کل:{" "}
          <span className="text-blue-600">{totalRecord}</span>
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

        <div className="flex items-center gap-1.5">
          <button
            onClick={onRefresh}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-green-800 text-white hover:bg-green-600"
            title="تازه‌سازی"
            type="button"
          >
            <RefreshCcw size={16} />
          </button>
        </div>
      </div>

      {/* ===== جدول ===== */}
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
            {actions.length > 0 && (
              <th className="border px-1 py-0/5 text-center">عملیات</th>
            )}
          </tr>
        </thead>

        <tbody className="text-[16px]">
          {data.length > 0 ? (
            data.map((item, idx) => (
              <tr
                key={idx}
                className={cn(getRowClass(item, idx), "transition-colors cursor-pointer")}
                onClick={() => {
                  if (actions.length > 0) actions[0].onClick(item);
                }}
              >
                {columns.map((col, fidx) => {
                  const cellContent = col.render
                    ? col.render(item[col.field], item, idx)
                    : item[col.field];

                  const tooltipContent = col.tooltipField
                    ? item[col.tooltipField]
                    : cellContent;

                  const shouldShowTooltip = col.showTooltip;

                  return (
                    <td
                      key={fidx}
                      className="text-center border px-2 py-2 truncate relative"
                    >
                      {shouldShowTooltip ? (
                        <CustomTooltip content={tooltipContent}>
                          <span className="block w-full">{cellContent}</span>
                        </CustomTooltip>
                      ) : (
                        <span>{cellContent}</span>
                      )}
                    </td>
                  );
                })}

                {actions.length > 0 && (
                  <td className="text-center border px-1 py-1 w-5 relative">
                    <div className="flex justify-center gap-1">
                      {actions.map((action, aIdx) => {
                        if (action.condition && !action.condition(item)) {
                          return null;
                        }

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

      {/* ===== صفحه‌بندی ===== */}
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