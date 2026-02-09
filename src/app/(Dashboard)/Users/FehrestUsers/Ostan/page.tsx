"use client";

import React, { useEffect, useRef, useState } from "react";
import Breadcrumbkhabar from "@/component/Breadcrumb/Breadcrumb";
import { Code2Icon, Home, Newspaper, Plus, X } from "lucide-react";
import FormInput from "@/component/Objects/FormInput1";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

import { GetCitys } from "@/Lib/ApiService";
import { GetListUsers, AddUser, DeleteUser } from "@/Lib/ApiServiceUsers";
import DropDownPerson from "@/component/Objects/DropDownPerson";
import PostDropdown from "@/component/Objects/DropDownPost";

type CityApiRow = {
    CityId: number;
    PCityId: number | null;
    CityIdHozeh: number | null;
    Name: string;
    FullName: string;
    Name_Code: string;
    IsHoze: boolean;
    IsActive: boolean;
};

type UserApiRow = {
    UserId: number;
    PersonId: number | null;
    FullName: string;
    CodeMelli: string;
    Mahal: string | number | null;
    NameMahal: string;
    CityId: number;
    PostId: number | null;
    OnvanPost: string;
    Password?: string;
    IPLock?: string;
    IsActive?: boolean;
    Active_NameFarsi: string;
};

