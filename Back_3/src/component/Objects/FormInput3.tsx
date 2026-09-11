"use client";
import { LucideIcon } from "lucide-react";

interface FormInputProps {
  label?: string;
  placeholder?: string;
  icon?: LucideIcon;
  value?: string;
  maxLength?: number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void; 
}

const FormInput3 = ({ label, placeholder, icon: Icon, value, maxLength, onChange, onKeyDown }: FormInputProps) => {
  return (
    <div className="flex flex-col w-80 mb-4">
      {label && <label className="text-right mb-1 text-[15px] font-medium text-purple-800">{label}</label>}
      <div className="flex items-center h-10 pr-3 border border-gray-300 rounded-full overflow-hidden w-full 
focus-within:ring-1 focus-within:ring-indigo-400 focus-within:border-indigo-400 transition-all duration-200 ease-in-out">
        {Icon && <Icon size={20} className="text-slate-400 mr-2 pointer-events-none" />}
        <input
          type="text"
          value={value}
          onChange={onChange} 
          onKeyDown={onKeyDown}  // ← حالا این درست پاس داده می‌شود
          maxLength={maxLength}
          placeholder={placeholder}
          className="text-[15px] flex-1 h-full px-2 outline-none bg-transparent text-right placeholder-slate-400"
        />
      </div>
    </div>
  );
};

export default FormInput3;
