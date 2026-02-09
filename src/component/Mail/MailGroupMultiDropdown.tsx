"use client";

import { useMemo, useState } from "react";
import Select, { MultiValue, StylesConfig } from "react-select";
import { motion, AnimatePresence } from "framer-motion";

type GroupApiRow = {
    ID: number;
    OnvanGroup: string;
};

type OptionType = {
    value: number;
    label: string;
    data: GroupApiRow;
};

interface Props {
    instanceId: string;
    items: GroupApiRow[];     // ✅ فقط همین دو فیلد کافیست
    loading?: boolean;

    label?: string;
    onSelect?: (items: { id: number; title: string }[]) => void;
    defaultSelectedIds?: number[];

    error?: boolean;
    errorMessage?: string;

    placeholder?: string;
    isDisabled?: boolean;
}

export default function MailGroupMultiSelect({
    instanceId,
    items,
    loading = false,
    label,
    onSelect,
    defaultSelectedIds,
    error,
    errorMessage,
    placeholder = "انتخاب...",
    isDisabled,
}: Props) {
    const [selectedOptions, setSelectedOptions] = useState<OptionType[]>([]);

    // ✅ نرمال‌سازی سرچ فارسی/عربی
    const normalizeFa = (s: string) =>
        (s || "")
            .toString()
            .replace(/ي/g, "ی")
            .replace(/ك/g, "ک")
            .replace(/\u200c/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();

    // ✅ mapping فقط با ID و OnvanGroup
    const options: OptionType[] = useMemo(() => {
        console.log(`[${instanceId}] items length:`, items?.length);

        const mapped = (items ?? []).map((g) => ({
            value: g.ID,
            label: g.OnvanGroup,
            data: g,
        }));

        console.log(`[${instanceId}] options length:`, mapped.length);
        console.log(`[${instanceId}] first option sample:`, mapped[0]);

        return mapped;
    }, [items, instanceId]);

    // ✅ اعمال مقدار اولیه (اگر داشتی)
    useMemo(() => {
        if (!defaultSelectedIds?.length) return;
        if (!options.length) return;

        const pre = options.filter((o) => defaultSelectedIds.includes(o.value));
        console.log(`[${instanceId}] defaultSelectedIds applied:`, defaultSelectedIds);
        console.log(`[${instanceId}] preselected:`, pre);

        setSelectedOptions(pre);
        onSelect?.(pre.map((x) => ({ id: x.data.ID, title: x.data.OnvanGroup })));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options]);

    const handleChange = (vals: MultiValue<OptionType>) => {
        const arr = vals ? [...vals] : [];
        setSelectedOptions(arr);

        console.log(`[${instanceId}] selected changed:`, arr);

        onSelect?.(arr.map((x) => ({ id: x.data.ID, title: x.data.OnvanGroup })));
    };

    const customStyles: StylesConfig<OptionType, true> = {
        control: (provided, state) => ({
            ...provided,
            fontSize: "15px",
            minHeight: "34px",
            direction: "rtl",
            borderRadius: "8px",
            borderColor: error ? "#f87171" : state.isFocused ? "#6366f1" : "#d1d5db",
            boxShadow: "none",
            "&:hover": { borderColor: error ? "#f87171" : "#6366f1" },
            opacity: isDisabled ? 0.7 : 1,
        }),
        menu: (provided) => ({
            ...provided,
            direction: "rtl",
            textAlign: "right",
            fontSize: "15px",
            zIndex: 9999,
        }),
        menuPortal: (provided) => ({ ...provided, zIndex: 999999 }),
        menuList: (provided) => ({ ...provided, maxHeight: 260 }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isFocused ? "#f3f4f6" : "white",
            color: "#333",
            textAlign: "right",
        }),
        placeholder: (provided) => ({
            ...provided,
            color: "#9ca3af",
            textAlign: "right",
        }),
        valueContainer: (provided) => ({
            ...provided,
            direction: "rtl",
            paddingTop: 2,
            paddingBottom: 2,
        }),
        multiValue: (provided) => ({ ...provided, borderRadius: "10px", overflow: "hidden" }),
        multiValueLabel: (provided) => ({ ...provided, fontSize: "14px", padding: "2px 8px" }),
        multiValueRemove: (provided) => ({ ...provided, cursor: "pointer" }),
    };

    return (
        <div className="flex flex-col my-2 w-full">
            {label && (
                <label className="text-sm text-gray-700 mb-1 text-right font-semibold">
                    {label}
                </label>
            )}

            <Select<OptionType, true>
                instanceId={instanceId}
                inputId={instanceId}
                options={options}
                value={selectedOptions}
                onChange={handleChange}
                placeholder={loading ? "در حال دریافت..." : placeholder}
                isMulti
                isClearable
                isDisabled={isDisabled || loading}
                styles={customStyles}
                closeMenuOnSelect={false}
                noOptionsMessage={() => "موردی یافت نشد"}
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                menuPosition="fixed"
                onMenuOpen={() => console.log(`[${instanceId}] menu open`)}
                onMenuClose={() => console.log(`[${instanceId}] menu close`)}

                // ✅ سرچ فارسی/عربی
                filterOption={(candidate, input) => {
                    const needle = normalizeFa(input);
                    if (!needle) return true;
                    return normalizeFa(candidate.label).includes(needle);
                }}

                // ✅ لاگ سرچ
                onInputChange={(val) => {
                    console.log(`[${instanceId}] search:`, val);
                    return val;
                }}
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
