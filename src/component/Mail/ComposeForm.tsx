"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import MailGroupMultiSelect from "@/component/Mail/MailGroupMultiDropdown";
import { MailGroup } from "@/Lib/ApiServiceMail";
import { useRouter } from "next/navigation";

import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

import RichTextEditor from "@/component/Tiptap";

import {
    InsertMessageMail,
    GetUsersFromGroup,
    InsertMessageUserMail,
    InsertMessageFilesMail,
} from "@/Lib/ApiServiceMail";

import { Paperclip, Send, Save, X } from "lucide-react";

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

export default function ComposeForm() {
    const user = useSelector((state: RootState) => state.user);
    const router = useRouter();

    const [groups, setGroups] = useState<GroupApiRow[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);

    const [toGroups, setToGroups] = useState<Picked[]>([]);
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");

    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [sending, setSending] = useState(false);
    const [saving, setSaving] = useState(false);

    const canUse = !!user?.Mahal && !!user?.UserId;

    useEffect(() => {
        const load = async () => {
            try {
                if (!canUse) return;

                setLoadingGroups(true);
                const res: any = await MailGroup(user.Mahal, user.UserId);
                if (res.status == 401) {
                    router.push("/Login");
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

    const toIds = useMemo(() => toGroups.map((x) => x.id), [toGroups]);

    const isEmptyHtml = (html: string) => {
        const t = (html || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
        return t.length === 0;
    };

    // attachments
    const handlePickFiles = () => {
        fileInputRef.current?.click();
    };

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

    const clearAllAttachments = () => {
        setAttachments([]);
    };

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

    /**
     * isSend:
     * 1 => ارسال
     * 0 => ذخیره پیش‌نویس
     */
    const handleSend = async (isSend: number) => {
        if (!canUse) return;

        // اگر خواستی پیش‌نویس بدون گیرنده هم ذخیره شود، همین validation را فقط برای isSend=1 بگذار
        if (!toIds.length || !subject.trim() || isEmptyHtml(body)) return;

        if (sending || saving) return;

        try {
            if (isSend === 1) setSending(true);
            else setSaving(true);

            // STEP1: ذخیره پیام
            const res1: any = await InsertMessageMail(subject, body, isSend, user.UserId);
            if (res1?.status !== 200) return;

            const messageId = Number(res1?.data?.[0]?.MessageId);
            if (!messageId || Number.isNaN(messageId)) return;

            // ✅ اگر پیش‌نویس بود، همینجا تمام و برو inbox
            if (isSend === 0) {
                router.push("/Mail/inbox");
                return;
            }

            const pickedRows: GroupApiRow[] = toIds
                .map((id) => groups.find((g) => Number(g.ID) === Number(id)))
                .filter(Boolean) as GroupApiRow[];

            const directUserIds: (number | string)[] = [];
            const groupIdsOnly: number[] = [];

            for (const row of pickedRows) {
                if (row?.UserId !== undefined && row?.UserId !== null && String(row.UserId) !== "") {
                    directUserIds.push(row.UserId);
                } else {
                    groupIdsOnly.push(Number(row.ID));
                }
            }

            const usersByGroup = await Promise.all(
                groupIdsOnly.map(async (groupId) => {
                    try {
                        const r: any = await GetUsersFromGroup(groupId);
                        const list = parseUsersFromGroupResponse(r);
                        return { groupId, users: list };
                    } catch (e: any) {
                        const status = e?.status || e?.response?.status;
                        if (status === 401) router.push("/Login");
                        return { groupId, users: [] as GroupUserRow[] };
                    }
                })
            );

            const groupUserIds = usersByGroup.flatMap((x) => x.users).map((u) => u.UserId);

            // STEP2.6: merge + dedupe + حذف ارسال به خود
            const allRecipientUserIds = [...directUserIds, ...groupUserIds];

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

            // STEP3: ارسال به کاربران
            await Promise.all(
                finalUserIds.map(async (toUserId) => {
                    await InsertMessageUserMail(messageId, user.UserId, toUserId, user.UserId);
                })
            );

            // STEP4: فایل‌ها
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

            // ✅ پایان: برو inbox
            router.push("/Mail/inbox");
        } catch (e: any) {
            const status = e?.status || e?.response?.status;
            if (status === 401) router.push("/Login");
        } finally {
            setSending(false);
            setSaving(false);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h1 className="text-lg">نوشتن پیام</h1>

            <div className="mt-4 grid gap-3">
                <MailGroupMultiSelect
                    instanceId="to-groups"
                    items={groups}
                    loading={loadingGroups}
                    label="گیرندگان (To)"
                    placeholder={canUse ? "انتخاب گیرندگان..." : "در حال آماده سازی..."}
                    isDisabled={!canUse || sending || saving}
                    onSelect={(items) => setToGroups(items)}
                />

                <input
                    className="w-full rounded-xl border border-sky-300 px-4 py-2 outline-none focus:border-sky-500"
                    placeholder="موضوع"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={sending || saving}
                />

                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <RichTextEditor
                        height="h-[240px]"
                        minHeight="min-h-[240px]"
                        maxHeight="max-h-[520px]"
                        content={body}
                        onChange={(newContent) => setBody(newContent)}
                        readOnly={sending || saving}
                        justify={true}
                    />
                </div>

                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilesSelected} />

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm text-slate-700 ml-2">پیوست‌ها:</div>

                        <button
                            type="button"
                            onClick={handlePickFiles}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-60"
                            disabled={sending || saving}
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
                                disabled={sending || saving}
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
                                        <span className="max-w-[220px] truncate text-sm text-slate-800">{f.name}</span>
                                        <span className="text-xs text-slate-500 whitespace-nowrap">
                                            {Math.ceil(f.size / 1024)} KB
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(idx)}
                                            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 hover:bg-slate-50 disabled:opacity-60"
                                            disabled={sending || saving}
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
                        onClick={() => handleSend(1)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-6 py-2 text-white hover:opacity-95 disabled:opacity-60"
                        disabled={sending || saving || !toIds.length || !subject.trim() || isEmptyHtml(body) || !canUse}
                    >
                        <Send className="h-4 w-4" />
                        {sending ? "در حال ارسال..." : "ارسال"}
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSend(0)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-200 px-4 py-2 text-slate-900 hover:bg-slate-300 disabled:opacity-60"
                        disabled={sending || saving || !toIds.length || !subject.trim() || isEmptyHtml(body) || !canUse}
                    >
                        <Save className="h-4 w-4" />
                        {saving ? "در حال ذخیره پیش‌نویس..." : "ذخیره پیش‌نویس"}
                    </button>

                    <button
                        type="button"
                        className="mr-auto rounded-2xl border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50 disabled:opacity-60"
                        disabled={sending || saving}
                        onClick={() => console.log("[ComposeForm] Cancel clicked")}
                    >
                        انصراف
                    </button>
                </div>
            </div>
        </div>
    );
}
