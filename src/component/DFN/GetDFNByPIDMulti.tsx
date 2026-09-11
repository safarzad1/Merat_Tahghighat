"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Select, { MultiValue, StylesConfig } from "react-select";
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
    defaultValue?: number[] | number;
    name?: string;
    onSelect?: (info: { NameFarsi: string; Value: number }[] | null) => void;
    onChange?: (e: React.ChangeEvent<HTMLInputElement> | any) => void;
    error?: boolean;
    errorMessage?: string;
    labelColor?: string;
    required?: boolean;
    requiredStarColor?: string;
    isDisabled?: boolean;
    closeMenuOnSelect?: boolean;
    instanceId?: string;
}

function normalizeArrayResult(result: any): any[] {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.recordset)) return result.recordset;
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result?.data?.recordset)) return result.data.recordset;
    if (Array.isArray(result?.result)) return result.result;
    return [];
}

function sameNumberArray(a: number[], b: number[]) {
    if (a.length !== b.length) return false;
    const aa = [...a].sort((x, y) => x - y);
    const bb = [...b].sort((x, y) => x - y);
    for (let i = 0; i < aa.length; i++) {
        if (aa[i] !== bb[i]) return false;
    }
    return true;
}

export default function GetDFNByPIDMulti({
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
    isDisabled = false,
    closeMenuOnSelect = false,
    instanceId = "dfn-multi-dropdown",
}: Props) {
    const [items, setItems] = useState<DropdownItem[]>([]);
    const [selectedOptions, setSelectedOptions] = useState<OptionType[]>([]);
    const [loading, setLoading] = useState(false);

    // جلوگیری از stale closure / dependency loop
    const onSelectRef = useRef(onSelect);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onSelectRef.current = onSelect;
    }, [onSelect]);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const normalizeFa = (s: string) =>
        (s || "")
            .toString()
            .replace(/ي/g, "ی")
            .replace(/ك/g, "ک")
            .replace(/\u200c/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();

    // ✅ فقط fetch دیتا
    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            if (!PID) {
                if (!mounted) return;
                setItems([]);
                setSelectedOptions([]);
                return;
            }

            setLoading(true);
            try {
                console.log(PID);
                const result = await DFNByPID(PID);
                console.log(result);
                const list = normalizeArrayResult(result);

                const mapped: DropdownItem[] = (list || [])
                    .map((i: any) => ({
                        NameFarsi: String(i?.NameFarsi ?? i?.nameFarsi ?? i?.Title ?? i?.label ?? "").trim(),
                        Value: Number(i?.Value ?? i?.value),
                    }))
                    .filter((x: DropdownItem) => x.NameFarsi && Number.isFinite(x.Value));

                if (!mounted) return;
                setItems(mapped);
            } catch (err) {
                console.error("❌ Error fetching DFNByPIDMulti:", err);
                if (!mounted) return;
                setItems([]);
                setSelectedOptions([]);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchData();

        return () => {
            mounted = false;
        };
    }, [PID]);

    const options: OptionType[] = useMemo(() => {
        return (items ?? []).map((i) => ({
            label: i.NameFarsi,
            value: i.Value,
            data: i,
        }));
    }, [items]);

    // ✅ اعمال defaultValue (با useEffect نه useMemo)
    useEffect(() => {
        if (!options.length) {
            setSelectedOptions([]);
            return;
        }

        const defaultIds: number[] =
            defaultValue == null
                ? []
                : Array.isArray(defaultValue)
                    ? defaultValue.map(Number).filter(Number.isFinite)
                    : [Number(defaultValue)].filter(Number.isFinite);

        const nextSelected = defaultIds.length
            ? options.filter((o) => defaultIds.includes(o.value))
            : [];

        const prevIds = selectedOptions.map((x) => x.value);
        const nextIds = nextSelected.map((x) => x.value);

        if (!sameNumberArray(prevIds, nextIds)) {
            setSelectedOptions(nextSelected);

            const selectedPayload = nextSelected.map((x) => ({
                NameFarsi: x.data.NameFarsi,
                Value: x.data.Value,
            }));

            onSelectRef.current?.(selectedPayload.length ? selectedPayload : null);
            onChangeRef.current?.({
                target: {
                    name,
                    value: selectedPayload.map((x) => x.Value), // number[]
                },
            } as any);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options, defaultValue, name]);

    const handleChange = (vals: MultiValue<OptionType>) => {
        const arr = vals ? [...vals] : [];
        setSelectedOptions(arr);

        const selectedPayload = arr.map((x) => ({
            NameFarsi: x.data.NameFarsi,
            Value: x.data.Value,
        }));

        onSelectRef.current?.(selectedPayload.length ? selectedPayload : null);

        onChangeRef.current?.({
            target: {
                name,
                value: selectedPayload.map((x) => x.Value), // number[]
            },
        } as any);
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
            marginTop: 2,
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
        multiValue: (provided) => ({
            ...provided,
            borderRadius: "10px",
            overflow: "hidden",
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            fontSize: "13px",
            padding: "2px 8px",
        }),
        multiValueRemove: (provided) => ({
            ...provided,
            cursor: "pointer",
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

            <Select<OptionType, true>
                instanceId={instanceId}
                inputId={instanceId}
                options={options}
                value={selectedOptions}
                onChange={handleChange}
                placeholder={loading ? "در حال بارگذاری..." : placeholder}
                isMulti
                isClearable
                isDisabled={isDisabled || loading}
                styles={customStyles}
                closeMenuOnSelect={closeMenuOnSelect}
                noOptionsMessage={() => (loading ? "در حال دریافت..." : "موردی یافت نشد")}
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                menuPosition="fixed"
                filterOption={(candidate, input) => {
                    const needle = normalizeFa(input);
                    if (!needle) return true;
                    return normalizeFa(candidate.label).includes(needle);
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