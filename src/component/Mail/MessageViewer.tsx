"use client";

import React from "react";
import { MailMessage } from "./types";

export default function MessageViewer({
    msg,
    onBack,
}: {
    msg: MailMessage;
    onBack?: () => void;
}) {
    return (
        <div className="grid grid-cols-12 gap-4">
            {/* Viewer */}
            <section className="col-span-12 lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-lg font-bold">{msg.subject}</h1>
                        <div className="mt-1 text-xs text-slate-500">
                            از: {msg.senderName}
                            {msg.senderEmail ? ` (${msg.senderEmail})` : ""} — تاریخ: {msg.createdateTime}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50">
                            پاسخ
                        </button>
                        <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50">
                            ارسال مجدد
                        </button>
                        <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50">
                            چاپ
                        </button>
                    </div>
                </div>

                <hr className="my-4 border-slate-200" />

                {/* اگر body HTML است، بهتره sanitize کنی؛ فعلاً متن ساده/preview-safe */}
                <pre className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
                    {msg.text ?? msg.preview ?? ""}
                </pre>

                {msg.attachmentsCount > 0 && (
                    <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                        <div className="text-xs font-semibold text-slate-600">پیوست‌ها</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50">
                                دانلود پیوست‌ها ({msg.attachmentsCount})
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* Actions */}
            <aside className="col-span-12 lg:col-span-4 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500">عملیات</div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <button className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800">
                            علامت‌گذاری مهم
                        </button>
                        <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50">
                            {msg.isStarred ? "برداشتن ستاره" : "ستاره‌دار"}
                        </button>
                        <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50">
                            آرشیو
                        </button>
                        <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50">
                            حذف
                        </button>
                    </div>
                </div>

                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm hover:bg-slate-50 text-right"
                    >
                        ← بازگشت
                    </button>
                )}
            </aside>
        </div>
    );
}
