"use client";

import Select, { SingleValue, StylesConfig } from "react-select";
import { AnimatePresence, motion } from "framer-motion";

export type DropDownSelectOption = {
  value: number;
  label: string;
};

type Props = {
  label?: string;
  value?: number | null;
  options: DropDownSelectOption[];
  onChange: (value: number) => void;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  isClearable?: boolean;
  disabled?: boolean;
  instanceId?: string;
  labelColor?: string;
  requiredStarColor?: string;
};

export default function DropDownSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "انتخاب کنید...",
  required = false,
  error = false,
  errorMessage,
  isClearable = true,
  disabled = false,
  instanceId = "app-dropdown",
  labelColor = "text-gray-700",
  requiredStarColor = "text-red-600",
}: Props) {
  const selected = options.find((item) => item.value === Number(value || 0)) || null;

  // استایل بر اساس DropDownPost / GetDFNByPID موجود در پروژه
  const customStyles: StylesConfig<DropDownSelectOption, false> = {
    control: (provided, state) => ({
      ...provided,
      fontSize: "15px",
      fontFamily: "Shabnam, Arial, sans-serif",
      minHeight: "38px",
      direction: "rtl",
      borderRadius: "12px",
      borderColor: error ? "#f87171" : state.isFocused ? "#38bdf8" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 4px rgba(56,189,248,0.22)" : "none",
      "&:hover": { borderColor: error ? "#f87171" : "#38bdf8" },
    }),
    valueContainer: (provided) => ({
      ...provided,
      direction: "rtl",
      fontFamily: "Shabnam, Arial, sans-serif",
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 999999,
      fontFamily: "Shabnam, Arial, sans-serif",
    }),
    menu: (provided) => ({
      ...provided,
      direction: "rtl",
      textAlign: "right",
      fontSize: "15px",
      fontFamily: "Shabnam, Arial, sans-serif",
      zIndex: 999999,
      marginTop: 6,
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#e0f2fe" : state.isFocused ? "#f3f4f6" : "white",
      color: "#0f172a",
      cursor: "pointer",
      paddingTop: 10,
      paddingBottom: 10,
      fontFamily: "Shabnam, Arial, sans-serif",
      textAlign: "right",
      direction: "rtl",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af",
      fontFamily: "Shabnam, Arial, sans-serif",
      textAlign: "right",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#0f172a",
      fontWeight: 500,
      fontFamily: "Shabnam, Arial, sans-serif",
      textAlign: "right",
    }),
    input: (provided) => ({
      ...provided,
      fontFamily: "Shabnam, Arial, sans-serif",
      direction: "rtl",
    }),
    noOptionsMessage: (provided) => ({
      ...provided,
      fontFamily: "Shabnam, Arial, sans-serif",
      direction: "rtl",
      textAlign: "right",
    }),
  };

  const handleChange = (option: SingleValue<DropDownSelectOption>) => {
    onChange(option ? option.value : 0);
  };

  return (
    <div className="flex flex-col my-0 w-full">
      {label && (
        <label className={`text-right mb-1 transition-colors duration-200 inline-flex items-center justify-start gap-1 ${labelColor}`}>
          {label}
          {required && <span className={`text-[14px] ${requiredStarColor}`}>*</span>}
        </label>
      )}

      <Select<DropDownSelectOption, false>
        instanceId={instanceId}
        options={options}
        value={selected}
        onChange={handleChange}
        placeholder={placeholder}
        isClearable={isClearable}
        isDisabled={disabled}
        styles={customStyles}
        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
        menuPosition="fixed"
        noOptionsMessage={() => "موردی یافت نشد"}
      />

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
}
