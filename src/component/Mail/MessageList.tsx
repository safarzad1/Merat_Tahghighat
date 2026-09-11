"use client";

import React, { useEffect, useMemo, useState } from "react";
import MessageRow from "./MessageRow";
import { MailFolder, MailMessage } from "./types";
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

    AttachMessage?: number | null;
    CreateDateTime: string;

    // 👇 اگر API شما این فیلدها رو داشت، uncomment کن و در map استفاده کن
    // IsTrash?: number | boolean | null;
    // IsArchive?: number | boolean | null;
    // IsImportant?: number | boolean | null;
    // IsStarred?: number | boolean | null;
    // Folder?: "inbox" | "archive" | "trash";
};

type Props = {
    title: string;
    folder?: MailFolder;
    messages?: MailMessage[];
    disableFetch?: boolean;
};

const stripHtml = (html: string) =>
    (html || "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

export default function MessageList({
    title,
    folder = "inbox",
    messages: externalMessages,
    disableFetch,
}: Props) {
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

            const res = await MessageInbox(user.UserId, 1);
            const list: InboxApiRow[] = Array.isArray((res as { data?: unknown })?.data)
                ? ((res as { data: InboxApiRow[] }).data ?? [])
                : [];

            setRows(list);
        } catch (e) {
            console.error("[MessageList] MessageInbox error:", e);
            setError("خطا در دریافت پیام‌ها");
            setRows([]);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (disableFetch) return;
        if (externalMessages) return;
        loadInbox();
    }, [user?.UserId, disableFetch, !!externalMessages]);

    const inboxMessages: MailMessage[] = useMemo(() => {
        return rows.map((r) => {
            const body = r.Payam || "";
            const preview = stripHtml(body).slice(0, 140);

            const isRead = Number(r.ReadMessage) === 1;

            return {
                id: String(r.MessageId),

                subject: (r.OnvanPayam || "").trim() || "(بدون عنوان)",
                body,

                senderName: (r.SenderUserName || "").trim() || "نامشخص",
                senderId: String(r.SenderUserId ?? r.CreateUserId ?? ""),

                createdateTime: r.CreateDateTime,

                isRead,
                isNew: !isRead,

                dateTimeRead: r.DateTimeRead,
                attachmentsCount: Number(r.AttachMessage ?? 0),

                preview,

                folder: "inbox",
                isImportant: false,
                isStarred: false,
            };
        });
    }, [rows]);

    const baseMessages: MailMessage[] = useMemo(() => {
        return externalMessages ?? inboxMessages;
    }, [externalMessages, inboxMessages]);

    const messages: MailMessage[] = useMemo(() => {
        if (folder === "important") return baseMessages.filter((m) => !!m.isImportant);
        if (folder === "trash") return baseMessages.filter((m) => m.folder === "trash");
        if (folder === "archive") return baseMessages.filter((m) => m.folder === "archive");
        return baseMessages;
    }, [baseMessages, folder]);

    const unreadCount = useMemo(() => {
        return messages.reduce((sum, m) => sum + (m.isNew ? 1 : 0), 0);
    }, [messages]);

    const refreshDisabled = !canUse || loading || !!externalMessages || disableFetch;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-green-900 text-white px-4 py-2 rounded-t-2xl">
                <div className="flex items-center gap-2">
                    <h1 className="">{title}</h1>

                    {unreadCount > 0 && (
                        <span className="rounded-full bg-sky-350  px-2 py-1 text-xs text-sky-700">
                            {unreadCount} پیام جدید
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    onClick={loadInbox}
                    className="rounded-xl border border-slate-200 bg-white text-black px-3 py-2 text-xs hover:bg-slate-50 disabled:opacity-60"
                    disabled={refreshDisabled}
                    title="بروزرسانی"
                >
                    {loading ? "در حال دریافت..." : "بروزرسانی"}
                </button>
            </div>

            {/* Body */}
            <div className="px-4 py-1">
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
