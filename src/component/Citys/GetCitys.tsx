"use client";

import { useEffect, useState } from "react";
import Select, { SingleValue, StylesConfig } from "react-select";
import { GetCitys } from "@/Lib/ApiService";
import { useRouter } from "next/navigation";

interface DropdownItem {
    FullName: string;
    CityId: number;
}

interface OptionType {
    label: string;
    value: number;
    data: DropdownItem;
}

interface Props {
    label?: string;
    placeholder?: string;
    pcityId?: number; // ← فقط value پیش‌فرض
    defaultValue?: number; // ← فقط value پیش‌فرض
    onSelect?: (info: { FullName: string; CityId: number } | null) => void;
}

const CustomDropdown = ({
    label,
    placeholder = "انتخاب کنید...",
    pcityId,
    defaultValue,
    onSelect
}: Props) => {
    const [items, setItems] = useState<DropdownItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<DropdownItem | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {

                const result = await GetCitys(pcityId);
                const list = result?.recordset || result?.data || result || [];
                const mapped: DropdownItem[] = list.map((i: any) => ({
                    FullName: i.FullName,
                    CityId: Number(i.CityId),
                }));
                setItems(mapped);

                // تنظیم پیش‌فرض اگر defaultValue داده شده
                if (defaultValue !== undefined) {
                    const def = mapped.find((i) => i.CityId === defaultValue) || null;
                    setSelectedItem(def);
                    if (def) onSelect?.({ FullName: def.FullName, CityId: def.CityId });
                }
            } catch (err) {
                console.error("❌ Error fetching DFN data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [defaultValue]);

    const options: OptionType[] = items.map((i) => ({
        label: i.FullName,
        value: i.CityId,
        data: i,
    }));

    const handleChange = (option: SingleValue<OptionType>) => {
        if (option) {
            const selected = option.data;
            setSelectedItem(selected);
            onSelect?.({ FullName: selected.FullName, CityId: selected.CityId });
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
            borderRadius: "8px"

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
            {label && (
                <label className="text-purple-700 mb-1 text-right">
                    {label}
                </label>
            )}

            <Select<OptionType>
                instanceId="dfn-dropdown"
                options={options}
                value={
                    selectedItem
                        ? options.find((o) => o.value === selectedItem.CityId)
                        : null
                }
                onChange={handleChange}
                placeholder={loading ? "در حال بارگذاری..." : placeholder}
                isClearable
                isDisabled={loading}
                styles={customStyles}
            />


        </div>
    );
};

export default CustomDropdown;
