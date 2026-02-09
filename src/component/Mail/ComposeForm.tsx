"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import MailGroupMultiSelect from "@/component/Mail/MailGroupMultiDropdown";
import { MailGroup } from "@/Lib/ApiServiceMail";
import { useRouter } from "next/navigation";

import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

// ✅ ادیتور TipTap شما
import RichTextEditor from "@/component/Tiptap";

// ✅ آیکن‌ها
import { Paperclip, Send, Save, CalendarClock, X } from "lucide-react";

type GroupApiRow = {
    ID: number;
    OnvanGroup: string;
};

type Picked = { id: number; title: string };

export default function ComposeForm() {
    const user = useSelector((state: RootState) => state.user);
    const router = useRouter();

    const [groups, setGroups] = useState<GroupApiRow[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);

    const [toGroups, setToGroups] = useState<Picked[]>([]);
    const [subject, setSubject] = useState("");

    // ✅ body از این به بعد HTML است (خروجی Tiptap)
    const [body, setBody] = useState("");

    // ✅ پیوست‌ها
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const canUse = !!user?.Mahal && !!user?.UserId;

    useEffect(() => {
        const load = async () => {
            try {
                if (!canUse) {
                    console.log("[ComposeForm] user not ready:", user);
                    return;
                }

                setLoadingGroups(true);

                console.log("[ComposeForm] fetch MailGroup params:", {
                    Mahal: user.Mahal,
                    UserId: user.UserId,
                });

                const res: any = await MailGroup(user.Mahal, user.UserId);
                console.log("[ComposeForm] MailGroup response:", res);

                const list: GroupApiRow[] = Array.isArray(res?.data) ? res.data : [];
                console.log("[ComposeForm] groups length:", list.length);

                setGroups(list);
            } catch (e: any) {
                const status = e?.status || e?.response?.status;
                console.log("[ComposeForm] error status:", status);
                console.error("[ComposeForm] fetch groups error:", e);
                if (status === 401) router.push("/Login");
            } finally {
                setLoadingGroups(false);
            }
        };

        load();
    }, [canUse, user?.Mahal, user?.UserId, router]);

    const toIds = useMemo(() => toGroups.map((x) => x.id), [toGroups]);

    // ✅ تشخیص خالی بودن HTML از ادیتور
    const isEmptyHtml = (html: string) => {
        const t = (html || "")
            .replace(/<[^>]*>/g, "")
            .replace(/&nbsp;/g, " ")
            .trim();
        return t.length === 0;
    };

    // ✅ لاگ پیش‌نویس
    useEffect(() => {
        const t = setTimeout(() => {
            console.log("[ComposeForm] Draft mock:", {
                toIds,
                subject,
                body,
                attachments: attachments.map((f) => ({ name: f.name, size: f.size, type: f.type })),
            });
        }, 700);
        return () => clearTimeout(t);
    }, [toIds, subject, body, attachments]);

    const handlePickFiles = () => {
        fileInputRef.current?.click();
    };

    const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setAttachments((prev) => {
            // جلوگیری از تکراری‌ها (نام + سایز)
            const existingKey = new Set(prev.map((f) => `${f.name}__${f.size}`));
            const merged = [...prev];
            for (const f of files) {
                const k = `${f.name}__${f.size}`;
                if (!existingKey.has(k)) merged.push(f);
            }
            console.log("[ComposeForm] attachments merged:", merged);
            return merged;
        });

        // برای اینکه انتخاب دوباره‌ی همان فایل trigger شود
        e.target.value = "";
    };

    const removeAttachment = (idx: number) => {
        setAttachments((prev) => {
            const next = prev.filter((_, i) => i !== idx);
            console.log("[ComposeForm] attachments after remove:", next);
            return next;
        });
    };

    const handleSend = async () => {
        // اینجا بعداً API ارسال
        console.log("[ComposeForm] SEND payload:", {
            toIds,
            subject,
            bodyHtml: body,
            attachments: attachments.map((f) => ({ name: f.name, size: f.size, type: f.type })),
        });
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h1 className="text-lg">نوشتن پیام</h1>

            <div className="mt-4 grid gap-3">
                {/* گیرندگان */}
                <MailGroupMultiSelect
                    instanceId="to-groups"
                    items={groups}
                    loading={loadingGroups}
                    label="گیرندگان (To)"
                    placeholder={canUse ? "انتخاب گیرندگان..." : "در حال آماده سازی..."}
                    isDisabled={!canUse}
                    onSelect={(items) => setToGroups(items)}
                />

                {/* موضوع */}
                <input
                    className="w-full rounded-xl border border-sky-300 px-4 py-2 outline-none focus:border-sky-500"
                    placeholder="موضوع"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                />

                {/* ادیتور (بدنه پیام) */}
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <RichTextEditor
                        height="h-[240px]"
                        minHeight="min-h-[240px]"
                        maxHeight="max-h-[520px]"
                        content={body}
                        onChange={(newContent) => {
                            console.log("[ComposeForm] body html:", newContent);
                            setBody(newContent);
                        }}
                        readOnly={false}
                        justify={true}
                    />
                </div>

                {/* پیوست‌ها */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFilesSelected}
                />

                {attachments.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-sm text-slate-700 text-right">پیوست‌ها</div>
                        <div className="mt-2 grid gap-2">
                            {attachments.map((f, idx) => (
                                <div
                                    key={`${f.name}_${f.size}_${idx}`}
                                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
                                >
                                    <div className="text-sm text-slate-800 truncate">{f.name}</div>
                                    <div className="text-xs text-slate-500 whitespace-nowrap">
                                        {Math.ceil(f.size / 1024)} KB
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeAttachment(idx)}
                                        className="mr-auto inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2 py-1 text-sm hover:bg-slate-50"
                                        title="حذف فایل"
                                    >
                                        <X className="h-4 w-4" />
                                        حذف
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* دکمه‌ها */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handleSend}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-60"
                        disabled={!toIds.length || !subject.trim() || isEmptyHtml(body)}
                        title={
                            !toIds.length
                                ? "حداقل یک گیرنده انتخاب کنید"
                                : !subject.trim()
                                    ? "موضوع را وارد کنید"
                                    : isEmptyHtml(body)
                                        ? "متن پیام را وارد کنید"
                                        : ""
                        }
                    >
                        <Send className="h-4 w-4" />
                        ارسال
                    </button>

                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50"
                        onClick={() => console.log("[ComposeForm] Save draft clicked")}
                    >
                        <Save className="h-4 w-4" />
                        ذخیره پیش‌نویس
                    </button>

                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50"
                        onClick={() => console.log("[ComposeForm] Schedule clicked")}
                    >
                        <CalendarClock className="h-4 w-4" />
                        زمان‌بندی ارسال
                    </button>

                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50"
                        onClick={handlePickFiles}
                    >
                        <Paperclip className="h-4 w-4" />
                        افزودن پیوست
                    </button>

                    <button
                        type="button"
                        className="mr-auto rounded-2xl border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50"
                        onClick={() => console.log("[ComposeForm] Cancel clicked")}
                    >
                        انصراف
                    </button>
                </div>
            </div>
        </div>
    );
}
