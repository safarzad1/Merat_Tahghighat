"use client";

import { LucideIcon, Eye, EyeOff } from "lucide-react";
import { UseFormRegisterReturn } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface CustomInputProps {
  label?: string;
  placeholder?: string;
  icon?: LucideIcon;
  maxLength?: number;
  type?: string;
  register: UseFormRegisterReturn;
  error?: boolean;
  errorMessage?: string;
}

const FormInput2 = ({
  label,
  placeholder,
  icon: Icon,
  maxLength,
  type = "text",
  register,
  error,
  errorMessage,
}: CustomInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <div className="flex flex-col w-full mb-4">
      {label && (
        <label className="text-right mb-1 text-[15px] font-medium text-purple-800">
          {label}
        </label>
      )}

      <div
        className={`flex items-center h-10 pr-3 border rounded-full overflow-hidden w-full transition-all duration-300 ${error
            ? "border-red-400 bg-red-50 focus-within:ring-1 focus-within:ring-red-300"
            : "border-slate-300 focus-within:ring-2 focus-within:ring-indigo-400"
          }`}
      >
        {Icon && (
          <Icon
            size={20}
            className={`mr-2 pointer-events-none ${error ? "text-red-400" : "text-slate-400"
              }`}
          />
        )}

        <input
          {...register}
          type={inputType}
          maxLength={maxLength}
          placeholder={placeholder}
          className="flex-1 h-full text-[15px] px-2 outline-none bg-transparent text-right placeholder-slate-400"
        />

        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-slate-400 hover:text-slate-600 px-2 focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
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

export default FormInput2;
