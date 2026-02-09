"use client";

import { useEffect, useMemo, useState } from "react";
import Select, { SingleValue, StylesConfig } from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import { GetEntekhabat } from "@/Lib/ApiServiceEntekhabat";

interface EntekhabatItem {
    CodeEntekhabat: number;
    OnvanDore: string;
}

interface OptionType {
    label: string;
    value: number;
    data: EntekhabatItem;
}

interface Props {
    mahal: number;                 // ✅ ورودی
    label?: string;
    placeholder?: string;
    defaultValue?: number;         // ✅ پیش‌فرض = CodeEntekhabat
    onSelect?: (info: { CodeEntekhabat: number; OnvanDore: string } | null) => void;
    error?: boolean;
    errorMessage?: string;
}

const EntekhabatDropdown = ({
    mahal,
    label,
    placeholder = "انتخاب کنید...",
    defaultValue,
    onSelect,
    error,
    errorMessage,
}: Props) => {
    const [items, setItems] = useState<EntekhabatItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<EntekhabatItem | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (mahal === undefined || mahal === null) return;

            setLoading(true);
            try {
                // ✅ فرض: GetEntekhabat(mahal) => لیست
                const result = await GetEntekhabat(mahal);
                const list = (result?.recordset || result?.data || result || []) as any[];

                const mapped: EntekhabatItem[] = list.map((i: any) => ({
                    CodeEntekhabat: Number(i.CodeEntekhabat),
                    OnvanDore: String(i.OnvanDore ?? ""),
                }));

                setItems(mapped);

                if (defaultValue !== undefined) {
                    const def = mapped.find((x) => x.CodeEntekhabat === defaultValue) || null;
                    setSelectedItem(def);
                    if (def) onSelect?.({ CodeEntekhabat: def.CodeEntekhabat, OnvanDore: def.OnvanDore });
                }
            } catch (err) {
                console.error("❌ Error fetching Entekhabat data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mahal, defaultValue]);

    const options: OptionType[] = useMemo(
        () =>
            items.map((i) => ({
                label: i.OnvanDore,
                value: i.CodeEntekhabat,
                data: i,
            })),
        [items]
    );

    const handleChange = (option: SingleValue<OptionType>) => {
        if (option) {
            const selected = option.data;
            setSelectedItem(selected);
            onSelect?.({ CodeEntekhabat: selected.CodeEntekhabat, OnvanDore: selected.OnvanDore });
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
                instanceId="entekhabat-dropdown"
                options={options}
                value={
                    selectedItem
                        ? options.find((o) => o.value === selectedItem.CodeEntekhabat) ?? null
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

export default EntekhabatDropdown;
