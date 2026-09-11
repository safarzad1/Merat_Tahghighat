"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FormTextAreaProps {
    label?: string;
    placeholder?: string;
    value?: string;
    maxLength?: number;
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    error?: boolean;
    errorMessage?: string;
    onlyNumber?: boolean;
    rows?: number;
    height?: string;      // هنوز نگه می‌داریم برای حالت‌های غیر فول
    justify?: boolean;
    lineHeight?: string;
    readOnly?: boolean;
    fullHeight?: boolean; // ✅ اضافه شد (حالت “تمام قد”)
}

const Textarea1 = ({
    label,
    placeholder,
    value,
    maxLength,
    onChange,
    error,
    errorMessage,
    onlyNumber = false,
    rows = 4,
    height = "h-24",
    justify = false,
    lineHeight = "leading-7",
    readOnly = false,
    fullHeight = false,
}: FormTextAreaProps) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (readOnly) return;

        let val = e.target.value;
        if (onlyNumber) val = val.replace(/\D/g, "");

        onChange?.({ ...e, target: { ...e.target, value: val } } as any);
    };

    return (
        <div className={`flex flex-col w-full mb-1 ${fullHeight ? "h-full min-h-0" : ""}`}>
            {label && <label className="text-right mb-1 text-purple-700">{label}</label>}

            <textarea
                className={[
                    "text-[16px] w-full border rounded p-4 resize-none outline-none transition-all duration-200",
                    "overflow-y-auto",
                    justify ? "text-justify" : "text-right",
                    lineHeight,
                    error ? "border-red-500" : "border-gray-300",
                    readOnly ? "bg-gray-100 cursor-not-allowed" : "bg-white",
                    fullHeight ? "flex-1 min-h-0" : height, // ✅ این خط کلیدی است
                ].join(" ")}
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                maxLength={maxLength}
                rows={rows}
                readOnly={readOnly}
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

export default Textarea1;
