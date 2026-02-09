"use client";

import { GetJambandiMohagheghPeyvast } from "@/Lib/ApiService";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { createPortal } from "react-dom";

interface Props {
    tahghighId: number;
}

type PeyvastObj = { FileName?: string;[key: string]: any };

// ✅ Portal helper
function Portal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    return createPortal(children, document.body);
}

export default function ShowJambandiMohagheghPeyvast({ tahghighId }: Props) {
    const user = useSelector((state: RootState) => state.user);

    const [fileNames, setFileNames] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const [previewSrc, setPreviewSrc] = useState<string | null>(null);
    const [previewName, setPreviewName] = useState<string>("");

    const normalizeFileNames = (payload: any): string[] => {
        if (!payload) return [];
        if (typeof payload === "string") return [payload];

        if (Array.isArray(payload)) {
            return payload
                .map((x) => {
                    if (typeof x === "string") return x;
                    if (x && typeof x === "object" && "FileName" in x) return (x as PeyvastObj).FileName;
                    return null;
                })
                .filter(Boolean) as string[];
        }

        if (typeof payload === "object") {
            const nested = payload.data ?? payload.items ?? payload.result;
            if (nested) return normalizeFileNames(nested);
            if (payload.FileName) return [payload.FileName];
        }

        return [];
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!tahghighId) return;

            setLoading(true);
            try {
                const res: any = await GetJambandiMohagheghPeyvast(tahghighId);
                const payload = res?.data?.data ?? res?.data ?? res;
                const names = normalizeFileNames(payload);
                setFileNames(Array.from(new Set(names)));
            } catch (e) {
                console.error(e);
                setFileNames([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tahghighId]);

    const images = useMemo(
        () =>
            fileNames.map((name) => ({
                name,
                src: `/uploads/${name}`,
            })),
        [fileNames]
    );

    // (اختیاری) وقتی مودال باز است، اسکرول صفحه قفل شود
    useEffect(() => {
        if (!previewSrc) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [previewSrc]);

    if (loading) return <div>در حال بارگذاری...</div>;
    if (!images.length) return <div>پیوستی یافت نشد.</div>;

    return (
        <div className="mt-2">
            {/* ردیف تصاویر کوچک (کوچک‌تر تا ردیف بزرگ نشود) */}
            <div
                className={`flex gap-2 items-center ${images.length > 1 ? "overflow-x-auto" : ""}`}
                style={{ maxWidth: 260 }}
            >
                {images.map((img) => (
                    <button
                        type="button"
                        key={img.name}
                        className="w-[100px] h-[120px] border rounded overflow-hidden bg-gray-100 shrink-0"
                        title={img.name}
                        onClick={() => {
                            setPreviewSrc(img.src);
                            setPreviewName(img.name);
                        }}
                    >
                        <img
                            src={img.src}
                            alt={img.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                        />
                    </button>
                ))}
            </div>

            {/* ✅ فول‌اسکرین واقعی با Portal */}
            {previewSrc && (
                <Portal>
                    <div className="fixed inset-0 z-999999 bg-black/80 flex items-center justify-center p-4">
                        {/* بک‌دراپ */}
                        <div
                            className="absolute inset-0"
                            onClick={() => {
                                setPreviewSrc(null);
                                setPreviewName("");
                            }}
                        />

                        <div className="relative z-10 w-screen h-screen flex flex-col items-center justify-center">
                            <div className="w-full max-w-6xl flex justify-end mb-3 px-2">
                                <button
                                    type="button"
                                    className="bg-white/90 hover:bg-white text-gray-700 px-4 py-2 rounded-lg"
                                    onClick={() => {
                                        setPreviewSrc(null);
                                        setPreviewName("");
                                    }}
                                >
                                    بستن
                                </button>
                            </div>

                            <img
                                src={previewSrc}
                                alt={previewName}
                                className="max-w-[95vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
                            />

                            {previewName && (
                                <div className="mt-3 text-white/90 text-sm break-all text-center px-4">
                                    {previewName}
                                </div>
                            )}
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    );
}
