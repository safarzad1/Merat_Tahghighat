"use client";

import React from "react";
import MailSidebar from "./MailSidebar";
import MailTopbar from "./MailTopbar";

type Props = { children: React.ReactNode };

export default function MailShell({ children }: Props) {
    return (
        <div dir="rtl">
            <div className="h-16 border-b border-white/40 bg-white/50 backdrop-blur-xl">
                <MailTopbar />
            </div>

            {/* بدون height */}
            <div className="p-3 md:p-5">
                <div className="grid grid-cols-12 gap-4">
                    <aside className="col-span-12 md:col-span-4 lg:col-span-3">
                        <MailSidebar />
                    </aside>

                    <main className="col-span-12 md:col-span-8 lg:col-span-9">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
