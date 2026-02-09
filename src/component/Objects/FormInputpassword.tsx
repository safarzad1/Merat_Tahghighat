"use client";
import { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FormInputProps {
  label?: string;
  placeholder?: string;
  icon?: LucideIcon;
  value?: string;
  maxLength?: number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  error?: boolean;
  errorMessage?: string;
  onlyNumber?: boolean;
}

const FormInput = ({
  label,
  placeholder,
  icon: Icon,
  value,
  maxLength,
  onChange,
  onKeyDown,
  error,
  errorMessage,
  onlyNumber = false,
}: FormInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (onlyNumber) {
      val = val.replace(/\D/g, ""); // فقط اعداد نگه داشته شوند
    }
    onChange?.({ ...e, target: { ...e.target, value: val } } as any);
  };

  return (
    <div className="flex flex-col w-full mb-1">
      {label && (
        <label className="text-right mb-1 text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}
      <div
        className={`flex items-center h-9 pr-3 border rounded-lg overflow-hidden w-full
          focus-within:ring-1 focus-within:border-indigo-500 focus-within:ring-indigo-500 transition-all duration-200 ease-in-out
          ${error ? "border-red-500 focus-within:border-red-400 focus-within:ring-red-400" : "border-gray-300"}`}
      >
        {Icon && <Icon size={20} className="text-slate-400 mr-2 pointer-events-none" />}
        <input
          type="password"
          value={value}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          maxLength={maxLength}
          placeholder={placeholder}
          className="text-black flex-1 h-full px-3 text-sm text-right outline-none bg-transparent placeholder-slate-400"
        />
      </div>

      <AnimatePresence>
        {errorMessage && (
          <motion.p
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.25 }}
            className="text-red-600 text-sm mt-1 text-right font-medium"
          >
            {errorMessage}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FormInput;
