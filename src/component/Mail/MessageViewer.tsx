"use client";

import React from "react";
import Link from "next/link";
import { MailMessage } from "./types";

export default function MessageViewer({ msg }: { msg: MailMessage }) {
    return (
        <div className="grid grid-cols-12 gap-4">
            {/* Viewer */}
            <section className="col-span-12 lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-lg font-bold">{msg.موضوع}</h1>
                        <div className="mt-1 text-xs text-slate-500">
                            از: {msg.فرستنده} {msg.ایمیل_فرستنده ? `(${msg.ایمیل_فرستنده})` : ""} — تاریخ: {msg.تاریخ}
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

                <pre className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
                    {msg.متن}
                </pre>

                {msg.دارای_پیوست && (
                    <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                        <div className="text-xs font-semibold text-slate-600">پیوست‌ها</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50">
                                فایل_نمونه.pdf — دانلود
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
                            ستاره‌دار
                        </button>
                        <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50">
                            آرشیو
                        </button>
                        <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50">
                            حذف
                        </button>
                    </div>
                </div>

                <Link
                    href="/mail/inbox"
                    className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm hover:bg-slate-50"
                >
                    ← بازگشت به صندوق ورودی
                </Link>
            </aside>
        </div>
    );
}
