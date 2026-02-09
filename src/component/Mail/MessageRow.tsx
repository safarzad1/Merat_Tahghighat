"use client";

import React from "react";
import Link from "next/link";
import { MailMessage } from "./types";

export default function MessageRow({ msg }: { msg: MailMessage }) {
    return (
        <Link
            href={`/Mail/message/${msg.id}`}
            className={[
                "flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm",
                msg.خوانده_شده ? "opacity-90" : "ring-1 ring-slate-200",
                "hover:bg-slate-50",
            ].join(" ")}
        >
            <div className="mt-1 flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4" onClick={(e) => e.stopPropagation()} />
                <span className="text-sm">{msg.ستاره_دار ? "⭐" : "☆"}</span>
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-semibold">
                        {msg.فرستنده}
                        {!msg.خوانده_شده && <span className="mr-2 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-white">جدید</span>}
                        {msg.مهم && <span className="mr-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-700">مهم</span>}
                    </div>
                    <div className="text-xs text-slate-500">{msg.تاریخ}</div>
                </div>

                <div className="mt-1 truncate text-sm text-slate-900">
                    {msg.موضوع}
                    {msg.دارای_پیوست && <span className="mr-2 text-slate-400">📎</span>}
                </div>

                <div className="mt-1 line-clamp-1 text-xs text-slate-500">{msg.پیشنمایش}</div>
            </div>
        </Link>
    );
}
