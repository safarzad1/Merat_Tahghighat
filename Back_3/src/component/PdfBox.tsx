"use client";

import { X, Minus, Plus, RotateCcw } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

type PdfModalProps = {
    open: boolean;
    onClose: () => void;
    fileName: string;
    title?: string;
};

export default function PdfModal({ open, onClose, fileName, title = "" }: PdfModalProps) {
    const [zoom, setZoom] = useState(110); // درصد (شروع)
    const [key, setKey] = useState(0);     // برای ریفرش iframe وقتی zoom عوض شد

    // وقتی مودال باز میشه، یکبار زوم پیش‌فرض رو تنظیم کن
    useEffect(() => {
        if (open) {
            setZoom(110);
            setKey((k) => k + 1);
        }
    }, [open]);

    const src = useMemo(() => {
        const safe = (fileName || "").trim().replace(/^\/+/, "");
        if (!safe) return "";

        // ✅ zoom با hash (اکثر pdf viewer های مرورگر می‌فهمن)
        // اضافه کردن key برای اینکه تغییر zoom حتما اعمال بشه
        return `/pdf/${safe}#zoom=${zoom}&view=FitH&toolbar=1&navpanes=0&k=${key}`;
    }, [fileName, zoom, key]);

    if (!open) return null;

    const clamp = (v: number) => Math.min(300, Math.max(50, v));

    const zoomIn = () => {
        setZoom((z) => {
            const nz = clamp(z + 10);
            setKey((k) => k + 1);
            return nz;
        });
    };

    const zoomOut = () => {
        setZoom((z) => {
            const nz = clamp(z - 10);
            setKey((k) => k + 1);
            return nz;
        });
    };

    const resetZoom = () => {
        setZoom(110);
        setKey((k) => k + 1);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            <div className="relative z-[10000] w-[98vw] max-w-[1600px] h-[92vh] bg-white rounded-2xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="h-14 px-4 flex items-center justify-between bg-sky-700 text-white">
                    <div className="font-bold text-[15px] truncate">{title}</div>

                    <div className="flex items-center gap-2">
                        <div className="text-xs bg-white/15 px-2 py-1 rounded-lg">
                            {zoom}%
                        </div>

                        <button onClick={zoomOut} className="p-2 hover:bg-white/10 rounded-full" title="Zoom Out">
                            <Minus size={18} />
                        </button>
                        <button onClick={zoomIn} className="p-2 hover:bg-white/10 rounded-full" title="Zoom In">
                            <Plus size={18} />
                        </button>
                        <button onClick={resetZoom} className="p-2 hover:bg-white/10 rounded-full" title="Reset">
                            <RotateCcw size={18} />
                        </button>

                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full" title="بستن">
                            <X size={22} />
                        </button>
                    </div>
                </div>

                <div
                    className="h-[calc(92vh-56px)] bg-gray-50"
                    onWheel={(e) => {
                        e.preventDefault();
                        const delta = e.deltaY > 0 ? -10 : 10;
                        setZoom((z) => {
                            const nz = clamp(z + delta);
                            setKey((k) => k + 1);
                            return nz;
                        });
                    }}
                    style={{ overscrollBehavior: "contain" }}
                >
                    {!src ? (
                        <div className="p-4 text-red-600">نام فایل نامعتبر است.</div>
                    ) : (
                        <iframe
                            key={src}
                            src={src}
                            title={title}
                            className="w-full h-full border-0"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}