"use client";

import { useEffect, useState } from "react";
import Select, { SingleValue, StylesConfig } from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import { DFNByPID } from "@/Lib/ApiService";

interface DropdownItem {
  NameFarsi: string;
  Value: number;
}

interface OptionType {
  label: string;
  value: number;
  data: DropdownItem;
}

interface Props {
  PID: number;
  label?: string;
  placeholder?: string;
  defaultValue?: number;
  name?: string;
  onSelect?: (info: { NameFarsi: string; Value: number } | null) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement> | any) => void;
  error?: boolean;
  errorMessage?: string;
  labelColor?: string;
  required?: boolean;
  requiredStarColor?: string;
}

const CustomDropdown = ({
  PID,
  label,
  placeholder = "انتخاب کنید...",
  defaultValue,
  name,
  onSelect,
  onChange,
  error,
  errorMessage,
  labelColor = "text-gray-700",
  required = false,
  requiredStarColor = "text-red-600",
}: Props) => {
  const [items, setItems] = useState<DropdownItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<DropdownItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!PID) return;
      setLoading(true);
      try {
        const result = await DFNByPID(PID);
        const list = result?.recordset || result?.data || result || [];
        const mapped: DropdownItem[] = list.map((i: any) => ({
          NameFarsi: i.NameFarsi,
          Value: Number(i.Value),
        }));
        setItems(mapped);

        if (defaultValue !== undefined) {
          const def = mapped.find((i) => i.Value === defaultValue) || null;
          setSelectedItem(def);
          if (def) {
            onSelect?.({ NameFarsi: def.NameFarsi, Value: def.Value });
            onChange?.({
              target: { value: def.Value, name: name },
            } as any);
          }
        }
      } catch (err) {
        console.error("❌ Error fetching DFN data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [PID, defaultValue]);

  const options: OptionType[] = items.map((i) => ({
    label: i.NameFarsi,
    value: i.Value,
    data: i,
  }));

  const handleChange = (option: SingleValue<OptionType>) => {
    if (option) {
      const selected = option.data;
      setSelectedItem(selected);
      onSelect?.({ NameFarsi: selected.NameFarsi, Value: selected.Value });

      onChange?.({
        target: { value: selected.Value, name: name },
      } as any);
    } else {
      setSelectedItem(null);
      onSelect?.(null);

      onChange?.({
        target: { value: "", name: name },
      } as any);
    }
  };

  const customStyles: StylesConfig<OptionType> = {
    control: (provided, state) => ({
      ...provided,
      fontSize: "15px",
      minHeight: "34px",
      direction: "rtl",
      borderRadius: "8px",
      borderColor: error
        ? "#f87171"
        : state.isFocused
          ? "#6366f1"
          : "#d1d5db",
      boxShadow: "none",
      "&:hover": {
        borderColor: error ? "#f87171" : "#6366f1",
      },
    }),
    menu: (provided) => ({
      ...provided,
      direction: "rtl",
      textAlign: "right",
      fontSize: "15px",
      zIndex: 9999,
      marginTop: 0,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#f3f4f6" : "white",
      color: "#333",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af",
    }),
  };

  return (
    <div className="flex flex-col my-0 w-full">
      {label && (
        <label
          className={`text-right mb-1 transition-colors duration-200 inline-flex items-center justify-start gap-1 ${labelColor}`}
        >
          {label}
          {required && <span className={`text-[14px] ${requiredStarColor}`}>*</span>}
        </label>
      )}

      <Select<OptionType>
        instanceId="dfn-dropdown"
        options={options}
        value={
          selectedItem
            ? options.find((o) => o.value === selectedItem.Value)
            : null
        }
        onChange={handleChange}
        placeholder={loading ? "در حال بارگذاری..." : placeholder}
        isClearable
        isDisabled={loading}
        styles={customStyles}
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
};

export default CustomDropdown;