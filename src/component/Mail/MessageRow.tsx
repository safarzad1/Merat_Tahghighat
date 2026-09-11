"use client";

import React from "react";
import Link from "next/link";
import { MailMessage } from "./types";
import { encryptText } from "@/Lib/cryptoUtil";

export default function MessageRow({ msg }: { msg: MailMessage }) {
    const isNew = !msg.isRead;

    const rowStyle = isNew
        ? "border-sky-300 bg-sky-50 shadow-sm ring-1 ring-sky-200"
        : "border-slate-200 bg-white opacity-90";

    const encrypted = encodeURIComponent(encryptText(String(msg.id)));

    return (
        <Link
            href={`/Mail/message/${encrypted}`}
            className={[
                "flex items-start gap-3 rounded-2xl border p-3 transition",
                rowStyle,
                "hover:bg-slate-50",
            ].join(" ")}
        >
            <div className="mt-1 flex items-center gap-2">
                <input
                    type="checkbox"
                    className="h-4 w-4"
                    onClick={(e) => e.stopPropagation()}
                />
                <span className="text-sm">{msg.isStarred ? "⭐" : "☆"}</span>
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <div
                        className={[
                            "truncate text-sm",
                            isNew ? "font-bold text-sky-900" : "text-green-800",
                        ].join(" ")}
                    >
                        {msg.senderName}

                        {isNew && (
                            <span className="mr-2 rounded-full bg-sky-600 px-2 py-0.5 text-[10px] text-white">
                                جدید
                            </span>
                        )}

                        {msg.isImportant && (
                            <span className="mr-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-700">
                                مهم
                            </span>
                        )}
                    </div>

                    <div className="text-xs text-slate-500">{msg.createdateTime}</div>
                </div>

                <div
                    className={[
                        "mt-1 truncate text-sm",
                        isNew ? "text-slate-900 font-semibold" : "text-slate-700",
                    ].join(" ")}
                >
                    {msg.subject}
                    {msg.attachmentsCount > 0 && (
                        <span className="mr-2 text-slate-400">📎</span>
                    )}
                </div>

                <div className="mt-1 line-clamp-1 text-xs text-slate-500">
                    {msg.preview}
                </div>
            </div>
        </Link>
    );
}