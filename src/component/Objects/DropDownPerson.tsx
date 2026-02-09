"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import AsyncSelect from "react-select/async";
import type { StylesConfig, SingleValue, InputActionMeta } from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import { GetSearchPersonDropDown } from "@/Lib/ApiServiseHamkari";

type PersonDropdownItem = {
    PersonId: number;
    FullName: string;
};

type OptionType = {
    label: string;
    value: number;
    data: PersonDropdownItem;
};

type Props = {
    mahal: number | string;

    label?: string;
    placeholder?: string;
    name?: string;

    onSelect?: (info: PersonDropdownItem | null) => void;
    onChange?: (e: React.ChangeEvent<HTMLInputElement> | any) => void;

    error?: boolean;
    errorMessage?: string;
    labelColor?: string;
    required?: boolean;
    requiredStarColor?: string;

    minSearchLength?: number;
    debounceMs?: number;
};

function debouncePromise<T extends (...args: any[]) => Promise<any>>(fn: T, ms: number) {
    let t: any;
    return (...args: Parameters<T>) =>
        new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
            clearTimeout(t);
            t = setTimeout(() => {
                fn(...args).then(resolve).catch(reject);
            }, ms);
        });
}

export default function DropDownPerson({
    mahal,
    label,
    placeholder = "شخص مورد نظر را جستجو کنید...",
    name,
    onSelect,
    onChange,
    error,
    errorMessage,
    labelColor = "text-gray-700",
    required = false,
    requiredStarColor = "text-red-600",
    minSearchLength = 2,
    debounceMs = 250,
}: Props) {
    const mounted = useRef(true);
    const lastQueryId = useRef(0);

    // ✅ مقدار انتخاب‌شده (این باید نمایش باکس را کنترل کند)
    const [selectedOption, setSelectedOption] = useState<OptionType | null>(null);

    // ✅ فقط متن جستجو
    const [searchText, setSearchText] = useState("");

    // ✅ منو باز/بسته
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        return () => {
            mounted.current = false;
        };
    }, []);

    const mapToOptions = (list: any[]): OptionType[] => {
        return (Array.isArray(list) ? list : [])
            .map((i: any) => {
                const PersonId = Number(i.PersonId ?? i.Value ?? i.Id ?? 0);
                const FullName = String(i.FullName ?? i.NameFarsi ?? i.Name ?? "");
                return {
                    label: FullName,
                    value: PersonId,
                    data: { PersonId, FullName },
                };
            })
            .filter((o) => o.value && o.label);
    };

    const loadOptions = useMemo(() => {
        const loader = async (text: string) => {
            const q = (text || "").trim();

            if (!q || q.length < minSearchLength) return [];
            if (mahal === undefined || mahal === null || mahal === "") return [];

            const myId = ++lastQueryId.current;

            const result = await GetSearchPersonDropDown(mahal as any, q as any);
            if (!mounted.current) return [];
            if (myId !== lastQueryId.current) return [];

            const list = result?.recordset || result?.data || result || [];
            const opts = mapToOptions(list);

            // ✅ اگر نتیجه داشت، منو باز بمونه
            if (opts.length > 0) setMenuOpen(true);

            return opts;
        };

        return debouncePromise(loader, debounceMs);
    }, [mahal, minSearchLength, debounceMs]);

    const customStyles: StylesConfig<OptionType> = {
        control: (provided, state) => ({
            ...provided,
            fontSize: "15px",
            minHeight: "40px",
            direction: "rtl",
            borderRadius: "12px",
            borderColor: error ? "#f87171" : state.isFocused ? "#38bdf8" : "#d1d5db",
            boxShadow: state.isFocused ? "0 0 0 4px rgba(56,189,248,0.22)" : "none",
            "&:hover": { borderColor: error ? "#f87171" : "#38bdf8" },
        }),
        menuPortal: (base) => ({ ...base, zIndex: 999999 }),
        menu: (provided) => ({
            ...provided,
            direction: "rtl",
            textAlign: "right",
            fontSize: "15px",
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
        }),
        placeholder: (provided) => ({ ...provided, color: "#9ca3af" }),
        singleValue: (provided) => ({ ...provided, color: "#0f172a", fontWeight: 500 }),
        input: (provided) => ({ ...provided, color: "#0f172a" }),
    };

    // ✅ کنترل سرچ (متن پاک نشود)
    const onInputChange = (val: string, meta: InputActionMeta) => {
        if (meta.action === "input-change") {
            setSearchText(val);

            const t = (val || "").trim();
            if (t.length >= minSearchLength) setMenuOpen(true);
            else setMenuOpen(false);

            return val;
        }

        // ✅ اجازه نده react-select خودش سرچ را خالی کند
        return searchText;
    };

    // ✅ انتخاب گزینه
    const onSelectChange = (opt: SingleValue<OptionType>) => {
        if (!opt) {
            setSelectedOption(null);
            setSearchText("");
            onSelect?.(null);
            onChange?.({ target: { value: "", name } } as any);
            setMenuOpen(false);
            return;
        }

        // ✅ 1) value را ست کن (برای نمایش SingleValue)
        setSelectedOption(opt);

        // ✅ 2) سرچ را خالی کن تا متن انتخاب‌شده فوراً داخل باکس دیده شود (حل مشکل انتخاب اول)
        setSearchText("");

        // ✅ 3) خروجی به والد
        onSelect?.(opt.data);
        onChange?.({ target: { value: opt.value, name } } as any);

        // ✅ 4) لیست بعد انتخاب بسته شود
        setMenuOpen(false);
    };

    return (
        <div className="flex flex-col my-0 w-full">
            {label && (
                <label className={`text-right mb-1 inline-flex items-center gap-1 ${labelColor}`}>
                    {label}
                    {required && <span className={`text-[14px] ${requiredStarColor}`}>*</span>}
                </label>
            )}

            <AsyncSelect<OptionType>
                instanceId="person-async-dropdown"
                cacheOptions
                defaultOptions={false}
                loadOptions={loadOptions}
                styles={customStyles}
                isClearable

                // ✅ کنترل شده
                value={selectedOption}
                onChange={onSelectChange}

                // ✅ متن سرچ کنترل شده
                inputValue={searchText}
                onInputChange={onInputChange}

                placeholder={placeholder}

                // ✅ منو کنترل شده
                menuIsOpen={menuOpen}
                onFocus={() => {
                    const t = (searchText || "").trim();
                    if (t.length >= minSearchLength) setMenuOpen(true);
                }}
                onBlur={() => {
                    // وقتی کاربر خارج شد، ببند
                    setMenuOpen(false);
                }}

                // ✅ برای مودال (z-index)
                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                menuPosition="fixed"

                // ✅ جلوگیری از پرش فوکوس
                blurInputOnSelect={false}
                closeMenuOnSelect={true}
                openMenuOnClick={false}
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
