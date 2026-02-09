// Component/ConfirmModal.tsx
"use client";
import { FC, useRef, useEffect } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  header?: string; // متن هدر
  type?: "success" | "warning" | "error"; // نوع پیام
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: FC<ConfirmModalProps> = ({
  isOpen,
  message,
  header,
  type = "success",
  onConfirm,
  onCancel,
}) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // فوکوس روی دکمه تایید وقتی مودال باز شد
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  // فعال‌سازی Enter برای تایید
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && isOpen) {
        e.preventDefault(); // جلوگیری از submit فرم در پس‌زمینه
        onConfirm();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onConfirm]);

  if (!isOpen) return null;

  const headerColor = {
    success: "bg-green-200 text-green-800",
    warning: "bg-yellow-200 text-yellow-800",
    error: "bg-red-200 text-red-800",
  }[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* پس‌زمینه تار */}
      <div
        className="absolute inset-0 bg-black opacity-40"
        onClick={onCancel}
      ></div>

      {/* خود مودال */}
      <div className="bg-white rounded-lg shadow-lg z-50 w-96 relative overflow-hidden">
        {/* هدر */}
        {header && (
          <div className={`px-4 py-2 font-bold text-center ${headerColor}`}>
            {header}
          </div>
        )}

        {/* متن و دکمه‌ها */}
        <div className="p-4">
          <p className="text-center text-[15px]">{message}</p>

          <div className="flex justify-end gap-2 mt-4">
            <button
              className="cursor-pointer bg-gray-300 hover:bg-gray-400 px-4 py-1 rounded"
              onClick={onCancel}
            >
              لغو
            </button>
            <button
              ref={confirmButtonRef}
              className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded"
              onClick={onConfirm}
            >
              تایید
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
