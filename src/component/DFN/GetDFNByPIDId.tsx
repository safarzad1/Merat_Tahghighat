"use client";

import { useEffect, useMemo, useState } from "react";
import Select, { SingleValue, StylesConfig } from "react-select";
import { AnimatePresence, motion } from "framer-motion";
import { DFNByPID } from "@/Lib/ApiService";

type DfnItem = {
  ID: number;
  PID: number;
  NameFarsi: string;
  Value?: number | string | null;
};

type OptionType = {
  label: string;
  value: number;
  data: DfnItem;
};

type Props = {
  PID: number;
  label?: string;
  placeholder?: string;
  value?: number | null;
  onChange: (value: number) => void;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  isClearable?: boolean;
  disabled?: boolean;
  instanceId?: string;
  labelColor?: string;
  requiredStarColor?: string;
};

export default function GetDFNByPIDId({
  PID,
  label,
  placeholder = "جستجو و انتخاب کنید...",
  value,
  onChange,
  required = false,
  error = false,
  errorMessage,
  isClearable = true,
  disabled = false,
  instanceId,
  labelColor = "text-gray-700",
  requiredStarColor = "text-red-600",
}: Props) {
  const [items, setItems] = useState<DfnItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      if (!PID) return;
      setLoading(true);
      try {
        const result = await DFNByPID(PID);
        const list = result?.recordset || result?.data || result || [];
        if (!active) return;

        setItems(
          list
            .map((item: any) => ({
              ID: Number(item.ID || 0),
              PID: Number(item.PID || PID),
              NameFarsi: String(item.NameFarsi || ""),
              Value: item.Value,
            }))
            .filter((item: DfnItem) => item.ID > 0 && item.NameFarsi.trim() !== "")
        );
      } catch (err) {
        console.error("Error fetching DFN data:", err);
        if (active) setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchData();
    return () => {
      active = false;
    };
  }, [PID]);

  const options = useMemo<OptionType[]>(
    () =>
      items.map((item) => ({
        label: item.NameFarsi,
        value: item.ID,
        data: item,
      })),
    [items]
  );

  const selected = options.find((option) => option.value === Number(value || 0)) || null;

  const customStyles: StylesConfig<OptionType, false> = {
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
      fontFamily: "Shabnam, Arial, sans-serif",
      textAlign: "right",
    }),
    input: (provided) => ({
      ...provided,
      fontFamily: "Shabnam, Arial, sans-serif",
      direction: "rtl",
      textAlign: "right",
    }),
    noOptionsMessage: (provided) => ({
      ...provided,
      fontFamily: "Shabnam, Arial, sans-serif",
      direction: "rtl",
      textAlign: "right",
    }),
  };

  const handleChange = (option: SingleValue<OptionType>) => {
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

      <Select<OptionType, false>
        instanceId={instanceId || `dfn-id-dropdown-${PID}`}
        options={options}
        value={selected}
        onChange={handleChange}
        placeholder={loading ? "در حال بارگذاری..." : placeholder}
        isClearable={isClearable}
        isDisabled={disabled || loading}
        isSearchable={true}
        filterOption={(candidate, input) =>
          candidate.label.toLocaleLowerCase("fa").includes(input.trim().toLocaleLowerCase("fa"))
        }
        styles={customStyles}
        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
        menuPosition="fixed"
        noOptionsMessage={() => "موردی یافت نشد"}
        loadingMessage={() => "در حال بارگذاری..."}
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
