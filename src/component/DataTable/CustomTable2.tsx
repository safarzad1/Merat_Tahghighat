"use client";

import {
  Search,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  FileText,
  Printer,
} from "lucide-react";
import { useState, useRef } from "react";

interface TableColumn {
  title: string;
  field: string;
  width?: string;
}

interface TableAction {
  icon: React.ReactNode; // آیکن دلخواه
  colorClass?: string; // رنگ دکمه
  title?: string; // Tooltip
  onClick: (row: any) => void; // اکشن کلیک
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
  actions?: TableAction[]; // ✅ دکمه‌های عملیات از بیرون
}

const DynamicTable: React.FC<DynamicTableProps> = ({
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
}) => {
  const totalPages = Math.ceil(totalRecord / recordsPerPage);
  const [localSearch, setLocalSearch] = useState(search || "");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const pdfRef = useRef<any>(null);

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
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        totalPages > 15 &&
        i !== 1 &&
        i !== totalPages &&
        (i < page - 2 || i > page + 2)
      ) {
        if (i === 2 || i === totalPages - 1) pages.push(<span key={i}>...</span>);
        continue;
      }
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange?.(i)}
          className={`cursor-pointer px-2 py-[2px] border rounded text-sm ${
            i === page ? "bg-blue-500 text-white" : "hover:bg-gray-200"
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="w-full">
      <h2 className="text-center text-lg font-semibold mb-2 text-gray-800">
        {title}
      </h2>

      {/* نوار بالای جدول */}
      <div className="flex justify-between items-center mb-2 gap-3 flex-wrap">
        <div className="text-gray-700 font-medium text-[14px]">
          تعداد کل: <span className="font-bold text-blue-600">{totalRecord}</span>
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
            className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600"
            title="تازه‌سازی"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={onExportExcel}
            className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600"
            title="خروجی Excel"
          >
            <FileText size={16} />
          </button>
          <button
            onClick={() => pdfRef.current?.exportPDF()}
            className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-gray-500 text-white hover:bg-gray-600"
            title="چاپ"
          >
            <Printer size={16} />
          </button>
        </div>
      </div>

      {/* جدول داده‌ها */}
      <table className="min-w-full table-auto border-collapse">
        <thead className="text-[14px]">
          <tr className="bg-blue-200 font-bold text-gray-800 h-7 shadow">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className="border px-3 py-[2px] text-center cursor-pointer select-none"
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
              <th className="border px-3 py-[2px] text-center">عملیات</th>
            )}
          </tr>
        </thead>

        <tbody className="text-[13.5px]">
          {data.length > 0 ? (
            data.map((item, idx) => (
              <tr
                key={idx}
                className={`${
                  idx % 2 === 0 ? "bg-white" : "bg-gray-100"
                } hover:bg-gray-200 transition-colors`}
              >
                {columns.map((col, fidx) => (
                  <td
                    key={fidx}
                    className="text-center border px-2 py-[3px] truncate"
                  >
                    {item[col.field]}
                  </td>
                ))}

                {actions.length > 0 && (
                  <td className="text-center border px-1 py-[3px]">
                    <div className="flex justify-center gap-1">
                      {actions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => action.onClick(item)}
                          title={action.title}
                          className={`p-1 cursor-pointer rounded-full text-white hover:opacity-90 transition ${action.colorClass || "bg-blue-500"}`}
                        >
                          {action.icon}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td
                className="border px-4 py-2 text-center text-sm"
                colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
              >
                هیچ داده‌ای یافت نشد
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* صفحه‌بندی */}
      <div className="flex justify-center gap-1.5 mt-3">
        <button
          onClick={() => onPageChange?.(Math.max(page - 1, 1))}
          className="cursor-pointer px-3 py-[3px] border rounded disabled:opacity-50 bg-green-700 text-white text-sm"
          disabled={page === 1}
        >
          قبلی
        </button>

        {renderPageNumbers()}

        <button
          onClick={() => onPageChange?.(Math.min(page + 1, totalPages))}
          className="cursor-pointer px-3 py-[3px] border rounded disabled:opacity-50 bg-green-700 text-white text-sm"
          disabled={page === totalPages}
        >
          بعدی
        </button>
      </div>
    </div>
  );
};

export default DynamicTable;
