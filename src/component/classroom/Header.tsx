import React from "react";

// تعریف تایپ ساده برای کاربر (یا می‌توانید از تایپ اصلی پروژه استفاده کنید)
interface User {
    FullName?: string;
    UserId?: number | string;
}

interface HeaderProps {
    roomId: string;
    user: User | null;
    role: string;
}

export default function Header({ roomId, user, role }: HeaderProps) {
    return (
        <header className="h-14 bg-gray-800 flex items-center justify-between px-4 border-b border-gray-700 shrink-0">
            <h1 className="">کلاس مجازی: {roomId}</h1>
            <div className="text-sm text-gray-400">
                {user?.FullName} <span className="mr-2 text-xs bg-gray-700 px-2 py-0.5 rounded">({role})</span>
            </div>
        </header>
    );
}