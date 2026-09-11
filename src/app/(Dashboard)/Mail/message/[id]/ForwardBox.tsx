"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import MailGroupMultiSelect from "@/component/Mail/MailGroupMultiDropdown";
import RichTextEditor from "@/component/Tiptap";
import { MailGroup } from "@/Lib/ApiServiceMail";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
    InsertMessageMail,
    GetUsersFromGroup,
    InsertMessageUserMail,
    InsertMessageFilesMail,
} from "@/Lib/ApiServiceMail";
import { Paperclip, Send, X } from "lucide-react";

type GroupUserRow = { UserId: number | string };

type GroupApiRow = {
    ID: number;
    OnvanGroup: string;
    UserId?: number | string;
    Mahal?: number | string;
    CreateUserId?: number | string;
    [key: string]: any;
};

type Picked = { id: number; title: string };

type UploadApiResult = {
    status: number;
    files: {
        originalName: string;
        guidName: string;
        size: number;
        type: string;
    }[];
    error?: string;
};

type Props = {
    original: {
        subject: string;
        bodyHtml: string;
        senderName: string;
        createdAt: string;
    };
    onSent?: () => void;
};

const isEmptyHtml = (html: string) => {
    const t = (html || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
    return t.length === 0;
};

function buildForwardHtml(original: Props["original"]) {
    const safeSubject = original.subject || "(بدون عنوان)";
    const sender = original.senderName || "نامشخص";
    const dt = original.createdAt || "";

    return `
    <div dir="rtl">
      <p><b>--- فوروارد پیام ---</b></p>
      <p><b>از:</b> ${sender}</p>
      <p><b>تاریخ:</b> ${dt}</p>
      <p><b>موضوع:</b> ${safeSubject}</p>
      <hr />
      <div>${original.bodyHtml || ""}</div>
    </div>
  `;
}

export default function ForwardBox({ original, onSent }: Props) {
    const user = useSelector((state: RootState) => state.user);
    const router = useRouter();

    const [groups, setGroups] = useState<GroupApiRow[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);

    const [toGroups, setToGroups] = useState<Picked[]>([]);
    const [subject, setSubject] = useState(() => `${(original.subject || "").trim()}`);
    const [body, setBody] = useState(() => buildForwardHtml(original));

    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [sending, setSending] = useState(false);

    const canUse = !!user?.Mahal && !!user?.UserId;

    const toIds = useMemo(() => toGroups.map((x) => x.id), [toGroups]);

    // اگر پیام عوض شد، متن/موضوع فوروارد آپدیت شود
    useEffect(() => {
        setSubject(`${(original.subject || "").trim()}`);
        setBody(buildForwardHtml(original));
        setToGroups([]);
        setAttachments([]);
    }, [original.subject, original.bodyHtml, original.senderName, original.createdAt]);

    // گرفتن گروه‌ها/کاربران
    useEffect(() => {
        const load = async () => {
            try {
                if (!canUse) return;

                setLoadingGroups(true);
                const res: any = await MailGroup(user.Mahal, user.UserId);
                if (res?.status === 401) {
                    router.push("/Login");
                    return;
                }
                const list: GroupApiRow[] = Array.isArray(res?.data) ? res.data : [];
                setGroups(list);
            } catch (e: any) {
                const status = e?.status || e?.response?.status;
                if (status === 401) router.push("/Login");
            } finally {
                setLoadingGroups(false);
            }
        };

        load();
    }, [canUse, user?.Mahal, user?.UserId, router]);

    // attachments
    const handlePickFiles = () => fileInputRef.current?.click();

    const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setAttachments((prev) => {
            const existingKey = new Set(prev.map((f) => `${f.name}__${f.size}`));
            const merged = [...prev];

            for (const f of files) {
                const k = `${f.name}__${f.size}`;
                if (!existingKey.has(k)) {
                    merged.push(f);
                    existingKey.add(k);
                }
            }
            return merged;
        });

        e.target.value = "";
    };

    const removeAttachment = (idx: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== idx));
    };

    const clearAllAttachments = () => setAttachments([]);

    const parseUsersFromGroupResponse = (r: any): GroupUserRow[] => {
        if (Array.isArray(r)) return r;
        if (Array.isArray(r?.data)) return r.data;
        if (Array.isArray(r?.data?.data)) return r.data.data;
        return [];
    };

    const uploadFilesToMessageApi = async (files: File[]) => {
        const fd = new FormData();
        for (const f of files) fd.append("file", f);

        const res = await fetch("/Api/UploadFilesMessage", {
            method: "POST",
            body: fd,
            credentials: "include",
        });

        const json: UploadApiResult | any = await res.json().catch(() => null);
        if (!res.ok) throw { status: res.status, data: json };

        const uploaded = Array.isArray(json?.files) ? json.files : [];
        return uploaded as UploadApiResult["files"];
    };

    const insertFileRow = async (
        messageId: number,
        row: { guidName: string; originalName: string; type: string },
        userId: number | string
    ) => {
        const fileName = String(row.guidName || "").trim();
        const captionName = String(row.originalName || "").trim();
        const mMType = String(row.type || "application/octet-stream").trim();

        if (!messageId || !fileName || !captionName) return false;

        const r: any = await InsertMessageFilesMail(messageId, fileName, captionName, mMType, userId);
        const st = r?.status ?? r?.data?.status;
        return st === 200;
    };

    const handleForwardSend = async () => {
        if (!canUse) return;
        if (sending) return;

        if (!toIds.length || !subject.trim() || isEmptyHtml(body)) return;

        try {
            setSending(true);

            // ✅ isSend=1 یعنی ارسال واقعی (پیش‌نویس نداریم اینجا)
            const res1: any = await InsertMessageMail(subject, body, 1, user.UserId);

            if (res1?.status === 401) {
                router.push("/Login");
                return;
            }

            if (res1?.status !== 200) return;

            const messageId = Number(res1?.data?.[0]?.MessageId);
            if (!messageId || Number.isNaN(messageId)) return;

            // گروه/کاربرهای انتخاب شده
            const pickedRows: GroupApiRow[] = toIds
                .map((id) => groups.find((g) => Number(g.ID) === Number(id)))
                .filter(Boolean) as GroupApiRow[];

            const directUserIds: (number | string)[] = [];
            const groupIdsOnly: number[] = [];

            for (const row of pickedRows) {
                const hasUserId = row?.UserId !== undefined && row?.UserId !== null && String(row.UserId) !== "";
                if (hasUserId) directUserIds.push(row.UserId!);
                else groupIdsOnly.push(Number(row.ID));
            }

            const usersByGroup = await Promise.all(
                groupIdsOnly.map(async (groupId) => {
                    try {
                        const r: any = await GetUsersFromGroup(groupId);
                        if (r?.status === 401) {
                            router.push("/Login");
                            return { groupId, users: [] as GroupUserRow[] };
                        }
                        const list = parseUsersFromGroupResponse(r);
                        return { groupId, users: list };
                    } catch {
                        return { groupId, users: [] as GroupUserRow[] };
                    }
                })
            );

            const groupUserIds = usersByGroup.flatMap((x) => x.users).map((u) => u.UserId);
            const allRecipientUserIds = [...directUserIds, ...groupUserIds];

            // یکتا + حذف خود فرستنده
            const senderIdStr = String(user.UserId);
            const uniq = new Set<string>();
            const finalUserIds: (number | string)[] = [];

            for (const id of allRecipientUserIds) {
                const key = String(id ?? "");
                if (!key) continue;
                if (key === senderIdStr) continue;
                if (!uniq.has(key)) {
                    uniq.add(key);
                    finalUserIds.push(id);
                }
            }

            if (finalUserIds.length === 0) return;

            // ثبت گیرندگان
            await Promise.all(
                finalUserIds.map(async (toUserId) => {
                    return InsertMessageUserMail(messageId, user.UserId, toUserId, user.UserId);
                })
            );

            // پیوست‌های جدید (اگر انتخاب شده)
            if (attachments.length > 0) {
                const uploadedRows = await uploadFilesToMessageApi(attachments);
                for (const row of uploadedRows) {
                    await insertFileRow(
                        messageId,
                        { guidName: row.guidName, originalName: row.originalName, type: row.type },
                        user.UserId
                    );
                }
            }

            // موفق
            onSent?.();

            // می‌تونی بعد از ارسال پاکسازی هم بکنی
            setToGroups([]);
            setAttachments([]);

            // پیامک/نوتیف اگر داری اینجا
            // مثلا: alert("ارسال شد")

        } finally {
            setSending(false);
        }
    };

    const disabledSend =
        !canUse || sending || !toIds.length || !subject.trim() || isEmptyHtml(body);

    return (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-slate-800">فوروارد پیام</h2>
                <div className="text-xs text-slate-500">
                    انتخاب گیرندگان و ارسال همین پیام برای افراد دیگر
                </div>
            </div>

            <div className="mt-3 grid gap-3">
                <MailGroupMultiSelect
                    instanceId="forward-to-groups"
                    items={groups}
                    loading={loadingGroups}
                    label="گیرندگان جدید"
                    placeholder={canUse ? "انتخاب گیرندگان..." : "در حال آماده سازی..."}
                    isDisabled={!canUse || sending}
                    onSelect={(items) => setToGroups(items)}
                />

                <input
                    className="w-full rounded-xl border border-sky-300 px-4 py-2 outline-none focus:border-sky-500"
                    placeholder="موضوع"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={sending}
                />

                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <RichTextEditor
                        height="h-[220px]"
                        minHeight="min-h-[220px]"
                        maxHeight="max-h-[520px]"
                        content={body}
                        onChange={(newContent) => setBody(newContent)}
                        readOnly={sending}
                        justify={true}
                    />
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFilesSelected}
                />

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm text-slate-700 ml-2">پیوست‌ها:</div>

                        <button
                            type="button"
                            onClick={handlePickFiles}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-60"
                            disabled={sending}
                            title="افزودن پیوست"
                        >
                            <Paperclip className="h-4 w-4" />
                            افزودن
                        </button>

                        {attachments.length > 0 && (
                            <button
                                type="button"
                                onClick={clearAllAttachments}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-red-500 text-white px-3 py-1.5 text-sm hover:opacity-90 disabled:opacity-60"
                                disabled={sending}
                                title="حذف همه پیوست‌ها"
                            >
                                <X className="h-4 w-4" />
                                حذف همه
                            </button>
                        )}

                        {attachments.length === 0 ? (
                            <div className="text-sm text-slate-500">فایلی انتخاب نشده</div>
                        ) : (
                            <div className="flex flex-wrap items-center gap-2">
                                {attachments.map((f, idx) => (
                                    <div
                                        key={`${f.name}_${f.size}_${idx}`}
                                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5"
                                        title={`${f.name} • ${Math.ceil(f.size / 1024)} KB`}
                                    >
                                        <span className="max-w-[220px] truncate text-sm text-slate-800">
                                            {f.name}
                                        </span>
                                        <span className="text-xs text-slate-500 whitespace-nowrap">
                                            {Math.ceil(f.size / 1024)} KB
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(idx)}
                                            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 hover:bg-slate-50 disabled:opacity-60"
                                            disabled={sending}
                                            title="حذف فایل"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handleForwardSend}
                        className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-6 py-2 text-white hover:opacity-95 disabled:opacity-60"
                        disabled={disabledSend}
                    >
                        <Send className="h-4 w-4" />
                        {sending ? "در حال ارسال..." : "ارسال فوروارد"}
                    </button>

                    <div className="text-xs text-slate-500 mr-auto">
                        {original?.subject
                            ? `موضوع اصلی: ${stripHtmlSafe(original.subject)}`
                            : ""}
                    </div>
                </div>
            </div>
        </div>
    );
}

// چون subject ممکنه HTML نباشه ولی برای اطمینان:
function stripHtmlSafe(s: string) {
    return (s || "").replace(/<[^>]+>/g, "").trim();
}