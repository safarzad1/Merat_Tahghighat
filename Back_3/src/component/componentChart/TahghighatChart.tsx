"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Get_AmarTahghight_Shahrestan } from "@/Lib/ApiService";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { useRouter } from "next/navigation";

interface DataItem {
    NameFarsi: string;
    CountParvandeh: number;
}

interface ApiResponse {
    status: number;
    data: DataItem[];
}

interface FileStatusChartProps {
    mahal: number;
    userId: number | string; // ✅ اضافه شد
}

const colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function FileStatusChart({ mahal, userId }: FileStatusChartProps) {
    const [chartData, setChartData] = useState<DataItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // ✅ پاس دادن userId به API
                const response: ApiResponse = await Get_AmarTahghight_Shahrestan(mahal, userId);

                if (response.status == 401) {
                    router.push("/Login");
                    return;
                }

                if (response && response.status === 200 && response.data && Array.isArray(response.data)) {
                    setChartData(response.data);
                } else {
                    console.warn("Invalid response structure:", response);
                    setChartData([]);
                }
            } catch (err) {
                setError("خطا در دریافت داده‌ها");
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };

        // ✅ هم mahal و هم userId باید موجود باشند
        if (mahal && userId !== undefined && userId !== null && String(userId) !== "") {
            fetchData();
        } else {
            setLoading(false);
            setChartData([]);
        }
    }, [mahal, userId, router]);

    if (loading) {
        return (
            <div className="w-full rounded-lg shadow-lg bg-white border border-gray-100 overflow-hidden">
                <div className="bg-green-700 h-12 flex items-center justify-between px-4">
                    <h2 className="text-lg font-bold text-white">وضعیت پرونده‌ها</h2>
                    <div className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium">
                        شهرستان: {mahal}
                    </div>
                </div>
                <div className="p-6 h-[350px] flex items-center justify-center">
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500">در حال بارگذاری داده‌ها...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full rounded-lg shadow-lg bg-white border border-gray-100 overflow-hidden">
                <div className="bg-green-700 h-12 flex items-center justify-between px-4">
                    <h2 className="text-lg font-bold text-white">وضعیت پرونده‌ها</h2>
                    <div className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium">
                        شهرستان: {mahal}
                    </div>
                </div>
                <div className="p-6 h-[350px] flex flex-col items-center justify-center">
                    <div className="text-red-500 text-4xl mb-4">⚠️</div>
                    <p className="text-red-500 font-medium mb-2">{error}</p>
                    <p className="text-gray-500 text-sm">لطفاً دوباره تلاش کنید</p>
                </div>
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="w-full rounded-lg shadow-lg bg-white border border-gray-100 overflow-hidden">
                <div className="bg-green-700 h-12 flex items-center justify-between px-4">
                    <h2 className="text-lg font-bold text-white">وضعیت پرونده‌ها</h2>
                    <div className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium">
                        شهرستان: {mahal}
                    </div>
                </div>
                <div className="p-6 h-[350px] flex items-center justify-center">
                    <p className="text-gray-500">داده‌ای برای نمایش وجود ندارد</p>
                </div>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const index = chartData.findIndex((item) => item.NameFarsi === label);
            const fillColor = colors[index % colors.length];

            return (
                <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-200">
                    <p className="font-bold text-gray-800 mb-2">{label}</p>
                    <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: fillColor }}></div>
                        <p className="text-gray-600">
                            تعداد پرونده:{" "}
                            <span className="font-bold text-blue-600">
                                {payload[0].value.toLocaleString("fa-IR")}
                            </span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="m-1 w-full rounded-lg shadow-lg bg-white border border-gray-100 overflow-hidden">
            <div className="bg-green-700 h-12 flex items-center justify-between px-4">
                <h2 className="text-lg font-bold text-white">آمار تحقیقات</h2>
            </div>

            <div className="p-4">
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 25, right: 30, left: 20, bottom: 15 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis
                                dataKey="NameFarsi"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#6b7280", fontSize: 12 }}
                                tickMargin={10}
                                height={50}
                                interval={0}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#6b7280", fontSize: 12 }}
                                tickMargin={10}
                                tickFormatter={(value) => value.toLocaleString("fa-IR")}
                                width={50}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0, 0, 0, 0.05)" }} />
                            <Legend
                                wrapperStyle={{
                                    paddingTop: "15px",
                                    fontSize: "12px",
                                }}
                                iconType="circle"
                                iconSize={10}
                            />
                            <Bar dataKey="CountParvandeh" name="تعداد پرونده" radius={[4, 4, 0, 0]} maxBarSize={70}>
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} strokeWidth={1} stroke="#fff" />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                            <span className="text-sm text-gray-600">
                                مجموع:{" "}
                                {chartData
                                    .reduce((sum, item) => sum + item.CountParvandeh, 0)
                                    .toLocaleString("fa-IR")}{" "}
                                پرونده
                            </span>
                        </div>
                        <div className="text-sm text-gray-500">آخرین به‌روزرسانی: {new Date().toLocaleDateString("fa-IR")}</div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {chartData.map((item, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-md">
                                <div className="flex items-center mb-1">
                                    <div
                                        className="w-3 h-3 rounded-full mr-2"
                                        style={{ backgroundColor: colors[index % colors.length] }}
                                    ></div>
                                    <span className="text-sm text-gray-600 truncate">{item.NameFarsi}</span>
                                </div>
                                <div className="text-base font-bold text-gray-800">{item.CountParvandeh.toLocaleString("fa-IR")}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}