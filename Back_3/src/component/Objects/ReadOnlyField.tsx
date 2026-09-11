"use client";

import React from "react";
import { Copy, Check } from "lucide-react";

type ValueType = string | number | boolean | null | undefined | Date;

type Props = {
    label?: string;
    value?: ValueType;

    /** اگر true باشد به جای input از textarea استفاده می‌کند */
    multiline?: boolean;
    rows?: number;

    /** نمایش حالت لودینگ */
    loading?: boolean;

    /** اگر true باشد دکمه کپی نمایش داده می‌شود */
    copyable?: boolean;

    /** تبدیل مقدار برای نمایش */
    formatter?: (value: ValueType) => string;

    placeholder?: string;
    title?: string;

    /** راست‌چین/چپ‌چین */
    dir?: "rtl" | "ltr" | "auto";

    /** آیکن سمت راست (RTL) */
    icon?: React.ReactNode;

    /** متن یا نود قبل/بعد از ورودی */
    prefix?: React.ReactNode;
    suffix?: React.ReactNode;

    /** کلاس‌ها */
    className?: string;
    inputClassName?: string;
    labelClassName?: string;

    /** اگر مقدار خالی بود چه چیزی نشان دهد */
    emptyText?: string;

    /** اگر خواستی با کلیک روی فیلد کاری انجام شود */
    onClick?: () => void;

    /** برای تست و ... */
    id?: string;
    name?: string;
};

function defaultFormatter(v: ValueType): string {
    if (v === null || v === undefined) return "";
    if (v instanceof Date) return v.toLocaleString("fa-IR");
    if (typeof v === "boolean") return v ? "بله" : "خیر";
    return String(v);
}

export default function ReadOnlyField({
    label,
    value,
    multiline = false,
    rows = 3,
    loading = false,
    copyable = false,
    formatter,
    placeholder = "",
    title,
    dir = "rtl",
    icon,
    prefix,
    suffix,
    className = "",
    inputClassName = "",
    labelClassName = "",
    emptyText = "",
    onClick,
    id,
    name,
}: Props) {
    const [copied, setCopied] = React.useState(false);

    const text = React.useMemo(() => {
        const out = (formatter ?? defaultFormatter)(value);
        if (!out) return emptyText ? emptyText : "";
        return out;
    }, [value, formatter, emptyText]);

    const canCopy = copyable && !!text && !loading;

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!canCopy) return;

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 900);
        } catch {
        }
    };

    return (
        <div className={`flex flex-col gap-1 ${className}`} dir={dir}>
            {label ? (
                <label
                    className={`text-purple-600 text-[15px] px-1 ${labelClassName}`}
                    htmlFor={id}
                >
                    {label}
                </label>
            ) : null}

            <div
                className={[
                    "relative text-[20px] w-full rounded-xl border border-gray-200 bg-gray-50",
                    "px-3 py-1 text-black",
                    "flex items-stretch gap-2",
                    onClick ? "cursor-pointer hover:bg-gray-100" : "",
                    loading ? "animate-pulse" : "",
                ].join(" ")}
                onClick={onClick}
                title={title}
            >
                {/* icon */}
                {icon ? (
                    <div className="flex items-center opacity-70">{icon}</div>
                ) : null}

                {prefix ? (
                    <div className="flex items-center text-gray-700">{prefix}</div>
                ) : null}

                <div className="flex-1 min-w-0">
                    {loading ? (
                        <div className="h-5 w-full rounded bg-gray-200" />
                    ) : multiline ? (
                        <textarea
                            id={id}
                            name={name}
                            value={text}
                            readOnly
                            rows={rows}
                            placeholder={placeholder}
                            className={[
                                "w-full resize-none bg-transparent outline-none",
                                "text-sm text-gray-900 placeholder:text-gray-400",
                                inputClassName,
                            ].join(" ")}
                        />
                    ) : (
                        <input
                            id={id}
                            name={name}
                            value={text}
                            readOnly
                            placeholder={placeholder}
                            className={[
                                "w-full bg-transparent outline-none",
                                "text-sm text-gray-900 placeholder:text-gray-400",
                                "truncate",
                                inputClassName,
                            ].join(" ")}
                        />
                    )}
                </div>

                {/* suffix */}
                {suffix ? (
                    <div className="flex items-center text-gray-700">{suffix}</div>
                ) : null}

                {/* copy button */}
                {copyable ? (
                    <button
                        type="button"
                        onClick={handleCopy}
                        className={[
                            "ml-0 mr-0",
                            "w-9 h-9 rounded-lg flex items-center justify-center",
                            "hover:bg-gray-200 transition",
                            canCopy ? "text-gray-700" : "text-gray-300 cursor-not-allowed",
                        ].join(" ")}
                        title={copied ? "کپی شد" : "کپی"}
                        disabled={!canCopy}
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                ) : null}
            </div>
        </div>
    );
}
