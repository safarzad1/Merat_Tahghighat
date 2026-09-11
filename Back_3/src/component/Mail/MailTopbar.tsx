"use client";

import React from "react";
import Link from "next/link";
import { Bell, Mail, Settings } from "lucide-react";

export default function MailTopbar() {
    return (
        <div className="w-full bg-emerald-950 text-white">
            <div className="flex items-center gap-3 px-3 py-3">
                {/* لوگو + عنوان */}
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-400 shadow-md" />
                    <div className="leading-tight">
                        <div className="text-[15px] ">صندوق پستی</div>
                    </div>
                </div>

                {/* سرچ */}
                <div className="mx-2 flex-1 max-w-[520px]">
                    <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur">
                        <input
                            className="w-full bg-transparent text-[13px] outline-none placeholder:text-white/60"
                            placeholder="جستجو… (فرستنده، موضوع، متن)"
                        />
                    </div>
                </div>

                {/* آیکن‌ها + دکمه */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="rounded-2xl p-2 hover:bg-white/10 active:scale-[0.98]"
                        aria-label="اعلان‌ها"
                        title="اعلان‌ها"
                    >
                        <Bell className="h-5 w-5 text-white/90" />
                    </button>

                    <button
                        type="button"
                        className="rounded-2xl p-2 hover:bg-white/10 active:scale-[0.98]"
                        aria-label="تنظیمات"
                        title="تنظیمات"
                    >
                        <Settings className="h-5 w-5 text-white/90" />
                    </button>

                    <Link
                        href="/Mail/compose"
                        className="mr-1 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-400 px-4 py-2 text-[16px]  text-slate-900 shadow-md hover:opacity-95 active:scale-[0.98]"
                    >
                        <Mail className="h-5 w-5" />
                        <span>نوشتن پیام جدید</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
