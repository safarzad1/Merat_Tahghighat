"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Download, ArrowRight } from "lucide-react";
import ForwardBox from './ForwardBox'
import {
    MessageByID,
    MessageFilesByID,
    ReadMessageset,
} from "@/Lib/ApiServiceMail";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

type Props = { id: string };

type Msg = {
    OnvanPayam: string;
    Payam: string; // HTML
    CreateDateTime: string;
    SenderUserName: string;
};

type FileRow = {
    FileName: string;
    CaptionName: string;
    MMType?: string | null;
};

function pickFirstRow(res: any): any | null {
    const raw = res?.data?.data ?? res?.data ?? res ?? null;
    if (!raw) return null;
    if (Array.isArray(raw)) return raw[0] ?? null;
    if (Array.isArray(raw?.data)) return raw.data[0] ?? null;
    return raw;
}

function pickArray(res: any): any[] {
    const raw = res?.data?.data ?? res?.data ?? res ?? [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    return raw ? [raw] : [];
}

export default function MessagePageClient({ id }: Props) {
    const router = useRouter();
    const mid = useMemo(() => Number(id), [id]);
    const userId = useSelector((state: RootState) => state.user?.UserId);

    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState<Msg | null>(null);
    const [files, setFiles] = useState<FileRow[]>([]);
    const [error, setError] = useState<string | null>(null);

    const markedRef = useRef<number | null>(null);
    useEffect(() => {
        let alive = true;

        const markAsRead = async () => {
            if (!Number.isFinite(mid)) return;
            if (!userId) return;

            if (markedRef.current === mid) return;
            markedRef.current = mid;

            try {
                const res: any = await ReadMessageset(mid, userId);
                const st = res?.status ?? res?.data?.status;

                if (st === 401) {
                    router.push("/Login");
                    return;
                }

                window.dispatchEvent(new Event("mail-read"));
            } catch {
                if (alive) markedRef.current = null;
            }
        };

        markAsRead();

        return () => {
            alive = false;
        };
    }, [mid, userId, router]);

    useEffect(() => {
        let mounted = true;

        const run = async () => {
            setLoading(true);
            setError(null);
            setMsg(null);
            setFiles([]);

            if (!Number.isFinite(mid)) {
                setError(`ID نامعتبر است: ${id}`);
                setLoading(false);
                return;
            }

            try {
                const [resMsg, resFiles] = await Promise.all([
                    MessageByID(mid),
                    MessageFilesByID(mid),
                ]);

                const st1 = resMsg?.status ?? resMsg?.data?.status;
                const st2 = resFiles?.status ?? resFiles?.data?.status;

                if (st1 === 401 || st2 === 401) {
                    router.push("/Login");
                    return;
                }

                const row = pickFirstRow(resMsg);
                if (!row) {
                    setError("پیام پیدا نشد.");
                    return;
                }

                const parsedMsg: Msg = {
                    OnvanPayam: String(row.OnvanPayam ?? ""),
                    Payam: String(row.Payam ?? ""), // HTML
                    CreateDateTime: String(row.CreateDateTime ?? ""),
                    SenderUserName: String(row.SenderUserName ?? ""),
                };

                const arr = pickArray(resFiles) as any[];
                const parsedFiles: FileRow[] = arr
                    .map((x) => ({
                        FileName: String(x.FileName ?? ""),
                        CaptionName: String(x.CaptionName ?? ""),
                        MMType: x.MMType ?? null,
                    }))
                    .filter((x) => x.FileName && x.CaptionName);

                if (mounted) {
                    setMsg(parsedMsg);
                    setFiles(parsedFiles);
                }
            } catch (e: any) {
                setError(e?.message || "خطا در دریافت پیام");
            } finally {
                if (mounted) setLoading(false);
            }
        };

        run();
        return () => {
            mounted = false;
        };
    }, [id, mid, router]);

    const fileUrl = (fileName: string) =>
        `/MessageUploads/${encodeURIComponent(fileName)}`;

    if (loading) {
        return (
            <div className="min-h-[240px] rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="h-6 w-48 animate-pulse rounded-lg bg-slate-200" />
                <div className="mt-3 h-4 w-64 animate-pulse rounded bg-slate-200" />
                <div className="mt-5 space-y-2">
                    <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-11/12 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-10/12 animate-pulse rounded bg-slate-200" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
                {error}
            </div>
        );
    }

    if (!msg) {
        return (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
                پیام پیدا نشد.
            </div>
        );
    }

    return (
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-3 shadow-sm">
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3 backdrop-blur">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-red-300 hover:bg-slate-50"
                    title="بازگشت"
                >
                    <ArrowRight className="h-5 w-5 cursor-pointer" />
                </button>

                <div className="min-w-0 flex-1">
                    <div className="truncate text-base text-sky-600">
                        {msg.OnvanPayam || "بدون عنوان"}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-slate-500" />
                            {msg.SenderUserName || "نامشخص"}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="whitespace-nowrap">{msg.CreateDateTime || ""}</span>
                    </div>
                </div>
            </div>

            <div className="mt-2 grid gap-3 lg:grid-cols-[1fr_320px]">
                <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4">
                    <div
                        className="prose max-w-none prose-p:leading-7 prose-li:leading-7"
                        dangerouslySetInnerHTML={{ __html: msg.Payam }}
                    />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <Paperclip className="h-4 w-4 text-slate-500" />
                            پیوست‌ها
                        </div>
                        <div className="text-xs text-slate-500">{files.length} فایل</div>
                    </div>

                    {files.length === 0 ? (
                        <div className="text-sm text-slate-500">پیوستی ندارد</div>
                    ) : (
                        <div className="space-y-1.5">
                            {files.map((f, idx) => (
                                <div
                                    key={`${f.FileName}_${idx}`}
                                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm text-slate-800">
                                            {f.CaptionName}
                                        </div>
                                        {!!f.MMType && (
                                            <div className="mt-0.5 truncate text-[11px] text-slate-500">
                                                {f.MMType}
                                            </div>
                                        )}
                                    </div>

                                    <a
                                        className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-xs text-white hover:opacity-95"
                                        href={fileUrl(f.FileName)}
                                        target="_blank"
                                        rel="noreferrer"
                                        download
                                        title="دانلود / پیش‌نمایش"
                                    >
                                        <Download className="h-4 w-4" />
                                        دانلود
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ForwardBox
                original={{
                    subject: msg.OnvanPayam || "",
                    bodyHtml: msg.Payam || "",
                    senderName: msg.SenderUserName || "",
                    createdAt: msg.CreateDateTime || "",
                }}
                onSent={() => {
                    // اگر دوست داشتی بعد از ارسال، شمارنده‌ها یا inbox رفرش بشن:
                    window.dispatchEvent(new Event("mail-sent"));
                }}
            />

        </div>



    );
}