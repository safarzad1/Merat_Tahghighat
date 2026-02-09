"use client";

import React, { useMemo } from "react";
import { Users } from "lucide-react";

interface UserInfo {
    userId: string;
    role: "teacher" | "student";
    FullName?: string;
}

interface UserListProps {
    currentUser: { FullName?: string; UserId?: string | number } | null;
    role: string;
    users: UserInfo[];
}

export default function UserList({ currentUser, role, users }: UserListProps) {

    const uniqueUsers = useMemo(() => {
        if (!users) return [];

        // ✅ این خط را هم اضافه کنید تا اولین آیتم را ببینید
        if (users.length > 0) {
            console.log("نمونه اولین کاربر:", users[0]);
        }

        const currentIdStr = String(currentUser?.UserId || "");
        const seen = new Set<string>();

        return users.filter((user) => {
            const userIdStr = String(user.userId);
            if (userIdStr === currentIdStr) return false;
            if (seen.has(userIdStr)) return false;
            seen.add(userIdStr);
            return true;
        });
    }, [users, currentUser]);
    return (
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col shrink-0">
            <div className="p-3 border-b border-gray-700  flex items-center gap-2">
                <Users size={18} /> کاربران آنلاین
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">

                {/* --- کاربر جاری --- */}
                {currentUser && (
                    <div className="flex items-center gap-3 p-2 bg-gray-700/50 rounded border border-gray-600">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs ">
                            {currentUser.FullName?.charAt(0) || "U"}
                        </div>
                        <div className="flex-1">
                            {/* ✅ اینجا نام کامل نمایش داده می‌شود */}
                            <div className="text-sm ">{currentUser.FullName || "کاربر"}</div>
                            <div className="text-xs text-green-400">
                                من ({role === 'teacher' ? 'استاد' : 'دانشجو'})
                            </div>
                        </div>
                    </div>
                )}

                {/* --- لیست سایر کاربران --- */}
                {uniqueUsers.length > 0 ? (
                    uniqueUsers.map((user) => (
                        <div key={user.userId} className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded transition">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs  ${user.role === 'teacher' ? 'bg-purple-600' : 'bg-gray-600'
                                }`}>
                                {/* ✅ اینجا هم نام کامل نمایش داده می‌شود */}
                                {user.FullName ? user.FullName.charAt(0).toUpperCase() : user.userId.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                {/* ✅ نمایش نام کامل کاربر */}
                                <div className="text-sm">{user.FullName}</div>
                                <div className={`text-xs ${user.role === 'teacher' ? 'text-purple-400' : 'text-green-400'
                                    }`}>
                                    {user.role === 'teacher' ? 'استاد' : 'دانشجو'}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-xs text-gray-500 text-center mt-2">کاربر دیگری آنلاین نیست</p>
                )}
            </div>
        </div>
    );
}