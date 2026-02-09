"use client";

import React, { useEffect, useMemo, useState } from "react";
import MessageRow from "./MessageRow";
import { MailMessage } from "./types";
import { MessageInbox } from "@/Lib/ApiServiceMail";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

type InboxApiRow = {
    MessageId: number | string;
    OnvanPayam: string;
    Payam: string;

    CreateUserId: number | string;

    SenderUserId: number | string | null;
    SenderUserName: string | null;

    ReadMessage: number | boolean | null;
    DateTimeRead: string | null;
    NewMessage: number;

    AttachMessage?: number | null; // ✅ تعداد پیوست

    CreateDateTime: string;
};

export default function MessageList({ title }: { title: string }) {
    const user = useSelector((state: RootState) => state.user);

    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<InboxApiRow[]>([]);
    const [error, setError] = useState<string | null>(null);

    const canUse = !!user?.UserId;

    const loadInbox = async () => {
        if (!canUse) return;

        try {
            setLoading(true);
            setError(null);

            const res: any = await MessageInbox(user.UserId);
            const list: InboxApiRow[] = Array.isArray(res?.data) ? res.data : [];

            setRows(list);
        } catch (e: any) {
            console.error("[MessageList] MessageInbox error:", e);
            setError("خطا در دریافت پیام‌ها");
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInbox();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.UserId]);

    const unreadCount = useMemo(() => {
        // طبق SP: NewMessage برای هر ردیف 0 یا 1 است
        return rows.reduce((sum, r) => sum + (Number(r.NewMessage) > 0 ? 1 : 0), 0);
    }, [rows]);

    // ✅ مپ به تایپ MailMessage برای MessageRow
    const messages: MailMessage[] = useMemo(() => {
        return rows.map((r) => ({
            id: String(r.MessageId),

            // ✅ عنوان پیام
            subject: (r.OnvanPayam || "").trim() || "(بدون عنوان)",

            // بدنه (HTML)
            body: r.Payam,

            // ✅ نام ارسال کننده
            senderName: (r.SenderUserName || "").trim() || "نامشخص",
            senderId: String(r.SenderUserId ?? r.CreateUserId ?? ""),

            // تاریخ
            createdAt: r.CreateDateTime,

            // وضعیت‌ها
            isRead: Number(r.ReadMessage) === 1,
            isNew: Number(r.NewMessage) > 0,
            dateTimeRead: r.DateTimeRead,

            // ✅ تعداد پیوست
            attachmentsCount: Number(r.AttachMessage ?? 0),
        })) as any;
    }, [rows]);

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                <div className="flex items-center gap-2">
                    <h1 className="text-lg">{title}</h1>

                    {unreadCount > 0 && (
                        <span className="rounded-full bg-sky-50 px-2 py-1 text-xs text-sky-700">
                            {unreadCount} پیام جدید
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    onClick={loadInbox}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50 disabled:opacity-60"
                    disabled={!canUse || loading}
                    title="بروزرسانی"
                >
                    {loading ? "در حال دریافت..." : "بروزرسانی"}
                </button>
            </div>

            {/* Body */}
            <div className="p-4">
                {error && (
                    <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <section className="space-y-2">
                    {loading ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                            در حال دریافت پیام‌ها...
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                            پیامی وجود ندارد.
                        </div>
                    ) : (
                        messages.map((m) => <MessageRow key={m.id} msg={m} />)
                    )}
                </section>
            </div>
        </div>
    );
}
