"use client";

import React from "react";

type Row = {
    r: number;
    shomarehParvandeh: string;
    codeMelli: string;
    fullName: string;
    tel: string;
    hozeh: string;
    status: "ارسال شده" | "دریافت شده" | "بدون همیار";
};

type Props = {
    title?: string;
    subtitle?: string;
    rows: Row[];
};

export default function A4PrintTable({
    title = "گزارش فهرست اشخاص",
    subtitle = "نمونه چاپ A4 - جدول با کادر",
    rows,
}: Props) {
    const today = new Date().toLocaleDateString("fa-IR");

    return (
        <div className="bg-gray-100 min-h-screen p-4">
            {/* صفحه A4 */}
            <div className="mx-auto bg-white shadow-lg rounded-xl p-6 w-[210mm] min-h-[297mm]">
                {/* Header */}
                <div className="border-2 border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xl font-extrabold text-gray-900">{title}</div>
                            <div className="text-sm text-gray-600 mt-1">{subtitle}</div>
                        </div>

                        <div className="text-left">
                            <div className="text-xs text-gray-600">تاریخ: {today}</div>
                            <div className="text-xs text-gray-600 mt-1">تعداد: {rows.length}</div>
                        </div>
                    </div>

                    {/* خط جداکننده */}
                    <div className="h-[2px] bg-gray-800 mt-3" />

                    {/* اطلاعات کوچک */}
                    <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
                        <InfoBox label="استان" value="نمونه: تهران" />
                        <InfoBox label="حوزه" value="نمونه: حوزه ۱" />
                        <InfoBox label="کد گزارش" value="REP-1404-1203" />
                    </div>
                </div>

                {/* Actions */}
                <div className="print-hidden flex gap-2 mt-4">
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-600 cursor-pointer"
                    >
                        چاپ
                    </button>

                    <button
                        onClick={() => alert("اینجا می‌تونی خروجی PDF هم بذاری")}
                        className="px-4 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-600 cursor-pointer"
                    >
                        خروجی PDF
                    </button>
                </div>

                {/* Table */}
                <div className="mt-4 border-2 border-gray-800 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-900 text-white">
                                <Th w="40px">ردیف</Th>
                                <Th w="95px">پرونده</Th>
                                <Th w="110px">کد ملی</Th>
                                <Th>نام و نام خانوادگی</Th>
                                <Th w="110px">تلفن</Th>
                                <Th w="140px">حوزه</Th>
                                <Th w="95px">وضعیت</Th>
                            </tr>
                        </thead>

                        <tbody>
                            {rows.map((x, idx) => (
                                <tr
                                    key={idx}
                                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                                >
                                    <Td center>{x.r}</Td>
                                    <Td center>{x.shomarehParvandeh}</Td>
                                    <Td center>{x.codeMelli}</Td>
                                    <Td>{x.fullName}</Td>
                                    <Td center dir="ltr">{x.tel}</Td>
                                    <Td>{x.hozeh}</Td>
                                    <Td center>
                                        <StatusBadge status={x.status} />
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="mt-4 border-2 border-gray-800 rounded-xl p-3 text-xs text-gray-700">
                    <div className="flex justify-between">
                        <div>امضا / مهر: ........................................</div>
                        <div>صفحه 1 از 1</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="border border-gray-300 rounded-lg p-2">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="font-bold text-gray-800 mt-1">{value}</div>
        </div>
    );
}

function Th({ children, w }: { children: React.ReactNode; w?: string }) {
    return (
        <th
            className="border border-gray-700 px-2 py-2 text-center font-bold"
            style={w ? { width: w } : undefined}
        >
            {children}
        </th>
    );
}

function Td({
    children,
    center,
    dir,
}: {
    children: React.ReactNode;
    center?: boolean;
    dir?: "ltr" | "rtl";
}) {
    return (
        <td
            dir={dir}
            className={[
                "border border-gray-300 px-2 py-2",
                center ? "text-center" : "text-right",
            ].join(" ")}
        >
            {children}
        </td>
    );
}

function StatusBadge({ status }: { status: Row["status"] }) {
    const cls =
        status === "ارسال شده"
            ? "bg-blue-100 text-blue-800 border-blue-300"
            : status === "دریافت شده"
                ? "bg-green-100 text-green-800 border-green-300"
                : "bg-gray-200 text-gray-800 border-gray-300";

    return (
        <span className={`px-2 py-1 rounded-full border text-xs font-bold ${cls}`}>
            {status}
        </span>
    );
}