export default function Page() {
    const user = useSelector((state: RootState) => state.user);
    const router = useRouter();

    // ✅ refs برای اسکرول به همان شهر
    const cityRefs = useRef<Record<number, HTMLDivElement | null>>({});

    const [selectedmahal, setSelectedmahal] = useState<string>("");

    const [userName, setUserName] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const [errorUserName, setErrorUserName] = useState<boolean>(false);
    const [errorPassword, setErrorPassword] = useState<boolean>(false);

    const [selectedPost, setSelectedPost] = useState<number | null>(null);
    const [selectedPerson, setselectedPerson] = useState<number | null>(null);

    const [data, setData] = useState<CityApiRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const [dataUser, setDataUser] = useState<Record<number, UserApiRow[]>>({});

    const [expandedCityId, setExpandedCityId] = useState<number | null>(null);
    const [loadingUsersByCity, setLoadingUsersByCity] = useState<Record<number, boolean>>({});
    const [errorUsersByCity, setErrorUsersByCity] = useState<Record<number, string>>({});

    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    // ✅ لودینگ حذف برای هر کاربر
    const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

    const openUserModal = (cityId: number) => {
        setSelectedmahal(String(cityId));
        setIsUserModalOpen(true);
    };

    const closeUserModal = () => setIsUserModalOpen(false);

    useEffect(() => {
        let isMounted = true;

        const fetchCities = async () => {
            setLoading(true);
            setError("");

            try {
                const res = await GetCitys(user.Mahal);

                if (res?.status === 200) {
                    if (isMounted) setData(res.data);
                } else if (res?.status === 401 || res?.state === 401) {
                    router.push("/Login");
                    return;
                } else {
                    throw new Error("خطا در دریافت لیست شهرها");
                }
            } catch (e: any) {
                if (isMounted) setError(e?.message || "خطا در دریافت داده‌ها");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchCities();
        return () => {
            isMounted = false;
        };
    }, [router, user.Mahal]);

    // ✅ این تابع همیشه کاربران شهر را دوباره می‌گیرد (برای Refresh بعد از Add/Delete)
    const fetchUsersByCity = async (cityId: number) => {
        setLoadingUsersByCity((prev) => ({ ...prev, [cityId]: true }));
        setErrorUsersByCity((prev) => ({ ...prev, [cityId]: "" }));

        try {
            const res = await GetListUsers(cityId);

            if (res?.status === 200) {
                const rows: UserApiRow[] = res.data ?? [];
                setDataUser((prev) => ({ ...prev, [cityId]: rows }));
            } else if (res?.status === 401 || res?.state === 401) {
                router.push("/Login");
                return;
            } else {
                throw new Error("خطا در دریافت لیست کاربران");
            }
        } catch (e: any) {
            setErrorUsersByCity((prev) => ({
                ...prev,
                [cityId]: e?.message || "خطا در دریافت کاربران",
            }));
        } finally {
            setLoadingUsersByCity((prev) => ({ ...prev, [cityId]: false }));
        }
    };

    // ✅ اسکرول به کارت شهر (بالا)
    const scrollToCity = (cityId: number) => {
        const el = cityRefs.current[cityId];
        if (!el) return;

        const OFFSET_TOP = 80; // اگر هدر ثابت داری، این عدد رو تنظیم کن
        const top = el.getBoundingClientRect().top + window.scrollY - OFFSET_TOP;

        window.scrollTo({ top, behavior: "smooth" });
    };

    const onToggleUsers = async (cityId: number) => {
        if (expandedCityId === cityId) {
            setExpandedCityId(null);
            return;
        }

        setExpandedCityId(cityId);

        // ✅ بعد از رندر باز شدن، اسکرول کن
        requestAnimationFrame(() => scrollToCity(cityId));

        // اگر قبلاً لود شده بود دوباره نزن
        if (dataUser[cityId]?.length) return;

        await fetchUsersByCity(cityId);
    };

    const SaveUser = async () => {
        const uOk = userName.trim().length > 0;
        const pOk = password.trim().length > 0;

        setErrorUserName(!uOk);
        setErrorPassword(!pOk);

        if (!uOk || !pOk) return;

        const cityId = Number(selectedmahal);
        if (!cityId) return;

        try {
            const result = await AddUser(userName, selectedmahal, selectedPerson, selectedPost, password, user.Mahal);

            if (result?.status === 200) {
                // ✅ فقط زیرمجموعه همان شهر رفرش شود
                await fetchUsersByCity(cityId);

                // ✅ همان شهر باز بماند
                setExpandedCityId(cityId);

                closeUserModal();

                // پاکسازی فرم
                setUserName("");
                setPassword("");
                setselectedPerson(null);
                setSelectedPost(null);
                setErrorUserName(false);
                setErrorPassword(false);

                // ✅ اسکرول به همان شهر (بعد از add)
                requestAnimationFrame(() => scrollToCity(cityId));
            } else if (result?.status === 401 || result?.state === 401) {
                router.push("/Login");
                return;
            } else {
                console.log("AddUser error:", result);
            }
        } catch (e) {
            console.error("❌ AddUser error:", e);
        }
    };

    // ✅ حذف کاربر (بدون confirm) + رفرش همان شهر
    const onDeleteUser = async (cityId: number, userIdToDelete: number) => {
        try {
            setDeletingUserId(userIdToDelete);

            const res = await DeleteUser(userIdToDelete, user.UserId);

            if (res?.status === 200) {
                await fetchUsersByCity(cityId);
                // ✅ بعد از حذف هم روی همان شهر بماند
                setExpandedCityId(cityId);
            } else if (res?.status === 401 || res?.state === 401) {
                router.push("/Login");
                return;
            } else {
                console.log("Delete error:", res);
            }
        } catch (e) {
            console.error("❌ DeleteUser error:", e);
        } finally {
            setDeletingUserId(null);
        }
    };

    return (
        <div>
            <div className="bg-sky-200 mt-1 mx-1 rounded py-2 px-10">
                <Breadcrumbkhabar
                    items={[
                        { label: "داشبورد", href: "/Dashboard", icon: <Home className="w-4 h-4" /> },
                        { label: "مدیریت کاربران استان و شهرستان", icon: <Newspaper className="w-4 h-4" /> },
                    ]}
                />
            </div>

            <div dir="rtl" className="bg-white mx-1 shabnam py-0 px-2 flex flex-col md:flex-row gap-4 rounded-b-xl">
                <div className="bg-white rounded-b-xl shadow w-full flex flex-col gap-3 p-3">
                    {loading && <div className="text-gray-500">در حال دریافت داده‌ها...</div>}
                    {error && <div className="text-red-600">❌ {error}</div>}

                    {!loading && !error && (
                        <>
                            <div className="flex items-center justify-between">
                                <div className="text-gray-700">
                                    تعداد : <span className="text-[17px]">{data.length}</span>
                                </div>
                            </div>

                            {data.length === 0 ? (
                                <div className="text-gray-500 py-6 text-center">داده‌ای برای نمایش وجود ندارد.</div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {data.map((row) => {
                                        const isOpen = expandedCityId === row.CityId;
                                        const users = dataUser[row.CityId] || [];
                                        const usersLoading = !!loadingUsersByCity[row.CityId];
                                        const usersError = errorUsersByCity[row.CityId];

                                        return (
                                            <div
                                                key={row.CityId}
                                                ref={(el) => {
                                                    cityRefs.current[row.CityId] = el;
                                                }}
                                                className="rounded-2xl border border-slate-200/70 bg-gradient-to-l from-sky-50/60 to-white shadow-sm overflow-hidden hover:shadow-md transition"
                                            >
                                                <div className="group flex items-center justify-between gap-3 px-4 py-3 hover:bg-sky-50/60 transition">
                                                    <button
                                                        type="button"
                                                        onClick={() => onToggleUsers(row.CityId)}
                                                        className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-b from-sky-500 to-cyan-500 text-white flex items-center justify-center shadow-sm hover:from-sky-600 hover:to-cyan-600 hover:shadow focus:outline-none focus:ring-4 focus:ring-sky-200 transition"
                                                        aria-label="نمایش کاربران"
                                                        title="نمایش کاربران"
                                                    >
                                                        <span className={`cursor-pointer text-xl leading-none transition ${isOpen ? "rotate-45" : ""}`}>+</span>
                                                    </button>

                                                    <div className="min-w-0 flex-1 flex items-center justify-between gap-4">
                                                        <div className="min-w-0">
                                                            <div className="text-slate-900 truncate">{row.FullName}</div>
                                                            <div className="text-xs text-slate-500 mt-1 truncate">
                                                                کد شهر:{" "}
                                                                <span className="px-2 py-0.5 rounded-lg bg-white/70 border border-slate-200">#{row.CityId}</span>
                                                            </div>
                                                        </div>

                                                        <div className="shrink-0">
                                                            <span className="text-xs px-2 py-1 rounded-full bg-sky-100 text-sky-700 border border-sky-200">لیست کاربران</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {isOpen && (
                                                    <div className="border-t border-slate-200/70 bg-white px-4 py-4">
                                                        {usersLoading && <div className="text-slate-500">در حال دریافت کاربران...</div>}
                                                        {usersError && <div className="text-red-600">❌ {usersError}</div>}

                                                        {!usersLoading && !usersError && (
                                                            <>
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <div className="text-slate-700">
                                                                        تعداد کاربران: <span className="text-slate-900">{users.length}</span>
                                                                    </div>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openUserModal(row.CityId)}
                                                                        className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-b from-sky-500 to-cyan-500 text-white shadow-sm hover:from-sky-600 hover:to-cyan-600 hover:shadow focus:outline-none focus:ring-4 focus:ring-sky-200 transition"
                                                                        title="عملیات"
                                                                        aria-label="عملیات"
                                                                    >
                                                                        <Plus className="w-5 h-5" />
                                                                    </button>
                                                                </div>

                                                                {users.length === 0 ? (
                                                                    <div className="text-slate-500 py-3 text-center">کاربری برای این شهر ثبت نشده است.</div>
                                                                ) : (
                                                                    <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                                                                        <table className="min-w-full">
                                                                            <thead className="bg-gradient-to-l from-sky-100 to-cyan-100">
                                                                                <tr className="text-slate-800">
                                                                                    <th className="p-3 text-right">نام کاربری</th>
                                                                                    <th className="p-3 text-right">شماره ملی</th>
                                                                                    <th className="p-3 text-right">نام و نام خانوادگی</th>
                                                                                    <th className="p-3 text-right">محل</th>
                                                                                    <th className="p-3 text-right">عنوان پست</th>
                                                                                    <th className="p-3 text-right">وضعیت</th>
                                                                                    <th className="p-3 text-right">حذف</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {users.map((u, idx) => (
                                                                                    <tr
                                                                                        key={u.UserId}
                                                                                        className={`border-t text-[16px] border-slate-200/70 transition hover:bg-sky-50/60 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                                                                                            }`}
                                                                                    >
                                                                                        <td className="p-3 text-slate-700">{u.UserId}</td>
                                                                                        <td className="p-3 text-slate-900">{u.CodeMelli}</td>
                                                                                        <td className="p-3 text-slate-900">{u.FullName}</td>
                                                                                        <td className="p-3 text-slate-700">{u.NameMahal}</td>
                                                                                        <td className="p-3 text-slate-700">{u.OnvanPost}</td>
                                                                                        <td className="p-3">
                                                                                            <span className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                                                                {u.Active_NameFarsi}
                                                                                            </span>
                                                                                        </td>

                                                                                        <td className="p-3">
                                                                                            <button
                                                                                                type="button"
                                                                                                disabled={deletingUserId === u.UserId}
                                                                                                onClick={() => onDeleteUser(row.CityId, u.UserId)}
                                                                                                className={`px-3 py-2 rounded-xl border text-sm transition focus:outline-none focus:ring-4
                                                  ${deletingUserId === u.UserId
                                                                                                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                                                                                        : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 focus:ring-rose-100"
                                                                                                    }`}
                                                                                            >
                                                                                                {deletingUserId === u.UserId ? "در حال حذف..." : "حذف"}
                                                                                            </button>
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {isUserModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={closeUserModal} />

                    <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-l from-sky-100 to-cyan-100">
                            <div className="text-slate-800 font-semibold">افزودن کاربر</div>

                            <button
                                type="button"
                                onClick={closeUserModal}
                                className="w-9 h-9 rounded-full flex items-center justify-center bg-white/70 hover:bg-white border border-slate-200 text-slate-700 hover:text-slate-900 transition focus:outline-none focus:ring-4 focus:ring-sky-200"
                                aria-label="بستن"
                                title="بستن"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 text-slate-600 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 gap-4">
                                <FormInput
                                    label="نام کاربر"
                                    placeholder="نام کاربر"
                                    icon={Code2Icon}
                                    value={userName}
                                    onChange={(e) => {
                                        setUserName(e.target.value);
                                        if (errorUserName) setErrorUserName(false);
                                    }}
                                    error={errorUserName}
                                    errorMessage={errorUserName ? "نام کاربر الزامی است" : ""}
                                    onlyNumber={false}
                                    maxLength={200}
                                />

                                <FormInput
                                    label="کلمه عبور"
                                    placeholder="کلمه عبور"
                                    icon={Code2Icon}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (errorPassword) setErrorPassword(false);
                                    }}
                                    error={errorPassword}
                                    errorMessage={errorPassword ? "کلمه عبور الزامی است" : ""}
                                    onlyNumber={false}
                                    maxLength={200}
                                />

                                <DropDownPerson
                                    mahal={user.Mahal}
                                    label="انتخاب شخص"
                                    placeholder="شخص مورد نظر را انتخاب کنید..."
                                    onSelect={(p) => {
                                        setselectedPerson(p?.PersonId ?? null);
                                    }}
                                />

                                <PostDropdown
                                    mahal={user.Mahal}
                                    label="انتخاب پست"
                                    placeholder={selectedPerson ? "پست مورد نظر را انتخاب کنید..." : "ابتدا شخص را انتخاب کنید"}
                                    onSelect={(p) => setSelectedPost(p?.PostId ?? null)}
                                    error={!selectedPerson}
                                    errorMessage={!selectedPerson ? "ابتدا شخص را انتخاب کنید" : ""}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t bg-slate-50">
                            <button
                                type="button"
                                onClick={closeUserModal}
                                className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition focus:outline-none focus:ring-4 focus:ring-slate-200"
                            >
                                انصراف
                            </button>

                            <button
                                type="button"
                                onClick={SaveUser}
                                className="px-5 py-2 rounded-xl bg-gradient-to-b from-sky-500 to-cyan-500 text-white hover:from-sky-600 hover:to-cyan-600 shadow-sm hover:shadow transition focus:outline-none focus:ring-4 focus:ring-sky-200"
                            >
                                ثبت
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
