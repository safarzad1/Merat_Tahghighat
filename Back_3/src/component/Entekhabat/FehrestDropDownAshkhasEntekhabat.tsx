"use client";

import { useEffect, useState } from "react";
import Select, { SingleValue, StylesConfig } from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import { GetDropDownAshkhasEntekhabat } from "@/Lib/ApiServiceDavtalab";

interface DropdownItem {
    ShomarehParvandeh: string;
    OnvanFarsi: string;
}

interface OptionType {
    label: string;
    value: string;
    data: DropdownItem;
}

interface Props {
    mahal: number;
    label?: string;
    placeholder?: string;
    defaultValue?: string; // ← شماره پرونده پیش‌فرض
    onSelect?: (info: { ShomarehParvandeh: string; OnvanFarsi: string } | null) => void;
    error?: boolean;
    errorMessage?: string;
}

const DropDownAshkhasEntekhabat = ({
    mahal,
    label,
    placeholder = "انتخاب کنید...",
    defaultValue,
    onSelect,
    error,
    errorMessage,
}: Props) => {
    const [items, setItems] = useState<DropdownItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<DropdownItem | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!mahal) return;

            setLoading(true);
            try {
                const result: any = await GetDropDownAshkhasEntekhabat(mahal);

                const list =
                    result?.recordset ||
                    result?.data ||
                    result ||
                    [];

                const mapped: DropdownItem[] = (list as any[]).map((i: any) => ({
                    ShomarehParvandeh: String(i.ShomarehParvandeh ?? ""),
                    OnvanFarsi: String(i.OnvanFarsi ?? ""),
                }));

                setItems(mapped);

                if (defaultValue !== undefined && defaultValue !== null) {
                    const def = mapped.find((i) => i.ShomarehParvandeh === String(defaultValue)) || null;
                    setSelectedItem(def);
                    if (def) onSelect?.({ ShomarehParvandeh: def.ShomarehParvandeh, OnvanFarsi: def.OnvanFarsi });
                }
            } catch (err) {
                console.error("❌ Error fetching AshkhasEntekhabat dropdown:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [mahal, defaultValue]); // ✅ مثل کامپوننت خودت

    const options: OptionType[] = items.map((i) => ({
        label: i.OnvanFarsi,
        value: i.ShomarehParvandeh,
        data: i,
    }));

    const handleChange = (option: SingleValue<OptionType>) => {
        if (option) {
            const selected = option.data;
            setSelectedItem(selected);
            onSelect?.({
                ShomarehParvandeh: selected.ShomarehParvandeh,
                OnvanFarsi: selected.OnvanFarsi,
            });
        } else {
            setSelectedItem(null);
            onSelect?.(null);
        }
    };

    const customStyles: StylesConfig<OptionType> = {
        control: (provided, state) => ({
            ...provided,
            fontSize: "15px",
            minHeight: "34px",
            direction: "rtl",
            borderRadius: "8px",
            borderColor: error ? "#f87171" : state.isFocused ? "#6366f1" : "#d1d5db",
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
        <div className="flex flex-col my-0 w-full pb-2">
            {label && <label className="text-purple-700 mb-1 text-right">{label}</label>}

            <Select<OptionType>
                instanceId={`ashkhas-entekhabat-${mahal}`}
                options={options}
                value={selectedItem ? options.find((o) => o.value === selectedItem.ShomarehParvandeh) : null}
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

export default DropDownAshkhasEntekhabat;
