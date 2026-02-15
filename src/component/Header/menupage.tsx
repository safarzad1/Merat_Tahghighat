"use client";

import {
    FolderCog,
    Users,
    LogOut,
    Newspaper,
    UserCheck,
    User,
    User2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useEffect, useRef, useState } from "react";

export default function TopBar() {
    const router = useRouter();
    const user = useSelector((state: RootState) => state.user);

    const [openDavtalab, setOpenDavtalab] = useState(false);
    const [openUsers, setOpenUsers] = useState(false);

    const davtalabRef = useRef<HTMLDivElement>(null);
    const usersRef = useRef<HTMLDivElement>(null);

    const logout = async () => {
        localStorage.setItem("UserId", "");
        localStorage.setItem("Mahal", "");
        localStorage.setItem("FullName", "");
        localStorage.setItem("OnvanSemat", "");
        router.push("/Login");
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            const inDavtalab = davtalabRef.current?.contains(target) ?? false;
            const inUsers = usersRef.current?.contains(target) ?? false;

            if (!inDavtalab && !inUsers) {
                setOpenDavtalab(false);
                setOpenUsers(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const mahalLen = user?.Mahal?.toString()?.length ?? 0;

    // ✅ مهم: PostId را عددی کن که "56" هم درست تشخیص داده شود
    const postId = Number(user?.PostId);

    // ✅ اگر PostId = 56 فقط 3 آیتم را نشان بده
    if (postId === 56) {
        return (
            <div className="bg-white w-full mt-0.5 h-10 md:h-10 border-r-gray-500 shadow-md flex items-center justify-between px-4 gap-5 md:px-8">
                <div className="flex items-center gap-2">
                    <button
                        onClick={logout}
                        className="p-1 h-8 bg-white rounded-xl flex items-center gap-1 text-black text-sm md:text-base cursor-pointer hover:bg-sky-500 hover:text-white"
                    >
                        <LogOut size={16} className="text-red-600" />
                        <span>خروج از حساب</span>
                    </button>

                    <div className="text-indigo-700">|</div>

                    <Link
                        href="/TahghighatManage"
                        className="p-1 h-8 bg-white rounded-xl flex items-center gap-1 text-black text-sm md:text-base cursor-pointer hover:bg-sky-500 hover:text-white"
                    >
                        <FolderCog size={16} className="text-blue-600" />
                        <span>مدیریت تحقیقات</span>
                    </Link>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6 me-8 md:me-16">
                    <div className="p-3 h-8 bg-sky-100 rounded-xl flex items-center gap-1 text-black text-sm md:text-base cursor-pointer hover:bg-sky-500 hover:text-white">
                        <span>تاریخ روز :</span>
                        <span>{user?.DateNow}</span>
                    </div>
                </div>
            </div>
        );
    }

    // ✅ حالت عادی (همون منوی کامل شما)
    return (
        <div className="bg-white w-full mt-0.5 h-10 md:h-10 border-r-gray-500 shadow-md flex items-center justify-between px-4 gap-5 md:px-8">
            {/* Left Side */}
            <div className="flex items-center gap-2">
                <button
                    onClick={logout}
                    className="p-1 h-8 bg-white rounded-xl flex items-center gap-1 text-black text-sm md:text-base cursor-pointer hover:bg-sky-500 hover:text-white"
                >
                    <LogOut size={16} className="text-red-600" />
                    <span>خروج از حساب</span>
                </button>

                {mahalLen === 1 && (
                    <>
                        <div className="text-indigo-700">|</div>
                        <Link
                            href="/AkhbarManage"
                            className="p-1 h-8 bg-white rounded-xl flex items-center gap-1 text-black text-sm md:text-base cursor-pointer hover:bg-sky-500 hover:text-white"
                        >
                            <Newspaper size={16} className="text-blue-600" />
                            <span>مدیریت اخبار</span>
                        </Link>
                    </>
                )}

                <div className="text-indigo-700">|</div>
                <Link
                    href="/TahghighatManage"
                    className="p-1 h-8 bg-white rounded-xl flex items-center gap-1 text-black text-sm md:text-base cursor-pointer hover:bg-sky-500 hover:text-white"
                >
                    <FolderCog size={16} className="text-blue-600" />
                    <span>مدیریت تحقیقات</span>
                </Link>

                {postId !== 56 && (
                    <>
                        <div className="text-indigo-700">|</div>
                        <Link
                            href="/Persons/Hamkari"
                            className="p-1 h-8 bg-white rounded-xl flex items-center gap-1 text-black text-sm md:text-base cursor-pointer hover:bg-sky-500 hover:text-white"
                        >
                            <Users size={16} className="text-blue-600" />
                            <span>همکاران</span>
                        </Link>
                    </>
                )}

                <div className="text-indigo-700">|</div>

                {/* ✅ منوی پیش ثبت نام */}
                <div ref={davtalabRef} className="relative">
                    <div
                        onClick={() => {
                            setOpenDavtalab((prev) => !prev);
                            setOpenUsers(false);
                        }}
                        className="p-1 h-8 bg-white rounded-xl flex items-center gap-1 text-black text-sm md:text-base cursor-pointer hover:bg-sky-500 hover:text-white select-none"
                    >
                        <UserCheck size={16} className="text-blue-600" />
                        <span>پیش ثبت نام مجلس دوازدهم</span>
                    </div>

                    {openDavtalab && (
                        <div className="absolute right-0 mt-1 w-60 bg-white border border-gray-200 rounded-b-xl shadow-lg z-50">
                            <Link
                                href="/Davtalab/CardDavtalab"
                                onClick={() => setOpenDavtalab(false)}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-sky-100 rounded-t-xl"
                            >
                                <User size={16} className="text-blue-600" />
                                <span>فهرست پیش ثبت نام</span>
                            </Link>

                            {mahalLen === 3 && (
                                <Link
                                    href="/Davtalab/AshkhasParvandeh"
                                    onClick={() => setOpenDavtalab(false)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-sky-100 rounded-b-xl"
                                >
                                    <User2Icon size={16} className="text-green-600" />
                                    <span>پرونده اشخاص</span>
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* ✅ منوی مدیریت کاربران */}
                {mahalLen <= 3 && (
                    <>
                        <div className="text-indigo-700">|</div>

                        <div ref={usersRef} className="relative">
                            <div
                                onClick={() => {
                                    setOpenUsers((prev) => !prev);
                                    setOpenDavtalab(false);
                                }}
                                className="p-1 h-8 bg-white rounded-xl flex items-center gap-1 text-black text-sm md:text-base cursor-pointer hover:bg-sky-500 hover:text-white select-none"
                            >
                                <UserCheck size={16} className="text-blue-600" />
                                <span>مدیریت کاربران</span>
                            </div>

                            {openUsers && (
                                <div className="absolute right-0 mt-1 w-60 bg-white border border-gray-200 rounded-b-xl shadow-lg z-50">
                                    {mahalLen === 1 && (
                                        <Link
                                            href="/Users/FehrestUsers/Setad"
                                            onClick={() => setOpenUsers(false)}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-sky-100 rounded-t-xl"
                                        >
                                            <User size={16} className="text-blue-600" />
                                            <span>کاربران ستاد</span>
                                        </Link>
                                    )}

                                    <Link
                                        href="/Users/FehrestUsers/Ostan"
                                        onClick={() => setOpenUsers(false)}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-sky-100 rounded-b-xl"
                                    >
                                        <User size={16} className="text-blue-600" />
                                        <span>کاربران استان و شهرستان</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6 me-8 md:me-16">
                <div className="p-3 h-8 bg-sky-100 rounded-xl flex items-center gap-1 text-black text-sm md:text-base cursor-pointer hover:bg-sky-500 hover:text-white">
                    <span>تاریخ روز :</span>
                    <span>{user?.DateNow}</span>
                </div>
            </div>
        </div>
    );
}
