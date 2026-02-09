"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Inbox,
    Send,
    FileText,
    Archive,
    Trash2,
    ShieldAlert,
    Star,
    BadgeCheck,
} from "lucide-react";

const items = [
    { href: "/Mail/inbox", label: "صندوق ورودی", Icon: Inbox },
    { href: "/Mail/sent", label: "ارسال‌شده", Icon: Send },
    { href: "/Mail/drafts", label: "پیش‌نویس‌ها", Icon: FileText },
    { href: "/Mail/starred", label: "ستاره‌دار", Icon: Star },
    { href: "/Mail/important", label: "مهم", Icon: BadgeCheck },
    { href: "/Mail/archive", label: "آرشیو", Icon: Archive },
    { href: "/Mail/spam", label: "هرزنامه", Icon: ShieldAlert },
    { href: "/Mail/trash", label: "زباله‌دان", Icon: Trash2 },
];

export default function MailSidebar() {
    const pathname = usePathname();

    return (
        <div className="rounded-[22px] border border-white/60 bg-white p-4 shadow-sm backdrop-blur-xl">
            {/* تیتر بزرگ‌تر */}
            <div className="mb-3 text-[17px] text-slate-700">پوشه‌ها</div>

            <nav className="space-y-1">
                {items.map(({ href, label, Icon }) => {
                    const active =
                        pathname === href || (pathname === "/mail" && href === "/mail/inbox");

                    return (
                        <Link
                            key={href}
                            href={href}
                            className={[
                                "group flex  items-center justify-between rounded-2xl px-3 py-3 transition",
                                active
                                    ? "bg-gradient-to-r text-[17px] from-green-600 to-emerald-800 text-white shadow-md"
                                    : "text-slate-700 hover:bg-white/85",
                            ].join(" ")}
                        >
                            <div className="flex items-center gap-3">
                                {/* آیکن */}
                                <Icon
                                    className={[
                                        "h-5 w-5",
                                        active ? "text-white" : "text-slate-500 group-hover:text-slate-700",
                                    ].join(" ")}
                                />
                                {/* فونت بزرگ‌تر */}
                                <span className="text-base ">{label}</span>
                            </div>

                            <span
                                className={[
                                    "text-lg leading-none",
                                    active ? "text-white/80" : "text-slate-400 group-hover:text-slate-500",
                                ].join(" ")}
                            >
                                ›
                            </span>
                        </Link>
                    );
                })}
            </nav>


        </div>
    );
}
