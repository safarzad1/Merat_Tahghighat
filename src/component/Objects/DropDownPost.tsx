"use client";

import React, { useEffect, useMemo, useState } from "react";
import Select, { SingleValue, StylesConfig } from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import { GetListpost } from "@/Lib/ApiService";

interface PostDropdownItem {
    PostId: number;
    OnvanPost: string;
}

interface OptionType {
    label: string;
    value: number;
    data: PostDropdownItem;
}

interface Props {
    mahal: number | string;

    label?: string;
    placeholder?: string;
    defaultValue?: number; // PostId
    name?: string;

    onSelect?: (info: { PostId: number; OnvanPost: string } | null) => void;
    onChange?: (e: React.ChangeEvent<HTMLInputElement> | any) => void;

    error?: boolean;
    errorMessage?: string;
    labelColor?: string;
    required?: boolean;
    requiredStarColor?: string;
}

const PostDropdown = ({
    mahal,
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
    const [items, setItems] = useState<PostDropdownItem[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    // ✅ options
    const options: OptionType[] = useMemo(
        () =>
            items.map((i) => ({
                label: i.OnvanPost,
                value: i.PostId,
                data: i,
            })),
        [items]
    );

    // ✅ value (کاملاً کنترل شده)
    const value = useMemo(() => {
        if (selectedId == null) return null;
        return options.find((o) => o.value === selectedId) ?? null;
    }, [options, selectedId]);

    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            if (mahal === undefined || mahal === null || mahal === "") return;

            setLoading(true);
            try {
                const result = await GetListpost(mahal as any);
                const list = result?.recordset || result?.data || result || [];

                const mapped: PostDropdownItem[] = (Array.isArray(list) ? list : []).map((i: any) => ({
                    PostId: Number(i.PostId ?? i.Value ?? i.Id),
                    OnvanPost: String(i.OnvanPost ?? i.NameFarsi ?? i.Name ?? ""),
                }));

                if (!mounted) return;

                setItems(mapped);

                // ✅ 1) اگر defaultValue داریم، همون رو ست کن
                if (defaultValue !== undefined && defaultValue !== null) {
                    const exists = mapped.some((x) => x.PostId === defaultValue);
                    setSelectedId(exists ? defaultValue : null);
                    return;
                }

                // ✅ 2) اگر قبلاً انتخاب داشتیم و هنوز تو لیست هست، نگهش دار
                setSelectedId((prev) => {
                    if (prev == null) return null;
                    const stillExists = mapped.some((x) => x.PostId === prev);
                    return stillExists ? prev : null;
                });
            } catch (err) {
                console.error("❌ Error fetching Post dropdown:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        // ✅ وقتی mahal عوض شد طبیعی است انتخاب پاک شود (اگر می‌خواهی پاک نشود بگو)
        setSelectedId(null);
        fetchData();

        return () => {
            mounted = false;
        };
        // ✅ خیلی مهم: onSelect/onChange را اینجا نگذار
    }, [mahal, defaultValue]);

    const handleChange = (option: SingleValue<OptionType>) => {
        if (option) {
            const selected = option.data;
            setSelectedId(selected.PostId);

            onSelect?.({ PostId: selected.PostId, OnvanPost: selected.OnvanPost });
            onChange?.({ target: { value: selected.PostId, name } } as any);
        } else {
            setSelectedId(null);

            onSelect?.(null);
            onChange?.({ target: { value: "", name } } as any);
        }
    };

    const customStyles: StylesConfig<OptionType> = {
        control: (provided, state) => ({
            ...provided,
            fontSize: "15px",
            minHeight: "38px",
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
        }),
        placeholder: (provided) => ({ ...provided, color: "#9ca3af" }),
        singleValue: (provided) => ({ ...provided, color: "#0f172a", fontWeight: 500 }),
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
                instanceId="post-dropdown"
                options={options}
                value={value}
                onChange={handleChange}
                placeholder={loading ? "در حال بارگذاری..." : placeholder}
                isClearable
                isDisabled={loading}
                styles={customStyles}
                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                menuPosition="fixed"
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

export default PostDropdown;
