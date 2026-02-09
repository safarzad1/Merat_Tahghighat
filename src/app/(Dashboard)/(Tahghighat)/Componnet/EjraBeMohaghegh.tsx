"use client";

import { useEffect, useState } from "react";
import Select, { SingleValue, StylesConfig } from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { MohagheghEntekhabat } from "@/Lib/ApiService";

interface User {
    ShomarehParvandeh: number;
    FullName: string;
}

interface OptionType {
    value: number;
    label: string;
    data: User;
}

interface Props {
    codeEntekhabat: number;
    mahal: number;
    noeHamkari: number;
    vije: number;
    label?: string;
    onSelect?: (info: { id: number; title: string } | null) => void;
    defaultValue?: number; // فقط عدد پرونده
    error?: boolean;
    errorMessage?: string;
}

const InputUserDropdown = ({
    codeEntekhabat,
    mahal,
    noeHamkari,
    vije,
    label,
    onSelect,
    defaultValue,
    error,
    errorMessage,
}: Props) => {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const result = await MohagheghEntekhabat(
                    codeEntekhabat,
                    mahal,
                    noeHamkari,
                    vije,
                );

                const list: User[] = result?.data || result?.recordset || [];
                setUsers(list);

                // ✅ تنظیم پیش‌فرض + گرفتن عنوان (FullName)
                if (defaultValue !== undefined) {
                    const def = list.find((u) => u.ShomarehParvandeh === defaultValue) || null;
                    setSelectedUser(def);

                    if (def) {
                        onSelect?.({ id: def.ShomarehParvandeh, title: def.FullName });
                    } else {
                        onSelect?.(null);
                    }
                }
            } catch (err) {
                console.error("Error fetching users:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [codeEntekhabat, mahal, noeHamkari, vije, defaultValue]);

    const options: OptionType[] = users.map((u) => ({
        value: u.ShomarehParvandeh,
        label: u.FullName,
        data: u,
    }));

    const handleChange = (option: SingleValue<OptionType>) => {
        if (option) {
            const selected = option.data;
            setSelectedUser(selected);
            onSelect?.({ id: selected.ShomarehParvandeh, title: selected.FullName });
        } else {
            setSelectedUser(null);
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
            "&:hover": { borderColor: error ? "#f87171" : "#6366f1" },
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
        placeholder: (provided) => ({ ...provided, color: "#9ca3af" }),
    };

    return (
        <div className="flex flex-col my-0 w-full">
            {label && (
                <label className="text-sm text-gray-700 mb-1 text-right font-semibold">
                    {label}
                </label>
            )}

            <Select<OptionType>
                instanceId="user-select"
                options={options}
                value={
                    selectedUser
                        ? options.find((o) => o.value === selectedUser.ShomarehParvandeh) ?? null
                        : null
                }
                onChange={handleChange}
                placeholder={loading ? "در حال بارگذاری..." : "انتخاب..."}
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

export default InputUserDropdown;
