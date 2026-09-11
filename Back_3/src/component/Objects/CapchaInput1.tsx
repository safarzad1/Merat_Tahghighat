import React from "react";
import { UseFormRegisterReturn } from "react-hook-form";

interface CaptchaInputProps {
  label?: string;
  num1: number;
  num2: number;
  maxLength?: number;
  register: UseFormRegisterReturn;
  error?: boolean;
  errorMessage?: string;
}

const CapchaInput1: React.FC<CaptchaInputProps> = ({
  label = "کد امنیتی",
  num1,
  num2,
  maxLength,
  register,
  error,
  errorMessage,
}) => {
  return (
    <div className="flex flex-col w-full">
      {label && (
        <label
          htmlFor="captcha"
          className="font-medium text-[14px] text-purple-800 w-full text-right mb-1"
        >
          {label}
        </label>
      )}

      <div
        className={`flex items-center mt-2 h-10 border rounded-full overflow-hidden w-full transition-all duration-300 ${
          error
            ? "border-red-500 ring-1 ring-red-100"
            : "border-slate-300 focus-within:ring-2 focus-within:ring-indigo-400"
        }`}
      >
        <input
          {...register}
          type="text"
          inputMode="numeric"
          maxLength={maxLength}
          className="flex-1 h-full px-2 outline-none bg-transparent text-right pr-10 text-[14px]"
          placeholder="جواب را وارد کنید"
        />

        <span className="flex items-center justify-center w-20 h-full bg-slate-100 text-slate-700 font-bold text-lg border-l border-slate-300 select-none">
          {num1} + {num2}
        </span>
      </div>

      {/* 🔹 نمایش پیام خطا زیر فیلد */}
      {error && errorMessage && (
        <span className="text-red-500 text-sm mt-1 text-right">{errorMessage}</span>
      )}
    </div>
  );
};

export default CapchaInput1;
