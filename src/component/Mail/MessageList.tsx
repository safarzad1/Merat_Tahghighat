"use client";

import React from "react";
import MessageRow from "./MessageRow";
import { MailMessage } from "./types";

export default function MessageList({
    title,
    messages,
}: {
    title: string;
    messages: MailMessage[];
}) {
    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-lg font-bold">{title}</h1>

                <div className="flex items-center gap-2">
                    <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50">
                        علامت‌گذاری خوانده‌شده
                    </button>
                    <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50">
                        آرشیو
                    </button>
                    <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50">
                        حذف
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
                {/* List */}
                <section className="col-span-12 lg:col-span-5 space-y-2">
                    {messages.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                            پیامی وجود ندارد.
                        </div>
                    ) : (
                        messages.map((m) => <MessageRow key={m.id} msg={m} />)
                    )}
                </section>

                {/* Placeholder viewer */}
                <section className="col-span-12 lg:col-span-7">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                        برای مشاهده، یک پیام را از لیست انتخاب کنید.
                    </div>
                </section>
            </div>
        </div>
    );
}
